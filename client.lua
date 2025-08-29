-- Cached native functions for better performance
local PlayerPedId = PlayerPedId
local IsPedInAnyVehicle = IsPedInAnyVehicle
local GetVehiclePedIsIn = GetVehiclePedIsIn
local GetVehicleClass = GetVehicleClass
local GetEntityCoords = GetEntityCoords
local GetEntityForwardVector = GetEntityForwardVector
local GetOffsetFromEntityInWorldCoords = GetOffsetFromEntityInWorldCoords
local StartShapeTestCapsule = StartShapeTestCapsule
local GetShapeTestResult = GetShapeTestResult
local IsEntityAVehicle = IsEntityAVehicle
local GetEntitySpeed = GetEntitySpeed
local GetVehicleNumberPlateText = GetVehicleNumberPlateText
local GetGameTimer = GetGameTimer
local Wait = Wait
local vector3 = vector3
local pairs = pairs
local ipairs = ipairs
local table_insert = table.insert
local table_remove = table.remove
local string_upper = string.upper
local math_ceil = math.ceil
local math_max = math.max

-- State management
local state = {
    radarEnabled = false,
    radarWasEnabled = false,
    interacting = false,
    inputActive = false,
    speedLockThreshold = 80,
    speedLockEnabled = false,
    lastUpdate = 0,
    currentVehicle = 0,
    lastFrontPlate = "",
    lastRearPlate = "",
    lastFrontSpeed = 0,
    lastRearSpeed = 0
}

-- BOLO system
local boloPlates = {}
local boloLookup = {} -- Lookup table for O(1) plate checking

-- Control groups cache (pre-calculated once)
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

-- Cache for saved positions
local savedPositionsCache = nil

-- Thread management
local radarThread = nil
local controlThread = nil

-- Cache update interval in MS (convert once)
local updateInterval = Config.UpdateInterval or 100

-- Pre-calculate speed multiplier
local speedMultiplier = Config.SpeedMultiplier or 2.236936

-- Cache config values
local frontRange = Config.FrontDetectionRange or 30.0
local rearRange = Config.RearDetectionRange or 30.0
local restrictClass = Config.RestrictToVehicleClass and Config.RestrictToVehicleClass.Enable
local vehicleClass = Config.RestrictToVehicleClass and Config.RestrictToVehicleClass.Class
local reopenAfterLeave = Config.ReopenRadarAfterLeave
local notificationType = Config.NotificationType

local function SendIfRadarEnabled(msg)
    if state.radarEnabled then
        SendNUIMessage(msg)
    end
end

local function LoadSavedPositions()
    if savedPositionsCache then
        return savedPositionsCache
    end
    local jsonStr = GetResourceKvpString("radar_positions")
    savedPositionsCache = jsonStr and json.decode(jsonStr) or nil
    return savedPositionsCache
end

local function SavePositions(positions)
    if positions then
        savedPositionsCache = positions
        SetResourceKvp("radar_positions", json.encode(positions))
    end
end

local function IsValidRadarVehicle(ped, veh)
    if veh == 0 then
        return false
    end
    
    if not restrictClass then
        return true
    end
    
    return GetVehicleClass(veh) == vehicleClass
end

