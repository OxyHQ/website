import { SYMBOL_PATHS, type SymbolType } from './symbolPaths';

export default function MapSymbol({ type }: { type: SymbolType }) {
  return (
    <svg width="18" height="12" viewBox="-9 -6 18 12" aria-hidden="true">
      <path d={SYMBOL_PATHS[type]} fill="currentColor" />
    </svg>
  );
}
