/*
  Calculating Planetary positions in JS

  Code based on old Eletric Orrery Java code

  AMN 16/08/2015

*/


 // ==================================================================
 // Planetary constants

 var
 NUMPLAN = 8, // Number of planets (not inc pluto)
 SUN = 0,     // An ID for the Sun
 MER = 1,     // Planet IDs
 VEN = 2,
 EAR = 3,
 MAR = 4,
 JUP = 5,
 SAT = 6,
 URA = 7,
 NEP = 8,
 PLU = 9,    // Cannot be done using orbital elements, so not implmenets
 MON = 10;   // I may want to add the moon later, so include it for now...

var   // The name of the planet
 PlanetName = ["Sun", "Mercury", "Venus", "Earth", "Mars", "Jupiter", "Saturn",
       "Uranus", "Neptune", "Pluto", "Moon"];

var   // The radius of the planet (or Sun or Pluto or Moon) in km
 PlanetRadius = [ 695000, 
                  2440, 6052, 6378, 3397, 71492, 60268, 25559, 24746, 1186,
                  3474];

   // Orbital elements.
   //  There are six elements: N,i,w,a,e and M (as described in
   //   Paul Schlyters' document). All can have two components:
   //        Element = const + slope*dayval
   //  These will be stored in a 3D array:
   //      OrbitElement[Planet][Element][const/slope]
var ORB_N = 0,
   ORB_i = 1,
   ORB_w = 2,
   ORB_a = 3,
   ORB_e = 4,
   ORB_M = 5;

var OrbitElement = [
   // Sun (no orbit!)
   [ [ 0.0, 0.0 ],   // N
         [ 0.0, 0.0 ],   // i
         [ 0.0, 0.0 ],   // w
         [ 0.0, 0.0 ],   // a
         [ 0.0, 0.0 ],   // e
         [ 0.0, 0.0 ]    // M
   ],
   // Mercury
   [ [ 48.3313,    3.24587e-5 ],   // N (Omega)
         [ 7.0047,     5.00e-8 ],      // i
         [ 29.1241,    1.01444e-5 ],   // w
         [ 0.387098,   0.0 ],          // a
         [ 0.205635,   5.59e-10 ],     // e
         [ 168.6562,   4.0923344368 ]  // M
   ],
   // Venus
   [ [ 76.6799,    2.46590e-5 ],
     [ 3.3946,     2.75e-8 ],
     [ 54.8910,    1.38374e-5 ],
     [ 0.723330,   0.0 ],
     [ 0.006773,  -1.302e-9 ],
     [ 48.0052,    1.6021302244 ]
   ],
   // Earth (Or "Sun" in PS's document + 180deg shift on "M")
   [ [ 0.0,        0.0 ],
     [ 0.0,        0.0 ],
     [ 282.9404,   4.70935e-5 ],
     [ 1.0,        0.0 ],
     [ 0.016709,  -1.151e-9 ],
     [ 176.0470,   0.9856002585 ]
   ],
   // Mars
   [ [ 49.5574,    2.11081e-5 ],
     [ 1.8497,    -1.78e-8 ],
     [ 286.5016,   2.92961e-5 ],
     [ 1.523688,   0.0 ],
     [ 0.093405,   2.516e-9 ],
     [ 18.6021,    0.5240207766 ]
   ],
   // Jupiter
   [ [ 100.4542,   2.76854e-5 ],
     [ 1.3030,    -1.557e-7 ],
     [ 273.8777,   1.64505e-5 ],
     [ 5.20256,    0.0 ],
     [ 0.048498,   4.469e-9 ],
     [ 19.8950,    0.0830853001 ]
   ],
   // Saturn
   [ [ 113.6634,   2.38980e-5 ],
     [ 2.4886,    -1.081e-7 ],
     [ 339.3939,   2.97661e-5 ],
     [ 9.55475,    0.0 ],
     [ 0.055546,  -9.499e-9 ],
     [ 316.9670,   0.0334442282 ]
   ],
   // Uranus
   [ [ 74.0005,    1.3978e-5 ],
     [ 0.7733,     1.9e-8 ],
     [ 96.6612,    3.0565e-5 ],
     [ 19.18171,  -1.55e-8 ],
     [ 0.047318,   7.45e-9 ],
     [ 142.5905,   0.011725806 ]
   ],
   // Neptune
   [ [ 131.7806,   3.0173e-5 ],
     [ 1.7700,    -2.55e-7 ],
     [ 272.8461,  -6.027e-6 ],
     [ 30.05826,   3.313e-8 ],
     [ 0.008606,   2.15e-9 ],
     [ 260.2471,   0.005995147 ]
   ],
       // Pluto (Orbital elements are rather crude estimates based on bodged data, but probably OK)
   [ [ 110.303,    2.839e-7 ],
     [ 17.1417,   -8.41889e-9 ],
     [ 113.763,   -1.1786e-5 ],
     [ 39.4817,    2.1057e-8 ],
     [ 0.24881,    1.7700e-9 ],
     [ 14.8561,    0.0039876 ]
   ],
   
   // Moon (NOT IMPLEMENTED YET)
   [ [ 0.0, 0.0 ],   // N
         [ 0.0, 0.0 ],   // i
         [ 0.0, 0.0 ],   // w
         [ 0.0, 0.0 ],   // a
         [ 0.0, 0.0 ],   // e
         [ 0.0, 0.0 ]    // M
   ]];


 // ======================================================================
 // Variables used during the calculations

var X=0, Y=1, Z=2;

