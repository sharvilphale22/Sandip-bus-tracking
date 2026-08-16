import { Home, MapPin, Route, Bell, User } from 'lucide-react';

const NAV_ITEMS = [
  { key: 'home', label: 'Home', icon: Home },
  { key: 'track', label: 'Track', icon: MapPin },
  { key: 'routes', label: 'Routes', icon: Route },
  { key: 'notifications', label: 'Alerts', icon: Bell },
  { key: 'profile', label: 'Profile', icon: User },
];

export default function BottomNav({ active, onChange, notificationCount = 0 }) {
  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      <div className="max-w-content mx-auto h-full flex items-stretch px-1">
        {NAV_ITEMS.map(({ key, label, icon: Icon }) => {
          const isActive = active === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange(key)}
              className={`bottom-nav-item ${isActive ? 'active' : ''}`}
              aria-current={isActive ? 'page' : undefined}
              aria-label={label}
            >
              <span className="relative">
                <Icon className="w-5 h-5" strokeWidth={isActive ? 2.25 : 2} aria-hidden="true" />
                {key === 'notifications' && notificationCount > 0 && (
                  <span className="absolute -top-1 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-error text-white text-[10px] font-bold flex items-center justify-center">
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </span>
                )}
              </span>
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
