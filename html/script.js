const state = {
  isActive: true,
  showLog: false,
  showBolo: false,
  isPositioning: false,
  isLogPositioning: false,
  isBoloPositioning: false,
  frontSpeed: 0,
  rearSpeed: 0,
  frontPlate: "--------",
  rearPlate: "--------",
  boloPlates: [],
  boloAlerts: { front: false, rear: false },
  savedReadings: [],
  idCounter: 1,
  notificationType: "native",
  interactKey: "",
  selectedDirection: "Front",
}

const radarPanel = document.getElementById("radar-panel")
const logPanel = document.getElementById("log-panel")
const boloPanel = document.getElementById("bolo-panel")
const boloModal = document.getElementById("bolo-modal")
const keybindsPanel = document.getElementById("keybinds-panel")
const notification = document.getElementById("notification")
const frontPanel = document.getElementById("front-panel")
const rearPanel = document.getElementById("rear-panel")
const frontSpeed = document.getElementById("front-speed")
const rearSpeed = document.getElementById("rear-speed")
const frontPlate = document.getElementById("front-plate")
const rearPlate = document.getElementById("rear-plate")
const radarTitle = document.getElementById("radar-title")
const logTitle = document.getElementById("log-title")
const boloTitle = document.getElementById("bolo-title")
const radarHint = document.getElementById("radar-hint")
const logEntries = document.getElementById("log-entries")
const logEmpty = document.getElementById("log-empty")
const logPositioningHint = document.getElementById("log-positioning-hint")
const boloEntries = document.getElementById("bolo-entries")
const boloEmpty = document.getElementById("bolo-empty")
const boloPositioningHint = document.getElementById("bolo-positioning-hint")
const boloPlateInput = document.getElementById("bolo-plate-input")
const keybindsBtn = document.getElementById("keybinds-btn")
const positionBtn = document.getElementById("position-btn")
const lockBtn = document.getElementById("lock-btn")
const logBtn = document.getElementById("log-btn")
const boloBtn = document.getElementById("bolo-btn")
const saveBtn = document.getElementById("save-btn")
const logPositionBtn = document.getElementById("log-position-btn")
const boloPositionBtn = document.getElementById("bolo-position-btn")
const closeLogBtn = document.getElementById("close-log-btn")
const closeBoloBtnPanel = document.getElementById("close-bolo-btn")
const addBoloPlateBtn = document.getElementById("add-bolo-plate-btn")
const closeBoloBtnModal = document.getElementById("close-bolo-modal-btn")
const addBoloBtn = document.getElementById("add-bolo-btn")
let speedLockThreshold = 80
let speedLockEnabled = false
let speedLockUserDisabled = false
let lastLockTrigger = null
const speedLockBtn = document.getElementById("speed-lock-btn")
const speedLockModal = document.getElementById("speed-lock-modal")
const closeSpeedLockModalBtn = document.getElementById("close-speed-lock-modal-btn")
const speedLockInput = document.getElementById("speed-lock-input")
const setSpeedLockBtn = document.getElementById("set-speed-lock-btn")
const disableSpeedLockBtn = document.getElementById("disable-speed-lock-btn")

let isDragging = false
let isLogDragging = false
let isBolosDragging = false
let dragOffset = { x: 0, y: 0 }
let logDragOffset = { x: 0, y: 0 }
let boloDragOffset = { x: 0, y: 0 }

let animationFrameId = null
const currentMousePos = { x: 0, y: 0 }

function savePositions() {
  const positions = {
    radar: {
      left: radarPanel.style.left,
      top: radarPanel.style.top,
    },
    log: {
      left: logPanel.style.left,
      top: logPanel.style.top,
    },
    bolo: {
      left: boloPanel.style.left,
      top: boloPanel.style.top,
      right: boloPanel.style.right,
    },
  }

  fetch("https://sd-policeradar/savePositions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(positions),
  }).catch(() => {})
}

function handleMouseUp() {
  if (isDragging || isLogDragging || isBolosDragging) {
    savePositions()

    if (isDragging) {
      radarPanel.style.transition = "transform 0.2s ease, box-shadow 0.2s ease"
    }
    if (isLogDragging) {
      logPanel.style.transition = "transform 0.2s ease, box-shadow 0.2s ease"
    }
    if (isBolosDragging) {
      boloPanel.style.transition = "transform 0.2s ease, box-shadow 0.2s ease"
    }
  }

  isDragging = false
  isLogDragging = false
  isBolosDragging = false
  document.body.style.cursor = "default"

  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }
}

