import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { api } from '../api/client';

export default function PlanningCenterCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code');
        const errorParam = searchParams.get('error');

        if (errorParam) {
          setError(errorParam);
          setLoading(false);
          return;
        }

        if (!code) {
          setError('Kein Autorisierungscode erhalten');
          setLoading(false);
          return;
        }

        // Exchange code for token
        const response = await api.post('/api/auth/planning-center/callback', { code });
        
        const { token, user } = response.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        // Redirect to dashboard
        navigate('/');
      } catch (err: any) {
        setError(err.response?.data?.error || 'Authentifizierung fehlgeschlagen');
        setLoading(false);
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-reallife-500 mx-auto"></div>
          <p className="mt-4 text-slate-500">Authentifizierung wird abgeschlossen...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white py-12 px-4">
        <div className="max-w-md w-full">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            <p className="font-semibold">Authentifizierungsfehler</p>
            <p className="mt-1">{error}</p>
          </div>
          <button
            onClick={() => navigate('/login')}
                    className="mt-4 w-full py-2.5 px-6 bg-accent-500 text-white rounded-md hover:bg-accent-600 transition-colors duration-200 font-medium shadow-sm"
          >
            Zurück zur Anmeldung
          </button>
        </div>
      </div>
    );
  }

  return null;
}