-- Open radar UI with all necessary messages
local function OpenRadarUI()
    local messages = {
        {type = "open"},
        {type = "setKeybinds", keybinds = Config.Keybinds},
        {type = "setNotificationType", notificationType = notificationType},
        {type = "setSpeedUnit", speedUnit = Config.SpeedUnit}
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

-- Close radar UI
local function CloseRadarUI()
    state.interacting = false
    state.inputActive = false
    SetNuiFocus(false, false)
    SendNUIMessage({type = "close"})
end

-- Toggle radar
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
        
        if not radarThread then
            radarThread = CreateThread(RadarUpdateLoop)
        end
    else
        CloseRadarUI()
    end
end

-- radar update (only send changes)
local function DoRadarUpdate(ped, veh)
    local pos = GetEntityCoords(ped)
    local forward = GetEntityForwardVector(ped)
    
    local fx, fy = forward.x * frontRange, forward.y * frontRange
    local rx, ry = forward.x * rearRange, forward.y * rearRange
    
    local frontTarget = vector3(pos.x + fx, pos.y + fy, pos.z)
    local rearTarget = vector3(pos.x - rx, pos.y - ry, pos.z)
    
    local startPos = GetOffsetFromEntityInWorldCoords(veh, 0.0, 1.0, 1.0)
    
    local fSpeed, fPlate = 0, ""
    local fRay = StartShapeTestCapsule(startPos, frontTarget, 6.0, 10, veh, 7)
    local _, _, _, _, fEnt = GetShapeTestResult(fRay)
    
    if IsEntityAVehicle(fEnt) then
        fSpeed = math_ceil(GetEntitySpeed(fEnt) * speedMultiplier)
        fPlate = GetVehicleNumberPlateText(fEnt) or ""
        
        if fPlate ~= "" and fPlate ~= state.lastFrontPlate then
            TriggerEvent('sd-policeradar:onPlateScanned', {
                plate = fPlate,
                speed = fSpeed,
                direction = "front",
                vehicle = fEnt
            })
        end
    end
    
    local rSpeed, rPlate = 0, ""
    local rRay = StartShapeTestCapsule(startPos, rearTarget, 3.0, 10, veh, 7)
    local _, _, _, _, rEnt = GetShapeTestResult(rRay)
    
    if IsEntityAVehicle(rEnt) then
        rSpeed = math_ceil(GetEntitySpeed(rEnt) * speedMultiplier)
        rPlate = GetVehicleNumberPlateText(rEnt) or ""
        
        if rPlate ~= "" and rPlate ~= state.lastRearPlate then
            TriggerEvent('sd-policeradar:onPlateScanned', {
                plate = rPlate,
                speed = rSpeed,
                direction = "rear",
                vehicle = rEnt
            })
        end
    end
    
    if fSpeed ~= state.lastFrontSpeed or rSpeed ~= state.lastRearSpeed or 
       fPlate ~= state.lastFrontPlate or rPlate ~= state.lastRearPlate then
        
        SendNUIMessage({
            type = "update",
            frontSpeed = fSpeed,
            rearSpeed = rSpeed,
            frontPlate = fPlate,
            rearPlate = rPlate
        })
        
        state.lastFrontSpeed = fSpeed
        state.lastRearSpeed = rSpeed
        state.lastFrontPlate = fPlate
        state.lastRearPlate = rPlate
    end
    
    if state.speedLockEnabled then
        if (fSpeed >= state.speedLockThreshold or rSpeed >= state.speedLockThreshold) then
            local triggerSpeed = math_max(fSpeed, rSpeed)
            
            SendNUIMessage({
                type = "speedLockTriggered",
                speed = triggerSpeed,
                plate = fSpeed >= state.speedLockThreshold and fPlate or rPlate,
                direction = fSpeed >= state.speedLockThreshold and "Front" or "Rear"
            })
            state.speedLockEnabled = false
        end
    end
end

-- Dedicated radar update thread (only runs when needed)
function RadarUpdateLoop()
    while state.radarEnabled do
        local now = GetGameTimer()
        
        if now - state.lastUpdate >= updateInterval then
            state.lastUpdate = now
            
            local ped = PlayerPedId()
            local veh = GetVehiclePedIsIn(ped, false)
            
            if veh ~= 0 then
                DoRadarUpdate(ped, veh)
            else
                if reopenAfterLeave then
                    state.radarWasEnabled = true
                end
                CloseRadarUI()
                state.radarEnabled = false
                break
            end
        end
        
        Wait(50)
    end
    
    radarThread = nil
end

-- Dedicated control disabling thread (only runs when needed)
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

-- Command registration
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

-- Simple command registration
local simpleCommands = {
    radarSave = {Config.Keybinds.SaveReading, "Save Radar Reading", {type = "saveReading"}},
    radarLock = {Config.Keybinds.LockRadar, "Toggle Radar Lock", {type = "toggleLock"}},
    radarSelectFront = {Config.Keybinds.SelectFront, "Select Front", {type = "selectDirection", data = "Front"}},
    radarSelectRear = {Config.Keybinds.SelectRear, "Select Rear", {type = "selectDirection", data = "Rear"}},
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

-- NUI Callbacks
RegisterNUICallback("setSpeedLockThreshold", function(data, cb)
    state.speedLockThreshold = data.threshold or state.speedLockThreshold
    state.speedLockEnabled = data.enabled or false
    
    if notificationType == "custom" and data.threshold then
        ShowNotification("Speed lock threshold set to " .. data.threshold .. " MPH")
    end
    cb({})
end)

-- BOLO plate management
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

RegisterNUICallback("boloAlert", function(data, cb)
    PlaySoundFrontend(-1, "TIMER_STOP", "HUD_MINI_GAME_SOUNDSET", 1)
    cb({})
end)

RegisterNUICallback("showNotification", function(data, cb)
    if notificationType == "custom" and data.message then
        ShowNotification(data.message)
    end
    cb({})
end)

RegisterNUICallback("savePositions", function(data, cb)
    SavePositions(data)
    cb({})
end)

RegisterNUICallback("inputActive", function(data, cb)
    state.inputActive = true
    SetNuiFocus(true, true)
    SetNuiFocusKeepInput(false)
    
    if not controlThread then
        controlThread = CreateThread(ControlDisableLoop)
    end
    cb({})
end)

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

-- Main vehicle detection thread (minimal overhead)
CreateThread(function()
    while true do
        local ped = PlayerPedId()
        local veh = GetVehiclePedIsIn(ped, false)
        
        if veh ~= 0 then
            if state.radarWasEnabled and not state.radarEnabled then
                state.radarEnabled = true
                state.currentVehicle = veh
                OpenRadarUI()
                state.radarWasEnabled = false
                
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

-- Exports with validation
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

exports('getBoloPlates', function()
    return boloPlates
end)

exports('isRadarEnabled', function()
    return state.radarEnabled
end)

exports('toggleRadar', function()
    ToggleRadar()
end)