function init() {
  document.body.style.display = "none"
  const radarWidth = 288,
    radarHeight = 300,
    logWidth = 320,
    boloWidth = 280

  radarPanel.style.left = `${Math.max(0, (window.innerWidth - radarWidth) / 2)}px`
  radarPanel.style.top = `${Math.max(0, (window.innerHeight - radarHeight) / 2)}px`
  radarPanel.style.transform = "none"
  logPanel.style.left = `${Math.max(0, (window.innerWidth - radarWidth) / 2 - logWidth - 20)}px`
  logPanel.style.top = `${Math.max(0, (window.innerHeight - radarHeight) / 2)}px`
  boloPanel.style.right = "20px"
  boloPanel.style.top = "20px"

  setupEventListeners()
  initializeSelection()
}

function applyPositions(positions) {
  if (!positions) return

  if (positions.radar) {
    if (positions.radar.left) radarPanel.style.left = positions.radar.left
    if (positions.radar.top) radarPanel.style.top = positions.radar.top
  }

  if (positions.log) {
    if (positions.log.left) logPanel.style.left = positions.log.left
    if (positions.log.top) logPanel.style.top = positions.log.top
  }

  if (positions.bolo) {
    if (positions.bolo.left) {
      boloPanel.style.left = positions.bolo.left
      boloPanel.style.right = "auto"
    } else if (positions.bolo.right) {
      boloPanel.style.right = positions.bolo.right
    }
    if (positions.bolo.top) boloPanel.style.top = positions.bolo.top
  }
}

function setupEventListeners() {
  keybindsBtn.addEventListener("click", toggleKeybinds)
  positionBtn.addEventListener("click", togglePositioning)
  lockBtn.addEventListener("click", toggleRadar)
  logBtn.addEventListener("click", toggleLog)
  boloBtn.addEventListener("click", toggleBolo)
  saveBtn.addEventListener("click", saveReading)
  speedLockBtn.addEventListener("click", openSpeedLockModal)
  logPositionBtn.addEventListener("click", toggleLogPositioning)
  boloPositionBtn.addEventListener("click", toggleBoloPositioning)

  frontPanel.addEventListener("click", () => selectDirection("Front"))
  rearPanel.addEventListener("click", () => selectDirection("Rear"))

  closeLogBtn.addEventListener("click", () => {
    state.showLog = false
    logPanel.classList.add("hidden")
    logBtn.classList.remove("active")
  })
  closeBoloBtnPanel.addEventListener("click", () => {
    state.showBolo = false
    boloPanel.classList.add("hidden")
    boloBtn.classList.remove("active")
  })

  addBoloPlateBtn.addEventListener("click", showBoloModal)
  closeBoloBtnModal.addEventListener("click", hideBoloModal)
  addBoloBtn.addEventListener("click", addBoloPlate)

  closeSpeedLockModalBtn.addEventListener("click", closeSpeedLockModal)
  setSpeedLockBtn.addEventListener("click", setSpeedLockThreshold)
  disableSpeedLockBtn.addEventListener("click", disableSpeedLock)
  speedLockInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") setSpeedLockThreshold()
  })

  radarPanel.addEventListener("mousedown", handleRadarMouseDown)
  logPanel.addEventListener("mousedown", handleLogMouseDown)
  boloPanel.addEventListener("mousedown", handleBoloMouseDown)
  document.addEventListener("mousemove", handleMouseMove)
  document.addEventListener("mouseup", handleMouseUp)
}

function updateUIValues(data) {
  if (state.isActive) {
    if (data.frontSpeed !== undefined) {
      state.frontSpeed = data.frontSpeed
      frontSpeed.textContent = data.frontSpeed
    }
    if (data.rearSpeed !== undefined) {
      state.rearSpeed = data.rearSpeed
      rearSpeed.textContent = data.rearSpeed
    }
    if (data.frontPlate !== undefined) {
      state.frontPlate = data.frontPlate || "--------"
      frontPlate.textContent = state.frontPlate
      checkBoloMatch("front", data.frontPlate)
    }
    if (data.rearPlate !== undefined) {
      state.rearPlate = data.rearPlate || "--------"
      rearPlate.textContent = state.rearPlate
      checkBoloMatch("rear", data.rearPlate)
    }
  }
}

