import { ShaderMaterial, TextureLoader, Vector3 } from 'three'
import { solarDirection } from '../../data/dashboard/solar-position'

/** Texture UVs map directly to Earth longitude/latitude, independently of camera rotation. */
export function createSolarMaterial(highResolution: boolean) {
  const loader = new TextureLoader()
  const day = loader.load('/images/dashboard/earth-day-nasa.jpg')
  const night = loader.load(highResolution ? '/images/dashboard/earth-night-nasa-8k.webp' : '/images/dashboard/earth-night-nasa.webp')
  // Keep the same sRGB texture arithmetic as the native GLES wallpaper.
  const material = new ShaderMaterial({
    uniforms: {
      dayImage: { value: day }, nightImage: { value: night },
      sun: { value: new Vector3(...solarDirection(Date.now())) },
    },
    vertexShader: `varying vec2 earthUv;
      void main() { earthUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform sampler2D dayImage;
      uniform sampler2D nightImage;
      uniform vec3 sun;
      varying vec2 earthUv;
      void main() {
        float longitude = (earthUv.x - 0.5) * 6.28318530718;
        float latitude = (earthUv.y - 0.5) * 3.14159265359;
        vec3 normal = vec3(cos(latitude) * sin(longitude), sin(latitude), cos(latitude) * cos(longitude));
        float facing = dot(normal, sun);
        float daylight = smoothstep(-0.08, 0.12, facing);
        vec3 day = texture2D(dayImage, earthUv).rgb;
        vec3 night = texture2D(nightImage, earthUv).rgb;
        vec3 lit = day * (0.25 + 0.75 * sqrt(max(facing, 0.0)));
        gl_FragColor = vec4(mix(night, lit, daylight), 1.0);
      }`,
    toneMapped: false,
  })
  let minute = Math.floor(Date.now() / 60_000)
  return {
    material,
    update(now: number) {
      const next = Math.floor(now / 60_000)
      if (minute === next) return
      minute = next
      material.uniforms.sun.value.set(...solarDirection(now))
    },
    dispose() { day.dispose(); night.dispose(); material.dispose() },
  }
}
