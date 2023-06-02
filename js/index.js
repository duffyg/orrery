/* globals PlanetEllipse, PlanetPosition, X, Y */
// ==================================================================
// Planetary constants
const NUMPLAN = 8 // Number of planets (not inc pluto)
const SUN = 0 // An ID for the Sun
// const MER = 1 // Planet IDs
// const VEN = 2
const EAR = 3
// const MAR = 4
// const JUP = 5
// const SAT = 6
// const URA = 7
// const NEP = 8
// const PLU = 9 // Cannot be done using orbital elements, so not implmenets
// const MON = 10 // I may want to add the moon later, so include it for now...

// The names of the planets
const PlanetName = ['Sun', 'Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn',
    'Uranus', 'Neptune', 'Pluto', 'Moon']

// The radii of the planets (or Sun or Pluto or Moon) in km
const PlanetRadius = [695000, 2440, 6052, 6378, 3397, 71492, 60268,
    25559, 24746, 1186, 3474]

// ==========================================
// Basic setup of canvas etc
const orrCanvas = document.getElementById('orrCanvas')
const orrContext = orrCanvas.getContext('2d')

const orrKeyCanv = document.getElementById('orrKeyCanvas')
const orrKeyCont = orrKeyCanv.getContext('2d')

const requestAnimationFrame = window.requestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.msRequestAnimationFrame

// ==========================================
// Helper functions to do scalings etc

// ----------------------------------------------------
// Scaling factors and current "date" for displaying
let spaceScale = 0.00006 // The current spacial scaling from AU to canvas pixels
let spaceScaleDesired = 0.06 // The spacial scale to aim for
const spaceScaleRate = 0.08 // The multiplicative change in scale per frame

let timeScale = 0.0 // Scaling from "real" time to displayed time (default to stationary).

// The "date" being displayed (defaults to "now")
let dispDate = new Date()
// The date and time that the current "rate" starts from (defaults to "now")
let startDate = new Date()
let startTime = (new Date().getTime())
// The upper and lower limits on the date to display
const minDate = new Date('January 1, 1800')
const maxDate = new Date('December 31, 2200')

// ----------------------------------------------------
// Convert from AU coordinate to pixel on the orrCanvas
function AU2pix (au, pix) {
    const midX = orrCanvas.width / 2.0
    const midY = orrCanvas.height / 2.0

    pix[X] = midX + (au[X] / spaceScale)
    pix[Y] = midY + (au[Y] / spaceScale)
}

// ----------------------------------------------------
// Convert from time-from-start to "space" time
function time2date (startTime, startDate) {
    const now = (new Date().getTime())
    const timDif = now - startTime
    let timscl = (timDif * timeScale) + startDate.getTime()
    if (timscl > maxDate.getTime()) {
        timscl = maxDate.getTime()
        rateChanged('but_ratestop') // Force it to "stop"
    }
    if (timscl < minDate.getTime()) {
        timscl = minDate.getTime()
        rateChanged('but_ratestop')
    }
    dispDate.setTime(timscl)
}

// ==========================================
// Handlers for buttons
function rateChanged (buttid) {
    // Enable all the buttons (the one that has beeb selected will be disabled below)
    document.getElementById('but_ratebbb').disabled = false
    document.getElementById('but_ratebb').disabled = false
    document.getElementById('but_rateb').disabled = false
    document.getElementById('but_ratestop').disabled = false
    document.getElementById('but_ratef').disabled = false
    document.getElementById('but_rateff').disabled = false
    document.getElementById('but_ratefff').disabled = false

    // Get the rate from the appropriate button

    // 5 days per second: 8.64e5
    // 1 year per second: 3.15e7
    // 10 years per second: 3.15e8
    let newrate
    switch (buttid) {
    case 'but_ratebbb':
        newrate = -3.15e8
        break
    case 'but_ratebb':
        newrate = -3.15e7
        break
    case 'but_rateb':
        newrate = -8.64e5
        break
    case 'but_ratestop':
        newrate = 0
        break
    case 'but_ratef':
        newrate = 8.64e5
        break
    case 'but_rateff':
        newrate = 3.15e7
        break
    case 'but_ratefff':
        newrate = 3.15e8
        break
    }

    timeScale = newrate
    startDate.setTime(dispDate.getTime())
    startTime = (new Date().getTime())

    // Display/enable all the appropraite buttons
    document.getElementById(buttid).disabled = true

    // If anything other than "stop", disable all the "step" buttons
    const stepst = (newrate !== 0)
    document.getElementById('but_stepbyr').disabled = stepst
    document.getElementById('but_stepbmn').disabled = stepst
    document.getElementById('but_stepbdy').disabled = stepst
    document.getElementById('but_stepnow').disabled = stepst
    document.getElementById('but_stepfdy').disabled = stepst
    document.getElementById('but_stepfmn').disabled = stepst
    document.getElementById('but_stepfyr').disabled = stepst
}