var DEG2RAD = Math.PI/180.0;

var ZeroDate  = new Date(2000, 0, 1, 0, 0, 1); // 2000/1/1 00:00:01 (Months start from 0...)
var ZeroDateMillisec = ZeroDate.getTime();


 // ---------------------------------------------------------------------
 //Convert a JS date/time to the number of days from 00:00:01 0/0/2000

function DayVal(time) {

 var millisec = time.getTime() - ZeroDateMillisec;
 var days = millisec / 8.64e7;
 
 return(days);

}


 // ======================================================================
 // Calculate the [X,Y,Z] position of a single planet "planet" at
 // time "time", returning the answer in an array

function PlanetPosition(planet, time) {

 var dayval = DayVal(time);

 var curorb = [], pos = [];
 var eccen_anom, eccen_anom0, eccen_anom1;
 var xv, yv, v, r, i;

 for(i=0; i<6; i++) {
   curorb[i] = OrbitElement[planet][i][0] + 
                   (dayval * OrbitElement[planet][i][1]);
 }
 
     // Convert all angles to radians
 curorb[ORB_N] = curorb[ORB_N]*DEG2RAD;
 curorb[ORB_i] = curorb[ORB_i]*DEG2RAD;
 curorb[ORB_w] = curorb[ORB_w]*DEG2RAD;
 while(curorb[ORB_M] > 360.0) curorb[ORB_M] -= 360.0;
 while(curorb[ORB_M] < 0.0) curorb[ORB_M] += 360.0;
 curorb[ORB_M] = curorb[ORB_M]*DEG2RAD;
 
     // Calculate the eccentric anomaly
     //  E = M + e * sin(M) * (1+ e*cos(M)) [All in radians]
 eccen_anom = curorb[ORB_M] + (
               curorb[ORB_e] * Math.sin(curorb[ORB_M]) *
           (1.0 + curorb[ORB_e]*Math.cos(curorb[ORB_M]))
          );

     // Iterate if required
 eccen_anom0 = eccen_anom;
 eccen_anom1 = eccen_anom0 - ( 
             eccen_anom0 - curorb[ORB_e]*Math.sin(eccen_anom0)
             - curorb[ORB_M] ) / 
                 (1.0 - curorb[ORB_e]*Math.cos(eccen_anom0));
 while(Math.abs(eccen_anom1 - eccen_anom0) > 1.0e-5) {
     eccen_anom = eccen_anom0 - ( 
                eccen_anom0 - curorb[ORB_e]*Math.sin(eccen_anom0)
                - curorb[ORB_M] ) / 
                   (1.0 - curorb[ORB_e]*Math.cos(eccen_anom0));
     eccen_anom0 = eccen_anom1;
     eccen_anom1 = eccen_anom;
 }

     // Now get the distance and "true anomaly"

 xv = curorb[ORB_a] * (Math.cos(eccen_anom) - curorb[ORB_e]);
 yv = curorb[ORB_a] * ( Math.sqrt(1.0 - curorb[ORB_e]*curorb[ORB_e])
                * Math.sin(eccen_anom));

 v = Math.atan2(yv, xv);
 r = Math.sqrt( xv*xv + yv*yv );

     // Finally, get the full 3-D coordinates
 pos[X] = r * (Math.cos(curorb[ORB_N]) * Math.cos(v+curorb[ORB_w])
            - Math.sin(curorb[ORB_N]) * Math.sin(v+curorb[ORB_w])
              * Math.cos(curorb[ORB_i]));
 pos[Y] = r * (Math.sin(curorb[ORB_N]) * Math.cos(v+curorb[ORB_w])
            + Math.cos(curorb[ORB_N]) * Math.sin(v+curorb[ORB_w])
              * Math.cos(curorb[ORB_i]));
 pos[Z] = r * (Math.sin(v+curorb[ORB_w]) * Math.sin(curorb[ORB_i]));

 return(pos);
 
}

 // ======================================================================
 // Calculate a full ellipse of a single planet "planet" in "numstep"
 // steps, returning the answer in an array

function PlanetEllipse(planet, numsteps) {

 var E, e, a, N, w, xv, yv, v, r, i, lp;

 var orbEllipse = []

 stp = 360.0/(1.0*numsteps);
 stp *= DEG2RAD;

 e = OrbitElement[planet][ORB_e][0];
 a = OrbitElement[planet][ORB_a][0];
 i = OrbitElement[planet][ORB_i][0] * DEG2RAD;
 N = OrbitElement[planet][ORB_N][0] * DEG2RAD;
 w = OrbitElement[planet][ORB_w][0] * DEG2RAD;

 for(lp=0; lp<numsteps; lp++) {

   orbEllipse[lp] = [];

   E = lp*stp;
   xv = a * (Math.cos(E) - e);
   yv = a * (Math.sqrt(1.0 - e*e) * Math.sin(E));
   
   v = Math.atan2(yv, xv);
   r = Math.sqrt(xv*xv + yv*yv);
   
   orbEllipse[lp][X] = r * (Math.cos(N) * Math.cos(v+w) 
                - Math.sin(N) * Math.sin(v+w) 
                * Math.cos(i));
   orbEllipse[lp][Y] = r * (Math.sin(N) * Math.cos(v+w) 
                + Math.cos(N) * Math.sin(v+w) 
                * Math.cos(i));
   orbEllipse[lp][Z] = r * (Math.sin(v+w) * Math.sin(i));
 }

 return(orbEllipse);


} // PlanetEllipse


