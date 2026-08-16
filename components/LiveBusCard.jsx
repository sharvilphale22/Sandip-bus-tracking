import { Bus, MapPin, Clock, ChevronRight } from 'lucide-react';
import StatusBadge from './ui/StatusBadge';
import EtaDisplay from './ui/EtaDisplay';
import { formatRelativeTime, isLocationStale, getBusStatus } from '../utils/format';

export default function LiveBusCard({
  busNumber,
  route,
  eta,
  tripActive,
  lastUpdated,
  nextStop,
  pickupStop,
  onViewMap,
  status: statusOverride,
}) {
  const locationStale = isLocationStale(lastUpdated);
  const status = statusOverride || getBusStatus({ tripActive, locationStale, eta });

  return (
    <article className="card-raised overflow-hidden">
      <div className="p-4 border-b border-border">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-11 h-11 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Bus className="w-5 h-5 text-primary" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-text-primary truncate">
                Sandip Bus {busNumber || '—'}
              </h2>
              <p className="text-sm text-text-secondary truncate">
                Route: {route || 'Not assigned'}
              </p>
            </div>
          </div>
          <StatusBadge status={status} />
        </div>
      </div>

      <div className="p-4 grid grid-cols-2 gap-4 border-b border-border">
        <EtaDisplay eta={eta} tripActive={tripActive && !locationStale} />
        <div className="flex flex-col justify-center gap-3">
          <div>
            <p className="text-xs text-text-muted mb-0.5">Your stop</p>
            <p className="text-sm font-medium text-text-primary flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-primary flex-shrink-0" aria-hidden="true" />
              <span className="truncate">{pickupStop || '—'}</span>
            </p>
          </div>
          {nextStop && (
            <div>
              <p className="text-xs text-text-muted mb-0.5">Next stop</p>
              <p className="text-sm font-medium text-text-primary truncate">{nextStop}</p>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 py-3 flex items-center justify-between gap-3 bg-surface-muted">
        <div className="flex items-center gap-1.5 text-xs text-text-secondary min-w-0">
          <Clock className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
          {lastUpdated ? (
            <span>
              Updated {formatRelativeTime(lastUpdated)}
              {locationStale && (
                <span className="text-warning font-medium"> · Location may be outdated</span>
              )}
            </span>
          ) : (
            <span>Waiting for live location</span>
          )}
        </div>
        {onViewMap && (
          <button
            type="button"
            onClick={onViewMap}
            className="btn-ghost text-primary text-sm py-2 px-3 min-h-[44px] flex-shrink-0"
          >
            View map
            <ChevronRight className="w-4 h-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </article>
  );
}
