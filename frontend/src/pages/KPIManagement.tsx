import { useEffect, useState } from 'react';
import { api } from '../api/client';

interface MissionPoint {
  id: string;
  name: string;
  description: string;
  order: number;
  kpis: KPI[];
}

interface KPI {
  id: string;
  name: string;
  description: string;
  missionPointId: string;
  records: KPIRecord[];
}

interface KPIRecord {
  id: string;
  value: number;
  date: string;
  notes?: string;
}

export default function KPIManagement() {
  const [missionPoints, setMissionPoints] = useState<MissionPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [showKPIForm, setShowKPIForm] = useState(false);
  const [showRecordForm, setShowRecordForm] = useState(false);
  const [selectedMissionPoint, setSelectedMissionPoint] = useState<string>('');
  const [selectedKPI, setSelectedKPI] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    value: '',
    notes: ''
  });

  useEffect(() => {
    fetchMissionPoints();
  }, []);

  const fetchMissionPoints = async () => {
    try {
      const response = await api.get('/api/mission-points');
      setMissionPoints(response.data);
    } catch (error) {
      console.error('Error fetching mission points:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKPI = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/api/kpis', {
        name: formData.name,
        description: formData.description,
        missionPointId: selectedMissionPoint
      });
      setFormData({ name: '', description: '', value: '', notes: '' });
      setShowKPIForm(false);
      fetchMissionPoints();
    } catch (error) {
      console.error('Error creating KPI:', error);
      alert('KPI konnte nicht erstellt werden');
    }
  };

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post(`/api/kpis/${selectedKPI}/records`, {
        value: parseFloat(formData.value),
        notes: formData.notes
      });
      setFormData({ name: '', description: '', value: '', notes: '' });
      setShowRecordForm(false);
      fetchMissionPoints();
    } catch (error) {
      console.error('Error adding record:', error);
      alert('Eintrag konnte nicht hinzugefügt werden');
    }
  };

  if (loading) {
    return <div className="text-center py-12">Laden...</div>;
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">KPI Verwaltung</h1>
          <p className="mt-2 text-sm text-gray-600">
            Mission Points und ihre KPIs verwalten
          </p>
        </div>
        <button
          onClick={() => setShowKPIForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          KPI erstellen
        </button>
      </div>

      {/* Create KPI Modal */}
      {showKPIForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold mb-4">Neuen KPI erstellen</h3>
            <form onSubmit={handleCreateKPI}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mission Point
                </label>
                <select
                  value={selectedMissionPoint}
                  onChange={(e) => setSelectedMissionPoint(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                >
                  <option value="">Mission Point auswählen</option>
                  {missionPoints.map((mp) => (
                    <option key={mp.id} value={mp.id}>
                      {mp.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  KPI Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Beschreibung
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowKPIForm(false);
                    setFormData({ name: '', description: '', value: '', notes: '' });
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Erstellen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Record Modal */}
      {showRecordForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold mb-4">KPI Eintrag hinzufügen</h3>
            <form onSubmit={handleAddRecord}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Wert
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notizen
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowRecordForm(false);
                    setFormData({ name: '', description: '', value: '', notes: '' });
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Add Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mission Points List */}
      <div className="space-y-6">
        {missionPoints.map((missionPoint) => (
          <div key={missionPoint.id} className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {missionPoint.name}
            </h2>
            {missionPoint.description && (
              <p className="text-sm text-gray-600 mb-4">{missionPoint.description}</p>
            )}

            <div className="space-y-4">
              {missionPoint.kpis.map((kpi) => {
                const latestRecord = kpi.records[0];
                return (
                  <div
                    key={kpi.id}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {kpi.name}
                        </h3>
                        {kpi.description && (
                          <p className="text-sm text-gray-600 mt-1">
                            {kpi.description}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          setSelectedKPI(kpi.id);
                          setShowRecordForm(true);
                        }}
                        className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                      >
                        Eintrag hinzufügen
                      </button>
                    </div>
                    {latestRecord && (
                      <div className="mt-2">
                        <div className="text-2xl font-bold text-blue-600">
                          {latestRecord.value.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Zuletzt aktualisiert: {new Date(latestRecord.date).toLocaleDateString('de-DE')}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              {missionPoint.kpis.length === 0 && (
                <p className="text-sm text-gray-500">Noch keine KPIs. Erstellen Sie einen, um zu beginnen.</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
