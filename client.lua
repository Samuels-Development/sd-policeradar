local PlayerPedId = PlayerPedId
local IsPedInAnyVehicle = IsPedInAnyVehicle
local GetVehiclePedIsIn = GetVehiclePedIsIn
local GetVehicleClass = GetVehicleClass
local GetEntityCoords = GetEntityCoords
local GetEntityForwardVector = GetEntityForwardVector
local GetOffsetFromEntityInWorldCoords = GetOffsetFromEntityInWorldCoords
local GetEntityHeading = GetEntityHeading
local GetEntitySpeed = GetEntitySpeed
local GetEntityVelocity = GetEntityVelocity
local GetEntityModel = GetEntityModel
local GetEntityPitch = GetEntityPitch
local GetModelDimensions = GetModelDimensions
local DoesEntityExist = DoesEntityExist
local HasEntityClearLosToEntity = HasEntityClearLosToEntity
local IsThisModelABoat = IsThisModelABoat
local IsThisModelAHeli = IsThisModelAHeli
local IsThisModelAPlane = IsThisModelAPlane
local StartShapeTestCapsule = StartShapeTestCapsule
local GetShapeTestResult = GetShapeTestResult
local IsEntityAVehicle = IsEntityAVehicle
local GetVehicleNumberPlateText = GetVehicleNumberPlateText
local GetVehicleNumberPlateTextIndex = GetVehicleNumberPlateTextIndex
local FindFirstVehicle = FindFirstVehicle
local FindNextVehicle = FindNextVehicle
local EndFindVehicle = EndFindVehicle
local GetGameTimer = GetGameTimer
local Wait = Wait
local vector2 = vector2
local vector3 = vector3
local pairs = pairs
local ipairs = ipairs
local tostring = tostring
local table_insert = table.insert
local table_remove = table.remove
local table_sort = table.sort
local string_upper = string.upper
local math_ceil = math.ceil
local math_max = math.max
local math_abs = math.abs
local math_sqrt = math.sqrt

local state = {
    radarEnabled = false,
    radarWasEnabled = false,
    interacting = false,
    inputActive = false,
    speedLockThreshold = 80,
    speedLockEnabled = false,
    lastUpdate = 0,
    currentVehicle = 0,
    lastFrontSpeed = 0,
    lastRearSpeed = 0,
    lastPatrolSpeed = 0,
    frontApproaching = false,
    rearApproaching = false
}

local boloPlates = {}
local boloLookup = {} --- O(1) plate lookup table

local controlGroups = {
    interact = {1,2,24,25,68,69,70,91,92},
    typing = {
        1,2,24,25,68,69,70,91,92,30,31,32,33,34,35,
        71,72,73,74,75,76,59,60,61,62,63,64,65,
        8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,
        44,45,46,47,48,49,50,51,140,141,142,143,144,
        177,178,179,180,181,199,200,201,202,203,204,322
    },
    scrollWheel = {14,15,81,82,99,100,115,116,261,262}
}

local savedPositionsCache = nil

local radarThread = nil
local controlThread = nil
local poolThread = nil
local plateThread = nil

local Config = require 'config'
local ShowNotification = Config.ShowNotification

local updateInterval = Config.UpdateInterval or 200
local speedMultiplier = Config.SpeedUnit == "KMH" and 3.6 or 2.236936
local maxRange = Config.MaxDetectionRange or 200.0
local plateRange = Config.PlateDetectionRange or 50.0
local restrictClass = Config.RestrictToVehicleClass and Config.RestrictToVehicleClass.Enable
local vehicleClass = Config.RestrictToVehicleClass and Config.RestrictToVehicleClass.Class
local reopenAfterLeave = Config.ReopenRadarAfterLeave
local notificationType = Config.NotificationType

local modelValidityCache = {} --- [modelHash] = bool, whether the model is a ground vehicle
local modelSphereCache = {} --- [modelHash] = { radius, size }, cached model dimensions for sphere intersection
local vehiclePool = {} --- Refreshed periodically by a separate thread

