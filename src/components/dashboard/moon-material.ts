import { ShaderMaterial, TextureLoader, Vector3 } from 'three'

/** Same day/night terminator technique as solar-material.ts, but the Moon has
 * no city-lights layer to blend into — its far side just dims toward a small
 * ambient floor instead of a second texture. */
export function createMoonMaterial() {
  const loader = new TextureLoader()
  const map = loader.load('/images/dashboard/moon.jpg')
  const material = new ShaderMaterial({
    uniforms: {
      moonMap: { value: map },
      sun: { value: new Vector3(0, 0, 1) },
    },
    vertexShader: `varying vec2 moonUv;
      void main() { moonUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform sampler2D moonMap;
      uniform vec3 sun;
      varying vec2 moonUv;
      void main() {
        float longitude = (moonUv.x - 0.5) * 6.28318530718;
        float latitude = (moonUv.y - 0.5) * 3.14159265359;
        vec3 normal = vec3(cos(latitude) * sin(longitude), sin(latitude), cos(latitude) * cos(longitude));
        float facing = dot(normal, sun);
        float daylight = smoothstep(-0.08, 0.12, facing) * 0.94 + 0.06;
        gl_FragColor = vec4(texture2D(moonMap, moonUv).rgb * daylight, 1.0);
      }`,
    toneMapped: false,
  })
  return {
    material,
    setSunDirection(direction: readonly [number, number, number]) {
      material.uniforms.sun.value.set(...direction)
    },
    dispose() { map.dispose(); material.dispose() },
  }
}
