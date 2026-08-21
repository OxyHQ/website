import { describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  APP_COLOR_NAMES,
  APP_COLOR_PRESETS,
  COLOR_PRESET_FAMILY_REGISTRY,
  COLOR_PRESET_GROUPS,
  COLOR_PRESET_REGISTRY,
  FREE_COLOR_NAMES,
  HANDLE_COLOR_NAMES,
  PREMIUM_COLOR_NAMES,
} from '@oxyhq/bloom/color-presets'
import { getPresetVars } from '@oxyhq/bloom/design-tokens'
import { FAIRCOIN_PRESET, SITE_PRESET } from '../src/theme/brands'
import { PUBLIC_COLOR_PRESET_GROUPS } from '../src/theme/preset-catalog'

const PREVIEW_ROLES = [
  '--background',
  '--foreground',
  '--surface',
  '--card',
  '--muted',
  '--muted-foreground',
  '--border',
  '--primary',
  '--primary-subtle',
  '--secondary',
  '--tertiary',
] as const

type ProjectScripts = Record<string, string>

const BROWSER_INSTALL_COMMAND = 'bunx playwright install --with-deps chromium'
const CLOUDFLARE_BUILD_COMMAND = '- run: bun run build'

const hasProvisionedCloudflareBrowserGate = (
  scripts: ProjectScripts,
  workflow: string,
): boolean => {
  const installOffset = workflow.indexOf(BROWSER_INSTALL_COMMAND)
  const buildOffset = workflow.indexOf(CLOUDFLARE_BUILD_COMMAND)
  const installCount = [...workflow.matchAll(new RegExp(BROWSER_INSTALL_COMMAND, 'g'))].length

  return scripts.postbuild.includes('bun run test:theme:browser')
    && scripts['test:theme:browser'] === 'bun scripts/theme-prepaint.browser.test.ts'
    && installCount === 1
    && installOffset > -1
    && buildOffset > -1
    && installOffset < buildOffset
}

describe('Bloom theme contract', () => {
  test('publishes every preset name exactly once', () => {
    expect(COLOR_PRESET_REGISTRY).toHaveLength(34)
    expect(new Set(APP_COLOR_NAMES).size).toBe(APP_COLOR_NAMES.length)
    for (const name of APP_COLOR_NAMES) expect(APP_COLOR_PRESETS[name]?.name).toBe(name)
  })

  test('groups the same recipes that the website picker renders', () => {
    const groupedNames = COLOR_PRESET_FAMILY_REGISTRY.flatMap(
      (family) => COLOR_PRESET_GROUPS[family.name].presets.map((preset) => preset.name),
    )
    expect(groupedNames).toEqual(expect.arrayContaining(APP_COLOR_NAMES))
    expect(new Set(groupedNames)).toEqual(new Set(APP_COLOR_NAMES))
    expect(APP_COLOR_PRESETS.cobalt.tertiaryHex).toBe('#ffd000')
  })

  test('offers only free recipes without inventing entitlement state', () => {
    const publicNames = PUBLIC_COLOR_PRESET_GROUPS.flatMap((group) =>
      group.presets.map((preset) => preset.name),
    )
    expect(new Set(publicNames)).toEqual(new Set(FREE_COLOR_NAMES))
    for (const gated of [...HANDLE_COLOR_NAMES, ...PREMIUM_COLOR_NAMES]) {
      expect(publicNames).not.toContain(gated)
    }
  })

  test('generates prepaint selectors for exactly the public presets', () => {
    const css = readFileSync(join(import.meta.dir, '..', 'src', 'styles', 'theme.generated.css'), 'utf8')
    const generatedNames = [...css.matchAll(/:root\[data-color-preset='([^']+)'\]/g)]
      .map((match) => match[1])
    expect(new Set(generatedNames)).toEqual(new Set(FREE_COLOR_NAMES))
    for (const name of FREE_COLOR_NAMES) {
      expect(css).toContain(`:root[data-color-preset='${name}']`)
      expect(css).toContain(`:root[data-color-preset='${name}'].dark`)
    }
    for (const gated of [...HANDLE_COLOR_NAMES, ...PREMIUM_COLOR_NAMES]) {
      expect(generatedNames).not.toContain(gated)
    }
  })

  test('keeps the website brand presets in Bloom', () => {
    expect(APP_COLOR_NAMES).toContain(SITE_PRESET)
    expect(APP_COLOR_NAMES).toContain(FAIRCOIN_PRESET)
  })

  test('resolves the paired light and dark roles used by the settings previews', () => {
    for (const name of APP_COLOR_NAMES) {
      const light = getPresetVars(name, 'light')
      const dark = getPresetVars(name, 'dark')

      for (const role of PREVIEW_ROLES) {
        expect(light[role], `${name} light ${role}`).toMatch(/^rgba?\(/)
        expect(dark[role], `${name} dark ${role}`).toMatch(/^rgba?\(/)
      }
      expect(light['--background'], `${name} light/dark background`).not.toBe(dark['--background'])
    }
  })

  test('provisions Chromium before Cloudflare runs the browser-gated build', () => {
    const packageJson = JSON.parse(
      readFileSync(join(import.meta.dir, '..', 'package.json'), 'utf8'),
    ) as { scripts: ProjectScripts }
    const workflow = readFileSync(
      join(import.meta.dir, '..', '.github', 'workflows', 'deploy.yml'),
      'utf8',
    )

    expect(hasProvisionedCloudflareBrowserGate(packageJson.scripts, workflow)).toBe(true)
    expect(hasProvisionedCloudflareBrowserGate(
      packageJson.scripts,
      workflow.replace(BROWSER_INSTALL_COMMAND, ''),
    )).toBe(false)
    expect(hasProvisionedCloudflareBrowserGate(
      packageJson.scripts,
      workflow
        .replace(`        run: ${BROWSER_INSTALL_COMMAND}\n`, '')
        .replace(CLOUDFLARE_BUILD_COMMAND, `${CLOUDFLARE_BUILD_COMMAND}\n\n      - run: ${BROWSER_INSTALL_COMMAND}`),
    )).toBe(false)
    expect(hasProvisionedCloudflareBrowserGate(
      { ...packageJson.scripts, postbuild: packageJson.scripts.postbuild.replace('bun run test:theme:browser', '') },
      workflow,
    )).toBe(false)
  })
})