--- Ray trace definitions: x offset from vehicle center for sphere intersection
local rayTraces = {
    { startX = 0.0,   endX = 0.0   },
    { startX = -5.0,  endX = -5.0  },
    { startX = 5.0,   endX = 5.0   },
    { startX = -10.0, endX = -10.0 },
    { startX = -17.0, endX = -17.0 },
}

--- Clamp a value between min and max
--- @param val number
--- @param min number
--- @param max number
--- @return number
local function Clamp(val, min, max)
    if val < min then return min end
    if val > max then return max end
    return val
end

--- Entity enumerator metatable (coroutine pattern from IllidanS4)
local entityEnumerator = {
    __gc = function(enum)
        if enum.destructor and enum.handle then
            enum.destructor(enum.handle)
        end
        enum.destructor = nil
        enum.handle = nil
    end
}

--- Enumerate all vehicles in the world via coroutine
--- @return function iterator
local function EnumerateVehicles()
    return coroutine.wrap(function()
        local iter, id = FindFirstVehicle()
        if not id or id == 0 then
            EndFindVehicle(iter)
            return
        end

        local enum = {handle = iter, destructor = EndFindVehicle}
        setmetatable(enum, entityEnumerator)

        local next = true
        repeat
            coroutine.yield(id)
            next, id = FindNextVehicle(iter)
        until not next

        enum.destructor, enum.handle = nil, nil
        EndFindVehicle(iter)
    end)
end

--- Check if a vehicle model is a ground vehicle (not boat, heli, or plane), cached per model hash
--- @param veh number The vehicle entity handle
--- @return boolean
local function IsVehicleModelValid(veh)
    local mdl = GetEntityModel(veh)
    local cached = modelValidityCache[mdl]
    if cached ~= nil then return cached end

    if IsThisModelABoat(mdl) or IsThisModelAHeli(mdl) or IsThisModelAPlane(mdl) then
        modelValidityCache[mdl] = false
        return false
    end

    modelValidityCache[mdl] = true
    return true
end

--- Get dynamic sphere radius and numeric size for a vehicle model, cached per model hash
--- @param veh number The vehicle entity handle
--- @return number radius
--- @return number numericSize
local function GetVehicleSphereData(veh)
    local mdl = GetEntityModel(veh)
    local cached = modelSphereCache[mdl]
    if cached then return cached.radius, cached.size end

    local min, max = GetModelDimensions(mdl)
    local size = max - min
    local numericSize = size.x + size.y + size.z
    local radius = Clamp((numericSize * numericSize) / 12, 5.0, 11.0)

    modelSphereCache[mdl] = { radius = radius, size = numericSize }
    return radius, numericSize
end

--- 2D sphere (cylinder) intersection test, projects to XY plane so inclines don't break detection
--- @param centre vector3 The vehicle position
--- @param radius number The sphere radius
--- @param rayStart vector3 The ray origin
--- @param rayEnd vector3 The ray endpoint
--- @return boolean hit
--- @return number relPos 1 = front, -1 = rear, 0 = beside
local function RayHitsSphere(centre, radius, rayStart, rayEnd)
    local rs = vector2(rayStart.x, rayStart.y)
    local re = vector2(rayEnd.x, rayEnd.y)
    local c = vector2(centre.x, centre.y)

    local rayDir = re - rs
    local rayLen = #rayDir
    if rayLen < 0.001 then return false, 0 end

    local rayNorm = rayDir / rayLen
    local toCenter = c - rs

    local tProj = toCenter.x * rayNorm.x + toCenter.y * rayNorm.y
    local perpSqr = (toCenter.x * toCenter.x + toCenter.y * toCenter.y) - (tProj * tProj)
    local radiusSqr = radius * radius

    local distToCenter = #(rs - c) - (radius * 2)
    if perpSqr < radiusSqr and not (distToCenter > rayLen) then
        if tProj > 8.0 then
            return true, 1
        elseif tProj < -8.0 then
            return true, -1
        end
        return false, 0
    end

    return false, 0
end

