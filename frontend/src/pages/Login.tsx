import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((state) => state.login);
  const loginWithPlanningCenter = useAuthStore((state) => state.loginWithPlanningCenter);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Anmeldung fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  };

  const handlePlanningCenterLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await loginWithPlanningCenter();
    } catch (err: any) {
      setError(err.message || 'Planning Center Anmeldung fehlgeschlagen');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
                  <h2 className="mt-6 text-center text-4xl font-display font-bold tracking-tighter text-reallife-500">
            Reallife Church App
          </h2>
          <p className="mt-2 text-center text-base tracking-tight text-slate-500">
            Melden Sie sich in Ihrem Konto an
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              <p className="font-semibold">Fehler</p>
              <p className="mt-1 text-sm">{error}</p>
              {error.includes('not configured') && (
                <div className="mt-3 text-xs bg-red-100 p-2 rounded">
                  <p className="font-semibold">Setup erforderlich:</p>
                  <p className="mt-1">Fügen Sie diese zu Ihrer backend/.env Datei hinzu:</p>
                  <code className="block mt-1 text-xs">
                    PLANNING_CENTER_CLIENT_ID=your_client_id<br/>
                    PLANNING_CENTER_CLIENT_SECRET=your_client_secret<br/>
                    PLANNING_CENTER_REDIRECT_URI=http://localhost:5173/auth/callback
                  </code>
                </div>
              )}
            </div>
          )}
          
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                E-Mail-Adresse
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                        className="appearance-none rounded-none relative block w-full px-3 py-2 border border-slate-300 placeholder-slate-400 text-slate-900 rounded-t-md focus:outline-none focus:ring-2 focus:ring-reallife-500 focus:border-reallife-500 focus:z-10 sm:text-sm"
                placeholder="E-Mail-Adresse"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Passwort
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                        className="appearance-none rounded-none relative block w-full px-3 py-2 border border-slate-300 placeholder-slate-400 text-slate-900 rounded-b-md focus:outline-none focus:ring-2 focus:ring-reallife-500 focus:border-reallife-500 focus:z-10 sm:text-sm"
                placeholder="Passwort"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-3">
            <button
              type="submit"
              disabled={loading}
                      className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-base font-semibold rounded-lg text-white bg-accent-500 hover:bg-accent-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-500 disabled:opacity-50 active:text-white/70 transition-colors duration-200 shadow-sm"
            >
              {loading ? 'Anmelden...' : 'Anmelden'}
            </button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-slate-500">Oder</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handlePlanningCenterLogin}
              disabled={loading}
                      className="w-full flex justify-center py-4 px-4 border-2 border-reallife-500 text-base font-semibold rounded-lg text-reallife-500 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-reallife-500 disabled:opacity-50 transition-colors duration-200"
            >
              {loading ? 'Verbinden...' : 'Mit Planning Center anmelden'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
