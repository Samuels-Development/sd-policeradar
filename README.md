# sd-policeradar

sd-policeradar is a feature-packed police radar that includes standard functionalities such as checking the speeds (in both MPH and KMH) and license plates of vehicles both ahead and behind you. You can also lock the radar, save entries to a radar log for later retrieval, create BOLOs that highlight a license plate with a red background if it matches, set an auto radar lock, and more. The system features a convenient keybind menu displaying all available keybinds, along with the ability to freely move UI elements, resize them and save their positions using KVP—ensuring your players’ layouts are retained across restarts and logouts.

## UI Preview
![Discord_jbaYPnhgqu](https://github.com/user-attachments/assets/34304fef-51c3-4d03-acd8-09afe98cf6b4)
<img width="1938" height="1091" alt="image" src="https://github.com/user-attachments/assets/7daf0cfd-c91a-4eb2-91cf-d1e20e19cf44" />
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/b59e11c3-cc39-4644-86ff-91932aec15bd" />
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/8bab8f32-94e3-41c9-9539-b5740831098c" />
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/942a75fb-3a14-49e7-b724-7bf7f9330667" />




## 🔔 Contact

Author: Samuel#0008  
Discord: [Join the Discord](https://discord.gg/FzPehMQaBQ)  
Store: [Click Here](https://fivem.samueldev.shop)

## 💾 Installation

1. Download the latest release from the [GitHub repository](https://github.com/Samuels-Development/sd-policeradar/releases). (ZIP, NOT SOURCE)
2. Extract the downloaded file and rename the folder to `sd-policeradar`.
3. Place the `sd-policeradar` folder into your server's `resources` directory.
4. Add `ensure sd-policeradar` to your `server.cfg` to ensure the resource starts with your server.


## 📖 Dependencies
- None

## 📖 Usage

### Command
You can use `/radar` to open the UI and `/radarInteract` to actually click on elements of the UI.

### Keybinds
As mentioned above, you can also open and use elements of the radar system via keybinds, refer to Config.Keybinds in the `config.lua` file

## 🔧 Exports

The radar system provides several exports that allow other resources to interact with it programmatically:

### Events

#### `sd-policeradar:onPlateScanned`
This event is triggered automatically whenever a vehicle's license plate is scanned by the radar.

**Event Data:**
- `plate` (string): The scanned license plate text
- `speed` (number): The vehicle's speed in the configured units (MPH/KPH)
- `direction` (string): Either "front" or "rear" indicating which radar detected it
- `vehicle` (entity): The vehicle entity handle

**Example Usage:**
```lua
AddEventHandler('sd-policeradar:onPlateScanned', function(data)
    print('Plate scanned: ' .. data.plate)
    print('Speed: ' .. data.speed .. ' MPH')
    print('Direction: ' .. data.direction)
    print('Vehicle Entity: ' .. data.vehicle)
    
    -- Example: Check against a database
    if data.speed > 100 then
        -- Trigger speeding violation logic
        TriggerEvent('myResource:speedingViolation', data)
    end
end)
```

### Client Exports

#### `addBoloPlate`
Adds a license plate to the BOLO (Be On the Look Out) list. Plates are automatically converted to uppercase.

**Parameters:**
- `plate` (string): The license plate to add

**Returns:**
- `boolean`: `true` if the plate was added successfully, `false` if it already exists or invalid input

**Example Usage:**
```lua
-- Add a single BOLO plate
local success = exports['sd-policeradar']:addBoloPlate('ABC123')
if success then
    print('BOLO plate added successfully')
else
    print('Plate already exists or invalid input')
end

-- Add multiple plates from a database
local wantedPlates = {'XYZ789', 'DEF456', 'GHI012'}
for _, plate in ipairs(wantedPlates) do
    exports['sd-policeradar']:addBoloPlate(plate)
end
```

#### `removeBoloPlate`
Removes a license plate from the BOLO list. Case-insensitive.

**Parameters:**
- `plate` (string): The license plate to remove

**Returns:**
- `boolean`: `true` if the plate was removed, `false` if it wasn't found or invalid input

**Example Usage:**
```lua
-- Remove a BOLO plate
local removed = exports['sd-policeradar']:removeBoloPlate('ABC123')
if removed then
    print('BOLO plate removed')
else
    print('Plate not found in BOLO list')
end
```

#### `getBoloPlates`
Gets all current BOLO plates.

**Parameters:** None

**Returns:**
- `table`: Array of all BOLO plates (in uppercase)

**Example Usage:**
```lua
-- Get all BOLO plates
local boloList = exports['sd-policeradar']:getBoloPlates()
for _, plate in ipairs(boloList) do
    print('BOLO Plate: ' .. plate)
end

-- Check if a specific plate is in BOLO
local function isPlateInBolo(checkPlate)
    local boloList = exports['sd-policeradar']:getBoloPlates()
    checkPlate = string.upper(checkPlate)
    for _, plate in ipairs(boloList) do
        if plate == checkPlate then
            return true
        end
    end
    return false
end
```

#### `isRadarEnabled`
Checks if the radar is currently active/open.

**Parameters:** None

**Returns:**
- `boolean`: `true` if radar is enabled, `false` if disabled

**Example Usage:**
```lua
-- Check radar status
if exports['sd-policeradar']:isRadarEnabled() then
    print('Radar is currently active')
else
    print('Radar is not active')
end

-- Only perform action if radar is active
local function performRadarAction()
    if not exports['sd-policeradar']:isRadarEnabled() then
        return print('Please enable the radar first')
    end
    -- Perform action
end
```

#### `toggleRadar`
Programmatically toggles the radar on/off. Respects vehicle class restrictions if configured.

**Parameters:** None

**Returns:** None

**Example Usage:**
```lua
-- Toggle radar from another resource
exports['sd-policeradar']:toggleRadar()

-- Create a custom command
RegisterCommand('myradar', function()
    exports['sd-policeradar']:toggleRadar()
end, false)

-- Auto-enable radar when entering police vehicle
AddEventHandler('baseevents:enteredVehicle', function(vehicle, seat, displayName)
    if seat == -1 then -- Driver seat
        local vehClass = GetVehicleClass(vehicle)
        if vehClass == 18 then -- Emergency class
            Wait(1000)
            if not exports['sd-policeradar']:isRadarEnabled() then
                exports['sd-policeradar']:toggleRadar()
            end
        end
    end
end)
```

### Integration Examples

#### Example 1: MDT Integration
```lua
-- Send BOLO plates from MDT to radar
RegisterNetEvent('mdt:sendBoloToRadar', function(plateList)
    for _, plate in ipairs(plateList) do
        exports['sd-policeradar']:addBoloPlate(plate)
    end
    TriggerEvent('chat:addMessage', {
        args = {'^1RADAR', 'BOLO list updated from MDT'}
    })
end)
```

#### Example 2: Automatic BOLO Alerts
```lua
-- Alert when BOLO vehicle is detected
AddEventHandler('sd-policeradar:onPlateScanned', function(data)
    local boloList = exports['sd-policeradar']:getBoloPlates()
    local scannedPlate = string.upper(data.plate)
    
    for _, boloPlate in ipairs(boloList) do
        if boloPlate == scannedPlate then
            -- Send alert to dispatch
            TriggerServerEvent('dispatch:boloVehicleDetected', {
                plate = data.plate,
                speed = data.speed,
                location = GetEntityCoords(PlayerPedId())
            })
            break
        end
    end
end)
```

#### Example 3: Speed Violation System
```lua
-- Automatic speed violation detection
local speedLimit = 65 -- MPH

AddEventHandler('sd-policeradar:onPlateScanned', function(data)
    if data.speed > speedLimit then
        local violation = {
            plate = data.plate,
            speed = data.speed,
            overLimit = data.speed - speedLimit,
            timestamp = os.time()
        }
        
        -- Log the violation
        TriggerServerEvent('traffic:logSpeedViolation', violation)
        
        -- Notify officer
        TriggerEvent('chat:addMessage', {
            color = {255, 0, 0},
            args = {'^1VIOLATION', string.format('%s going %d MPH (%.0f over limit)', 
                data.plate, data.speed, violation.overLimit)}
        })
    end
end)
```
