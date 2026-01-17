import { Outlet, Link, useLocation } from 'react-router-dom';

export default function Layout() {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Dashboard' },
    { path: '/kpis', label: 'Kennzahlen' },
    { path: '/connect', label: 'Connect Prozess' }
  ];

  return (
    <div className="min-h-screen bg-white">
      <nav className="bg-white shadow-md border-b-2 border-reallife-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-8">
              <Link to="/" className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <h1 className="text-2xl font-display font-bold tracking-tight text-reallife-500">
                    Reallife
                  </h1>
                  <p className="text-xs text-slate-600 tracking-wider uppercase">Berlin</p>
                </div>
              </Link>
              <div className="hidden md:flex md:space-x-1">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`inline-flex items-center px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                      location.pathname === item.path
                        ? 'text-reallife-500 border-b-2 border-reallife-500'
                        : 'text-slate-600 hover:text-reallife-500 hover:border-b-2 hover:border-reallife-300'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
            <div className="flex items-center">
              <div className="hidden sm:block">
                <span className="text-sm font-medium text-slate-700">Dashboard</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 bg-berlin-gray min-h-[calc(100vh-5rem)]">
        <Outlet />
      </main>
    </div>
  );
}