// eslint-disable-next-line no-unused-vars
function changeDate (act) {
    // Get the current date for changing
    let yr = dispDate.getFullYear()
    let mn = dispDate.getMonth()
    let dy = dispDate.getDate()

    // and a temporary date to store it all in
    let tmpdate = new Date()
    tmpdate.setFullYear(yr)
    tmpdate.setMonth(mn)
    tmpdate.setDate(dy)

    // Parse the string and see what is says
    switch (act) {
    case '-y':
        yr -= 1
        tmpdate.setFullYear(yr)
        break
    case '-m':
        mn -= 1
        tmpdate.setMonth(mn, dy)
        break
    case '-d':
        dy -= 1
        tmpdate.setMonth(mn, dy)
        break
    case '+y':
        yr += 1
        tmpdate.setFullYear(yr)
        break
    case '+m':
        mn += 1
        tmpdate.setMonth(mn, dy)
        break
    case '+d':
        dy += 1
        tmpdate.setMonth(mn, dy)
        break
    case 'now':
        tmpdate = new Date()
        break
    }

    // And pass it into the system, doing the boundary checks at the same time)
    startDate = tmpdate
    startTime = (new Date().getTime())
    time2date(startTime, startDate)
}

// ==========================================
// Orbital paths
let orbPath = [] // The actual paths
const orbPathStep = 50 // Number of steps on an orbital path

function createOrbPaths () {
    orbPath = [] // Initialise to nothing

    let orbp = []; let i
    orbp[0] = 0 // Create a blank value for the sun, which will never be used
    orbPath.push(orbp)

    for (i = 1; i <= NUMPLAN + 1; i++) { // 0 is for the Sun, +1 is for Pluto
        orbp = PlanetEllipse(i, orbPathStep)
        orbPath.push(orbp)
    }
}

// ==========================================
// Colours etc
const orbPathCols = ['#ffffee', // Sun (not used)
    '#999999', // Mercury
    '#CCCC33', // Venus
    '#3366FF', // Earth
    '#FF6666', // Mars
    '#FFCC33', // Jupiter
    '#CCCC33', // Saturn
    '#33CCCC', // Uranus
    '#33CCFF', // Neptune
    '#CCCCCC' // Pluto
]
const orbPlanetCols = ['#ffff00', // Sun
    '#666666', // Mercury
    '#999900', // Venus
    '#3399FF', // Earth
    '#CC0000', // Mars
    '#CC9900', // Jupiter
    '#CCCC00', // Saturn
    '#009999', // Uranus
    '#0099CC', // Neptune
    '#999999' // Pluto
]

const orbLabelCols = ['#ffff00', // Sun
    '#CCCCCC', // Mercury
    '#FFFF66', // Venus
    '#99CCFF', // Earth
    '#FF6666', // Mars
    '#FFCC66', // Jupiter
    '#FFFF66', // Saturn
    '#66FFFF', // Uranus
    '#66CCFF', // Neptune
    '#CCCCCC' // Pluto
]

let flgLabel // Do we show labels?
let flgPluto // Do we show Pluto?
let flgGeo // Geocentric view?

// eslint-disable-next-line no-unused-vars
function onClickGeo (elem) {
    const geo = document.getElementById('toggleGeo')
    if (geo.checked) console.log('geo checked')
    else console.log('geo unchecked')
}
// ==========================================
// Drawing functions

