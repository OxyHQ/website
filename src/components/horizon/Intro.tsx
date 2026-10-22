import Button from '../ui/Button';
import MapSymbol from './Symbol';
import type { SymbolType } from './symbolPaths';

const LEGEND: { type: SymbolType; title: string; description: string }[] = [
  {
    type: 'imperative',
    title: 'Innovation Imperatives',
    description: 'Critical needs that can help accelerate the path to net zero',
  },
  {
    type: 'moonshot',
    title: 'Moonshots',
    description:
      'High-risk, high-reward innovations that could radically reshape our path to net zero',
  },
  {
    type: 'tech-cluster',
    title: 'Tech Categories',
    description: 'Groupings of climate technologies',
  },
];

export function Legend() {
  return (
    <dl className="horizon-legend">
      {LEGEND.map((item) => (
        <div key={item.type}>
          <dt>
            <MapSymbol type={item.type} />
            <span>{item.title}</span>
          </dt>
          <dd>{item.description}</dd>
        </div>
      ))}
    </dl>
  );
}

// Layout and copy retained from the reference's desktop/mobile landing components.
export default function Intro({ onExplore }: { onExplore: () => void }) {
  return (
    <div className="horizon-intro">
      <div className="horizon-intro-copy">
        <h1>
          Inventing
          <span className="horizon-title-break">
            <br />
          </span>
          <span className="horizon-title-space"> </span>the Future
        </h1>
        <p>
          The Climate Tech Map is your guide to the known frontiers and unknown breakthroughs that
          will define our future. Explore the frontiers and find a breakthrough of your own.
        </p>
      </div>
      <hr />
      <Legend />
      <Button type="button" responsive className="horizon-cta force-light" onClick={onExplore}>
        Start exploring →
      </Button>
    </div>
  );
}
