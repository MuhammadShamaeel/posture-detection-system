import { getUser, logout } from "../utils/auth";
import { useNavigate, NavLink, Outlet, Navigate } from "react-router-dom";

const menu = [
  {
    name : "Monitor",
    path : "/monitor",
    icon : (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="1" y="1" width="14" height="10" rx="2"
          stroke="currentColor" strokeWidth="1.4" fill="none"/>
        <path d="M5 15h6M8 11v4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        <circle cx="8" cy="6" r="2" stroke="currentColor" strokeWidth="1.3" fill="none"/>
      </svg>
    ),
  },
  {
    name : "Reports",
    path : "/reports",
    icon : (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="2" y="1" width="12" height="14" rx="2"
          stroke="currentColor" strokeWidth="1.4" fill="none"/>
        <path d="M5 5h6M5 8h6M5 11h3"
          stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    name : "Insights",
    path : "/insights",
    icon : (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M2 13l3.5-4 3 2.5L12 5"
          stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="12" cy="5" r="1.5" fill="currentColor"/>
      </svg>
    ),
  },
  {
    name : "Settings",
    path : "/settings",
    icon : (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.3" fill="none"/>
        <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.42 1.42M11.53 11.53l1.42 1.42M3.05 12.95l1.42-1.42M11.53 4.47l1.42-1.42"
          stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      </svg>
    ),
  },
];

export default function MainLayout() {
  const user     = getUser();
  const navigate = useNavigate();

  // Extra guard: if somehow no user, redirect to landing
  if (!user) return <Navigate to="/" replace />;

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // User initials avatar
  const initials = (user.email?.[0] ?? "?").toUpperCase();

  return (
    <div className="flex h-screen bg-zinc-950 text-white overflow-hidden">

      {/* ── Sidebar ── */}
      <aside className="w-60 bg-zinc-900 border-r border-zinc-800 flex flex-col shrink-0">

        
        {/* Nav label */}
        <p className="px-4 pt-4 pb-1 text-[10px] text-zinc-600 uppercase tracking-widest">
          Navigation
        </p>

        {/* Menu */}
        <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto">
          {menu.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 ${
                  isActive
                    ? "bg-emerald-500/15 text-emerald-400 font-medium"
                    : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {/* Icon */}
                  <span className={`shrink-0 transition-colors ${
                    isActive ? "text-emerald-400" : "text-zinc-500"
                  }`}>
                    {item.icon}
                  </span>

                  {/* Label */}
                  <span>{item.name}</span>

                  {/* Active indicator dot */}
                  {isActive && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* ── Bottom user section ── */}
        <div className="p-3 border-t border-zinc-800">

          {/* Avatar row */}
          <div className="flex items-center gap-2.5 px-1 mb-3">
            <div className="w-7 h-7 rounded-full bg-zinc-700 flex items-center justify-center
              text-xs font-semibold text-zinc-300 shrink-0">
              {initials}
            </div>
            <div className="flex flex-col min-w-0">
              <p className="text-xs text-zinc-300 truncate font-medium">
                {user.email}
              </p>
            </div>
          </div>

          {/* Logout / Sign out */}
          <button
            onClick={handleLogout}
            className="w-full text-xs py-2 rounded-lg transition-colors
              bg-zinc-800 hover:bg-red-500/15 text-zinc-400 hover:text-red-400
              border border-zinc-700 hover:border-red-500/30"
          >
            Sign Out
          </button>

        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 overflow-auto min-w-0">
        <Outlet />
      </main>

    </div>
  );
}