--- Check if a target vehicle is in the general traffic flow using heading difference
--- @param tgtVeh number The target vehicle entity
--- @param ownVeh number The patrol vehicle entity
--- @param relPos number 1 = front, -1 = rear
--- @return boolean
local function IsVehicleInTraffic(tgtVeh, ownVeh, relPos)
    local tgtHdg = GetEntityHeading(tgtVeh)
    local plyHdg = GetEntityHeading(ownVeh)

    local hdgDiff = math_abs((plyHdg - tgtHdg + 180) % 360 - 180)

    if relPos == 1 and hdgDiff > 45 and hdgDiff < 135 then
        return false
    elseif relPos == -1 and hdgDiff > 45 and (hdgDiff < 135 or hdgDiff > 215) then
        return false
    end

    return true
end

--- Determine if a target vehicle is approaching using the dot product of relative position and velocity
--- @param ownVeh number The patrol vehicle entity
--- @param targetVeh number The target vehicle entity
--- @return boolean
local function IsApproaching(ownVeh, targetVeh)
    local ownPos = GetEntityCoords(ownVeh)
    local tarPos = GetEntityCoords(targetVeh)
    local ownVel = GetEntityVelocity(ownVeh)
    local tarVel = GetEntityVelocity(targetVeh)

    local relX = tarPos.x - ownPos.x
    local relY = tarPos.y - ownPos.y
    local relVx = tarVel.x - ownVel.x
    local relVy = tarVel.y - ownVel.y

    local dot = relX * relVx + relY * relVy

    return dot < 0
end

