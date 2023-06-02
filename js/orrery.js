/* eslint-disable camelcase */
/*
  Calculating Planetary positions in JS

  Code based on old Electric Orrery Java code

  AMN 16/08/2015

*/

// Orbital elements.
//  There are six elements: N,i,w,a,e and M (as described in
//   Paul Schlyters' document). All can have two components:
//        Element = const + slope*dayval
//  These will be stored in a 3D array:
//      OrbitElement[Planet][Element][const/slope]
const ORB_N = 0
const ORB_i = 1
const ORB_w = 2
const ORB_a = 3
const ORB_e = 4
const ORB_M = 5

const OrbitElement = [
    // Sun (no orbit!)
    [[0.0, 0.0], // N
        [0.0, 0.0], // i
        [0.0, 0.0], // w
        [0.0, 0.0], // a
        [0.0, 0.0], // e
        [0.0, 0.0] // M
    ],
    // Mercury
    [[48.3313, 3.24587e-5], // N (Omega)
        [7.0047, 5.00e-8], // i
        [29.1241, 1.01444e-5], // w
        [0.387098, 0.0], // a
        [0.205635, 5.59e-10], // e
        [168.6562, 4.0923344368] // M
    ],
    // Venus
    [[76.6799, 2.46590e-5],
        [3.3946, 2.75e-8],
        [54.8910, 1.38374e-5],
        [0.723330, 0.0],
        [0.006773, -1.302e-9],
        [48.0052, 1.6021302244]
    ],
    // Earth (Or "Sun" in PS's document + 180deg shift on "M")
    [[0.0, 0.0],
        [0.0, 0.0],
        [282.9404, 4.70935e-5],
        [1.0, 0.0],
        [0.016709, -1.151e-9],
        [176.0470, 0.9856002585]
    ],
    // Mars
    [[49.5574, 2.11081e-5],
        [1.8497, -1.78e-8],
        [286.5016, 2.92961e-5],
        [1.523688, 0.0],
        [0.093405, 2.516e-9],
        [18.6021, 0.5240207766]
    ],
    // Jupiter
    [[100.4542, 2.76854e-5],
        [1.3030, -1.557e-7],
        [273.8777, 1.64505e-5],
        [5.20256, 0.0],
        [0.048498, 4.469e-9],
        [19.8950, 0.0830853001]
    ],
    // Saturn
    [[113.6634, 2.38980e-5],
        [2.4886, -1.081e-7],
        [339.3939, 2.97661e-5],
        [9.55475, 0.0],
        [0.055546, -9.499e-9],
        [316.9670, 0.0334442282]
    ],
    // Uranus
    [[74.0005, 1.3978e-5],
        [0.7733, 1.9e-8],
        [96.6612, 3.0565e-5],
        [19.18171, -1.55e-8],
        [0.047318, 7.45e-9],
        [142.5905, 0.011725806]
    ],
    // Neptune
    [[131.7806, 3.0173e-5],
        [1.7700, -2.55e-7],
        [272.8461, -6.027e-6],
        [30.05826, 3.313e-8],
        [0.008606, 2.15e-9],
        [260.2471, 0.005995147]
    ],
    // Pluto (Orbital elements are rather crude estimates based on bodged data, but probably OK)
    [[110.303, 2.839e-7],
        [17.1417, -8.41889e-9],
        [113.763, -1.1786e-5],
        [39.4817, 2.1057e-8],
        [0.24881, 1.7700e-9],
        [14.8561, 0.0039876]
    ],

    // Moon (NOT IMPLEMENTED YET)
    [[0.0, 0.0], // N
        [0.0, 0.0], // i
        [0.0, 0.0], // w
        [0.0, 0.0], // a
        [0.0, 0.0], // e
        [0.0, 0.0] // M
    ]]

// ======================================================================
// Variables used during the calculations

const X = 0; const Y = 1; const Z = 2

const DEG2RAD = Math.PI / 180.0

const ZeroDate = new Date(2000, 0, 1, 0, 0, 1) // 2000/1/1 00:00:01 (Months start from 0...)
const ZeroDateMillisec = ZeroDate.getTime()

// ---------------------------------------------------------------------
// Convert a JS date/time to the number of days from 00:00:01 0/0/2000

function DayVal (time) {
    const millisec = time.getTime() - ZeroDateMillisec
    const days = millisec / 8.64e7

    return (days)
}

// ======================================================================
// Calculate the [X,Y,Z] position of a single planet "planet" at
// time "time", returning the answer in an array