// ----------------------------------------------------
// Draw all the orbitals
function drawOrbitals (plutoFlag) {
    let p, np
    const orbear = PlanetPosition(EAR, dispDate)
    if (plutoFlag) np = NUMPLAN + 1
    else np = NUMPLAN
    for (p = 1; p <= np; p++) { // 0 is for Sun, +1 is for Pluto
        orrContext.beginPath()
        // Scale the line width based on whether this is only in the centre...
        let widpix
        const pos = []; const posB = []; let i

        AU2pix(orbPath[p][0], pos)
        AU2pix(orbPath[p][orbPathStep >> 1], posB)
        widpix = ((pos[X] - posB[X]) * (pos[X] - posB[X])) + ((pos[Y] - posB[Y]) * (pos[Y] - posB[Y]))
        widpix = Math.sqrt(widpix)
        if (widpix < (orrCanvas.width >> 3)) orrContext.lineWidth = '1'
        else orrContext.lineWidth = '2'
        orrContext.strokeStyle = orbPathCols[p]

        let orbPos = getOrbPos(p, orbPath[p][0], orbear)

        // AU2pix(orbPath[p][0], pos);
        AU2pix(orbPos, pos)
        orrContext.moveTo(pos[X], pos[Y])
        for (i = 1; i < orbPathStep; i++) {
            orbPos = getOrbPos(p, orbPath[p][i], orbear)
            // AU2pix(orbPath[p][i], pos);
            AU2pix(orbPos, pos)
            orrContext.lineTo(pos[X], pos[Y])
        }
        orrContext.closePath()
        orrContext.stroke()
    }
}
function getOrbPos (p, orbpos, orbear) {
    if (!flgGeo) return orbpos
    const pos = [orbpos[0], orbpos[1], orbpos[2]]
    if (p !== EAR) {
        pos[0] = pos[0] - orbear[0]
        pos[1] = pos[1] - orbear[1]
        pos[2] = pos[2] - orbear[2]
    }
    return pos
}

// ----------------------------------------------------
// Draw all the planets
function drawPlanets (plutoFlag) {
    let p; let np; let r; const posSun = []
    let orbpos; const pos = []
    const orbear = PlanetPosition(EAR, dispDate)
    const orbsun = PlanetPosition(SUN, dispDate)
    AU2pix(orbsun, posSun)
    // orbpos = PlanetPosition(SUN, dispDate);
    // AU2pix(orbpos, posSun);
    if (plutoFlag) np = NUMPLAN + 1
    else np = NUMPLAN
    for (p = np; p >= 0; p--) { // 0 is for Sun, +1 is for Pluto. Draw the Sun last
        orrContext.beginPath()
        orbpos = PlanetPosition(p, dispDate)
        if (flgGeo) {
            if (p === SUN) {
                orbpos[0] = 0 - orbear[0]
                orbpos[1] = 0 - orbear[1]
                orbpos[2] = 0 - orbear[2]
            }
            else if (p === EAR) {
                orbpos[0] = 0
                orbpos[1] = 0
                orbpos[2] = 0
            }
            else {
                orbpos[0] = orbpos[0] - orbear[0]
                orbpos[1] = orbpos[1] - orbear[1]
                orbpos[2] = orbpos[2] - orbear[2]
            }
        }
        AU2pix(orbpos, pos)

        // Calculate a radius that scales very roughly with object radius, but also scales as we zoom in or out.
        // The minimum radius is set tso that everthing (even Pluto) is always visible
        r = 1.5 + (Math.sqrt(PlanetRadius[p]) / (100.0 * Math.sqrt(spaceScale)))
        // However make sure that the Sun stays fixed relative to the scale (albeit quite large)
        if (p === 0) {
            r = 2 + (0.5 / Math.sqrt(spaceScale))
        }
        orrContext.arc(pos[X], pos[Y], r, 0, 2 * Math.PI)
        orrContext.lineWidth = '1'
        orrContext.strokeStyle = orbPlanetCols[p]
        orrContext.fillStyle = orbPlanetCols[p]
        orrContext.fill()

        orrContext.stroke()

        // Put a label if this is a decent distance from the Sun
        if (flgLabel) {
            let diff
            if (p !== SUN) {
                diff = ((pos[X] - posSun[X]) * (pos[X] - posSun[X])) + ((pos[Y] - posSun[Y]) * (pos[Y] - posSun[Y]))
                diff = Math.sqrt(diff)
            }
            else diff = orrCanvas.width
            if (diff > (orrCanvas.width / 11.5)) {
                orrContext.font = '14px Arial'
                orrContext.fillStyle = orbLabelCols[p]
                orrContext.textAlign = 'center'
                orrContext.fillText(PlanetName[p], pos[X], pos[Y] - (1.2 * r))
            }
        }
    }
}