--- Refresh the vehicle pool by enumerating all vehicles and filtering out non-ground vehicles
local function RefreshVehiclePool()
    local t = {}
    for veh in EnumerateVehicles() do
        if IsVehicleModelValid(veh) then
            t[#t + 1] = veh
        end
    end
    vehiclePool = t
end

--- Test one vehicle against one ray line using sphere intersection (mirrors wk_wars2x ShootCustomRay)
--- @param ownVeh number The patrol vehicle entity
--- @param veh number The target vehicle entity
--- @param rayStart vector3 The ray origin
--- @param rayEnd vector3 The ray endpoint
--- @return boolean hit
--- @return number|nil relPos
--- @return number|nil speed
--- @return number|nil size
local function ShootCustomRay(ownVeh, veh, rayStart, rayEnd)
    local pos = GetEntityCoords(veh)
    local dist = #(pos - rayStart)

    if not DoesEntityExist(veh) or veh == ownVeh or dist > maxRange then
        return false, nil, nil, nil
    end

    local entSpeed = GetEntitySpeed(veh)
    local visible = HasEntityClearLosToEntity(ownVeh, veh, 15)
    local pitch = GetEntityPitch(ownVeh)

    if entSpeed > 0.1 and visible and pitch > -35 and pitch < 35 then
        local radius, size = GetVehicleSphereData(veh)
        local hit, relPos = RayHitsSphere(pos, radius, rayStart, rayEnd)

        if hit and IsVehicleInTraffic(veh, ownVeh, relPos) then
            return true, relPos, entSpeed, size
        end
    end

    return false, nil, nil, nil
end

--- Gather all vehicles hit by a single ray line
--- @param ownVeh number The patrol vehicle entity
--- @param pool table The vehicle pool
--- @param rayStart vector3 The ray origin
--- @param rayEnd vector3 The ray endpoint
--- @return table|nil
local function GetVehiclesHitByRay(ownVeh, pool, rayStart, rayEnd)
    local caughtVehs = {}
    local hasData = false

    for p = 1, #pool do
        local hit, relPos, speed, size = ShootCustomRay(ownVeh, pool[p], rayStart, rayEnd)

        if hit then
            caughtVehs[#caughtVehs + 1] = {
                veh = pool[p],
                relPos = relPos,
                speed = math_ceil(speed * speedMultiplier),
                size = size
            }
            hasData = true
        end
    end

    if hasData then return caughtVehs end
    return nil
end

--- Shoot all rays against all pooled vehicles to find the strongest front and rear speed targets
--- @param ownVeh number The patrol vehicle entity
--- @return table|nil frontTarget
--- @return table|nil rearTarget
local function DetectSpeedTargets(ownVeh)
    local pool = vehiclePool
    local capturedVehicles = {}

    for i = 1, #rayTraces do
        local rt = rayTraces[i]
        local startPt = GetOffsetFromEntityInWorldCoords(ownVeh, rt.startX, 0.0, 0.0)
        local endPt = GetOffsetFromEntityInWorldCoords(ownVeh, rt.endX, maxRange, 0.0)

        local hitVehs = GetVehiclesHitByRay(ownVeh, pool, startPt, endPt)

        if hitVehs then
            for j = 1, #hitVehs do
                capturedVehicles[#capturedVehicles + 1] = hitVehs[j]
            end
        end
    end

    local frontHits = {}
    local rearHits = {}

    for i = 1, #capturedVehicles do
        local v = capturedVehicles[i]
        if v.relPos == 1 then
            frontHits[#frontHits + 1] = v
        elseif v.relPos == -1 then
            rearHits[#rearHits + 1] = v
        end
    end

    local sortBySize = function(a, b) return a.size > b.size end

    local frontTarget = nil
    if #frontHits > 0 then
        table_sort(frontHits, sortBySize)
        frontTarget = frontHits[1]
    end

    local rearTarget = nil
    if #rearHits > 0 then
        table_sort(rearHits, sortBySize)
        rearTarget = rearHits[1]
    end

    return frontTarget, rearTarget
end

--- Plate reader state per camera direction
local plateReader = {
    front = { plate = "", index = 0, locked = false },
    rear  = { plate = "", index = 0, locked = false }
}

--- Get a vehicle in a direction using capsule raycast (1:1 from wk_wars2x UTIL:GetVehicleInDirection)
--- @param entFrom number The source entity to ignore
--- @param coordFrom vector3 The ray start position
--- @param coordTo vector3 The ray end position
--- @return number vehicle
local function GetVehicleInDirection(entFrom, coordFrom, coordTo)
    local rayHandle = StartShapeTestCapsule(coordFrom.x, coordFrom.y, coordFrom.z, coordTo.x, coordTo.y, coordTo.z, 5.0, 10, entFrom, 7)
    local _, _, _, _, vehicle = GetShapeTestResult(rayHandle)
    return vehicle
end

--- Get relative direction between two headings (1:1 from wk_wars2x UTIL:GetEntityRelativeDirection)
--- @param myAng number
--- @param tarAng number
--- @return number 1 = same, 2 = opposite, 0 = perpendicular
local function GetRelativeDirection(myAng, tarAng)
    local angleDiff = math_abs((myAng - tarAng + 180) % 360 - 180)
    if angleDiff < 45 then
        return 1
    elseif angleDiff > 135 then
        return 2
    end
    return 0
end

--- Run plate reader for both front and rear cameras (1:1 from wk_wars2x READER:Main)
--- @param ownVeh number The patrol vehicle entity
local function PlateReaderUpdate(ownVeh)
    for i = 1, -1, -2 do
        local cam = i == 1 and "front" or "rear"
        local start = GetOffsetFromEntityInWorldCoords(ownVeh, 0.0, 5.0 * i, 0.0)
        local offset = GetOffsetFromEntityInWorldCoords(ownVeh, -2.5, plateRange * i, 0.0)
        local veh = GetVehicleInDirection(ownVeh, start, offset)

        if DoesEntityExist(veh) and IsEntityAVehicle(veh) and not plateReader[cam].locked then
            local ownH = GetEntityHeading(ownVeh)
            local tarH = GetEntityHeading(veh)
            local dir = GetRelativeDirection(ownH, tarH)

            if dir > 0 then
                local plate = GetVehicleNumberPlateText(veh)
                local index = GetVehicleNumberPlateTextIndex(veh)

                if plateReader[cam].plate ~= plate then
                    plateReader[cam].plate = plate or ""
                    plateReader[cam].index = index or 0

                    SendNUIMessage({
                        type = "plateUpdate",
                        cam = cam,
                        plate = plateReader[cam].plate,
                        plateIndex = plateReader[cam].index
                    })

                    if plate and plate ~= "" then
                        TriggerEvent('sd-policeradar:onPlateScanned', {
                            plate = plate,
                            plateIndex = index or 0,
                            direction = cam,
                            vehicle = veh
                        })
                    end
                end
            end
        end
    end
end

--- Send a NUI message only if the radar is currently enabled
--- @param msg table The NUI message to send
local function SendIfRadarEnabled(msg)
    if state.radarEnabled then
        SendNUIMessage(msg)
    end
end

--- Load saved panel positions from KVP storage
--- @return table|nil
local function LoadSavedPositions()
    if savedPositionsCache then
        return savedPositionsCache
    end
    local jsonStr = GetResourceKvpString("radar_positions")
    savedPositionsCache = jsonStr and json.decode(jsonStr) or nil
    return savedPositionsCache
end

--- Merge and persist panel positions to KVP storage
--- @param positions table The positions to save
local function SavePositions(positions)
    if positions then
        local current = savedPositionsCache or {}
        for k, v in pairs(positions) do
            current[k] = v
        end
        savedPositionsCache = current
        SetResourceKvp("radar_positions", json.encode(current))
    end
end

--- Check if the current vehicle is a valid radar-capable vehicle
--- @param ped number The player ped
--- @param veh number The vehicle entity
--- @return boolean
local function IsValidRadarVehicle(ped, veh)
    if veh == 0 then
        return false
    end

    if not restrictClass then
        return true
    end

    return GetVehicleClass(veh) == vehicleClass
end

--- Open the radar UI and send all initial configuration messages
local function OpenRadarUI()
    local messages = {
        {type = "open"},
        {type = "setKeybinds", keybinds = Config.Keybinds},
        {type = "setNotificationType", notificationType = notificationType},
        {type = "setSpeedUnit", speedUnit = Config.SpeedUnit},
        {type = "setLedGlow", ledGlow = Config.LedGlow ~= false}
    }

    local saved = LoadSavedPositions()
    if saved then
        messages[#messages + 1] = {type = "loadPositions", positions = saved}
    end

    if #boloPlates > 0 then
        messages[#messages + 1] = {type = "updateBoloPlates", plates = boloPlates}
    end

    for i = 1, #messages do
        SendNUIMessage(messages[i])
    end
end

--- Close the radar UI and reset interaction state
local function CloseRadarUI()
    state.interacting = false
    state.inputActive = false
    SetNuiFocus(false, false)
    SendNUIMessage({type = "close"})
end

--- Toggle the radar on or off, spawning all necessary threads when enabling
local function ToggleRadar()
    local ped = PlayerPedId()
    local veh = GetVehiclePedIsIn(ped, false)

    if not IsValidRadarVehicle(ped, veh) then
        return
    end

    state.radarEnabled = not state.radarEnabled

    if state.radarEnabled then
        state.radarWasEnabled = false
        state.currentVehicle = veh
        OpenRadarUI()

        if not poolThread then
            poolThread = CreateThread(function()
                while state.radarEnabled do
                    RefreshVehiclePool()
                    Wait(3000)
                end
                poolThread = nil
            end)
        end

        if not plateThread then
            plateThread = CreateThread(function()
                while state.radarEnabled do
                    local ped2 = PlayerPedId()
                    local veh2 = GetVehiclePedIsIn(ped2, false)
                    if veh2 ~= 0 then
                        PlateReaderUpdate(veh2)
                    end
                    Wait(500)
                end
                plateThread = nil
            end)
        end

        if not radarThread then
            radarThread = CreateThread(RadarUpdateLoop)
        end
    else
        CloseRadarUI()
    end
end

--- Run a single radar update tick: detect speeds, compute approaching/away, send NUI update
--- @param ped number The player ped
--- @param veh number The patrol vehicle entity
local function DoRadarUpdate(ped, veh)
    local frontTarget, rearTarget = DetectSpeedTargets(veh)

    local fSpeed = frontTarget and frontTarget.speed or 0
    local rSpeed = rearTarget and rearTarget.speed or 0

    local fApproaching = false
    local rApproaching = false

    if frontTarget then
        fApproaching = IsApproaching(veh, frontTarget.veh)
    end
    if rearTarget then
        rApproaching = IsApproaching(veh, rearTarget.veh)
    end

    local patrolSpeed = math_ceil(GetEntitySpeed(veh) * speedMultiplier)

    if fSpeed ~= state.lastFrontSpeed or rSpeed ~= state.lastRearSpeed or
       patrolSpeed ~= state.lastPatrolSpeed or
       fApproaching ~= state.frontApproaching or rApproaching ~= state.rearApproaching then

        SendNUIMessage({
            type = "update",
            frontSpeed = fSpeed,
            rearSpeed = rSpeed,
            patrolSpeed = patrolSpeed,
            frontApproaching = fApproaching,
            rearApproaching = rApproaching
        })

        state.lastFrontSpeed = fSpeed
        state.lastRearSpeed = rSpeed
        state.lastPatrolSpeed = patrolSpeed
        state.frontApproaching = fApproaching
        state.rearApproaching = rApproaching
    end

    if state.speedLockEnabled then
        if (fSpeed >= state.speedLockThreshold or rSpeed >= state.speedLockThreshold) then
            local triggerSpeed = math_max(fSpeed, rSpeed)

            SendNUIMessage({
                type = "speedLockTriggered",
                speed = triggerSpeed,
                plate = fSpeed >= state.speedLockThreshold and plateReader.front.plate or plateReader.rear.plate,
                direction = fSpeed >= state.speedLockThreshold and "Front" or "Rear"
            })
            state.speedLockEnabled = false
        end
    end
end

--- Radar update loop thread, uses dynamic wait based on patrol vehicle speed
function RadarUpdateLoop()
    while state.radarEnabled do
        local ped = PlayerPedId()
        local veh = GetVehiclePedIsIn(ped, false)

        if veh ~= 0 then
            DoRadarUpdate(ped, veh)

            local speed = GetEntitySpeed(veh)
            if speed < 0.1 then
                Wait(200)
            else
                Wait(updateInterval)
            end
        else
            if reopenAfterLeave then
                state.radarWasEnabled = true
            end
            CloseRadarUI()
            state.radarEnabled = false
            break
        end
    end

    radarThread = nil
end

--- Control disabling loop thread, disables game controls while interacting or typing
function ControlDisableLoop()
    while state.inputActive or state.interacting do
        if state.inputActive then
            for i = 1, #controlGroups.typing do
                DisableControlAction(0, controlGroups.typing[i], true)
            end
            for i = 0, 2 do
                for j = 1, #controlGroups.scrollWheel do
                    DisableControlAction(i, controlGroups.scrollWheel[j], true)
                end
            end
        elseif state.interacting then
            for i = 1, #controlGroups.interact do
                DisableControlAction(0, controlGroups.interact[i], true)
            end
            for i = 0, 2 do
                for j = 1, #controlGroups.scrollWheel do
                    DisableControlAction(i, controlGroups.scrollWheel[j], true)
                end
            end
        end

        Wait(0)
    end

    controlThread = nil
end

RegisterCommand("radar", ToggleRadar, false)
if Config.Keybinds.ToggleRadar and Config.Keybinds.ToggleRadar:match("%S") then
    RegisterKeyMapping("radar", "Toggle Radar", "keyboard", Config.Keybinds.ToggleRadar)
end

RegisterCommand("radarInteract", function()
    if state.radarEnabled then
        state.interacting = not state.interacting
        SetNuiFocus(state.interacting, state.interacting)
        SetNuiFocusKeepInput(state.interacting)

        if state.interacting and not controlThread then
            controlThread = CreateThread(ControlDisableLoop)
        end
    end
end, false)
if Config.Keybinds.Interact and Config.Keybinds.Interact:match("%S") then
    RegisterKeyMapping("radarInteract", "Interact with Radar UI", "keyboard", Config.Keybinds.Interact)
end

local simpleCommands = {
    radarSave = {Config.Keybinds.SaveReading, "Save Radar Reading", {type = "saveReading"}},
    radarLock = {Config.Keybinds.LockRadar, "Toggle Radar Lock", {type = "toggleLock"}},
    radarLockSpeed = {Config.Keybinds.LockSpeed, "Lock/Unlock Speed", {type = "toggleSpeedLock"}},
    radarLockPlate = {Config.Keybinds.LockPlate, "Lock/Unlock Plates", {type = "togglePlateLock"}},
    radarToggleLog = {Config.Keybinds.ToggleLog, "Toggle Radar Log", {type = "toggleLog"}},
    radarToggleBolo = {Config.Keybinds.ToggleBolo, "Toggle BOLO List", {type = "toggleBolo"}},
    radarToggleKeybinds = {Config.Keybinds.ToggleKeybinds, "Toggle Radar Keybinds", {type = "toggleKeybinds"}},
    radarSpeedLockThreshold = {Config.Keybinds.SpeedLockThreshold, "Open Speed Lock Threshold Menu", {type = "openSpeedLockModal"}},
}

for cmd, info in pairs(simpleCommands) do
    RegisterCommand(cmd, function() SendIfRadarEnabled(info[3]) end, false)
    if info[1] and info[1]:match("%S") then
        RegisterKeyMapping(cmd, info[2], "keyboard", info[1])
        local hash = GetHashKey("+" .. cmd)
        table_insert(controlGroups.interact, hash)
        table_insert(controlGroups.typing, hash)
    end
end

--- Move mode commands: toggle positioning for individual elements
--- These auto-enable interact mode so the mouse works for dragging
local moveCommands = {
    radarMoveRadar = {Config.Keybinds.MoveRadar, "Move Radar Panel", "togglePositionRadar"},
    radarMoveLog = {Config.Keybinds.MoveLog, "Move Log Panel", "togglePositionLog"},
    radarMoveBolo = {Config.Keybinds.MoveBolo, "Move BOLO Panel", "togglePositionBolo"},
}

for cmd, info in pairs(moveCommands) do
    RegisterCommand(cmd, function()
        if state.radarEnabled then
            if not state.interacting then
                state.interacting = true
                SetNuiFocus(true, true)
                SetNuiFocusKeepInput(true)

                if not controlThread then
                    controlThread = CreateThread(ControlDisableLoop)
                end
            end

            SendNUIMessage({type = info[3]})
        end
    end, false)
    if info[1] and info[1]:match("%S") then
        RegisterKeyMapping(cmd, info[2], "keyboard", info[1])
        local hash = GetHashKey("+" .. cmd)
        table_insert(controlGroups.interact, hash)
        table_insert(controlGroups.typing, hash)
    end
end

--- NUI callback: Set speed lock threshold and enable/disable auto-lock
RegisterNUICallback("setSpeedLockThreshold", function(data, cb)
    state.speedLockThreshold = data.threshold or state.speedLockThreshold
    state.speedLockEnabled = data.enabled or false

    if notificationType == "custom" and data.threshold then
        ShowNotification("Speed lock threshold set to " .. data.threshold .. " MPH")
    end
    cb({})
end)

--- NUI callback: Add a plate to the BOLO list
RegisterNUICallback("addBoloPlate", function(data, cb)
    if data.plate then
        local upperPlate = string_upper(data.plate)
        if not boloLookup[upperPlate] then
            table_insert(boloPlates, upperPlate)
            boloLookup[upperPlate] = true
            SendNUIMessage({type = "updateBoloPlates", plates = boloPlates})
        end
    end
    cb({})
end)

--- NUI callback: Remove a plate from the BOLO list
RegisterNUICallback("removeBoloPlate", function(data, cb)
    if data.plate and boloLookup[data.plate] then
        for i = 1, #boloPlates do
            if boloPlates[i] == data.plate then
                table_remove(boloPlates, i)
                boloLookup[data.plate] = nil
                break
            end
        end
        SendNUIMessage({type = "updateBoloPlates", plates = boloPlates})
    end
    cb({})
end)

--- NUI callback: Play BOLO alert sound
RegisterNUICallback("boloAlert", function(data, cb)
    PlaySoundFrontend(-1, "TIMER_STOP", "HUD_MINI_GAME_SOUNDSET", 1)
    cb({})
end)

--- NUI callback: Show a custom notification
RegisterNUICallback("showNotification", function(data, cb)
    if notificationType == "custom" and data.message then
        ShowNotification(data.message)
    end
    cb({})
end)

--- NUI callback: Persist panel positions to KVP
RegisterNUICallback("savePositions", function(data, cb)
    SavePositions(data)
    cb({})
end)

--- NUI callback: Mark text input as active and disable game controls
RegisterNUICallback("inputActive", function(data, cb)
    state.inputActive = true
    SetNuiFocus(true, true)
    SetNuiFocusKeepInput(false)

    if not controlThread then
        controlThread = CreateThread(ControlDisableLoop)
    end
    cb({})
end)

--- NUI callback: Mark text input as inactive and restore focus state
RegisterNUICallback("inputInactive", function(data, cb)
    state.inputActive = false
    if state.radarEnabled then
        SetNuiFocus(state.interacting, state.interacting)
        SetNuiFocusKeepInput(state.interacting)
    else
        SetNuiFocus(false, false)
    end
    cb({})
end)

--- Main vehicle detection thread, handles radar reopen after leaving vehicle
CreateThread(function()
    while true do
        local ped = PlayerPedId()
        local veh = GetVehiclePedIsIn(ped, false)

        if veh ~= 0 then
            if state.radarWasEnabled and not state.radarEnabled and IsValidRadarVehicle(ped, veh) then
                state.radarEnabled = true
                state.currentVehicle = veh
                OpenRadarUI()
                state.radarWasEnabled = false

                if not poolThread then
                    poolThread = CreateThread(function()
                        while state.radarEnabled do
                            RefreshVehiclePool()
                            Wait(3000)
                        end
                        poolThread = nil
                    end)
                end

                if not plateThread then
                    plateThread = CreateThread(function()
                        while state.radarEnabled do
                            local ped3 = PlayerPedId()
                            local veh3 = GetVehiclePedIsIn(ped3, false)
                            if veh3 ~= 0 then
                                PlateReaderUpdate(veh3)
                            end
                            Wait(500)
                        end
                        plateThread = nil
                    end)
                end

                if not radarThread then
                    radarThread = CreateThread(RadarUpdateLoop)
                end
            end

            Wait(500)
        else
            if state.radarEnabled then
                if reopenAfterLeave then
                    state.radarWasEnabled = true
                end
                CloseRadarUI()
                state.radarEnabled = false
            end

            Wait(1000)
        end
    end
end)

--- Export: Add a plate to the BOLO list
--- @param plate string The plate text to add
--- @return boolean success
exports('addBoloPlate', function(plate)
    if type(plate) ~= "string" or plate == "" then
        return false
    end

    local upperPlate = string_upper(plate)
    if boloLookup[upperPlate] then
        return false
    end

    table_insert(boloPlates, upperPlate)
    boloLookup[upperPlate] = true

    if state.radarEnabled then
        SendNUIMessage({type = "updateBoloPlates", plates = boloPlates})
    end

    return true
end)

--- Export: Remove a plate from the BOLO list
--- @param plate string The plate text to remove
--- @return boolean success
exports('removeBoloPlate', function(plate)
    if type(plate) ~= "string" or plate == "" then
        return false
    end

    local upperPlate = string_upper(plate)
    if not boloLookup[upperPlate] then
        return false
    end

    for i = 1, #boloPlates do
        if boloPlates[i] == upperPlate then
            table_remove(boloPlates, i)
            boloLookup[upperPlate] = nil

            if state.radarEnabled then
                SendNUIMessage({type = "updateBoloPlates", plates = boloPlates})
            end

            return true
        end
    end

    return false
end)

--- Export: Get the current BOLO plates list
--- @return table
exports('getBoloPlates', function()
    return boloPlates
end)

--- Export: Check if the radar is currently enabled
--- @return boolean
exports('isRadarEnabled', function()
    return state.radarEnabled
end)

--- Export: Toggle the radar on or off
exports('toggleRadar', function()
    ToggleRadar()
end)
