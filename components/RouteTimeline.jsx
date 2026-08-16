import { CheckCircle2 } from 'lucide-react';

export default function RouteTimeline({ stops = [], etas = [], tripActive, myStopName, routeMode = 'morning' }) {
  if (!stops.length) {
    return (
      <div className="card p-6 text-center">
        <p className="text-text-secondary text-sm">No route stops available</p>
        <p className="text-text-muted text-xs mt-1">Route information will appear once assigned.</p>
      </div>
    );
  }

  return (
    <div className="card p-4">
      <h3 className="section-title mb-4">
        {routeMode === 'morning' ? 'Morning route' : 'Evening route'}
      </h3>
      <ol className="space-y-0" aria-label="Route stops">
        {stops.map((stop, i) => {
          const isMyStop = stop.name === myStopName;
          const eta = etas.find(e => e.stopName === stop.name);
          const isPassed = tripActive && eta && eta.eta <= 0;
          const isNext = tripActive && eta && eta.eta > 0 && !isPassed &&
            (i === 0 || (etas.find(e => e.stopName === stops[i - 1]?.name)?.eta <= 0));

          return (
            <li key={`${stop.name}-${i}`} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    isPassed
                      ? 'bg-success border-success text-white'
                      : isMyStop
                        ? 'bg-primary border-primary'
                        : isNext
                          ? 'bg-info-bg border-info'
                          : 'bg-surface border-border'
                  }`}
                  aria-hidden="true"
                >
                  {isPassed && <CheckCircle2 className="w-3 h-3" />}
                </div>
                {i < stops.length - 1 && (
                  <div className={`w-0.5 flex-1 min-h-[32px] ${isPassed ? 'bg-success/40' : 'bg-border'}`} />
                )}
              </div>
              <div className="pb-4 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className={`text-sm font-medium ${
                    isMyStop ? 'text-primary' : isPassed ? 'text-success' : 'text-text-primary'
                  }`}>
                    {stop.name}
                  </p>
                  {isMyStop && (
                    <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      Your stop
                    </span>
                  )}
                  {isNext && (
                    <span className="text-xs font-medium text-info bg-info-bg px-2 py-0.5 rounded-full">
                      Next
                    </span>
                  )}
                </div>
                {tripActive && eta && (
                  <p className="text-xs text-text-muted mt-0.5">
                    {isPassed ? 'Passed' : `~${eta.eta} min · ${eta.distance} km`}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
