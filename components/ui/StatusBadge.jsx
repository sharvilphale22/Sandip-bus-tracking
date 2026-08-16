import { Radio, Clock, Navigation, CircleOff, MapPinOff, CheckCircle2 } from 'lucide-react';

const STATUS_CONFIG = {
  live: { label: 'Live', icon: Radio, className: 'status-live' },
  approaching: { label: 'Approaching', icon: Navigation, className: 'status-approaching' },
  delayed: { label: 'Delayed', icon: Clock, className: 'status-delayed' },
  stopped: { label: 'Stopped', icon: CircleOff, className: 'status-stopped' },
  offline: { label: 'Offline', icon: CircleOff, className: 'status-offline' },
  'no-gps': { label: 'No GPS', icon: MapPinOff, className: 'status-no-gps' },
  completed: { label: 'Route completed', icon: CheckCircle2, className: 'status-offline' },
};

export default function StatusBadge({ status = 'offline', className = '' }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.offline;
  const Icon = config.icon;

  return (
    <span className={`status-badge ${config.className} ${className}`} role="status">
      <Icon className="w-3 h-3" aria-hidden="true" />
      {config.label}
    </span>
  );
}
