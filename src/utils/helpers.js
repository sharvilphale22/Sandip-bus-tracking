/**
 * Calculate distance between two coordinates using the Haversine formula
 * @returns distance in kilometers
 */
export function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(value) {
  return (value * Math.PI) / 180;
}

/**
 * Calculate ETA in minutes based on distance
 * Average bus speed: 25 km/h in city
 */
export function calculateETA(busLat, busLng, destLat, destLng) {
  if (!busLat || !busLng || !destLat || !destLng) return null;
  const distance = haversineDistance(busLat, busLng, destLat, destLng);
  const avgSpeedKmh = 25;
  const etaMinutes = Math.round((distance / avgSpeedKmh) * 60);
  return Math.max(1, etaMinutes); // At least 1 minute
}

/**
 * Format timestamp to friendly string
 */
export function formatTime(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Format date to friendly string
 */
export function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

/**
 * Format datetime to relative time (e.g. "2 min ago")
 */
export function timeAgo(date) {
  if (!date) return '';
  const now = new Date();
  const d = new Date(date);
  const diffMs = now - d;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHr < 24) return `${diffHr} hr ago`;
  return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
}

/**
 * Get bus status color
 */
export function getBusStatusColor(status) {
  switch (status) {
    case 'moving': return '#00d4ff';
    case 'active': return '#10b981';
    case 'stopped': return '#f59e0b';
    case 'inactive': return '#6b7280';
    default: return '#6b7280';
  }
}

/**
 * Get bus status label
 */
export function getBusStatusLabel(status) {
  switch (status) {
    case 'moving': return '🚌 Moving';
    case 'active': return '🟢 Active';
    case 'stopped': return '🟡 Stopped';
    case 'inactive': return '⚫ Inactive';
    default: return status;
  }
}
