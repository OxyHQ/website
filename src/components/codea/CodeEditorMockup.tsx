import { useHighlightedLines } from "./codeTokens";

const tabs = [
  { name: "ThemeProvider.tsx", active: true },
  { name: "useTheme.ts", active: false },
  { name: "types.ts", active: false },
];

/** The file the editor has open. */
const SOURCE = `import { createContext, useCallback, useState } from 'react';
import { ThemeConfig, ThemeContextValue } from './types';
import { useTheme } from './useTheme';

export const ThemeContext = createContext<ThemeContextValue | null>(null);

interface ThemeProviderProps {
  children: React.ReactNode;
  config?: ThemeConfig;
}

export default function ThemeProvider({ children, config }: ThemeProviderProps) {
  const [mode, setMode] = useState<'light' | 'dark'>('light');

  // Apply CSS variables to document root
  const applyTheme = useCallback(( theme: ThemeConfig ) => {
    const root = document.documentElement;
    Object.entries(theme.variables).forEach(([key, val]) => {
      root.style.setProperty(\`--\${key}\`, val);
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ mode, setMode, applyTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}`;

/** The lines Codea is suggesting, 1-based and inclusive. */
const SUGGESTION = { from: 15, to: 21 };

export default function CodeEditorMockup() {
  const lines = useHighlightedLines(SOURCE);
  return (
    <div className="w-full overflow-hidden rounded-xl border border-foreground/[0.06] shadow-2xl">
      {/* Tab bar */}
      <div className="flex items-center bg-background">
        {tabs.map((tab) => (
          <button
            key={tab.name}
            className={`px-4 py-2 text-xs font-medium transition-colors ${
              tab.active
                ? "bg-surface text-foreground/80 border-t border-t-primary/60"
                : "bg-background text-foreground/35 hover:text-foreground/50"
            }`}
          >
            {tab.name}
          </button>
        ))}
        <div className="flex-1 bg-background" />
      </div>

      {/* Editor body */}
      <div className="relative bg-surface p-0 font-mono text-[13px] leading-[1.65] [font-variant-ligatures:none] overflow-x-auto">
        <div className="min-w-[640px]">
          {lines.map((content, i) => {
            const num = i + 1;
            const suggestion = num >= SUGGESTION.from && num <= SUGGESTION.to;
            return (
              <div
                key={num}
                className={`flex ${
                  suggestion
                    ? "bg-success/10 border-l-2 border-success/40"
                    : "border-l-2 border-transparent"
                }`}
              >
                <span className="inline-block w-12 shrink-0 select-none pr-4 text-right text-foreground/20">
                  {num}
                </span>
                <span className="whitespace-pre">{content}</span>
              </div>
            );
          })}
        </div>

        {/* Floating tooltip */}
        <div className="absolute right-4 top-[220px] w-72 rounded-lg border border-foreground/[0.08] bg-popover px-4 py-3 shadow-xl">
          <div className="mb-1.5 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
            <span className="text-[11px] font-semibold tracking-wide text-success-text uppercase">
              Codea suggestion
            </span>
          </div>
          <p className="text-xs leading-relaxed text-foreground/55">
            <span className="text-foreground/80 font-medium">Detected:</span> your
            project uses CSS variables for theming. Applied consistent pattern.
          </p>
        </div>
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between bg-background px-4 py-1 text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <svg
              className="h-3 w-3"
              viewBox="0 0 16 16"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M11.75 2.5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5a.75.75 0 0 1 .75-.75Zm-3 1a.75.75 0 0 1 .75.75v7.5a.75.75 0 0 1-1.5 0v-7.5a.75.75 0 0 1 .75-.75Zm-6 3a.75.75 0 0 1 .75.75v2.5a.75.75 0 0 1-1.5 0v-2.5a.75.75 0 0 1 .75-.75Zm3-2a.75.75 0 0 1 .75.75v5.5a.75.75 0 0 1-1.5 0v-5.5a.75.75 0 0 1 .75-.75Z" />
            </svg>
            feat/dark-mode
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span>UTF-8</span>
          <span>TypeScript React</span>
        </div>
      </div>
    </div>
  );
}
