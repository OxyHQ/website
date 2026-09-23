const tabs = [
  { name: "ThemeProvider.tsx", active: true },
  { name: "useTheme.ts", active: false },
  { name: "types.ts", active: false },
];

interface CodeLine {
  num: number;
  content: React.ReactNode;
  suggestion?: boolean;
}

function Kw({ children }: { children: React.ReactNode }) {
  return <span className="text-chart-1">{children}</span>;
}
function Str({ children }: { children: React.ReactNode }) {
  return <span className="text-success-text">{children}</span>;
}
function Tp({ children }: { children: React.ReactNode }) {
  return <span className="text-info-text">{children}</span>;
}
function Cm({ children }: { children: React.ReactNode }) {
  return <span className="text-foreground/30">{children}</span>;
}
function Fn({ children }: { children: React.ReactNode }) {
  return <span className="text-chart-3">{children}</span>;
}
function Pl({ children }: { children: React.ReactNode }) {
  return <span className="text-foreground/70">{children}</span>;
}

const lines: CodeLine[] = [
  {
    num: 1,
    content: (
      <>
        <Kw>import</Kw> <Pl>{"{ createContext, useCallback, useState }"}</Pl>{" "}
        <Kw>from</Kw> <Str>'react'</Str>;
      </>
    ),
  },
  {
    num: 2,
    content: (
      <>
        <Kw>import</Kw> <Pl>{"{ ThemeConfig, ThemeContextValue }"}</Pl>{" "}
        <Kw>from</Kw> <Str>'./types'</Str>;
      </>
    ),
  },
  {
    num: 3,
    content: (
      <>
        <Kw>import</Kw> <Pl>{"{ useTheme }"}</Pl> <Kw>from</Kw>{" "}
        <Str>'./useTheme'</Str>;
      </>
    ),
  },
  { num: 4, content: "" },
  {
    num: 5,
    content: (
      <>
        <Kw>export</Kw> <Kw>const</Kw> <Pl>ThemeContext</Pl> ={" "}
        <Fn>createContext</Fn>
        <Pl>{"<"}</Pl>
        <Tp>ThemeContextValue</Tp> <Pl>|</Pl> <Tp>null</Tp>
        <Pl>{">"}</Pl>(<Kw>null</Kw>);
      </>
    ),
  },
  { num: 6, content: "" },
  {
    num: 7,
    content: (
      <>
        <Kw>interface</Kw> <Tp>ThemeProviderProps</Tp> {"{"}
      </>
    ),
  },
  {
    num: 8,
    content: (
      <>
        {"  "}
        <Pl>children</Pl>: <Tp>React.ReactNode</Tp>;
      </>
    ),
  },
  {
    num: 9,
    content: (
      <>
        {"  "}
        <Pl>config</Pl>?: <Tp>ThemeConfig</Tp>;
      </>
    ),
  },
  { num: 10, content: "}" },
  { num: 11, content: "" },
  {
    num: 12,
    content: (
      <>
        <Kw>export</Kw> <Kw>default</Kw> <Kw>function</Kw>{" "}
        <Fn>ThemeProvider</Fn>({"{"}
        <Pl> children, config </Pl>
        {"}"}: <Tp>ThemeProviderProps</Tp>) {"{"}
      </>
    ),
  },
  {
    num: 13,
    content: (
      <>
        {"  "}
        <Kw>const</Kw> [<Pl>mode</Pl>, <Fn>setMode</Fn>] ={" "}
        <Fn>useState</Fn>
        <Pl>{"<"}</Pl>
        <Str>'light'</Str> <Pl>|</Pl> <Str>'dark'</Str>
        <Pl>{">"}</Pl>(<Str>'light'</Str>);
      </>
    ),
  },
  { num: 14, content: "" },
  {
    num: 15,
    content: (
      <>
        {"  "}
        <Cm>{"// Apply CSS variables to document root"}</Cm>
      </>
    ),
    suggestion: true,
  },
  {
    num: 16,
    content: (
      <>
        {"  "}
        <Kw>const</Kw> <Fn>applyTheme</Fn> = <Fn>useCallback</Fn>(({" "}
        <Pl>theme</Pl>: <Tp>ThemeConfig</Tp> ) {"=> {"}
      </>
    ),
    suggestion: true,
  },
  {
    num: 17,
    content: (
      <>
        {"    "}
        <Kw>const</Kw> <Pl>root</Pl> = <Pl>document</Pl>.
        <Pl>documentElement</Pl>;
      </>
    ),
    suggestion: true,
  },
  {
    num: 18,
    content: (
      <>
        {"    "}
        <Pl>Object</Pl>.<Fn>entries</Fn>(<Pl>theme</Pl>.<Pl>variables</Pl>).
        <Fn>forEach</Fn>(([<Pl>key</Pl>, <Pl>val</Pl>]) {"=> {"}
      </>
    ),
    suggestion: true,
  },
  {
    num: 19,
    content: (
      <>
        {"      "}
        <Pl>root</Pl>.<Pl>style</Pl>.<Fn>setProperty</Fn>(
        <Str>{"`--${key}`"}</Str>, <Pl>val</Pl>);
      </>
    ),
    suggestion: true,
  },
  {
    num: 20,
    content: (
      <>
        {"    "}
        {"}"});
      </>
    ),
    suggestion: true,
  },
  {
    num: 21,
    content: (
      <>
        {"  "}
        {"}"}, []);
      </>
    ),
    suggestion: true,
  },
  { num: 22, content: "" },
  {
    num: 23,
    content: (
      <>
        {"  "}
        <Kw>return</Kw> (
      </>
    ),
  },
  {
    num: 24,
    content: (
      <>
        {"    "}
        <Pl>{"<ThemeContext.Provider"}</Pl> <Tp>value</Tp>=
        {"{"}
        {"{ "}
        <Pl>mode</Pl>, <Pl>setMode</Pl>, <Pl>applyTheme</Pl>
        {" }"}
        {"}"}
        <Pl>{">"}</Pl>
      </>
    ),
  },
  {
    num: 25,
    content: (
      <>
        {"      {"}
        <Pl>children</Pl>
        {"}"}
      </>
    ),
  },
  {
    num: 26,
    content: (
      <>
        {"    "}
        <Pl>{"</ThemeContext.Provider>"}</Pl>
      </>
    ),
  },
  {
    num: 27,
    content: (
      <>
        {"  "}
        );
      </>
    ),
  },
  { num: 28, content: "}" },
];

export default function CodeEditorMockup() {
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
      <div className="relative bg-surface p-0 font-mono text-[13px] leading-[1.65] overflow-x-auto">
        <div className="min-w-[640px]">
          {lines.map((line) => (
            <div
              key={line.num}
              className={`flex ${
                line.suggestion
                  ? "bg-success/10 border-l-2 border-success/40"
                  : "border-l-2 border-transparent"
              }`}
            >
              <span className="inline-block w-12 shrink-0 select-none pr-4 text-right text-foreground/20">
                {line.num}
              </span>
              <span className="text-foreground/70 whitespace-pre">
                {line.content}
              </span>
            </div>
          ))}
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
