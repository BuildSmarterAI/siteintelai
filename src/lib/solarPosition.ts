/**
 * Solar Position Calculations
 * 
 * Accurate sun position algorithm for shadow analysis.
 * Based on NOAA Solar Calculator formulas.
 */

export interface SunPosition {
  azimuth: number;      // Degrees from North (0-360)
  altitude: number;     // Degrees above horizon (-90 to 90)
  zenith: number;       // Degrees from vertical (90 - altitude)
}

export interface ShadowMetrics {
  shadowLengthFactor: number;  // Shadow length multiplier (tan(zenith))
  directSunlightHours: number; // Estimated hours of direct sunlight
  solarNoon: Date;             // Time of solar noon
  sunrise: Date;               // Approximate sunrise
  sunset: Date;                // Approximate sunset
}

/**
 * Calculate the sun's position for a given date, time, and location
 */
export function calculateSunPosition(
  date: Date,
  latitude: number,
  longitude: number
): SunPosition {
  // Convert to Julian Date
  const JD = getJulianDate(date);
  const T = (JD - 2451545.0) / 36525; // Julian century

  // Calculate geometric mean longitude of the sun
  const L0 = (280.46646 + T * (36000.76983 + 0.0003032 * T)) % 360;

  // Calculate geometric mean anomaly of the sun
  const M = (357.52911 + T * (35999.05029 - 0.0001537 * T)) % 360;

  // Calculate eccentricity of Earth's orbit
  const e = 0.016708634 - T * (0.000042037 + 0.0000001267 * T);

  // Calculate sun's equation of center
  const C =
    (1.914602 - T * (0.004817 + 0.000014 * T)) * Math.sin(degToRad(M)) +
    (0.019993 - 0.000101 * T) * Math.sin(degToRad(2 * M)) +
    0.000289 * Math.sin(degToRad(3 * M));

  // Calculate sun's true longitude
  const sunLongitude = L0 + C;

  // Calculate sun's apparent longitude
  const omega = 125.04 - 1934.136 * T;
  const lambda = sunLongitude - 0.00569 - 0.00478 * Math.sin(degToRad(omega));

  // Calculate mean obliquity of the ecliptic
  const epsilon0 = 23 + (26 + (21.448 - T * (46.815 + T * (0.00059 - T * 0.001813))) / 60) / 60;
  const epsilon = epsilon0 + 0.00256 * Math.cos(degToRad(omega));

  // Calculate sun's declination
  const declination = radToDeg(Math.asin(Math.sin(degToRad(epsilon)) * Math.sin(degToRad(lambda))));

  // Calculate equation of time (in minutes)
  const y = Math.tan(degToRad(epsilon / 2)) ** 2;
  const EoT =
    4 *
    radToDeg(
      y * Math.sin(2 * degToRad(L0)) -
        2 * e * Math.sin(degToRad(M)) +
        4 * e * y * Math.sin(degToRad(M)) * Math.cos(2 * degToRad(L0)) -
        0.5 * y * y * Math.sin(4 * degToRad(L0)) -
        1.25 * e * e * Math.sin(2 * degToRad(M))
    );

  // Calculate solar time
  const hours = date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600;
  const timezone = -date.getTimezoneOffset() / 60;
  const solarTime = hours + (4 * longitude + EoT) / 60 - timezone;

  // Calculate hour angle
  const hourAngle = (solarTime - 12) * 15;

  // Calculate solar zenith angle
  const zenithCos =
    Math.sin(degToRad(latitude)) * Math.sin(degToRad(declination)) +
    Math.cos(degToRad(latitude)) * Math.cos(degToRad(declination)) * Math.cos(degToRad(hourAngle));
  const zenith = radToDeg(Math.acos(Math.min(1, Math.max(-1, zenithCos))));

  // Calculate altitude
  const altitude = 90 - zenith;

  // Calculate azimuth
  let azimuthCos =
    (Math.sin(degToRad(declination)) -
      Math.sin(degToRad(latitude)) * Math.cos(degToRad(zenith))) /
    (Math.cos(degToRad(latitude)) * Math.sin(degToRad(zenith)));
  azimuthCos = Math.min(1, Math.max(-1, azimuthCos));
  let azimuth = radToDeg(Math.acos(azimuthCos));

  if (hourAngle > 0) {
    azimuth = 360 - azimuth;
  }

  return {
    azimuth: Math.round(azimuth * 10) / 10,
    altitude: Math.round(altitude * 10) / 10,
    zenith: Math.round(zenith * 10) / 10,
  };
}

