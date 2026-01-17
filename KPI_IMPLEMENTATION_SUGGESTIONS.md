# KPI Implementation Suggestions
## Based on Analysis of Current CSV Tracking System

### 📊 Current Tracking Structure (from CSV files)

#### 1. **Gottesdienste (Sunday Services)**
**KPIs Tracked:**
- Besucher gesamt inkl. Kids (Total Visitors including Kids)
- Besucher Saal (ohne Kids Church) - Main service attendees
- Kids-Mitarbeiter (+Eltern in Kids Church) - Kids workers + parents
- Kids in Kids Church
- Erstbesucher (First-time visitors)
- Connectet (Connected):
  - Persönlich (Personal contact - exchanged contact info)
  - Connect-Karte (Connect card submitted)
- Entscheidungen (Decisions):
  - Gespräche geführt (Conversations held)
  - Davon Erstentscheidungen/Bekehrungen (First-time decisions/conversions)
- Neues Testament gegeben (New Testaments given)

**Frequency:** Weekly (by service date)

#### 2. **Community Sundays**
Similar structure to Gottesdienste but for community events

#### 3. **Friends & Food (Small Groups)**
**Organized by Location:**
- Moabit/Schöneberg
- Wilmersdorf
- Mitte
- Lichtenberg
- Tempelhof

**Each Location Tracks:**
- Teilnehmer gesamt (Total participants)
- Kids (up to 12 years)
- Erstbesucher bei FF (First-time at Friends & Food)
- Erstbesucher bei RL (First-time at RealLife Berlin)
- VIPs (Very Important Person/Contact)

**Frequency:** Weekly per location

#### 4. **FUTURE (Youth Group)**
**KPIs Tracked:**
- Besucher gesamt (Total visitors)
- Jugendliche (Youth)
- Mitarbeiter (Staff/Leaders)
- Erstbesucher (First-time visitors)
- Connectet (Connected)
- Entscheidungen (Decisions)
- Neues Testament gegeben (New Testaments given)

**Frequency:** Weekly

#### 5. **Community Events**
**Event-based tracking** (not weekly):
- Besucher gesamt inkl. Kids
- Erstbesucher
- VIPs

**Frequency:** Per event (irregular)

#### 6. **Rathenow** (Second Location)
Separate location tracking with similar structure

---

### 🎯 Implementation Recommendations

#### **Option 1: Hierarchical KPI Structure (Recommended)**

```sql
-- Enhanced KPI Structure
KPI Categories:
├── Gottesdienste (Service KPIs)
│   ├── Attendance KPIs
│   │   ├── Besucher gesamt inkl. Kids
│   │   ├── Besucher Saal (ohne Kids Church)
│   │   ├── Kids-Mitarbeiter
│   │   └── Kids in Kids Church
│   ├── Outreach KPIs
│   │   ├── Erstbesucher
│   │   ├── Connectet (Persönlich)
│   │   └── Connectet (Connect-Karte)
│   └── Decisions KPIs
│       ├── Entscheidungen (Gespräche)
│       └── Erstentscheidungen/Bekehrungen
│
├── Friends & Food (Small Groups)
│   ├── Moabit/Schöneberg
│   ├── Wilmersdorf
│   ├── Mitte
│   ├── Lichtenberg
│   └── Tempelhof
│   └── (Each with: Teilnehmer, Kids, Erstbesucher, VIPs)
│
└── FUTURE (Youth)
    └── (Similar structure to Gottesdienste)
```

**Database Schema Changes:**

```sql
-- Add location field to KPI for Friends & Food
ALTER TABLE "KPI" ADD COLUMN IF NOT EXISTS location TEXT;

-- Add category/type field
ALTER TABLE "KPI" ADD COLUMN IF NOT EXISTS category TEXT; 
-- Values: 'ATTENDANCE', 'OUTREACH', 'DECISIONS', 'CONNECTION', etc.

-- Add subcategory for hierarchical grouping
ALTER TABLE "KPI" ADD COLUMN IF NOT EXISTS subcategory TEXT;
-- e.g., 'TOTAL_VISITORS', 'KIDS_CHURCH', 'FIRST_TIME_VISITORS', etc.

-- Add metadata JSON field for flexible attributes
ALTER TABLE "KPI" ADD COLUMN IF NOT EXISTS metadata JSONB;
-- Store additional info like "includes_kids", "location", "age_group", etc.
```

#### **Option 2: Event-Based Tracking (for Community Events)**

