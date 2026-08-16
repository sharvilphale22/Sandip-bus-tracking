import { formatEta } from '../../utils/format';

export default function EtaDisplay({ eta, tripActive, compact = false }) {
  const { value, label } = formatEta(eta, tripActive);

  if (compact) {
    return (
      <div>
        <p className="text-2xl font-semibold text-text-primary leading-tight">{value}</p>
        <p className="text-xs text-text-secondary mt-0.5">{label}</p>
      </div>
    );
  }

  return (
    <div className="text-center py-2">
      <p className="text-xs font-medium uppercase tracking-wide text-text-muted mb-1">
        {tripActive ? 'Arriving in' : 'ETA'}
      </p>
      <p className="text-display font-semibold text-text-primary leading-none">{value}</p>
      <p className="text-sm text-text-secondary mt-2">{label}</p>
    </div>
  );
}
