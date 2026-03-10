/**
 * IPE section data (EN 10365 / standard steel tables).
 * All dimensions in mm, areas in mm², section moduli in mm³, weight in kg/m.
 *
 * Fields:
 *   h   – total height
 *   b   – flange width
 *   tf  – flange thickness
 *   tw  – web thickness
 *   R   – root radius
 *   A   – total cross-section area
 *   Aw  – web area (shear area, elastic)
 *   Wy  – elastic section modulus (strong axis)
 *   Zy  – plastic section modulus (strong axis)
 *   Iy  – second moment of area (strong axis)
 *   g   – self-weight (kg/m)
 */
export const IPE_SECTIONS = {
  IPE80:  { h:  80, b:  46, tf:  5.2, tw: 3.8, R:  5, A:  764, Aw:  219, Wy:  20.0e3, Zy:  23.2e3, Iy:   80.1e4, g:   6.0 },
  IPE100: { h: 100, b:  55, tf:  5.7, tw: 4.1, R:  7, A: 1032, Aw:  271, Wy:  34.2e3, Zy:  39.4e3, Iy:  171.0e4, g:   8.1 },
  IPE120: { h: 120, b:  64, tf:  6.3, tw: 4.4, R:  7, A: 1321, Aw:  334, Wy:  53.0e3, Zy:  60.7e3, Iy:  318.0e4, g:  10.4 },
  IPE140: { h: 140, b:  73, tf:  6.9, tw: 4.7, R:  7, A: 1643, Aw:  401, Wy:  77.3e3, Zy:  88.3e3, Iy:  541.0e4, g:  12.9 },
  IPE160: { h: 160, b:  82, tf:  7.4, tw: 5.0, R:  9, A: 2009, Aw:  481, Wy: 123.0e3, Zy: 140.0e3, Iy:  869.0e4, g:  15.8 },
  IPE180: { h: 180, b:  91, tf:  8.0, tw: 5.3, R:  9, A: 2395, Aw:  558, Wy: 166.0e3, Zy: 190.0e3, Iy: 1317.0e4, g:  18.8 },
  IPE200: { h: 200, b: 100, tf:  8.5, tw: 5.6, R: 12, A: 2848, Aw:  642, Wy: 194.0e3, Zy: 221.0e3, Iy: 1943.0e4, g:  22.4 },
  IPE220: { h: 220, b: 110, tf:  9.2, tw: 5.9, R: 12, A: 3337, Aw:  745, Wy: 252.0e3, Zy: 285.0e3, Iy: 2772.0e4, g:  26.2 },
  IPE240: { h: 240, b: 120, tf:  9.8, tw: 6.2, R: 15, A: 3912, Aw:  841, Wy: 324.0e3, Zy: 367.0e3, Iy: 3892.0e4, g:  30.7 },
  IPE270: { h: 270, b: 135, tf: 10.2, tw: 6.6, R: 15, A: 4595, Aw: 1000, Wy: 429.0e3, Zy: 484.0e3, Iy: 5790.0e4, g:  36.1 },
  IPE300: { h: 300, b: 150, tf: 10.7, tw: 7.1, R: 15, A: 5381, Aw: 1175, Wy: 557.0e3, Zy: 628.0e3, Iy: 8356.0e4, g:  42.2 },
  IPE330: { h: 330, b: 160, tf: 11.5, tw: 7.5, R: 18, A: 6261, Aw: 1411, Wy: 713.0e3, Zy: 804.0e3, Iy:11770.0e4, g:  49.1 },
  IPE360: { h: 360, b: 170, tf: 12.7, tw: 8.0, R: 18, A: 7273, Aw: 2677, Wy: 904.0e3, Zy:1020.0e3, Iy:16270.0e4, g:  57.1 },
  IPE400: { h: 400, b: 180, tf: 13.5, tw: 8.6, R: 21, A: 8446, Aw: 1973, Wy:1156.0e3, Zy:1307.0e3, Iy:23130.0e4, g:  66.3 },
  IPE450: { h: 450, b: 190, tf: 14.6, tw: 9.4, R: 21, A: 9882, Aw: 2385, Wy:1500.0e3, Zy:1702.0e3, Iy:33740.0e4, g:  77.6 },
  IPE500: { h: 500, b: 200, tf: 16.0, tw:10.2, R: 21, A:11552, Aw: 2830, Wy:1928.0e3, Zy:2194.0e3, Iy:48200.0e4, g:  90.7 },
  IPE550: { h: 550, b: 210, tf: 17.2, tw:11.1, R: 24, A:13441, Aw: 3385, Wy:2440.0e3, Zy:2787.0e3, Iy:67120.0e4, g: 105.6 },
  IPE600: { h: 600, b: 220, tf: 19.0, tw:12.0, R: 24, A:15598, Aw: 4037, Wy:3069.0e3, Zy:3512.0e3, Iy:92080.0e4, g: 122.4 },
}