```sql
-- Create Event table
CREATE TABLE IF NOT EXISTS "Event" (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  eventType TEXT NOT NULL, -- 'COMMUNITY_EVENT', 'SPECIAL_SERVICE', etc.
  date DATE NOT NULL,
  location TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Link KPI Records to Events
ALTER TABLE "KPIRecord" ADD COLUMN IF NOT EXISTS "eventId" TEXT;
ALTER TABLE "KPIRecord" ADD CONSTRAINT "KPIRecord_eventId_fkey" 
  FOREIGN KEY ("eventId") REFERENCES "Event"(id);
```

---

### 🔧 Suggested Implementation Steps

#### **Phase 1: Enhance KPI Schema** ✅

1. **Add Location Support:**
   - Add `location` field for Friends & Food groups
   - Add `category` and `subcategory` for organization
   - Add `metadata` JSONB for flexible attributes

2. **Update Mission Points:**
   - Current: "Wir gehen", "Wir bringen", "Wir begleiten"
   - These already align well with:
     - "Wir gehen" → Community Events, Outreach
     - "Wir bringen" → Gottesdienste (Sunday Services), Attendance
     - "Wir begleiten" → Friends & Food, Small Groups

#### **Phase 2: Create Predefined KPIs**

Based on CSV analysis, create these standard KPIs:

**Under "Wir bringen" (Sunday Services):**
- Besucher gesamt inkl. Kids
- Besucher Saal (ohne Kids Church)
- Kids-Mitarbeiter
- Kids in Kids Church
- Erstbesucher
- Connectet (Persönlich)
- Connectet (Connect-Karte)
- Entscheidungen (Gespräche geführt)
- Erstentscheidungen/Bekehrungen
- Neues Testament gegeben

**Under "Wir begleiten" (Friends & Food):**
- Teilnehmer gesamt [Location]
- Kids [Location]
- Erstbesucher bei FF [Location]
- Erstbesucher bei RL [Location]
- VIPs [Location]

(For each location: Moabit/Schöneberg, Wilmersdorf, Mitte, Lichtenberg, Tempelhof)

**Under "Wir gehen" (Outreach/Youth):**
- FUTURE: Besucher gesamt
- FUTURE: Jugendliche
- FUTURE: Mitarbeiter
- FUTURE: Erstbesucher
- Community Events: Besucher gesamt
- Community Events: Erstbesucher
- Community Events: VIPs

#### **Phase 3: Enhanced UI/UX**

1. **KPI Entry Form:**
   - Location selector (for Friends & Food KPIs)
   - Date picker with calendar
   - Quick entry mode (same date, multiple KPIs)
   - Bulk entry (CSV import from existing files)

2. **Dashboard Enhancements:**
   - Location-based filtering
   - Weekly/monthly/quarterly views
   - Trend analysis per location
   - Comparison between locations

3. **Visualizations:**
   - Weekly attendance graphs
   - Location comparison charts
   - First-time visitor trends
   - Decision/conversion tracking

---

### 📋 Quick Wins (Immediate Implementation)

1. **Add Location Field:**
   ```sql
   ALTER TABLE "KPI" ADD COLUMN IF NOT EXISTS location TEXT;
   ```

2. **Update KPI Creation UI:**
   - Add location dropdown for Friends & Food KPIs
   - Auto-populate based on KPI type

3. **Import Existing Data:**
   - Create CSV import script
   - Map existing CSV columns to KPI records
   - Preserve historical data

4. **Enhanced Filtering:**
   - Filter KPIs by location
   - Filter by category/subcategory
   - Date range filtering

---

### 🔄 Migration Path from CSV to Database

1. **CSV Import Script:**
   - Parse CSV files from `/KPI` folder
   - Map columns to KPI + KPIRecord structure
   - Handle location-based data (Friends & Food)
   - Import historical data with correct dates

2. **Data Mapping:**
   - CSV Date columns → KPIRecord.date
   - CSV Row names → KPI.name
   - CSV Values → KPIRecord.value
   - Location info → KPI.location or KPIRecord metadata

---

### 💡 Recommended Next Steps

1. ✅ **Add location field to database** (5 min)
2. ✅ **Update KPI creation form with location selector** (15 min)
3. ✅ **Create seed script for standard KPIs** (30 min)
4. ✅ **Build CSV import utility** (1 hour)
5. ✅ **Enhanced dashboard with location filtering** (2 hours)

Would you like me to start implementing any of these suggestions?
