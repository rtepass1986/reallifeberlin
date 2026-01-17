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
  trackingFrequency?: string;
  location?: string;
  category?: string;
  subcategory?: string;
  missionPoint?: {
    id: string;
    name: string;
    description: string;
  };
  records: KPIRecord[];
}

interface KPIRecord {
  id: string;
  value: number;
  date: string;
  notes?: string;
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
  const [selectedKPIDetails, setSelectedKPIDetails] = useState<KPI | null>(null);
  const [kpiTrends, setKpiTrends] = useState<any[]>([]);
  const [loadingKPIDetails, setLoadingKPIDetails] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (selectedKPI) {
      fetchKPIDetails(selectedKPI);
      fetchKPITrends(selectedKPI);
    } else {
      setSelectedKPIDetails(null);
    }
  }, [selectedKPI]);

  const fetchKPIDetails = async (kpiId: string) => {
    setLoadingKPIDetails(true);
    try {
      const response = await api.get(`/api/kpis/${kpiId}`);
      const kpiData = response.data;
      // Ensure records is always an array
      if (kpiData) {
        kpiData.records = Array.isArray(kpiData.records) ? kpiData.records : [];
        console.log(`Loaded KPI details for ${kpiData.name}: ${kpiData.records.length} records`);
      }
      setSelectedKPIDetails(kpiData);
    } catch (error) {
      console.error('Error fetching KPI details:', error);
    } finally {
      setLoadingKPIDetails(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/api/dashboard');
      // Ensure records is always an array
      const data = response.data;
      if (data?.missionPoints) {
        data.missionPoints = data.missionPoints.map((mp: MissionPoint) => ({
          ...mp,
          kpis: mp.kpis.map((kpi: KPI) => ({
            ...kpi,
            records: Array.isArray(kpi.records) ? kpi.records : []
          }))
        }));
      }
      setData(data);
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
      const trends = response.data || [];
      console.log(`Loaded KPI trends for ${kpiId}: ${trends.length} data points`);
      setKpiTrends(trends);
    } catch (error) {
      console.error('Error fetching KPI trends:', error);
      setKpiTrends([]);
    }
  };

  if (loading) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-reallife-500 mx-auto"></div>
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
                <h1 className="text-4xl font-display font-bold tracking-tighter text-reallife-500">Dashboard</h1>
        <p className="mt-2 text-lg tracking-tight text-slate-500">
          Übersicht über Mission Points, KPIs und Connect-Prozess Statistiken
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-8">
        <div className="bg-white overflow-hidden shadow-md rounded-xl border border-slate-200 hover:shadow-lg transition-all duration-200">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">Kontakte gesamt</p>
                        <p className="mt-2 text-3xl font-display font-bold text-reallife-500">
                  {data.statistics.totalContacts.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-slate-100 rounded-xl">
                <svg className="w-6 h-6 text-reallife-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-md rounded-xl border border-slate-200 hover:shadow-lg transition-all duration-200">
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

        <div className="bg-white overflow-hidden shadow-md rounded-xl border border-slate-200 hover:shadow-lg transition-all duration-200">
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
                    <div className="bg-gradient-to-r from-reallife-600 to-reallife-700 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-display font-bold tracking-tight text-white">
                    {missionPoint.name}
                  </h2>
                  {missionPoint.description && (
                    <p className="mt-1 text-sm text-reallife-100">{missionPoint.description}</p>
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
                    const records = kpi.records || [];
                    const latestRecord = records[0];
                    const currentValue = latestRecord?.value || 0;

                    return (
                      <div
                        key={kpi.id}
                        className="border-2 border-slate-200 rounded-xl p-5 cursor-pointer hover:border-reallife-500 hover:shadow-md transition-all bg-gradient-to-br from-white to-slate-50"
                        onClick={() => setSelectedKPI(kpi.id)}
                      >
                        <h3 className="text-base font-semibold text-slate-900 mb-3">
                          {kpi.name}
                        </h3>
                        {kpi.description && (
                          <p className="text-xs text-slate-500 mb-3">{kpi.description}</p>
                        )}
                        <div className="flex items-baseline justify-between">
                                  <div className="text-3xl font-display font-bold text-reallife-600">
                            {currentValue.toLocaleString()}
                          </div>
                          {selectedKPI === kpi.id && (
                                    <div className="w-2 h-2 bg-reallife-600 rounded-full"></div>
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

      {/* KPI Detail Modal */}
      {selectedKPI && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedKPI(null);
            }
          }}
        >
          <div className="relative top-10 mx-auto p-6 border w-full max-w-6xl shadow-2xl rounded-2xl bg-white mb-10">
            {loadingKPIDetails ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-reallife-500"></div>
              </div>
            ) : selectedKPIDetails ? (
              <>
                {/* Header */}
                <div className="flex items-start justify-between mb-6 pb-6 border-b border-slate-200">
                  <div className="flex-1">
                    <h2 className="text-3xl font-display font-bold text-reallife-500 mb-2">
                      {selectedKPIDetails.name}
                    </h2>
                    {selectedKPIDetails.description && (
                      <p className="text-slate-600 mb-3">{selectedKPIDetails.description}</p>
                    )}
                    {selectedKPIDetails.missionPoint && (
                      <p className="text-sm text-slate-500">
                        Mission Point: <span className="font-semibold text-reallife-600">{selectedKPIDetails.missionPoint.name}</span>
                      </p>
                    )}
                    {/* Badges */}
                    <div className="flex flex-wrap gap-2 mt-4">
                      {selectedKPIDetails.location && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          📍 {selectedKPIDetails.location}
                        </span>
                      )}
                      {selectedKPIDetails.category && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {selectedKPIDetails.category}
                        </span>
                      )}
                      {selectedKPIDetails.subcategory && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {selectedKPIDetails.subcategory}
                        </span>
                      )}
                      {selectedKPIDetails.trackingFrequency && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {
                            selectedKPIDetails.trackingFrequency === 'DAILY' ? '📅 Täglich' :
                            selectedKPIDetails.trackingFrequency === 'WEEKLY' ? '📅 Wöchentlich' :
                            selectedKPIDetails.trackingFrequency === 'MONTHLY' ? '📅 Monatlich' :
                            selectedKPIDetails.trackingFrequency === 'QUARTERLY' ? '📅 Quartalsweise' :
                            selectedKPIDetails.trackingFrequency === 'YEARLY' ? '📅 Jährlich' :
                            '📅 Manuell'
                          }
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedKPI(null)}
                    className="ml-4 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Statistics */}
                {selectedKPIDetails.records && Array.isArray(selectedKPIDetails.records) && selectedKPIDetails.records.length > 0 && (() => {
                  const values = selectedKPIDetails.records.map(r => r.value);
                  const currentValue = values[0];
                  const average = values.reduce((a, b) => a + b, 0) / values.length;
                  const min = Math.min(...values);
                  const max = Math.max(...values);
                  const trend = values.length > 1 ? ((currentValue - values[1]) / values[1] * 100) : 0;

                  return (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                      <div className="bg-gradient-to-br from-reallife-500 to-reallife-600 rounded-xl p-4 text-white">
                        <p className="text-xs font-medium opacity-90 mb-1">Aktueller Wert</p>
                        <p className="text-3xl font-display font-bold">{currentValue.toLocaleString()}</p>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                        <p className="text-xs font-medium text-slate-500 mb-1">Durchschnitt</p>
                        <p className="text-2xl font-display font-bold text-slate-900">{average.toFixed(1)}</p>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                        <p className="text-xs font-medium text-slate-500 mb-1">Minimum</p>
                        <p className="text-2xl font-display font-bold text-slate-900">{min.toLocaleString()}</p>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                        <p className="text-xs font-medium text-slate-500 mb-1">Maximum</p>
                        <p className="text-2xl font-display font-bold text-slate-900">{max.toLocaleString()}</p>
                      </div>
                      <div className={`rounded-xl p-4 border ${trend >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                        <p className="text-xs font-medium mb-1 text-slate-500">Trend</p>
                        <p className={`text-2xl font-display font-bold ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {trend >= 0 ? '+' : ''}{trend.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  );
                })()}

                {/* Chart */}
                <div className="mb-6 bg-slate-50 rounded-xl p-6 border border-slate-200">
                  <h3 className="text-lg font-display font-semibold text-slate-900 mb-4">Zeitverlauf</h3>
                  {kpiTrends.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
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
                          stroke="#000000" 
                          strokeWidth={2}
                          dot={{ fill: '#000000', r: 3 }}
                          activeDot={{ r: 5 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center py-12 text-slate-400">
                      <p>Keine Trend-Daten verfügbar</p>
                      <p className="text-sm mt-2">Es wurden noch keine historischen Daten für dieses KPI gesammelt.</p>
                    </div>
                  )}
                </div>

                {/* Records Table */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <div className="flex items-center justify-between p-4 bg-slate-50 border-b border-slate-200">
                    <h3 className="text-lg font-display font-semibold text-slate-900">
                      Historische Daten ({selectedKPIDetails.records?.length || 0} Einträge)
                    </h3>
                    <button
                      onClick={() => window.location.href = '/kpis'}
                      className="px-4 py-2 bg-accent-500 text-white rounded-md hover:bg-accent-600 transition-colors text-sm font-medium"
                    >
                      + Neuer Eintrag
                    </button>
                  </div>
                  {selectedKPIDetails.records && Array.isArray(selectedKPIDetails.records) && selectedKPIDetails.records.length > 0 ? (
                    <div className="max-h-96 overflow-y-auto">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-slate-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Datum</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Wert</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Notizen</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-slate-200">
                            {(selectedKPIDetails.records || []).map((record) => (
                              <tr key={record.id} className="hover:bg-slate-50">
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-900">
                                  {new Date(record.date).toLocaleDateString('de-DE', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-right text-reallife-600">
                                  {record.value.toLocaleString()}
                                </td>
                                <td className="px-4 py-3 text-sm text-slate-600">
                                  {record.notes || <span className="text-slate-400">-</span>}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 text-center text-slate-400">
                      <p className="text-lg mb-2">Noch keine Einträge vorhanden</p>
                      <p className="text-sm mb-4">Dieses KPI hat noch keine historischen Daten.</p>
                      <button
                        onClick={() => window.location.href = '/kpis'}
                        className="px-4 py-2 bg-accent-500 text-white rounded-md hover:bg-accent-600 transition-colors text-sm font-medium"
                      >
                        Ersten Eintrag hinzufügen
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-20 text-slate-500">
                <p>KPI-Details konnten nicht geladen werden.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