function checkBoloMatch(direction, plate) {
  if (!plate || plate === "--------") {
    if (direction === "front") {
      if (state.boloAlerts.front) {
        frontPanel.querySelector(".plate-box").classList.remove("bolo-alert")
        state.boloAlerts.front = false
      }
    } else {
      if (state.boloAlerts.rear) {
        rearPanel.querySelector(".plate-box").classList.remove("bolo-alert")
        state.boloAlerts.rear = false
      }
    }
    return
  }
  const cleanPlate = plate.trim().toUpperCase()
  const isMatch = state.boloPlates.some((boloPlate) => boloPlate.trim().toUpperCase() === cleanPlate)
  if (isMatch) {
    if (direction === "front") {
      if (!state.boloAlerts.front) {
        const plateBox = frontPanel.querySelector(".plate-box")
        plateBox.classList.add("bolo-alert")
        state.boloAlerts.front = true
        fetch("https://sd-policeradar/boloAlert", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ plate: cleanPlate, direction: "front" }),
        }).catch(() => {})
      }
    } else {
      if (!state.boloAlerts.rear) {
        const plateBox = rearPanel.querySelector(".plate-box")
        plateBox.classList.add("bolo-alert")
        state.boloAlerts.rear = true
        fetch("https://sd-policeradar/boloAlert", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ plate: cleanPlate, direction: "rear" }),
        }).catch(() => {})
      }
    }
  } else {
    if (direction === "front") {
      if (state.boloAlerts.front) {
        frontPanel.querySelector(".plate-box").classList.remove("bolo-alert")
        state.boloAlerts.front = false
      }
    } else {
      if (state.boloAlerts.rear) {
        rearPanel.querySelector(".plate-box").classList.remove("bolo-alert")
        state.boloAlerts.rear = false
      }
    }
  }
}

function handleRadarMouseDown(e) {
  if (!state.isPositioning) return
  isDragging = true
  document.body.style.cursor = "move"

  // Disable transitions during dragging for immediate response
  radarPanel.style.transition = "none"

  const rect = radarPanel.getBoundingClientRect()
  dragOffset = {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
  }
  e.preventDefault()
}

function handleLogMouseDown(e) {
  if (!state.isLogPositioning) return
  isLogDragging = true
  document.body.style.cursor = "move"

  logPanel.style.transition = "none"

  const rect = logPanel.getBoundingClientRect()
  logDragOffset = {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
  }
  e.preventDefault()
}

function handleBoloMouseDown(e) {
  if (!state.isBoloPositioning) return
  isBolosDragging = true
  document.body.style.cursor = "move"

  boloPanel.style.transition = "none"

  const rect = boloPanel.getBoundingClientRect()
  boloDragOffset = {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
  }
  e.preventDefault()
}

function handleMouseMove(e) {
  if (!isDragging && !isLogDragging && !isBolosDragging) return

  currentMousePos.x = e.clientX
  currentMousePos.y = e.clientY

  if (!animationFrameId) {
    animationFrameId = requestAnimationFrame(updateElementPositions)
  }
}

function updateElementPositions() {
  if (isDragging) {
    const newX = currentMousePos.x - dragOffset.x
    const newY = currentMousePos.y - dragOffset.y
    const maxX = window.innerWidth - radarPanel.offsetWidth
    const maxY = window.innerHeight - radarPanel.offsetHeight

    const clampedX = Math.max(0, Math.min(newX, maxX))
    const clampedY = Math.max(0, Math.min(newY, maxY))

    radarPanel.style.left = `${clampedX}px`
    radarPanel.style.top = `${clampedY}px`
  }

  if (isLogDragging) {
    const newX = currentMousePos.x - logDragOffset.x
    const newY = currentMousePos.y - logDragOffset.y
    const maxX = window.innerWidth - logPanel.offsetWidth
    const maxY = window.innerHeight - logPanel.offsetHeight

    const clampedX = Math.max(0, Math.min(newX, maxX))
    const clampedY = Math.max(0, Math.min(newY, maxY))

    logPanel.style.left = `${clampedX}px`
    logPanel.style.top = `${clampedY}px`
  }

  if (isBolosDragging) {
    const newX = currentMousePos.x - boloDragOffset.x
    const newY = currentMousePos.y - boloDragOffset.y
    const maxX = window.innerWidth - boloPanel.offsetWidth
    const maxY = window.innerHeight - boloPanel.offsetHeight

    const clampedX = Math.max(0, Math.min(newX, maxX))
    const clampedY = Math.max(0, Math.min(newY, maxY))

    boloPanel.style.left = `${clampedX}px`
    boloPanel.style.top = `${clampedY}px`
  }

  animationFrameId = null

  if (isDragging || isLogDragging || isBolosDragging) {
    animationFrameId = requestAnimationFrame(updateElementPositions)
  }
}

