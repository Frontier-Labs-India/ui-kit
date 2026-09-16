/* Equirectangular projection used by GeoMap — the same public helper the React
 * package exports alongside its GeoMap. x = lng + 180, y = 90 - lat, on a
 * 360×180 viewBox. */
export function geoToSvg(lat: number, lng: number): { x: number; y: number } {
  return { x: lng + 180, y: 90 - lat }
}