// eslint-disable-next-line no-unused-vars
function PlanetPosition (planet, time) {
    // var planet_p = planet
    // if (planet_p === 0) planet = 3
    // if (planet_p === 3) planet = 0
    const dayval = DayVal(time)

    const curorb = []; const pos = []
    let eccen_anom, eccen_anom0, eccen_anom1
    let i

    for (i = 0; i < 6; i++) {
        curorb[i] = OrbitElement[planet][i][0] +
            (dayval * OrbitElement[planet][i][1])
    }

    // Convert all angles to radians
    curorb[ORB_N] = curorb[ORB_N] * DEG2RAD
    curorb[ORB_i] = curorb[ORB_i] * DEG2RAD
    curorb[ORB_w] = curorb[ORB_w] * DEG2RAD
    while (curorb[ORB_M] > 360.0) curorb[ORB_M] -= 360.0
    while (curorb[ORB_M] < 0.0) curorb[ORB_M] += 360.0
    curorb[ORB_M] = curorb[ORB_M] * DEG2RAD

    // Calculate the eccentric anomaly
    //  E = M + e * sin(M) * (1+ e*cos(M)) [All in radians]
    eccen_anom = curorb[ORB_M] + (
        curorb[ORB_e] * Math.sin(curorb[ORB_M]) *
        (1.0 + curorb[ORB_e] * Math.cos(curorb[ORB_M]))
    )

    // Iterate if required
    eccen_anom0 = eccen_anom
    eccen_anom1 = eccen_anom0 - (
        eccen_anom0 - curorb[ORB_e] * Math.sin(eccen_anom0) -
        curorb[ORB_M]) /
        (1.0 - curorb[ORB_e] * Math.cos(eccen_anom0))
    while (Math.abs(eccen_anom1 - eccen_anom0) > 1.0e-5) {
        eccen_anom = eccen_anom0 - (
            eccen_anom0 - curorb[ORB_e] * Math.sin(eccen_anom0) -
            curorb[ORB_M]) /
            (1.0 - curorb[ORB_e] * Math.cos(eccen_anom0))
        eccen_anom0 = eccen_anom1
        eccen_anom1 = eccen_anom
    }

    // Now get the distance and "true anomaly"

    const xv = curorb[ORB_a] * (Math.cos(eccen_anom) - curorb[ORB_e])
    const yv = curorb[ORB_a] * (Math.sqrt(1.0 - curorb[ORB_e] * curorb[ORB_e]) *
        Math.sin(eccen_anom))

    const v = Math.atan2(yv, xv)
    const r = Math.sqrt(xv * xv + yv * yv)

    // Finally, get the full 3-D coordinates
    pos[X] = r * (Math.cos(curorb[ORB_N]) * Math.cos(v + curorb[ORB_w]) -
        Math.sin(curorb[ORB_N]) * Math.sin(v + curorb[ORB_w]) *
        Math.cos(curorb[ORB_i]))
    pos[Y] = r * (Math.sin(curorb[ORB_N]) * Math.cos(v + curorb[ORB_w]) +
        Math.cos(curorb[ORB_N]) * Math.sin(v + curorb[ORB_w]) *
        Math.cos(curorb[ORB_i]))
    pos[Z] = r * (Math.sin(v + curorb[ORB_w]) * Math.sin(curorb[ORB_i]))

    return (pos)
}

// ======================================================================
// Calculate a full ellipse of a single planet "planet" in "numstep"
// steps, returning the answer in an array

// eslint-disable-next-line no-unused-vars
function PlanetEllipse (planet, numsteps) {
    const orbEllipse = []

    let stp = 360.0 / (1.0 * numsteps)
    stp *= DEG2RAD

    const e = OrbitElement[planet][ORB_e][0]
    const a = OrbitElement[planet][ORB_a][0]
    const i = OrbitElement[planet][ORB_i][0] * DEG2RAD
    const N = OrbitElement[planet][ORB_N][0] * DEG2RAD
    const w = OrbitElement[planet][ORB_w][0] * DEG2RAD

    for (let lp = 0; lp < numsteps; lp++) {
        orbEllipse[lp] = []

        const E = lp * stp
        const xv = a * (Math.cos(E) - e)
        const yv = a * (Math.sqrt(1.0 - e * e) * Math.sin(E))

        const v = Math.atan2(yv, xv)
        const r = Math.sqrt(xv * xv + yv * yv)

        orbEllipse[lp][X] = r * (Math.cos(N) * Math.cos(v + w) -
            Math.sin(N) * Math.sin(v + w) *
            Math.cos(i))
        orbEllipse[lp][Y] = r * (Math.sin(N) * Math.cos(v + w) +
            Math.cos(N) * Math.sin(v + w) *
            Math.cos(i))
        orbEllipse[lp][Z] = r * (Math.sin(v + w) * Math.sin(i))
    }

    return (orbEllipse)
}