function toggleKeybinds() {
  state.showKeybinds = !state.showKeybinds
  keybindsPanel.classList.toggle("hidden", !state.showKeybinds)
  keybindsBtn.classList.toggle("active", state.showKeybinds)
}

function togglePositioning() {
  state.isPositioning = !state.isPositioning
  if (state.isPositioning) {
    radarPanel.classList.add("positioning")
    radarTitle.innerHTML = `<div class="status-indicator ${state.isActive ? "unlocked" : "locked"}"></div>POSITIONING`
    radarHint.textContent = "Click and drag to reposition"
    positionBtn.classList.add("active")
    if (state.isLogPositioning) {
      toggleLogPositioning()
    }
    if (state.isBoloPositioning) {
      toggleBoloPositioning()
    }
    if (state.showKeybinds) {
      toggleKeybinds()
    }
    showNotification("Click and drag to reposition radar")
  } else {
    radarPanel.classList.remove("positioning")
    radarTitle.innerHTML = `<div class="status-indicator ${state.isActive ? "unlocked" : "locked"}"></div>${state.isActive ? "UNLOCKED" : "LOCKED"}`
    updateDirectionHint()
    positionBtn.classList.remove("active")
    showNotification("Position saved")
  }
}

function toggleLogPositioning() {
  state.isLogPositioning = !state.isLogPositioning
  if (state.isLogPositioning) {
    logPanel.classList.add("positioning")
    logTitle.textContent = "POSITIONING LOG"
    logPositioningHint.classList.remove("hidden")
    logPositionBtn.classList.add("active")
    if (state.isPositioning) {
      togglePositioning()
    }
    if (state.isBoloPositioning) {
      toggleBoloPositioning()
    }
    showNotification("Click and drag to reposition log")
  } else {
    logPanel.classList.remove("positioning")
    logTitle.textContent = "RADAR LOG"
    logPositioningHint.classList.add("hidden")
    logPositionBtn.classList.remove("active")
    showNotification("Log position saved")
  }
}

function toggleBoloPositioning() {
  state.isBoloPositioning = !state.isBoloPositioning
  if (state.isBoloPositioning) {
    boloPanel.classList.add("positioning")
    boloTitle.textContent = "POSITIONING BOLO"
    boloPositioningHint.classList.remove("hidden")
    boloPositionBtn.classList.add("active")
    if (state.isPositioning) {
      togglePositioning()
    }
    if (state.isLogPositioning) {
      toggleLogPositioning()
    }
    showNotification("Click and drag to reposition BOLO list")
  } else {
    boloPanel.classList.remove("positioning")
    boloTitle.textContent = "BOLO PLATES"
    boloPositioningHint.classList.add("hidden")
    boloPositionBtn.classList.remove("active")
    showNotification("BOLO list position saved")
  }
}

function toggleRadar() {
  state.isActive = !state.isActive
  const statusIndicator = radarTitle.querySelector(".status-indicator")

  if (state.isActive) {
    lockBtn.innerHTML = '<i class="fa-solid fa-unlock"></i>'
    if (statusIndicator) {
      statusIndicator.classList.remove("locked")
      statusIndicator.classList.add("unlocked")
    }

    if (speedLockThreshold > 0 && !speedLockUserDisabled) {
      speedLockEnabled = true
      fetch("https://sd-policeradar/setSpeedLockThreshold", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          threshold: speedLockThreshold,
          enabled: true,
        }),
      }).catch(() => {})
    }
  } else {
    lockBtn.innerHTML = '<i class="fa-solid fa-lock"></i>'
    if (statusIndicator) {
      statusIndicator.classList.remove("unlocked")
      statusIndicator.classList.add("locked")
    }
  }

  radarTitle.innerHTML = `<div class="status-indicator ${state.isActive ? "unlocked" : "locked"}"></div>${state.isActive ? "UNLOCKED" : "LOCKED"}`
  showNotification(`Radar ${state.isActive ? "unlocked" : "locked"}`)
}

