return {
    NotificationType = "native", -- native/custom (native means built in notify from the radar itself, custom will mean it'll use ShowNotification function)

    ReopenRadarAfterLeave = true, -- true/false (if true, the radar will automatically reopen when you re-enter a vehicle after leaving it)

    ShowNotification = function(message)
        -- Custom notification function
        -- This is where you can implement your own notification system
        -- For example, using ESX or any other framework's notification system
    end,

    -- Restrict opening the radar to a certain class of vehicle
    RestrictToVehicleClass = {
        Enable = true, -- true/false
        Class = 18 -- Police vehicles (18)
    },

    Keybinds = { -- You can set these as nil if you don't want it to be something you open with a keybind.
        ToggleRadar = "F6",         -- Toggle radar on/off
        Interact = "F7",                -- Interact with radar UI
        SaveReading = "J",              -- Save current reading
        LockRadar = "F9",               -- Lock/unlock all (speed + plates)
        LockSpeed = "N",                  -- Lock/unlock speed only
        LockPlate = "M",                  -- Lock/unlock plates only
        ToggleLog = "F10",                -- Toggle log panel
        ToggleBolo = "F11",               -- Toggle BOLO list
        ToggleKeybinds = "F12",           -- Toggle keybinds display
        SpeedLockThreshold = nil,        -- Open speed lock threshold menu
    },

    -- LED glow effect on speed numbers (true = glow on, false = glow off)
    LedGlow = false,

    -- Speed unit configuration
    SpeedUnit = "MPH", -- "MPH" or "KMH"

    -- Update interval in ms
    UpdateInterval = 200,

    -- Max speed detection range in units (200 ≈ reliable, up to 350+)
    MaxDetectionRange = 200.0,

    -- Max plate reader range in units (default 50, same as wk_wars2x)
    PlateDetectionRange = 50.0,
}
