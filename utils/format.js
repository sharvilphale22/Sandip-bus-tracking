const STALE_THRESHOLD_SEC = 45;

export function formatRelativeTime(timestamp) {
  if (!timestamp) return null;
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 5) return 'Just now';
  if (seconds < 60) return `${seconds} sec ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours} hr ago`;
}

export function isLocationStale(timestamp, thresholdSec = STALE_THRESHOLD_SEC) {
  if (!timestamp) return true;
  return (Date.now() - timestamp) / 1000 > thresholdSec;
}

export function getBusStatus({ tripActive, locationStale, eta, tripEnded }) {
  if (tripEnded) return 'completed';
  if (!tripActive) return 'offline';
  if (locationStale) return 'no-gps';
  if (eta !== null && eta !== undefined && eta <= 2 && eta > 0) return 'approaching';
  if (tripActive) return 'live';
  return 'stopped';
}

export function formatEta(eta, tripActive) {
  if (!tripActive) {
    return { value: '—', label: 'Trip not started' };
  }
  if (eta === null || eta === undefined) {
    return { value: 'Unavailable', label: 'ETA unavailable' };
  }
  if (eta <= 0) {
    return { value: 'Arrived', label: 'Bus at your stop' };
  }
  if (eta === 1) {
    return { value: '1 min', label: 'Arriving soon' };
  }
  if (eta <= 5) {
    return { value: `${eta} min`, label: 'Arriving soon' };
  }
  return { value: `${eta} min`, label: 'Expected arrival' };
}

export function getFriendlyError(message) {
  if (!message) return 'Something went wrong. Please try again.';
  const lower = message.toLowerCase();
  if (lower.includes('network') || lower.includes('fetch')) {
    return 'Check your internet connection and try again.';
  }
  if (lower.includes('401') || lower.includes('invalid') || lower.includes('credentials')) {
    return 'Please check your email and password.';
  }
  if (lower.includes('500') || lower.includes('server') || lower.includes('mongo') || lower.includes('jwt')) {
    return 'Unable to complete the request. Please try again later.';
  }
  return message;
}
