import { useState } from 'react';
import { PlacePicker, type PlacePickerOption } from '@oxy.so/bloom/place-picker';

const places: PlacePickerOption[] = [
  {
    id: 'barcelona',
    title: 'Barcelona',
    subtitle: 'Catalonia, Spain',
    coordinate: { latitude: 41.3874, longitude: 2.1686 },
  },
  {
    id: 'berlin',
    title: 'Berlin',
    subtitle: 'Germany',
    coordinate: { latitude: 52.52, longitude: 13.405 },
  },
];

export default function PlacePickerExample() {
  const [query, setQuery] = useState('Bar');
  const [place, setPlace] = useState<PlacePickerOption | null>(null);
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <p>Search this local example list: Barcelona or Berlin.</p>
      <PlacePicker
        label="City"
        value={place}
        onValueChange={setPlace}
        query={query}
        onQueryChange={setQuery}
        results={places.filter((option) =>
          option.title.toLowerCase().includes(query.toLowerCase()),
        )}
      />
    </div>
  );
}
