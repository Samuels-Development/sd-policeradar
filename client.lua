local radarEnabled = false
local radarWasEnabled = false
local interacting = false
local inputActive = false
local boloPlates = {}
local speedLockThreshold = 80
local speedLockEnabled = false

-- Send NUI messages only when radar is enabled
local function SendIfRadarEnabled(message)
    if radarEnabled then
        SendNUIMessage(message)
    end
end

-- Load/save radar UI positions from resource KVP
local function LoadSavedPositions()
    local jsonStr = GetResourceKvpString("radar_positions")
    return jsonStr and json.decode(jsonStr) or nil
end

local function SavePositions(positions)
    if positions then
        SetResourceKvp("radar_positions", json.encode(positions))
    end
end

-- Toggle the radar UI open/close
local function ToggleRadar()
    local ped = PlayerPedId()
    if not IsPedInAnyVehicle(ped, false) then
        return
    end

    if Config.RestrictToVehicleClass.Enable then
        local veh = GetVehiclePedIsIn(ped, false)
        local vehClass = GetVehicleClass(veh)
        if vehClass ~= Config.RestrictToVehicleClass.Class then
            return
        end
    end

    radarEnabled = not radarEnabled

    if radarEnabled then
        radarWasEnabled = false
        SendNUIMessage({ type = "open" })
        SendNUIMessage({ type = "setKeybinds", keybinds = Config.Keybinds })
        SendNUIMessage({ type = "setNotificationType", notificationType = Config.NotificationType })
        SendNUIMessage({ type = "setSpeedUnit", speedUnit = Config.SpeedUnit })

        local saved = LoadSavedPositions()
        if saved then
            SendNUIMessage({ type = "loadPositions", positions = saved })
        end
    else
        interacting = false
        inputActive = false
        SetNuiFocus(false, false)
        SendNUIMessage({ type = "close" })
    end
end

-- Register slash command and keybind to toggle
RegisterCommand("radar", ToggleRadar, false)
if Config.Keybinds.ToggleRadar and type(Config.Keybinds.ToggleRadar) == "string" and Config.Keybinds.ToggleRadar:match("%S") then
    RegisterKeyMapping("radar", "Toggle Radar", "keyboard", Config.Keybinds.ToggleRadar)
end

-- Toggle UI interaction mode
RegisterCommand("radarInteract", function()
    if radarEnabled then
        interacting = not interacting
        SetNuiFocus(interacting, interacting)
        SetNuiFocusKeepInput(interacting)
    end
end, false)
if Config.Keybinds.Interact and type(Config.Keybinds.Interact) == "string" and Config.Keybinds.Interact:match("%S") then
    RegisterKeyMapping("radarInteract", "Interact with Radar UI", "keyboard", Config.Keybinds.Interact)
end

local simpleCommands = {
    radarSave = { key = Config.Keybinds.SaveReading, desc = "Save Radar Reading", msg = { type = "saveReading" } },
    radarLock  = { key = Config.Keybinds.LockRadar, desc = "Toggle Radar Lock", msg = { type = "toggleLock" } },
    radarSelectFront = { key = Config.Keybinds.SelectFront, desc = "Select Front", msg = { type = "selectDirection", data = "Front" } },
    radarSelectRear = { key = Config.Keybinds.SelectRear, desc = "Select Rear", msg = { type = "selectDirection", data = "Rear" } },
    radarToggleLog = { key = Config.Keybinds.ToggleLog, desc = "Toggle Radar Log", msg = { type = "toggleLog" } },
    radarToggleBolo = { key = Config.Keybinds.ToggleBolo, desc = "Toggle BOLO List", msg = { type = "toggleBolo" } },
    radarToggleKeybinds = { key = Config.Keybinds.ToggleKeybinds, desc = "Toggle Radar Keybinds", msg = { type = "toggleKeybinds" } },
    radarSpeedLockThreshold = { key = Config.Keybinds.SpeedLockThreshold, desc = "Open Speed Lock Threshold Menu", msg = { type = "openSpeedLockModal" } },
}

for cmd, info in pairs(simpleCommands) do
    RegisterCommand(cmd, function() SendIfRadarEnabled(info.msg) end, false)
    if info.key and type(info.key) == "string" and info.key:match("%S") then
        RegisterKeyMapping(cmd, info.desc, "keyboard", info.key)
    end
end

-- Added speed lock threshold callback
RegisterNUICallback("setSpeedLockThreshold", function(data, cb)
    if data.threshold and data.enabled ~= nil then
        speedLockThreshold = data.threshold
        speedLockEnabled = data.enabled
        
        if Config.NotificationType == "custom" then
            ShowNotification("Speed lock threshold set to " .. data.threshold .. " MPH")
        end
    end
    cb({})
end)

