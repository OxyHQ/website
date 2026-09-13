import { describe, expect, it } from 'bun:test';
import { cameraMotion, stepCameraMotion, selectCameraFocus, shortestLongitude, CAMERA_SPEED_LIMIT, CAMERA_ACCELERATION_LIMIT, type CameraFocus } from '../src/data/dashboard/camera-motion';

const target = (lng: number, key = 'a', requests = 100) => ({ key, lat: 0, lng, requests });
describe('continuous dashboard camera', () => {
  it('bounds velocity and acceleration when opposite targets change abruptly', () => {
    let state = cameraMotion({ lat: 20, lng: 0, altitude: 1.7 });
    for (let frame = 0; frame < 1_200; frame++) {
      const previous = state;
      state = stepCameraMotion(state, target(frame < 300 ? 180 : -60), 1 / 60);
      expect(Math.hypot(state.latVelocity, state.lngVelocity)).toBeLessThanOrEqual(CAMERA_SPEED_LIMIT + 1e-8);
      expect(Math.hypot(state.latVelocity - previous.latVelocity, state.lngVelocity - previous.lngVelocity)).toBeLessThanOrEqual(CAMERA_ACCELERATION_LIMIT / 60 + 1e-8);
      expect(Math.abs(shortestLongitude(state.lng - previous.lng))).toBeLessThanOrEqual(CAMERA_SPEED_LIMIT / 60 + 1e-8);
      expect(state.altitude).toBe(1.7);
    }
  });
  it('crosses the date line using the short two-degree route', () => {
    let state = cameraMotion({ lat: 0, lng: 179, altitude: 1.7 });
    for (let frame = 0; frame < 600; frame++) state = stepCameraMotion(state, target(-179), 1 / 60);
    expect(Math.abs(shortestLongitude(state.lng + 179))).toBeLessThan(0.001);
    expect(shortestLongitude(-358)).toBe(2);
  });
  it('matches at 30, 60 and 120 Hz and limits resume motion after a suspended frame', () => {
    const run = (rate: number) => {
      let state = cameraMotion({ lat: 0, lng: 0, altitude: 1.7 });
      for (let frame = 0; frame < rate * 4; frame++) state = stepCameraMotion(state, target(120), 1 / rate);
      return state;
    };
    expect(run(30).lng).toBeCloseTo(run(120).lng, 8);
    expect(run(60).lng).toBeCloseTo(run(120).lng, 8);
    const previous = run(60);
    const resumed = stepCameraMotion(previous, target(120), 60);
    expect(Math.abs(shortestLongitude(resumed.lng - previous.lng))).toBeLessThanOrEqual(CAMERA_SPEED_LIMIT * 0.1 + 1e-8);
  });
  it('keeps a stable target through ties, minor score fluctuations and short-lived challengers', () => {
    let focus: CameraFocus = { selectedAt: 0, challengerSince: 0 };
    focus = selectCameraFocus(focus, [target(0)], 0);
    focus = selectCameraFocus(focus, [target(0), target(90, 'b', 120)], 6_000);
    expect(focus.target?.key).toBe('a');
    focus = selectCameraFocus(focus, [target(0), target(90, 'b', 150)], 7_000);
    expect(focus.target?.key).toBe('a');
    focus = selectCameraFocus(focus, [target(0, 'a', 200), target(90, 'b', 150)], 8_000);
    focus = selectCameraFocus(focus, [target(0), target(90, 'b', 150)], 8_500);
    expect(selectCameraFocus(focus, [target(0), target(90, 'b', 150)], 10_499).target?.key).toBe('a');
    focus = selectCameraFocus(focus, [target(0), target(90, 'b', 150)], 10_500);
    expect(focus.target?.key).toBe('b');
    expect(selectCameraFocus(focus, [], 30_000).target?.key).toBe('b');
  });
});
