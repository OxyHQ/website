import { VirtualList } from '@oxy.so/bloom/list';

export default function ListExample() {
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <div className="h-48">
        <VirtualList
          data={['Sketch the idea', 'Choose components', 'Share your work']}
          renderItem={({ item }) => <p className="border-b border-border p-4">{item}</p>}
          keyExtractor={(item) => item}
        />
      </div>
    </div>
  );
}