-- NUI callbacks for BOLO, notifications, saving, input focus
RegisterNUICallback("addBoloPlate", function(data, cb)
    if data.plate then
        local upperPlate = string.upper(data.plate)
        table.insert(boloPlates, upperPlate)
        SendNUIMessage({ type = "updateBoloPlates", plates = boloPlates })
    end
    cb({})
end)

RegisterNUICallback("removeBoloPlate", function(data, cb)
    if data.plate then
        for i, p in ipairs(boloPlates) do
            if p == data.plate then
                table.remove(boloPlates, i)
                break
            end
        end
        SendNUIMessage({ type = "updateBoloPlates", plates = boloPlates })
    end
    cb({})
end)

RegisterNUICallback("boloAlert", function(data, cb)
    PlaySoundFrontend(-1, "TIMER_STOP", "HUD_MINI_GAME_SOUNDSET", 1)
    cb({})
end)

RegisterNUICallback("showNotification", function(data, cb)
    if Config.NotificationType == "custom" and data.message then
        ShowNotification(data.message)
    end
    cb({})
end)

RegisterNUICallback("savePositions", function(data, cb)
    SavePositions(data)
    cb({})
end)

RegisterNUICallback("inputActive", function(data, cb)
    inputActive = true
    SetNuiFocus(true, true)
    SetNuiFocusKeepInput(false)
    cb({})
end)

RegisterNUICallback("inputInactive", function(data, cb)
    inputActive = false
    if radarEnabled then
        SetNuiFocus(interacting, interacting)
        SetNuiFocusKeepInput(interacting)
    else
        SetNuiFocus(false, false)
    end
    cb({})
end)

-- Open/close UI helpers
local function OpenRadarUI()
    SendNUIMessage({ type = "open" })
    SendNUIMessage({ type = "setKeybinds", keybinds = Config.Keybinds })
    SendNUIMessage({ type = "setNotificationType", notificationType = Config.NotificationType })
    SendNUIMessage({ type = "setSpeedUnit", speedUnit = Config.SpeedUnit })
    local saved = LoadSavedPositions()
    if saved then
        SendNUIMessage({ type = "loadPositions", positions = saved })
    end
end

local function CloseRadarUI()
    interacting = false
    inputActive = false
    SetNuiFocus(false, false)
    SendNUIMessage({ type = "close" })
end

local function DoRadarUpdate(ped, veh)
    local pos     = GetEntityCoords(ped)
    local forward = GetEntityForwardVector(ped)

    local frontTarget = vector3(
        pos.x + forward.x * Config.FrontDetectionRange,
        pos.y + forward.y * Config.FrontDetectionRange,
        pos.z
    )
    local rearTarget = vector3(
        pos.x - forward.x * Config.RearDetectionRange,
        pos.y - forward.y * Config.RearDetectionRange,
        pos.z
    )

    local startPos = GetOffsetFromEntityInWorldCoords(veh, 0.0, 1.0, 1.0)

    local fRay = StartShapeTestCapsule(startPos, frontTarget, 6.0, 10, veh, 7)
    local _, _, _, _, fEnt = GetShapeTestResult(fRay)
    local fSpeed, fPlate = 0, ""
    if IsEntityAVehicle(fEnt) then
        fSpeed = math.ceil(GetEntitySpeed(fEnt) * Config.SpeedMultiplier)
        fPlate = GetVehicleNumberPlateText(fEnt)
        if fPlate and fPlate ~= "" then
            TriggerEvent('sd-policeradar:onPlateScanned', {
                plate = fPlate,
                speed = fSpeed,
                direction = "front",
                vehicle = fEnt
            })
        end
    end

    local rRay = StartShapeTestCapsule(startPos, rearTarget, 3.0, 10, veh, 7)
    local _, _, _, _, rEnt = GetShapeTestResult(rRay)
    local rSpeed, rPlate = 0, ""
    if IsEntityAVehicle(rEnt) then
        rSpeed = math.ceil(GetEntitySpeed(rEnt) * Config.SpeedMultiplier)
        rPlate = GetVehicleNumberPlateText(rEnt)
        if rPlate and rPlate ~= "" then
            TriggerEvent('sd-policeradar:onPlateScanned', {
                plate = rPlate,
                speed = rSpeed,
                direction = "rear",
                vehicle = rEnt
            })
        end
    end

    SendNUIMessage({
        type       = "update",
        frontSpeed = fSpeed,
        rearSpeed  = rSpeed,
        frontPlate = fPlate,
        rearPlate  = rPlate
    })

    if speedLockEnabled then
        if (fSpeed >= speedLockThreshold and fSpeed > 0) or (rSpeed >= speedLockThreshold and rSpeed > 0) then
            local triggerSpeed = math.max(fSpeed, rSpeed)
            local triggerPlate = ""
            local triggerDirection = ""
            
            if fSpeed >= speedLockThreshold and fSpeed > 0 then
                triggerPlate = fPlate
                triggerDirection = "Front"
            else
                triggerPlate = rPlate
                triggerDirection = "Rear"
            end
            
            SendNUIMessage({
                type = "speedLockTriggered",
                speed = triggerSpeed,
                plate = triggerPlate,
                direction = triggerDirection
            })
            speedLockEnabled = false
        end
    end