function toggleLog() {
  state.showLog = !state.showLog
  logPanel.classList.toggle("hidden", !state.showLog)
  logBtn.classList.toggle("active", state.showLog)
  updateLogEntries()
}

function toggleBolo() {
  state.showBolo = !state.showBolo
  boloPanel.classList.toggle("hidden", !state.showBolo)
  boloBtn.classList.toggle("active", state.showBolo)
  updateBoloEntries()
}

function showBoloModal() {
  boloModal.classList.remove("hidden")
  boloPlateInput.value = ""
  boloPlateInput.focus()
}

function hideBoloModal() {
  boloModal.classList.add("hidden")
}

function addBoloPlate() {
  const plate = boloPlateInput.value.trim()
  if (plate) {
    state.boloPlates.push(plate)
    fetch("https://sd-policeradar/addBoloPlate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ plate }),
    }).catch(() => {})
    updateBoloEntries()
    hideBoloModal()
    showNotification(`Added BOLO for plate: ${plate}`)
  }
}

function updateBoloEntries() {
  if (state.boloPlates.length > 0) {
    boloEntries.innerHTML = ""
    boloEmpty.classList.add("hidden")
    state.boloPlates.forEach((plate) => {
      const entryElement = document.createElement("div")
      entryElement.className = "bolo-entry"
      entryElement.innerHTML = `
        <div class="bolo-plate">${plate}</div>
        <div class="log-entry-actions">
          <button class="icon-button delete-bolo" data-plate="${plate}" title="Remove BOLO">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
      `
      boloEntries.appendChild(entryElement)
      const deleteBtn = entryElement.querySelector(".delete-bolo")
      deleteBtn.addEventListener("click", () => {
        removeBoloPlate(plate)
      })
    })
  } else {
    boloEntries.innerHTML = ""
    boloEmpty.classList.remove("hidden")
  }
}

function removeBoloPlate(plate) {
  state.boloPlates = state.boloPlates.filter((p) => p !== plate)
  fetch("https://sd-policeradar/removeBoloPlate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ plate }),
  }).catch(() => {})
  updateBoloEntries()
  showNotification(`Removed BOLO for plate: ${plate}`)
}

function selectDirection(direction) {
  if (state.selectedDirection === direction) return
  state.selectedDirection = direction
  frontPanel.classList.toggle("selected", direction === "Front")
  rearPanel.classList.toggle("selected", direction === "Rear")
  updateDirectionHint()
  showNotification(`Selected ${direction}`)
}

function initializeSelection() {
  frontPanel.classList.add("selected")
  rearPanel.classList.remove("selected")
  updateDirectionHint()

  radarTitle.innerHTML = `<div class="status-indicator ${state.isActive ? "unlocked" : "locked"}"></div>${state.isActive ? "UNLOCKED" : "LOCKED"}`

  lockBtn.innerHTML = state.isActive ? '<i class="fa-solid fa-unlock"></i>' : '<i class="fa-solid fa-lock"></i>'
}

function updateDirectionHint() {
  if (state.selectedDirection === "Front") {
    radarHint.textContent = "Front selected"
  } else {
    radarHint.textContent = "Rear selected"
  }
}

function saveReading() {
  const now = new Date()
  const timestamp = now.toLocaleTimeString() + " " + now.toLocaleDateString()
  const newReading = {
    id: state.idCounter++,
    timestamp,
    speed: state.selectedDirection === "Front" ? state.frontSpeed : state.rearSpeed,
    plate: state.selectedDirection === "Front" ? state.frontPlate : state.rearPlate,
    direction: state.selectedDirection,
  }
  state.savedReadings.unshift(newReading)
  showNotification(`Saved ${state.selectedDirection} reading`)
  if (state.showLog) {
    updateLogEntries()
  }
}

