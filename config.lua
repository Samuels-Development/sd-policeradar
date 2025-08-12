Config = {}

Config.NotificationType = "native" -- native/custom (native means built in notify from the radar itself, custom will mean it'll use ShowNotification function)

Config.ReopenRadarAfterLeave = true -- true/false (if true, the radar will automatically reopen when you re-enter a vehicle after leaving it)

ShowNotification = function(message)
    -- Custom notification function
    -- This is where you can implement your own notification system
    -- For example, using ESX or any other framework's notification system

    SD.ShowNotification(message, 'success') -- Example utilizing sd_lib's function (you'll need to import it to use this)
end

-- Restrict opening the radar to a certain class of vehicle
Config.RestrictToVehicleClass = {
    Enable = true, -- true/false
    Class = 18 -- Police vehicles (18)
}

Config.Keybinds = { -- You can set these as nil if you don't want it to be something you open with a keybind.
    ToggleRadar = "F6",         -- Toggle radar on/off
    Interact = "F7",                -- Interact with radar UI
    SaveReading = "J",              -- Save current reading
    LockRadar = "F9",                -- Lock/unlock radar
    SelectFront = "LEFT",           -- Select front radar
    SelectRear = "RIGHT",           -- Select rear radar
    ToggleLog = "F10",                -- Toggle log panel
    ToggleBolo = "F11",               -- Toggle BOLO list
    ToggleKeybinds = "F12",           -- Toggle keybinds display
    SpeedLockThreshold = nil,        -- Open speed lock threshold menu
}

-- Speed multiplier (2.23694 for MPH, 3.6 for KMH)
Config.SpeedMultiplier = 2.23694

-- Update interval in ms
Config.UpdateInterval = 200

-- Radar detection ranges
Config.FrontDetectionRange = 105.0
Config.RearDetectionRange = 105.0
