/** NOAA general solar-position equations, shared with the Android wallpaper.
 * Earth-fixed axes: x east at 90°, y north, z at the prime meridian.
 * https://gml.noaa.gov/grad/solcalc/solareqns.PDF
 */
export function solarDirection(epochMillis: number): [number, number, number] {
  const utc = new Date(epochMillis)
  const year = utc.getUTCFullYear()
  const start = Date.UTC(year, 0, 1)
  const days = (Date.UTC(year + 1, 0, 1) - start) / 86_400_000
  const day = Math.floor((epochMillis - start) / 86_400_000)
  const hour = utc.getUTCHours() + utc.getUTCMinutes() / 60 + utc.getUTCSeconds() / 3600
  const gamma = 2 * Math.PI / days * (day + (hour - 12) / 24)
  const equation = 229.18 * (0.000075 + 0.001868 * Math.cos(gamma) - 0.032077 * Math.sin(gamma) - 0.014615 * Math.cos(2 * gamma) - 0.040849 * Math.sin(2 * gamma))
  const declination = 0.006918 - 0.399912 * Math.cos(gamma) + 0.070257 * Math.sin(gamma) - 0.006758 * Math.cos(2 * gamma) + 0.000907 * Math.sin(2 * gamma) - 0.002697 * Math.cos(3 * gamma) + 0.00148 * Math.sin(3 * gamma)
  const longitude = (180 - (hour * 60 + equation) / 4) * Math.PI / 180
  return [Math.cos(declination) * Math.sin(longitude), Math.sin(declination), Math.cos(declination) * Math.cos(longitude)]
}
