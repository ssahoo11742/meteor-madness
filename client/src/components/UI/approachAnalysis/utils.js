export const MU_SUN = 2.959e-4; // AU^3 / day^2 (left here for reference if needed)
export const AU_SCALE = 10; // scale factor for visualization (same as before)
export const AU2KM = 1.495978707e8; // km
export const mu = 1.32712440018e11; // km^3/s^2
// --- Small helpers --- //
export function jdFromDate(date) {

  return 2440587.5 + date.getTime() / 86400000;
}

export function parseSBDBDate(cd) {
  // SBDB style date strings like "2025-09-22 08:11"
  return new Date(cd + " UTC");
}



export function rad2deg(rad) {
  return (rad * 180) / Math.PI;
}

export function deg2rad(deg) {
  return (deg * Math.PI) / 180;
}

export function periodFromA(a) {
  // Kepler's third law approximation (days)
  return 365.256898326 * Math.pow(a, 1.5);
}


