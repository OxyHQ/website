import { CodeBlock } from '@oxy.so/bloom/code'

export default function CodeExample() {
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <CodeBlock code={"const greeting = 'Hello, Bloom!'\nconsole.log(greeting)"} language="typescript" />
    </div>
  )
}