function drawKey () {
    const wid = orrKeyCanv.width
    const hgt = orrKeyCanv.height
    const cwid = wid / 2
    const chgt = hgt / 6

    let x, y
    // Sun (in the middle at the top. no line)
    x = wid / 2
    y = chgt / 2
    // orrKeyCont.beginPath();
    // orrKeyCont.lineWidth="2"
    // orrKeyCont.strokeStyle = orbPathCols[SUN];
    // orrKeyCont.moveTo(x-(cwid/2),y);
    // orrKeyCont.lineTo(x,y);
    // orrKeyCont.stroke();

    orrKeyCont.beginPath()
    orrKeyCont.arc(x - (cwid / 4), y, 6, 0, 2.0 * Math.PI)
    orrKeyCont.lineWidth = '1'
    orrKeyCont.strokeStyle = orbPlanetCols[SUN]
    orrKeyCont.fillStyle = orbPlanetCols[SUN]
    orrKeyCont.fill()
    orrKeyCont.stroke()

    orrKeyCont.font = '14px Arial'
    orrKeyCont.fillStyle = orbLabelCols[SUN]
    orrKeyCont.textAlign = 'start'
    orrKeyCont.fillText(PlanetName[SUN], x + 4, y + 7)

    x = cwid / 2
    y = y + chgt
    for (let p = 1; p <= NUMPLAN + 1; p++) {
        if (p === (NUMPLAN + 1)) { // Pluto goes in the middle
            x = cwid
        }
        orrKeyCont.beginPath()
        orrKeyCont.lineWidth = '2'
        orrKeyCont.strokeStyle = orbPathCols[p]
        orrKeyCont.moveTo(x - (cwid / 2), y)
        orrKeyCont.lineTo(x, y)
        orrKeyCont.stroke()

        orrKeyCont.beginPath()
        orrKeyCont.arc(x - (cwid / 4), y, 6, 0, 2.0 * Math.PI)
        orrKeyCont.lineWidth = '1'
        orrKeyCont.strokeStyle = orbPlanetCols[p]
        orrKeyCont.fillStyle = orbPlanetCols[p]
        orrKeyCont.fill()
        orrKeyCont.stroke()

        orrKeyCont.font = '14px Arial'
        orrKeyCont.fillStyle = orbLabelCols[p]
        orrKeyCont.textAlign = 'start'
        orrKeyCont.fillText(PlanetName[p], x + 4, y + 7)

        x = x + cwid
        if (x >= wid) {
            x = cwid / 2
            y = y + chgt
        }
    }
}

// ----------------------------------------------------
// Calculate and store all the orbital paths
createOrbPaths()

// ++++++++++++++TESTING++++++++++++++
//       Basic orbital motion
function drawAnim () {
    // Clear the canvas ready to redraw
    orrContext.clearRect(0, 0, orrCanvas.width, orrCanvas.height)

    // Add the current date in a nicely formatted way
    let str
    const yr = dispDate.getFullYear()
    const mn = dispDate.getMonth() + 1
    const dy = dispDate.getDate()
    if (dy < 10) str = '0' + dy + '/'
    else str = dy + '/'
    if (mn < 10) str += '0' + mn + '/'
    else str += mn + '/'
    str += yr
    orrContext.beginPath()
    orrContext.font = '20px Courier New'
    orrContext.fillStyle = '#FFFFCC'
    orrContext.textAlign = 'end'
    orrContext.fillText(str, 0.99 * orrCanvas.width, 20)

    // See how long we have been since "starttime"
    // const time = (new Date().getTime())
    // const timeDiff = time - startTime
    time2date(startTime, startDate)

    // Get the scale from the appropriate "checked" radio button
    const scaleRads = document.getElementsByName('rad_scale')
    for (let i = 0; i < scaleRads.length; i++) {
        if (scaleRads[i].checked === true) {
            spaceScaleDesired = scaleRads[i].value
        }
    }

    // If we are not where we want to be then change where we
    // are. However, as this is multiplicative, there will be no "end"
    // point, so have a final check to ensure convergence when it is
    // very close.

    if (spaceScaleDesired !== spaceScale) {
        const dif = spaceScale - spaceScaleDesired
        const frac = Math.abs(dif) / spaceScaleDesired
        if (frac < 0.005) {
            spaceScale = spaceScaleDesired
        }
        else {
            spaceScale = spaceScale - (spaceScaleRate * dif)
        }
    }

    // ==== Draw everything using current scale and date ====
    flgPluto = document.getElementById('togglePluto').checked
    flgGeo = document.getElementById('toggleGeo').checked
    flgLabel = document.getElementById('toggleLabel').checked
    drawOrbitals(flgPluto)
    drawPlanets(flgPluto)

    requestAnimationFrame(function () {
        drawAnim()
    })
}

startTime = (new Date().getTime())
startDate = (new Date())
dispDate = (new Date())
rateChanged('but_ratestop')
drawKey()
drawAnim()