function updateLogEntries() {
  if (state.savedReadings.length > 0) {
    logEntries.innerHTML = ""
    logEmpty.classList.add("hidden")
    state.savedReadings.forEach((reading) => {
      const entryElement = document.createElement("div")
      entryElement.className = "log-entry"
      entryElement.innerHTML = `
                <div class="log-entry-info">
                    <div class="log-entry-speed">
                        <span class="log-entry-direction">${reading.direction}:</span>
                        <span class="log-entry-value">${reading.speed}</span>
                        <span class="log-entry-unit">mph</span>
                    </div>
                    <div class="log-entry-plate">${reading.plate}</div>
                    <div class="log-entry-time">${reading.timestamp}</div>
                </div>
                <div class="log-entry-actions">
                    <button class="icon-button delete-entry" data-id="${reading.id}" title="Delete entry">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
            `
      logEntries.appendChild(entryElement)
      const deleteBtn = entryElement.querySelector(".delete-entry")
      deleteBtn.addEventListener("click", () => {
        deleteReading(reading.id)
      })
    })
  } else {
    logEntries.innerHTML = ""
    logEmpty.classList.remove("hidden")
  }
}

function deleteReading(id) {
  state.savedReadings = state.savedReadings.filter((reading) => reading.id !== id)
  updateLogEntries()
}

function showNotification(message) {
  if (state.notificationType === "native") {
    notification.textContent = message
    notification.classList.remove("hidden")
    setTimeout(() => {
      notification.classList.add("hidden")
    }, 2000)
  } else if (state.notificationType === "custom") {
    fetch("https://sd-policeradar/showNotification", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message }),
    }).catch(() => {})
  }
}

function isValidKeybind(key) {
  return key && typeof key === "string" && key.trim() !== ""
}

function updateKeybindsDisplay(keybinds) {
  if (!keybinds) return
  const keybindsList = document.querySelector(".keybinds-list")
  if (!keybindsList) return

  keybindsList.innerHTML = ""

  if (isValidKeybind(keybinds.ToggleRadar)) {
    addKeybindRow(keybindsList, "Toggle Radar", keybinds.ToggleRadar)
  }
  if (isValidKeybind(keybinds.Interact)) {
    addKeybindRow(keybindsList, "Interact with Radar", keybinds.Interact)
  }
  if (isValidKeybind(keybinds.SaveReading)) {
    addKeybindRow(keybindsList, "Save Reading", keybinds.SaveReading)
  }
  if (isValidKeybind(keybinds.LockRadar)) {
    addKeybindRow(keybindsList, "Lock/Unlock Radar", keybinds.LockRadar)
  }
  if (isValidKeybind(keybinds.SelectFront)) {
    addKeybindRow(keybindsList, "Switch to Front", keybinds.SelectFront)
  }
  if (isValidKeybind(keybinds.SelectRear)) {
    addKeybindRow(keybindsList, "Switch to Rear", keybinds.SelectRear)
  }
  if (isValidKeybind(keybinds.ToggleLog)) {
    addKeybindRow(keybindsList, "Toggle Log", keybinds.ToggleLog)
  }
  if (isValidKeybind(keybinds.ToggleBolo)) {
    addKeybindRow(keybindsList, "Toggle BOLO List", keybinds.ToggleBolo)
  }
  if (isValidKeybind(keybinds.ToggleKeybinds)) {
    addKeybindRow(keybindsList, "Show/Hide Keybinds", keybinds.ToggleKeybinds)
  }
  if (isValidKeybind(keybinds.SpeedLockThreshold)) {
    addKeybindRow(keybindsList, "Speed Lock Threshold", keybinds.SpeedLockThreshold)
  }
}

function addKeybindRow(container, name, key) {
  const row = document.createElement("div")
  row.className = "keybind-row"
  row.innerHTML = `
    <span class="keybind-name">${name}</span>
    <span class="keybind-key">${formatKeyName(key)}</span>
  `
  container.appendChild(row)
}

function formatKeyName(key) {
  switch (key.toUpperCase()) {
    case "LEFT":
      return "←"
    case "RIGHT":
      return "→"
    case "UP":
      return "↑"
    case "DOWN":
      return "↓"
    default:
      return key.toUpperCase()
  }
}

function openSpeedLockModal() {
  speedLockModal.classList.remove("hidden")
  speedLockInput.value = speedLockThreshold
  speedLockInput.focus()
  speedLockInput.select()
}

