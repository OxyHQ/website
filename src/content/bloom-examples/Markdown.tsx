import { Markdown } from '@oxy.so/bloom/markdown';

const SOURCE = `## A reply, as it arrives

Bloom's **Markdown** draws the text of a chat reply with the type ramp, a *list*, a [link](https://oxy.so) and \`inline code\`:

- headings, lists and quotes
- fenced code, with its language
- tables that scroll sideways

\`\`\`ts
const reply = await agent.ask('What is Bloom?');
\`\`\`
`;

export default function MarkdownExample() {
  return (
    <div className="w-full max-w-lg text-foreground">
      <Markdown>{SOURCE}</Markdown>
    </div>
  );
}
