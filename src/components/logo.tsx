import { Sparkle } from 'lucide-react';

export function Logo() {
  return (
    <div className="flex items-center justify-center size-12 bg-primary rounded-2xl shadow-lg shadow-primary/30">
      <Sparkle
        className="text-primary-foreground"
        width="28"
        height="28"
      />
    </div>
  );
}
