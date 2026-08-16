import { Loader2, Bus } from 'lucide-react';

export default function LoadingSpinner({ message = 'Loading…' }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center animate-fade-in" role="status" aria-live="polite">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-lg bg-primary/10 mb-4">
          <Bus className="w-7 h-7 text-primary" aria-hidden="true" />
        </div>
        <Loader2 className="w-6 h-6 text-primary animate-spin mx-auto" aria-hidden="true" />
        <p className="mt-3 text-sm text-text-secondary">{message}</p>
      </div>
    </div>
  );
}