end

local interactDisableControls = { 
    1,2,24,25,68,69,70,91,92 
}

-- Comprehensive list of controls to disable when typing
local typingDisableControls = { 
    1,2,24,25,68,69,70,91,92,  -- Original controls
    30,31,32,33,34,35,          -- Movement controls (A,D,W,S,etc)
    71,72,73,74,75,76,          -- Vehicle controls
    59,60,61,62,63,64,65,       -- Vehicle steering/acceleration
    8,9,10,11,12,13,14,15,      -- Weapon controls
    16,17,18,19,20,21,22,23,    -- More controls
    44,45,46,47,48,49,50,51,    -- Cover/reload/etc
    140,141,142,143,144,        -- Melee controls
    177,178,179,180,181,        -- Exit vehicle controls (F key)
    199,200,201,202,203,204,    -- Pause menu controls
    322                         -- ESC key
}
for cmd,_ in pairs(simpleCommands) do
    table.insert(interactDisableControls, GetHashKey("+" .. cmd))
    table.insert(typingDisableControls, GetHashKey("+" .. cmd))
end

-- Main thread loop
CreateThread(function()
    local lastUpdate = GetGameTimer()

    while true do
        local ped = PlayerPedId()
        local veh = GetVehiclePedIsIn(ped, false)
        local inVeh = veh ~= 0
        local now   = GetGameTimer()

        if inVeh then
            if radarWasEnabled and not radarEnabled then
                radarEnabled   = true
                OpenRadarUI()
                radarWasEnabled = false
            end

            if radarEnabled and (now - lastUpdate >= Config.UpdateInterval) then
                lastUpdate = now
                DoRadarUpdate(ped, veh)
            end

        else
            if radarEnabled then
                if Config.ReopenRadarAfterLeave then
                    radarWasEnabled = true
                end
                CloseRadarUI()
                radarEnabled = false
            end
        end

        if inputActive then
            for _, ctrl in ipairs(typingDisableControls) do
                DisableControlAction(0, ctrl, true)
            end
            -- Also disable scroll wheel when typing
            for i = 0, 2 do
                DisableControlAction(i, 14, true)
                DisableControlAction(i, 15, true)
                DisableControlAction(i, 81, true)
                DisableControlAction(i, 82, true)
            end
        elseif interacting then
            for _, ctrl in ipairs(interactDisableControls) do
                DisableControlAction(0, ctrl, true)
            end
            -- Disable ALL scroll wheel controls when interacting with UI
            for i = 0, 2 do  -- Input groups 0, 1, 2
                DisableControlAction(i, 14, true)   -- Scroll wheel down
                DisableControlAction(i, 15, true)   -- Scroll wheel up
                DisableControlAction(i, 81, true)   -- Radio Wheel Down 
                DisableControlAction(i, 82, true)   -- Radio Wheel Up
                DisableControlAction(i, 99, true)   -- Vehicle Select Next Weapon
                DisableControlAction(i, 100, true)  -- Vehicle Select Previous Weapon
                DisableControlAction(i, 115, true)  -- Wheel Next
                DisableControlAction(i, 116, true)  -- Wheel Previous
                DisableControlAction(i, 261, true)  -- Wheel Down
                DisableControlAction(i, 262, true)  -- Wheel Up
            end
        end

        if radarEnabled or interacting then
            Wait(0)
        else
            Wait(200)
        end
    end
end)

-- Export to add a BOLO plate
exports('addBoloPlate', function(plate)
    if not plate or type(plate) ~= "string" or plate == "" then
        return false
    end
    
    local upperPlate = string.upper(plate)
    
    for _, existingPlate in ipairs(boloPlates) do
        if existingPlate == upperPlate then
            return false
        end
    end
    
    table.insert(boloPlates, upperPlate)
    
    if radarEnabled then
        SendNUIMessage({ type = "updateBoloPlates", plates = boloPlates })
    end
    
    return true
end)

-- Export to remove a BOLO plate
exports('removeBoloPlate', function(plate)
    if not plate or type(plate) ~= "string" or plate == "" then
        return false
    end
    
    local removed = false
    for i, existingPlate in ipairs(boloPlates) do
        if existingPlate:upper() == plate:upper() then
            table.remove(boloPlates, i)
            removed = true
            break
        end
    end
    
    if removed and radarEnabled then
        SendNUIMessage({ type = "updateBoloPlates", plates = boloPlates })
    end
    
    return removed
end)

exports('getBoloPlates', function()
    return boloPlates
end)

exports('isRadarEnabled', function()
    return radarEnabled
end)

exports('toggleRadar', function()
    ToggleRadar()
end)