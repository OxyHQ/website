import { FileMessage } from '@oxy.so/bloom/message-media';

export default function MessageMediaExample() {
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <FileMessage name="Project-notes.pdf" />
    </div>
  );
}
