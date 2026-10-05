import { useMemo, useState } from 'react'
import { Button } from '@oxy.so/bloom/button'
import { ComposerPill, ComposerStatusBar } from '@oxy.so/bloom/composer-panel'
import { ComposerLoader } from '@oxy.so/bloom/composer-loader'
import { buildTheme, useTheme } from '@oxy.so/bloom/theme'

const recipes = ['blue', 'purple', 'pink', 'green', 'orange'] as const

/** A palette changes the light only, never the website's theme. */
export default function LoaderDemo({
  active,
  controls = false,
}: {
  active: boolean
  controls?: boolean
}) {
  const { mode } = useTheme()
  const [recipe, setRecipe] = useState('iridescent')
  const [value, setValue] = useState('')
  const palettes = useMemo(
    () =>
      recipes.map((name) => ({
        name,
        colors: buildTheme(name, mode).chartColors!,
      })),
    [mode],
  )
  const colors = useMemo(() => {
    if (recipe === 'iridescent')
      return [
        palettes[1].colors[0].color,
        palettes[2].colors[0].color,
        palettes[3].colors[0].color,
        palettes[0].colors[0].color,
      ] as const
    const theme = buildTheme(recipe as (typeof recipes)[number], mode)
    return [
      theme.colors.primary,
      theme.colors.secondary,
      theme.colors.primary,
      theme.colors.tertiary,
    ] as const
  }, [recipe, mode, palettes])
  return (
    <div className="flex w-full flex-col items-center">
      {controls && (
        <div
          className="mb-7 flex items-center justify-center gap-1.5"
          role="group"
          aria-label="Composer light colour"
        >
          {['iridescent', ...recipes].map((name) => (
            <Button
              key={name}
              iconOnly
              appearance="plain"
              accessibilityLabel={`${name} light`}
              pressed={recipe === name}
              onPress={() => setRecipe(name)}
              style={{
                width: 26,
                height: 26,
                minWidth: 26,
                borderRadius: 999,
                padding: 0,
                borderWidth: recipe === name ? 2 : 0,
                borderColor: 'var(--muted-foreground)',
              }}
            >
              <span
                aria-hidden
                className="block h-full w-full rounded-full"
                style={{
                  background:
                    name === 'iridescent'
                      ? `conic-gradient(${palettes.map((p) => p.colors[0].color).join(',')})`
                      : `radial-gradient(circle at 35% 25%, var(--background), ${buildTheme(name as (typeof recipes)[number], mode).colors.primary} 65%)`,
                }}
              />
            </Button>
          ))}
        </div>
      )}
      <ComposerLoader active={active} colors={colors} style={{ width: '100%' }}>
        <ComposerPill
          value={value}
          onValueChange={setValue}
          maxLines={1}
          models={['Bloom', 'Design agent', 'Review agent']}
          surface={false}
          glass
          onSubmit={() => setValue('')}
          style={{ width: '100%' }}
        />
      </ComposerLoader>
      {!controls && (
        <ComposerStatusBar
          branch="Main"
          folders={[{ prefix: '', name: 'bloom-ui' }]}
          mode="Design agent"
          style={{ width: '100%', marginTop: 10 }}
        />
      )}
    </div>
  )
}
