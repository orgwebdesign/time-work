import { Sparkle } from 'lucide-react';

export function Logo() {
  return (
    <div className="flex items-center justify-center size-8 bg-primary rounded-lg shadow-md">
      <Sparkle
        className="text-primary-foreground"
        width="20"
        height="20"
      />
    </div>
  );
}
