import { isValidElement, type ComponentPropsWithoutRef, type ReactNode } from 'react'
import CodeBlock from './CodeBlock'

/** Route fenced Markdown through the same Bloom card as explicit CodeBlock MDX. */
export default function MdxCodeBlock({ children, className }: ComponentPropsWithoutRef<'pre'>) {
  const code = isValidElement<{ className?: string; children?: ReactNode }>(children) ? children : null
  const language = /(?:^|\s)language-([\w+-]+)/.exec(code?.props.className ?? '')?.[1]
  return <CodeBlock language={language} className={className}>{code ? code.props.children : children}</CodeBlock>
}
