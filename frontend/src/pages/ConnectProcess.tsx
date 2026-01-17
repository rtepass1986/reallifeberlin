import { useEffect, useState } from 'react';
import { api } from '../api/client';

interface Contact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  district?: string;
  area?: string;
  source: string;
  classification: string;
  registeredForSmallGroup: boolean;
  createdAt: string;
  workflowProgress?: {
    id: string;
    currentWeek: string;
    tasks: Task[];
  };
}

interface Task {
  id: string;
  description: string;
  dueDate: string;
  status: string;
  taskType: string;
  assignedTo: {
    name: string;
  };
}

export default function ConnectProcess() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showContactForm, setShowContactForm] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    district: '',
    area: '',
    notes: '',
    source: 'SUNDAY_SERVICE',
    classification: 'NAME_CHRISTIAN',
    registeredForSmallGroup: false
  });

  useEffect(() => {
    fetchContacts();
    fetchTasks();
  }, []);

  const fetchContacts = async () => {
    try {
      const response = await api.get('/api/contacts');
      setContacts(response.data);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async () => {
    try {
      const response = await api.get('/api/tasks?status=PENDING');
      setTasks(response.data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const handleCreateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Combine first name and last name into name field
      const name = `${formData.firstName} ${formData.lastName}`.trim() || formData.firstName || formData.lastName;
      await api.post('/api/contacts', {
        name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        postalCode: formData.postalCode,
        district: formData.district,
        area: formData.area,
        notes: formData.notes,
        source: formData.source,
        classification: formData.classification,
        registeredForSmallGroup: formData.registeredForSmallGroup
      });
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        postalCode: '',
        district: '',
        area: '',
        notes: '',
        source: 'SUNDAY_SERVICE',
        classification: 'NAME_CHRISTIAN',
        registeredForSmallGroup: false
      });
      setShowContactForm(false);
      fetchContacts();
      fetchTasks();
    } catch (error) {
      console.error('Error creating contact:', error);
      alert('Kontakt konnte nicht erstellt werden');
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, status: string) => {
    try {
      await api.patch(`/api/tasks/${taskId}/status`, { status });
      fetchTasks();
      fetchContacts();
    } catch (error) {
      console.error('Error updating task:', error);
      alert('Aufgabe konnte nicht aktualisiert werden');
    }
  };

  if (loading) {
    return <div className="text-center py-12">Laden...</div>;
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Connect Prozess</h1>
          <p className="mt-2 text-sm text-gray-600">
            Kontakte und Follow-up Workflows verwalten
          </p>
        </div>
        <button
          onClick={() => setShowContactForm(true)}
                  className="bg-accent-500 text-white px-6 py-2.5 rounded-md hover:bg-accent-600 transition-colors duration-200 font-medium shadow-sm"
        >
          Neuer Kontakt
        </button>
      </div>

      {/* Create Contact Modal */}
      {showContactForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">Neuer Kontakt</h3>
            <form onSubmit={handleCreateContact}>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vorname *
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nachname *
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    required
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  E-Mail
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="beispiel@email.com"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefon
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="+49 30 12345678"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adresse
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="Straße und Hausnummer"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stadt
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="Berlin"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    PLZ
                  </label>
                  <input
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="10115"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bezirk
                  </label>
                  <input
                    type="text"
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gebiet
                  </label>
                  <input
                    type="text"
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quelle
                </label>
                <select
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="SUNDAY_SERVICE">Gottesdienst</option>
                  <option value="COMMUNITY_EVENT">Gemeindeveranstaltung</option>
                  <option value="CAFE">Café</option>
                  <option value="WEBSITE">Website</option>
                  <option value="INSTAGRAM">Instagram</option>
                </select>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Klassifizierung
                </label>
                <select
                  value={formData.classification}
                  onChange={(e) => setFormData({ ...formData, classification: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="VIP_CHRISTIAN">VIP Christ</option>
                  <option value="NAME_CHRISTIAN">Name Christ</option>
                </select>
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
                  placeholder="Zusätzliche Informationen..."
                />
              </div>
              
              <div className="mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.registeredForSmallGroup}
                    onChange={(e) => setFormData({ ...formData, registeredForSmallGroup: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Bereits für Kleingruppe registriert</span>
                </label>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowContactForm(false);
                    setFormData({
                      firstName: '',
                      lastName: '',
                      email: '',
                      phone: '',
                      address: '',
                      city: '',
                      postalCode: '',
                      district: '',
                      area: '',
                      notes: '',
                      source: 'SUNDAY_SERVICE',
                      classification: 'NAME_CHRISTIAN',
                      registeredForSmallGroup: false
                    });
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-accent-500 text-white rounded-md hover:bg-accent-600 transition-colors duration-200 font-medium shadow-sm"
                >
                  Kontakt erstellen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tasks Section */}
      <div className="mb-8 bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Meine Aufgaben</h2>
        {tasks.length === 0 ? (
          <p className="text-sm text-gray-500">Keine ausstehenden Aufgaben</p>
        ) : (
          <div className="space-y-4">
            {tasks.map((task) => (
              <div key={task.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{task.description}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Fällig: {new Date(task.dueDate).toLocaleDateString('de-DE')}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Typ: {task.taskType} | Status: {task.status}
                    </p>
                  </div>
                  <div className="ml-4">
                    <select
                      value={task.status}
                      onChange={(e) => handleUpdateTaskStatus(task.id, e.target.value)}
                      className="text-sm border border-gray-300 rounded-md px-3 py-1"
                    >
                      <option value="PENDING">Ausstehend</option>
                      <option value="COMPLETED">Abgeschlossen</option>
                      <option value="ALREADY_IN_SMALL_GROUP">Bereits in Kleingruppe</option>
                      <option value="CONTACT_ENDED">Kontakt beendet</option>
                      <option value="RESCHEDULED">Verschieben</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Contacts Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Alle Kontakte</h2>
        {contacts.length === 0 ? (
          <p className="text-sm text-gray-500">Noch keine Kontakte</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kontakt
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quelle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Klassifizierung
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Workflow
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Erstellt
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {contacts.map((contact) => (
                  <tr key={contact.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {contact.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {contact.email || contact.phone || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {contact.source.replace('_', ' ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {contact.classification.replace('_', ' ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {contact.workflowProgress
                        ? `Woche ${contact.workflowProgress.currentWeek.replace('WEEK_', '')}`
                        : contact.registeredForSmallGroup
                        ? 'In Kleingruppe'
                        : 'Kein Workflow'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(contact.createdAt).toLocaleDateString('de-DE')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