function closeSpeedLockModal() {
  speedLockModal.classList.add("hidden")
}

function setSpeedLockThreshold() {
  const newThreshold = Number.parseInt(speedLockInput.value)
  if (newThreshold && newThreshold > 0 && newThreshold <= 200) {
    speedLockThreshold = newThreshold
    speedLockEnabled = true
    speedLockUserDisabled = false
    closeSpeedLockModal()
    showNotification(`Speed lock threshold set to ${speedLockThreshold} MPH`)

    if (window.invokeNative) {
      fetch("https://sd-policeradar/setSpeedLockThreshold", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          threshold: speedLockThreshold,
          enabled: true,
        }),
      }).catch(() => {})
    }
  } else {
    showNotification("Please enter a valid speed between 1-200 MPH")
  }
}

function disableSpeedLock() {
  speedLockEnabled = false
  speedLockUserDisabled = true
  closeSpeedLockModal()
  showNotification("Speed lock threshold disabled")

  if (window.invokeNative) {
    fetch("https://sd-policeradar/setSpeedLockThreshold", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        threshold: speedLockThreshold,
        enabled: false,
      }),
    }).catch(() => {})
  }
}

function updateRadarData() {
  if (!state.isActive) return

  fetch("https://sd-policeradar/getRadarData")
    .then((response) => response.json())
    .then((data) => {
      if (data.front) {
        frontSpeed.textContent = data.front.speed || "0"
        frontPlate.textContent = data.front.plate || "--------"

        if (data.front.speed && Number.parseInt(data.front.speed) >= speedLockThreshold && speedLockEnabled) {
          toggleRadar()
          lastLockTrigger = data.front.plate || "Unknown Vehicle"
          showNotification(`Auto-locked: ${lastLockTrigger} - Speed ${data.front.speed} MPH exceeds threshold`)
        }
      }
      if (data.rear) {
        rearSpeed.textContent = data.rear.speed || "0"
        rearPlate.textContent = data.rear.plate || "--------"

        if (data.rear.speed && Number.parseInt(data.rear.speed) >= speedLockThreshold && speedLockEnabled) {
          toggleRadar()
          lastLockTrigger = data.rear.plate || "Unknown Vehicle"
          showNotification(`Auto-locked: ${lastLockTrigger} - Speed ${data.rear.speed} MPH exceeds threshold`)
        }
      }
    })
    .catch(() => {})
}

document.addEventListener("DOMContentLoaded", init)

window.addEventListener("message", (event) => {
  const data = event.data
  if (data.type === "open") {
    document.body.style.display = "block"
  } else if (data.type === "close") {
    document.body.style.display = "none"
  } else if (data.type === "update") {
    updateUIValues(data)
  } else if (data.type === "updateBoloPlates") {
    state.boloPlates = data.plates || []
    updateBoloEntries()
  } else if (data.type === "saveReading") {
    saveReading()
  } else if (data.type === "toggleLock") {
    toggleRadar()
  } else if (data.type === "selectDirection") {
    if (data.data === "Front" || data.data === "Rear") {
      selectDirection(data.data)
    }
  } else if (data.type === "toggleLog") {
    toggleLog()
  } else if (data.type === "toggleBolo") {
    toggleBolo()
  } else if (data.type === "toggleKeybinds") {
    toggleKeybinds()
  } else if (data.type === "setKeybinds") {
    updateKeybindsDisplay(data.keybinds)
    if (data.keybinds && data.keybinds.Interact) {
      state.interactKey = data.keybinds.Interact
    }
  } else if (data.type === "setNotificationType") {
    state.notificationType = data.notificationType || "native"
  } else if (data.type === "loadPositions") {
    applyPositions(data.positions)
  } else if (data.type === "speedLockTriggered") {
    if (speedLockEnabled) {
      toggleRadar()
      lastLockTrigger = data.plate || "Unknown Vehicle"

      const plateInfo = data.plate && data.plate !== "--------" ? ` (${data.plate})` : ""
      showNotification(
        `Auto-locked: ${data.direction} radar - ${data.speed} MPH${plateInfo} exceeds ${speedLockThreshold} MPH threshold`,
      )
    }
  } else if (data.type === "openSpeedLockModal") {
    openSpeedLockModal()
  }
})
