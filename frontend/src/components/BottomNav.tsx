import { NavLink } from 'react-router-dom';
import { useApp } from '../App';

const navItems = [
  { to: '/upload', labelKey: 'nav.upload', icon: 'upload' },
  { to: '/timeline', labelKey: 'nav.timeline', icon: 'timeline' },
  { to: '/medicines', labelKey: 'nav.medicines', icon: 'medicine' },
  { to: '/settings', labelKey: 'nav.settings', icon: 'settings' },
];

const icons: Record<string, React.ReactNode> = {
  upload: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5h12a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 18.75 4.5H6.75A2.25 2.25 0 0 0 4.5 6.75v10.5a2.25 2.25 0 0 0 2.25 2.25Z" />
    </svg>
  ),
  timeline: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  ),
  medicine: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6a2.25 2.25 0 0 0-2.25-2.25H6A2.25 2.25 0 0 0 3.75 6v8.25A2.25 2.25 0 0 0 6 16.5h.75m9 0h3.75m-3.75 0v3.75m0-3.75H18" />
    </svg>
  ),
  settings: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.284a7.027 7.027 0 0 1 2.353.884l1.164-.403c.49-.17.993.104 1.163.593l.593 1.688c.17.489-.104.993-.593 1.163l-1.164.403a7.027 7.027 0 0 1-.884 2.353l.403 1.164c.17.489-.104.993-.593 1.163l-1.688.593c-.489.17-.993-.104-1.163-.593l-.403-1.164a7.027 7.027 0 0 1-2.353-.884l-1.164.403c-.49.17-.993-.104-1.163-.593l-.593-1.688c-.17-.489.104-.993.593-1.163l1.164-.403a7.027 7.027 0 0 1 .884-2.353l-.403-1.164c-.17-.489.104-.993.593-1.163l1.688-.593Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 18 0Z" />
    </svg>
  ),
};

export default function BottomNav() {
  const { t } = useApp();

  return (
    <nav className="bottom-nav safe-area-pb">
      <div className="max-w-lg mx-auto flex items-center justify-around">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 py-2 px-3 text-xs font-medium transition-colors ${
                isActive ? 'text-primary-600' : 'text-text-muted'
              }`
            }
          >
            {icons[item.icon]}
            {t(item.labelKey)}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}