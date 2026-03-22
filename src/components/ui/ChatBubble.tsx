interface ChatBubbleProps {
  message: string;
  isUser?: boolean;
  className?: string;
}

export default function ChatBubble({
  message,
  isUser = false,
  className = '',
}: ChatBubbleProps) {
  return (
    <div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} ${className}`}
    >
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? 'rounded-br-md bg-surface text-primary-foreground'
            : 'rounded-bl-md bg-primary-background shadow-attio-product-e1 text-secondary-foreground'
        }`}
      >
        {message}
      </div>
    </div>
  );
}
