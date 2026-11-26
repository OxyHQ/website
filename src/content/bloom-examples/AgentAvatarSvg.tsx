import { useEffect, useState } from 'react';
import { renderAgentAvatarPicture } from '@oxy.so/bloom/agent-avatar/svg';

// The server-side entry answers an SVG document as a string (no React); a server
// rasterizes it, and this page shows it as an image.
export default function AgentAvatarSvgExample() {
  const [svg, setSvg] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    void renderAgentAvatarPicture({ preset: 'blue_beret' }, null, { size: 192 }).then(
      (document) => {
        if (live) setSvg(document);
      },
    );
    return () => {
      live = false;
    };
  }, []);
  return (
    <div className="w-full max-w-lg text-foreground">
      {svg ? (
        <img
          src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`}
          alt="The Blue Beret character on its own tint"
          width={192}
          height={192}
          className="rounded-full"
        />
      ) : null}
    </div>
  );
}
