import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface MissionPoint {
  id: string;
  name: string;
  description: string;
  kpis: KPI[];
}

interface KPI {
  id: string;
  name: string;
  description: string;
  records: KPIRecord[];
}

interface KPIRecord {
  id: string;
  value: number;
  date: string;
}

interface DashboardData {
  missionPoints: MissionPoint[];
  statistics: {
    totalContacts: number;
    activeWorkflows: number;
    pendingTasks: number;
  };
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedKPI, setSelectedKPI] = useState<string | null>(null);
  const [kpiTrends, setKpiTrends] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (selectedKPI) {
      fetchKPITrends(selectedKPI);
    }
  }, [selectedKPI]);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/api/dashboard');
      setData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Use mock data if API fails
      setData({
        missionPoints: [
          {
            id: '1',
            name: 'Wir gehen',
            description: 'Mission Point für Outreach und Evangelisation',
            kpis: [
              {
                id: 'kpi-1',
                name: 'Teilnehmer bei Veranstaltungen',
                description: 'Anzahl der Personen, die an Outreach-Veranstaltungen teilnehmen',
                records: [{ id: '1', value: 150, date: new Date().toISOString() }]
              },
              {
                id: 'kpi-2',
                name: 'Erstbekehrungen im Gottesdienst',
                description: 'Erstbekehrungen während des Gottesdienstes',
                records: [{ id: '2', value: 12, date: new Date().toISOString() }]
              }
            ]
          },
          {
            id: '2',
            name: 'Wir bringen',
            description: 'Mission Point für das Bringen von Menschen in die Kirche',
            kpis: [
              {
                id: 'kpi-3',
                name: 'Neue Besucher',
                description: 'Anzahl der neuen Besucher in der Kirche',
                records: [{ id: '3', value: 45, date: new Date().toISOString() }]
              }
            ]
          },
          {
            id: '3',
            name: 'Wir begleiten',
            description: 'Mission Point für Jüngerschaft und Wachstum',
            kpis: [
              {
                id: 'kpi-4',
                name: 'Kleingruppen-Teilnehmer',
                description: 'Personen, die aktiv an Kleingruppen teilnehmen',
                records: [{ id: '4', value: 89, date: new Date().toISOString() }]
              }
            ]
          }
        ],
        statistics: {
          totalContacts: 234,
          activeWorkflows: 12,
          pendingTasks: 8
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchKPITrends = async (kpiId: string) => {
    try {
      const response = await api.get(`/api/dashboard/kpi-trends/${kpiId}?groupBy=day`);
      setKpiTrends(response.data);
    } catch (error) {
      console.error('Error fetching KPI trends:', error);
    }
  };

  if (loading) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-slate-500">Dashboard-Daten werden geladen...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-700 font-medium">Dashboard-Daten konnten nicht geladen werden</p>
          <p className="text-red-600 text-sm mt-2">Bitte überprüfen Sie Ihre Verbindung und versuchen Sie es erneut</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8">
        <h1 className="text-4xl font-display font-bold tracking-tighter text-blue-600">Dashboard</h1>
        <p className="mt-2 text-lg tracking-tight text-slate-500">
          Übersicht über Mission Points, KPIs und Connect-Prozess Statistiken
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-8">
        <div className="bg-white overflow-hidden shadow-lg rounded-2xl border border-slate-200 hover:shadow-xl transition-shadow">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">Kontakte gesamt</p>
                <p className="mt-2 text-3xl font-display font-bold text-blue-600">
                  {data.statistics.totalContacts.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-lg rounded-2xl border border-slate-200 hover:shadow-xl transition-shadow">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">Aktive Workflows</p>
                <p className="mt-2 text-3xl font-display font-bold text-indigo-600">
                  {data.statistics.activeWorkflows.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-indigo-50 rounded-xl">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-lg rounded-2xl border border-slate-200 hover:shadow-xl transition-shadow">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">Ausstehende Aufgaben</p>
                <p className="mt-2 text-3xl font-display font-bold text-amber-600">
                  {data.statistics.pendingTasks.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mission Points */}
      <div className="space-y-8">
        {data.missionPoints.map((missionPoint, index) => (
          <div key={missionPoint.id} className="bg-white shadow-lg rounded-2xl border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-display font-bold tracking-tight text-white">
                    {missionPoint.name}
                  </h2>
                  {missionPoint.description && (
                    <p className="mt-1 text-sm text-blue-100">{missionPoint.description}</p>
                  )}
                </div>
                <div className="text-4xl font-bold text-white/20">
                  {String(index + 1).padStart(2, '0')}
                </div>
              </div>
            </div>

            <div className="p-6">
              {missionPoint.kpis.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {missionPoint.kpis.map((kpi) => {
                    const latestRecord = kpi.records[0];
                    const currentValue = latestRecord?.value || 0;

                    return (
                      <div
                        key={kpi.id}
                        className="border-2 border-slate-200 rounded-xl p-5 cursor-pointer hover:border-blue-500 hover:shadow-md transition-all bg-gradient-to-br from-white to-slate-50"
                        onClick={() => setSelectedKPI(kpi.id)}
                      >
                        <h3 className="text-base font-semibold text-slate-900 mb-3">
                          {kpi.name}
                        </h3>
                        {kpi.description && (
                          <p className="text-xs text-slate-500 mb-3">{kpi.description}</p>
                        )}
                        <div className="flex items-baseline justify-between">
                          <div className="text-3xl font-display font-bold text-blue-600">
                            {currentValue.toLocaleString()}
                          </div>
                          {selectedKPI === kpi.id && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                          )}
                        </div>
                        {latestRecord && (
                          <div className="text-xs text-slate-400 mt-3 pt-3 border-t border-slate-200">
                            Zuletzt aktualisiert: {new Date(latestRecord.date).toLocaleDateString('de-DE', { 
                              day: '2-digit', 
                              month: '2-digit', 
                              year: 'numeric' 
                            })}
                          </div>
                        )}
                        {!latestRecord && (
                          <div className="text-xs text-slate-400 mt-3 pt-3 border-t border-slate-200">
                            Noch keine Daten
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <p>Noch keine KPIs definiert. Fügen Sie KPIs im KPI-Management-Bereich hinzu.</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* KPI Trends Chart */}
      {selectedKPI && kpiTrends.length > 0 && (
        <div className="mt-8 bg-white shadow-lg rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-display font-semibold text-slate-900">KPI Trends</h3>
            <button
              onClick={() => setSelectedKPI(null)}
              className="text-sm text-slate-500 hover:text-slate-700"
            >
              Schließen
            </button>
          </div>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={kpiTrends} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="date" 
                stroke="#64748b"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="#64748b"
                style={{ fontSize: '12px' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#2563eb" 
                strokeWidth={3}
                dot={{ fill: '#2563eb', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
