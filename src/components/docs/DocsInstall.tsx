import { useState } from 'react';
import { Tabs, TabsTrigger } from '@oxy.so/bloom/tabs';
import CodeBlock from '../../content/_components/CodeBlock';

export function DocsInstall({ packageName }: { packageName: string }) {
  const [manager, setManager] = useState('npm');
  const command = `${manager} ${manager === 'npm' ? 'install' : 'add'} ${packageName}`;
  return (
    <div
      className="not-prose min-w-0 rounded-2xl border border-border bg-surface p-2"
      data-docs-install
    >
      <Tabs label="Package manager" value={manager} onValueChange={setManager} variant="filled">
        {['npm', 'pnpm', 'yarn', 'bun'].map((name) => (
          <TabsTrigger key={name} value={name} label={name} />
        ))}
      </Tabs>
      <CodeBlock language="bash" className="my-0 mt-2">
        {command}
      </CodeBlock>
    </div>
  );
}