/**
 * Calculate shadow metrics for a given date and location
 */
export function calculateShadowMetrics(
  date: Date,
  latitude: number,
  longitude: number
): ShadowMetrics {
  const sunPosition = calculateSunPosition(date, latitude, longitude);

  // Shadow length factor (based on sun altitude)
  let shadowLengthFactor = 0;
  if (sunPosition.altitude > 0) {
    shadowLengthFactor = 1 / Math.tan(degToRad(sunPosition.altitude));
  }

  // Calculate sunrise/sunset
  const { sunrise, sunset, solarNoon } = calculateSunTimes(date, latitude, longitude);

  // Calculate direct sunlight hours
  let directSunlightHours = 0;
  if (sunrise && sunset) {
    directSunlightHours = (sunset.getTime() - sunrise.getTime()) / (1000 * 60 * 60);
  }

  return {
    shadowLengthFactor: Math.round(shadowLengthFactor * 100) / 100,
    directSunlightHours: Math.round(directSunlightHours * 10) / 10,
    solarNoon,
    sunrise,
    sunset,
  };
}

/**
 * Calculate sunrise, sunset, and solar noon times
 */
export function calculateSunTimes(
  date: Date,
  latitude: number,
  longitude: number
): { sunrise: Date; sunset: Date; solarNoon: Date } {
  const JD = getJulianDate(new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0));
  const T = (JD - 2451545.0) / 36525;

  // Solar declination
  const L0 = (280.46646 + T * 36000.76983) % 360;
  const M = (357.52911 + T * 35999.05029) % 360;
  const C = 1.9146 * Math.sin(degToRad(M)) + 0.02 * Math.sin(degToRad(2 * M));
  const sunLong = L0 + C;
  const epsilon = 23.439 - 0.00000036 * (JD - 2451545.0);
  const declination = radToDeg(Math.asin(Math.sin(degToRad(epsilon)) * Math.sin(degToRad(sunLong))));

  // Hour angle at sunrise/sunset
  const cosHourAngle =
    (Math.cos(degToRad(90.833)) - Math.sin(degToRad(latitude)) * Math.sin(degToRad(declination))) /
    (Math.cos(degToRad(latitude)) * Math.cos(degToRad(declination)));

  const hourAngle = radToDeg(Math.acos(Math.min(1, Math.max(-1, cosHourAngle))));

  // Equation of time
  const y = Math.tan(degToRad(epsilon / 2)) ** 2;
  const EoT =
    4 *
    radToDeg(
      y * Math.sin(2 * degToRad(L0)) -
        2 * 0.0167 * Math.sin(degToRad(M)) +
        4 * 0.0167 * y * Math.sin(degToRad(M)) * Math.cos(2 * degToRad(L0))
    );

  // Solar noon in UTC hours
  const timezone = -date.getTimezoneOffset() / 60;
  const solarNoonHours = 12 - longitude / 15 - EoT / 60 + timezone;

  const solarNoon = new Date(date);
  solarNoon.setHours(Math.floor(solarNoonHours), (solarNoonHours % 1) * 60, 0, 0);

  const sunriseHours = solarNoonHours - hourAngle / 15;
  const sunsetHours = solarNoonHours + hourAngle / 15;

  const sunrise = new Date(date);
  sunrise.setHours(Math.floor(sunriseHours), (sunriseHours % 1) * 60, 0, 0);

  const sunset = new Date(date);
  sunset.setHours(Math.floor(sunsetHours), (sunsetHours % 1) * 60, 0, 0);

  return { sunrise, sunset, solarNoon };
}

// Helper functions
function degToRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function radToDeg(radians: number): number {
  return (radians * 180) / Math.PI;
}

function getJulianDate(date: Date): number {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600;

  let y = year;
  let m = month;

  if (m <= 2) {
    y -= 1;
    m += 12;
  }

  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);

  const JD =
    Math.floor(365.25 * (y + 4716)) +
    Math.floor(30.6001 * (m + 1)) +
    day +
    hours / 24 +
    B -
    1524.5;

  return JD;
}

/**
 * Format time as HH:MM AM/PM
 */
export function formatSolarTime(date: Date): string {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const period = hours >= 12 ? "PM" : "AM";
  const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${displayHour}:${minutes.toString().padStart(2, "0")} ${period}`;
}
