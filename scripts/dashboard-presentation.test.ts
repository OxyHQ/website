import { describe, expect, it } from 'bun:test';
import { dashboardPresentation } from '../src/lib/dashboardPresentation';

describe('dashboard URL presentation', () => {
  it('enters window fullscreen from a link without native browser permission', () => {
    expect(dashboardPresentation('?fullscreen=true')).toEqual({ fullscreen: true, fullscreenLayout: true, widgetRows: 1 });
  });
  it('preserves the normal layout independently of fullscreen and chooses two widget rows', () => {
    expect(dashboardPresentation('?fullscreen=true&fullscreenLayout=false')).toEqual({ fullscreen: true, fullscreenLayout: false, widgetRows: 2 });
    expect(dashboardPresentation('?fullscreen=true&widgetRows=2')).toEqual({ fullscreen: true, fullscreenLayout: true, widgetRows: 2 });
    expect(dashboardPresentation('?fullscreen=true&fullscreenLayout=false&widgetRows=1').widgetRows).toBe(1);
  });
  it('accepts only supported values and retains native fullscreen behavior', () => {
    expect(dashboardPresentation('?fullscreen=1&widgetRows=999')).toEqual({ fullscreen: false, fullscreenLayout: false, widgetRows: 2 });
    expect(dashboardPresentation('?widgetRows=0', true)).toEqual({ fullscreen: true, fullscreenLayout: true, widgetRows: 1 });
    expect(dashboardPresentation('?fullscreenLayout=false', false, true)).toEqual({ fullscreen: true, fullscreenLayout: false, widgetRows: 2 });
  });
});
