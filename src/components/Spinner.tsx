import { Loader2 } from 'lucide-react';

interface SpinnerProps {
  size?: number;
  className?: string;
}

export function Spinner({ size = 20, className = '' }: SpinnerProps) {
  return <Loader2 className={`animate-spin ${className}`} style={{ width: size, height: size }} />;
}

export function FullPageSpinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <Spinner size={32} className="text-slate-400" />
    </div>
  );
}
