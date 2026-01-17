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
  trackingFrequency?: string;
  location?: string;
  category?: string;
  subcategory?: string;
  metadata?: any;
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
  const [showEditKPIForm, setShowEditKPIForm] = useState(false);
  const [showRecordForm, setShowRecordForm] = useState(false);
  const [selectedMissionPoint, setSelectedMissionPoint] = useState<string>('');
  const [selectedKPI, setSelectedKPI] = useState<string>('');
  const [editingKPI, setEditingKPI] = useState<KPI | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    value: '',
    notes: '',
    trackingFrequency: 'WEEKLY',
    location: '',
    category: '',
    subcategory: ''
  });

  useEffect(() => {
    fetchMissionPoints();
  }, []);

  const fetchMissionPoints = async () => {
    try {
      const response = await api.get('/api/mission-points');
      console.log('Mission Points loaded:', response.data);
      setMissionPoints(response.data || []);
    } catch (error) {
      console.error('Error fetching mission points:', error);
      setMissionPoints([]);
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
        missionPointId: selectedMissionPoint,
        trackingFrequency: formData.trackingFrequency,
        location: formData.location || null,
        category: formData.category || null,
        subcategory: formData.subcategory || null
      });
      setFormData({ name: '', description: '', value: '', notes: '', trackingFrequency: 'WEEKLY', location: '', category: '', subcategory: '' });
      setSelectedMissionPoint('');
      setShowKPIForm(false);
      fetchMissionPoints();
    } catch (error) {
      console.error('Error creating KPI:', error);
      alert('KPI konnte nicht erstellt werden');
    }
  };

  const handleEditKPI = (kpi: KPI) => {
    setEditingKPI(kpi);
    setFormData({
      name: kpi.name,
      description: kpi.description || '',
      value: '',
      notes: '',
      trackingFrequency: kpi.trackingFrequency || 'WEEKLY',
      location: kpi.location || '',
      category: kpi.category || '',
      subcategory: kpi.subcategory || ''
    });
    setSelectedMissionPoint(kpi.missionPointId);
    setShowEditKPIForm(true);
  };

  const handleUpdateKPI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingKPI) return;
    try {
      await api.put(`/api/kpis/${editingKPI.id}`, {
        name: formData.name,
        description: formData.description,
        missionPointId: selectedMissionPoint,
        trackingFrequency: formData.trackingFrequency,
        location: formData.location || null,
        category: formData.category || null,
        subcategory: formData.subcategory || null
      });
      setFormData({ name: '', description: '', value: '', notes: '', trackingFrequency: 'WEEKLY', location: '', category: '', subcategory: '' });
      setSelectedMissionPoint('');
      setEditingKPI(null);
      setShowEditKPIForm(false);
      fetchMissionPoints();
    } catch (error) {
      console.error('Error updating KPI:', error);
      alert('KPI konnte nicht aktualisiert werden');
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
                  className="bg-accent-500 text-white px-6 py-2.5 rounded-md hover:bg-accent-600 transition-colors duration-200 font-medium shadow-sm"
        >
          KPI erstellen
        </button>
      </div>

      {/* Create KPI Modal */}
      {showKPIForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" onClick={(e) => e.target === e.currentTarget && setShowKPIForm(false)}>
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold mb-4">Neuen KPI erstellen</h3>
            <form onSubmit={handleCreateKPI}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mission Point *
                </label>
                <select
                  value={selectedMissionPoint}
                  onChange={(e) => {
                    console.log('Mission Point selected:', e.target.value);
                    setSelectedMissionPoint(e.target.value);
                  }}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 bg-white text-gray-900 cursor-pointer appearance-none"
                  required
                >
                  <option value="">Mission Point auswählen</option>
                  {missionPoints.length === 0 ? (
                    <option value="" disabled>Lade Mission Points...</option>
                  ) : (
                    missionPoints.map((mp) => (
                      <option key={mp.id} value={mp.id}>
                        {mp.name}
                      </option>
                    ))
                  )}
                </select>
                {missionPoints.length === 0 && !loading && (
                  <p className="mt-1 text-xs text-red-500">Keine Mission Points verfügbar. Bitte erstellen Sie zuerst einen Mission Point.</p>
                )}
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
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tracking-Frequenz
                </label>
                <select
                  value={formData.trackingFrequency}
                  onChange={(e) => setFormData({ ...formData, trackingFrequency: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                >
                  <option value="DAILY">Täglich</option>
                  <option value="WEEKLY">Wöchentlich</option>
                  <option value="MONTHLY">Monatlich</option>
                  <option value="QUARTERLY">Quartalsweise</option>
                  <option value="YEARLY">Jährlich</option>
                  <option value="MANUAL">Manuell</option>
                </select>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowKPIForm(false);
                    setFormData({ name: '', description: '', value: '', notes: '', trackingFrequency: 'WEEKLY', location: '', category: '', subcategory: '' });
                    setSelectedMissionPoint('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-accent-500 text-white rounded-md hover:bg-accent-600 transition-colors duration-200 font-medium shadow-sm"
                >
                  Erstellen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit KPI Modal */}
      {showEditKPIForm && editingKPI && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" onClick={(e) => e.target === e.currentTarget && setShowKPIForm(false)}>
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white z-50">
            <h3 className="text-lg font-bold mb-4">KPI bearbeiten</h3>
            <form onSubmit={handleUpdateKPI}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mission Point *
                </label>
                <select
                  value={selectedMissionPoint}
                  onChange={(e) => {
                    console.log('Mission Point selected:', e.target.value);
                    setSelectedMissionPoint(e.target.value);
                  }}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 bg-white text-gray-900 cursor-pointer appearance-none"
                  required
                >
                  <option value="">Mission Point auswählen</option>
                  {missionPoints.length === 0 ? (
                    <option value="" disabled>Lade Mission Points...</option>
                  ) : (
                    missionPoints.map((mp) => (
                      <option key={mp.id} value={mp.id}>
                        {mp.name}
                      </option>
                    ))
                  )}
                </select>
                {missionPoints.length === 0 && !loading && (
                  <p className="mt-1 text-xs text-red-500">Keine Mission Points verfügbar. Bitte erstellen Sie zuerst einen Mission Point.</p>
                )}
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
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tracking-Frequenz
                </label>
                <select
                  value={formData.trackingFrequency}
                  onChange={(e) => setFormData({ ...formData, trackingFrequency: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 bg-white cursor-pointer"
                  required
                >
                  <option value="DAILY">Täglich</option>
                  <option value="WEEKLY">Wöchentlich</option>
                  <option value="MONTHLY">Monatlich</option>
                  <option value="QUARTERLY">Quartalsweise</option>
                  <option value="YEARLY">Jährlich</option>
                  <option value="MANUAL">Manuell</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Standort (für Friends & Food)
                </label>
                <select
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 bg-white cursor-pointer"
                >
                  <option value="">Kein Standort</option>
                  <option value="Moabit/Schöneberg">Moabit/Schöneberg</option>
                  <option value="Wilmersdorf">Wilmersdorf</option>
                  <option value="Mitte">Mitte</option>
                  <option value="Lichtenberg">Lichtenberg</option>
                  <option value="Tempelhof">Tempelhof</option>
                  <option value="Rathenow">Rathenow</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kategorie
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 bg-white cursor-pointer"
                >
                  <option value="">Keine Kategorie</option>
                  <option value="ATTENDANCE">Anwesenheit</option>
                  <option value="OUTREACH">Outreach</option>
                  <option value="DECISIONS">Entscheidungen</option>
                  <option value="CONNECTION">Verbindung</option>
                  <option value="KIDS">Kids</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unterkategorie
                </label>
                <input
                  type="text"
                  value={formData.subcategory}
                  onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                  placeholder="z.B. Gesamt, Saal, Kids Church, etc."
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditKPIForm(false);
                    setEditingKPI(null);
                    setFormData({ name: '', description: '', value: '', notes: '', trackingFrequency: 'WEEKLY', location: '', category: '', subcategory: '' });
                    setSelectedMissionPoint('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-accent-500 text-white rounded-md hover:bg-accent-600 transition-colors duration-200 font-medium shadow-sm"
                >
                  Speichern
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Record Modal */}
      {showRecordForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" onClick={(e) => e.target === e.currentTarget && setShowKPIForm(false)}>
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white z-50">
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
                  className="px-6 py-2.5 bg-accent-500 text-white rounded-md hover:bg-accent-600 transition-colors duration-200 font-medium shadow-sm"
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
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900">
                          {kpi.name}
                        </h3>
                        {kpi.description && (
                          <p className="text-sm text-gray-600 mt-1">
                            {kpi.description}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-2 mt-2">
                          {kpi.location && (
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                              📍 {kpi.location}
                            </span>
                          )}
                          {kpi.category && (
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-800">
                              {kpi.category === 'ATTENDANCE' ? '👥 Anwesenheit' :
                               kpi.category === 'OUTREACH' ? '📢 Outreach' :
                               kpi.category === 'DECISIONS' ? '✅ Entscheidungen' :
                               kpi.category === 'CONNECTION' ? '🔗 Verbindung' :
                               kpi.category === 'KIDS' ? '👶 Kids' :
                               kpi.category}
                            </span>
                          )}
                          {kpi.subcategory && (
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                              {kpi.subcategory}
                            </span>
                          )}
                          {kpi.trackingFrequency && (
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800">
                              {
                                kpi.trackingFrequency === 'DAILY' ? '📅 Täglich' :
                                kpi.trackingFrequency === 'WEEKLY' ? '📅 Wöchentlich' :
                                kpi.trackingFrequency === 'MONTHLY' ? '📅 Monatlich' :
                                kpi.trackingFrequency === 'QUARTERLY' ? '📅 Quartalsweise' :
                                kpi.trackingFrequency === 'YEARLY' ? '📅 Jährlich' :
                                '📅 Manuell'
                              }
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditKPI(kpi)}
                          className="text-sm bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700"
                        >
                          Bearbeiten
                        </button>
                        <button
                          onClick={() => {
                            setSelectedKPI(kpi.id);
                            setShowRecordForm(true);
                          }}
                          className="text-sm bg-accent-500 text-white px-4 py-1.5 rounded hover:bg-accent-600 transition-colors duration-200 font-medium"
                        >
                          Eintrag hinzufügen
                        </button>
                      </div>
                    </div>
                    {latestRecord && (
                      <div className="mt-2">
                        <div className="text-2xl font-bold text-reallife-500">
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
