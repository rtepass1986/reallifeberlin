# Reallife Church App

Eine vollständige Full-Stack-Anwendung für die Verwaltung von KPIs und den Connect-Prozess der Reallife Kirche.

## 📋 Inhaltsverzeichnis

- [Übersicht](#übersicht)
- [Features](#features)
- [Was ist implementiert](#was-ist-implementiert)
- [Was noch zu tun ist](#was-noch-zu-tun-ist)
- [Technologie-Stack](#technologie-stack)
- [Setup](#setup)
- [Projektstruktur](#projektstruktur)
- [API-Dokumentation](#api-dokumentation)

## 🎯 Übersicht

Diese Anwendung besteht aus zwei Hauptkomponenten:

1. **KPI Dashboard** - Verwaltung und Visualisierung von KPIs für Mission Points
2. **Connect Prozess** - Automatisierter 4-Wochen-Follow-up-Workflow für neue Kontakte

## ✨ Features

### KPI Management
- ✅ Mission Points verwalten (Wir gehen, Wir bringen, Wir begleiten)
- ✅ KPIs unter jedem Mission Point erstellen
- ✅ KPI-Werte erfassen und verfolgen
- ✅ Dashboard mit Visualisierungen
- ✅ Trend-Analysen für KPIs

### Connect Prozess
- ✅ Kontaktformular mit allen erforderlichen Feldern
- ✅ Automatischer 4-Wochen-Workflow
- ✅ Task-Management für Connectors
- ✅ Status-Tracking (Completed, Already in Small Group, Contact Ended, Reschedule)
- ✅ Benachrichtigungssystem (Struktur vorhanden)
- ✅ WhatsApp-Integration für Kleingruppenleiter

## ✅ Was ist implementiert

### Backend

#### Datenbank & Schema
- ✅ PostgreSQL-Datenbank mit Prisma ORM
- ✅ Vollständiges Datenbankschema:
  - User (mit Rollen: ADMIN, CONNECTOR, SMALL_GROUP_LEADER, VIEWER)
  - MissionPoint
  - KPI & KPIRecord
  - Contact (mit Quellen und Klassifizierung)
  - WorkflowProgress
  - Task (mit Status-Tracking)
  - SmallGroupLeader

#### API Routes
- ✅ `/api/auth` - Authentifizierung (lokale Login + Planning Center OAuth)
- ✅ `/api/mission-points` - CRUD für Mission Points
- ✅ `/api/kpis` - CRUD für KPIs und KPI Records
- ✅ `/api/contacts` - CRUD für Kontakte
- ✅ `/api/tasks` - Task-Verwaltung und Status-Updates
- ✅ `/api/workflows` - Workflow-Verwaltung
- ✅ `/api/dashboard` - Dashboard-Daten und Statistiken

#### Services
- ✅ `workflowService.ts` - 4-Wochen-Workflow-Erstellung
  - Week 1: Montag-Nachricht + Donnerstag-Erinnerung
  - Weeks 2-4: Donnerstag-Erinnerungen
  - Week 4: Status-Check
- ✅ `notificationService.ts` - Benachrichtigungssystem
  - Peoples App API Integration (Struktur)
  - WhatsApp API Integration (Struktur)
  - Fallback-Logging
- ✅ `cronService.ts` - Automatisierte Cron Jobs
  - Tägliche Task-Checks (8:00 Uhr)
  - Wöchentliche Workflow-Fortschritte (Montag 9:00 Uhr)
- ✅ `planningCenterAuth.ts` - Planning Center OAuth
- ✅ `planningCenterService.ts` - Planning Center API Integration

#### Middleware
- ✅ JWT-Authentifizierung
- ✅ Rollenbasierte Autorisierung

### Frontend

#### Seiten
- ✅ **Dashboard** (`/`) - Übersicht mit Statistiken und Mission Points
- ✅ **KPI Verwaltung** (`/kpis`) - KPIs erstellen und verwalten
- ✅ **Connect Prozess** (`/connect`) - Kontakte und Tasks verwalten
- ✅ **Login** (`/login`) - Anmeldung (lokal + Planning Center)

#### Komponenten
- ✅ Layout mit Navigation
- ✅ Responsive Design mit Tailwind CSS
- ✅ Deutsche Benutzeroberfläche

#### State Management
- ✅ Zustand Store für Authentifizierung
- ✅ API Client mit Axios

### Docker & Deployment
- ✅ Docker Compose für PostgreSQL
- ✅ Automatische Datenbankinitialisierung
- ✅ Environment-Variablen-Konfiguration

## 🚧 Was noch zu tun ist

### Hochpriorität (Kernfunktionalität)

#### 1. Workflow Early Termination ⚠️
**Status**: Nicht implementiert  
**Priorität**: Hoch

Wenn ein Connector einen Task mit folgenden Status markiert, sollte der Workflow automatisch beendet werden:
- `ALREADY_IN_SMALL_GROUP` → Workflow abschließen, restliche Tasks stornieren
- `CONTACT_ENDED` → Workflow abschließen, restliche Tasks stornieren

**Zu implementieren in**: `backend/src/routes/task.ts` (nach Status-Update)

```typescript
// Nach Status-Update prüfen:
if (status === 'ALREADY_IN_SMALL_GROUP' || status === 'CONTACT_ENDED') {
  // 1. Workflow als completed markieren
  // 2. Alle verbleibenden PENDING Tasks stornieren
  // 3. Workflow beenden
}
```

#### 2. API-Credentials konfigurieren ⚠️
**Status**: Struktur vorhanden, Credentials fehlen  
**Priorität**: Hoch

Benötigt für funktionierende Benachrichtigungen:

```env
# Peoples App API
PEOPLES_APP_API_KEY=your_api_key
PEOPLES_APP_API_URL=https://api.peoplesapp.com

# WhatsApp API
WHATSAPP_API_KEY=your_api_key
WHATSAPP_API_URL=https://api.whatsapp.com
```

**Datei**: `backend/.env`

#### 3. Contact-to-Small-Group Assignment ⚠️
**Status**: Nicht implementiert  
**Priorität**: Hoch

Kontakte sollten spezifischen Kleingruppen zugeordnet werden können:
- `smallGroupId` Feld zum Contact-Model hinzufügen
- Kleingruppenleiter-Zuordnung verbessern
- Aktuell wird nur der erste verfügbare Leiter gefunden

**Zu implementieren in**: 
- `backend/prisma/schema.prisma` (Contact Model erweitern)
- `backend/src/services/notificationService.ts` (Zuordnungslogik)

### Mittelpriorität (Erweiterte Features)

#### 4. Rescheduling-Funktionalität ⚠️
**Status**: Status vorhanden, Logik fehlt  
**Priorität**: Mittel

Wenn `RESCHEDULED` gewählt wird:
- Connector kann zukünftiges Datum setzen (z.B. 3 Monate später)
- Neuer Workflow wird automatisch für dieses Datum erstellt
- Aktueller Workflow wird pausiert

**Zu implementieren in**: `backend/src/routes/task.ts`

#### 5. Enhanced Dashboard Analytics ⚠️
**Status**: Basis-Statistiken vorhanden  
**Priorität**: Mittel

Fehlende Metriken:
- Conversion Rate (Kontakte → Kleingruppenmitglieder)
- Connector-Performance (Task-Completion-Rate pro Connector)
- Workflow-Status-Breakdown (nach Woche)
- Kontaktquellen-Effektivität
- Durchschnittliche Workflow-Dauer

**Zu implementieren in**: `backend/src/routes/dashboard.ts`

#### 6. Communication Method Tracking ⚠️
**Status**: Nicht implementiert  
**Priorität**: Niedrig

Tracking wie Connector Kontakt aufgenommen hat:
- WhatsApp
- Telefonanruf
- Persönlich
- E-Mail

**Zu implementieren in**: 
- `backend/prisma/schema.prisma` (Task Model erweitern)
- `frontend/src/pages/ConnectProcess.tsx` (UI hinzufügen)

### Niedrigpriorität (Nice-to-Have)

#### 7. Erweiterte Reporting-Features
- Export-Funktionen (CSV, PDF)
- Zeitraum-Filter für Analytics
- Vergleichsansichten (Monat zu Monat)

#### 8. Benachrichtigungs-Präferenzen
- Connector kann Benachrichtigungsmethode wählen
- E-Mail-Benachrichtigungen als Alternative
- Benachrichtigungszeitpunkt konfigurierbar

#### 9. Bulk-Operationen
- Mehrere Kontakte gleichzeitig erstellen
- Bulk-Status-Updates
- Massen-Zuweisung zu Connectors

#### 10. Audit-Log
- Änderungshistorie für Kontakte
- Task-Änderungsprotokoll
- Benutzeraktivitäts-Log

## 🛠 Technologie-Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Sprache**: TypeScript
- **Datenbank**: PostgreSQL
- **ORM**: Prisma
- **Authentifizierung**: JWT, Planning Center OAuth
- **Cron Jobs**: node-cron
- **HTTP Client**: Axios

### Frontend
- **Framework**: React
- **Sprache**: TypeScript
- **Routing**: React Router
- **State Management**: Zustand
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **Charts**: Recharts
- **HTTP Client**: Axios

### DevOps
- **Containerisierung**: Docker & Docker Compose
- **Datenbank**: PostgreSQL (Docker)

## 🚀 Setup

### Voraussetzungen
- Node.js 18+ und npm
- Docker & Docker Compose
- Git

### Installation

1. **Repository klonen**
```bash
git clone https://github.com/rtepass1986/reallifeberlin.git
cd reallifeberlin
```

2. **Dependencies installieren**
```bash
npm install
```

3. **Docker-Datenbank starten**
```bash
docker-compose up -d
```

4. **Environment-Variablen konfigurieren**

Erstelle `backend/.env`:
```env
# Datenbank
DATABASE_URL="postgresql://reallife_user:reallife_password@localhost:5432/reallife_db?schema=public"

# JWT
JWT_SECRET="your-secret-key-here"

# Planning Center (optional)
PLANNING_CENTER_CLIENT_ID=your_client_id
PLANNING_CENTER_CLIENT_SECRET=your_client_secret
PLANNING_CENTER_REDIRECT_URI=http://localhost:5173/auth/callback

# Peoples App API (optional, für Benachrichtigungen)
PEOPLES_APP_API_KEY=your_api_key
PEOPLES_APP_API_URL=https://api.peoplesapp.com

# WhatsApp API (optional, für Benachrichtigungen)
WHATSAPP_API_KEY=your_api_key
WHATSAPP_API_URL=https://api.whatsapp.com
```

Erstelle `frontend/.env`:
```env
VITE_API_URL=http://localhost:3001
```

5. **Datenbank migrieren**
```bash
cd backend
npx prisma generate
npx prisma migrate dev
```

6. **Datenbank seeden (optional)**
```bash
npm run seed
```

7. **Development-Server starten**
```bash
# Vom Root-Verzeichnis
npm run dev
```

Die Anwendung läuft dann auf:
- Frontend: http://localhost:5173
- Backend: http://localhost:3001

## 📁 Projektstruktur

```
Reallife_App/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma          # Datenbankschema
│   ├── src/
│   │   ├── middleware/
│   │   │   └── auth.ts            # JWT-Authentifizierung
│   │   ├── routes/
│   │   │   ├── auth.ts            # Authentifizierungs-Routes
│   │   │   ├── contact.ts         # Kontakt-Routes
│   │   │   ├── dashboard.ts       # Dashboard-Routes
│   │   │   ├── kpi.ts             # KPI-Routes
│   │   │   ├── missionPoint.ts    # Mission Point-Routes
│   │   │   ├── task.ts            # Task-Routes
│   │   │   └── workflow.ts        # Workflow-Routes
│   │   ├── services/
│   │   │   ├── cronService.ts     # Cron Jobs
│   │   │   ├── notificationService.ts  # Benachrichtigungen
│   │   │   ├── planningCenterAuth.ts   # Planning Center OAuth
│   │   │   ├── planningCenterService.ts # Planning Center API
│   │   │   └── workflowService.ts # Workflow-Logik
│   │   ├── scripts/
│   │   │   ├── seed.ts            # Datenbank-Seeding
│   │   │   └── createTestUser.ts  # Test-User erstellen
│   │   └── server.ts               # Express-Server
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── client.ts          # Axios-Client
│   │   ├── components/
│   │   │   └── Layout.tsx         # Haupt-Layout
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx      # Dashboard-Seite
│   │   │   ├── KPIManagement.tsx  # KPI-Verwaltung
│   │   │   ├── ConnectProcess.tsx # Connect-Prozess
│   │   │   ├── Login.tsx          # Login-Seite
│   │   │   └── PlanningCenterCallback.tsx # OAuth-Callback
│   │   ├── store/
│   │   │   └── authStore.ts       # Zustand Store
│   │   ├── App.tsx                # Haupt-App-Komponente
│   │   └── main.tsx               # Entry Point
│   └── package.json
├── docker-compose.yml              # Docker-Konfiguration
├── docker-init.sql                 # Datenbank-Initialisierung
└── README.md                       # Diese Datei
```

## 📚 API-Dokumentation

### Authentifizierung
- `POST /api/auth/register` - Benutzer registrieren
- `POST /api/auth/login` - Lokale Anmeldung
- `GET /api/auth/planning-center/authorize` - Planning Center OAuth starten
- `POST /api/auth/planning-center/callback` - OAuth-Callback
- `GET /api/auth/me` - Aktuellen Benutzer abrufen

### Mission Points
- `GET /api/mission-points` - Alle Mission Points abrufen
- `POST /api/mission-points` - Mission Point erstellen
- `PUT /api/mission-points/:id` - Mission Point aktualisieren
- `DELETE /api/mission-points/:id` - Mission Point löschen

### KPIs
- `GET /api/kpis` - Alle KPIs abrufen
- `POST /api/kpis` - KPI erstellen
- `PUT /api/kpis/:id` - KPI aktualisieren
- `DELETE /api/kpis/:id` - KPI löschen
- `POST /api/kpis/:id/records` - KPI-Record hinzufügen

### Kontakte
- `GET /api/contacts` - Alle Kontakte abrufen
- `POST /api/contacts` - Kontakt erstellen (startet automatisch Workflow)
- `GET /api/contacts/:id` - Einzelnen Kontakt abrufen
- `PUT /api/contacts/:id` - Kontakt aktualisieren

### Tasks
- `GET /api/tasks` - Alle Tasks abrufen (filterbar nach Status)
- `GET /api/tasks/:id` - Einzelnen Task abrufen
- `PATCH /api/tasks/:id/status` - Task-Status aktualisieren

### Workflows
- `GET /api/workflows` - Alle Workflows abrufen
- `GET /api/workflows/:id` - Einzelnen Workflow abrufen

### Dashboard
- `GET /api/dashboard` - Dashboard-Daten abrufen
- `GET /api/dashboard/kpi-trends/:kpiId` - KPI-Trends abrufen

## 🔐 Authentifizierung

Aktuell ist die Authentifizierung **deaktiviert** für schnelleres Development. Um sie zu aktivieren:

1. Entferne Kommentare in `frontend/src/App.tsx` (PrivateRoute)
2. Entferne Kommentare in allen Backend-Routes (`authenticate` Middleware)
3. Konfiguriere JWT_SECRET in `backend/.env`

## 📝 Notizen

- Die Anwendung ist vollständig auf **Deutsch** lokalisiert
- Alle Datenbank-Migrationen werden mit Prisma verwaltet
- Cron Jobs laufen automatisch im Hintergrund
- Docker-Container müssen laufen, damit die Datenbank verfügbar ist

## 🤝 Beitragen

1. Fork das Repository
2. Erstelle einen Feature-Branch (`git checkout -b feature/AmazingFeature`)
3. Committe deine Änderungen (`git commit -m 'Add some AmazingFeature'`)
4. Push zum Branch (`git push origin feature/AmazingFeature`)
5. Öffne einen Pull Request

## 📄 Lizenz

Dieses Projekt ist für den internen Gebrauch der Reallife Kirche bestimmt.

## 📞 Support

Bei Fragen oder Problemen, erstelle bitte ein Issue im GitHub Repository.

---

**Letzte Aktualisierung**: Januar 2025
