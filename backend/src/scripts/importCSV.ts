import pool from '../db.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * CSV Import Utility
 * Imports historical KPI data from CSV files in the /KPI folder
 */

interface CSVRow {
  [key: string]: string;
}

interface KPIMapping {
  csvName: string;
  kpiName: string;
  missionPointName: string;
  location?: string;
  category?: string;
  subcategory?: string;
}

// Mapping CSV row names to KPI names
const KPI_MAPPINGS: KPIMapping[] = [
  // Gottesdienste (Sunday Services)
  { csvName: 'Besucher gesamt inkl. Kids', kpiName: 'Besucher gesamt inkl. Kids', missionPointName: 'Wir bringen', category: 'ATTENDANCE', subcategory: 'TOTAL' },
  { csvName: 'Besucher Saal (ohne Kids Church)', kpiName: 'Besucher Saal (ohne Kids Church)', missionPointName: 'Wir bringen', category: 'ATTENDANCE', subcategory: 'MAIN_SERVICE' },
  { csvName: 'Kids-Mitarbeiter (+Eltern in Kids Church)', kpiName: 'Kids-Mitarbeiter (+Eltern in Kids Church)', missionPointName: 'Wir bringen', category: 'ATTENDANCE', subcategory: 'KIDS_WORKERS' },
  { csvName: 'Kids in Kids Church', kpiName: 'Kids in Kids Church', missionPointName: 'Wir bringen', category: 'KIDS', subcategory: 'KIDS_CHURCH' },
  { csvName: 'Erstbesucher', kpiName: 'Erstbesucher', missionPointName: 'Wir bringen', category: 'OUTREACH', subcategory: 'FIRST_TIME_VISITORS' },
  { csvName: 'Persönlich (Kontaktdaten ausgetauscht)', kpiName: 'Connectet (Persönlich)', missionPointName: 'Wir bringen', category: 'CONNECTION', subcategory: 'PERSONAL' },
  { csvName: 'Connect-Karte', kpiName: 'Connectet (Connect-Karte)', missionPointName: 'Wir bringen', category: 'CONNECTION', subcategory: 'CONNECT_CARD' },
  { csvName: 'Entscheidungen (Meldungen)', kpiName: 'Entscheidungen (Gespräche geführt)', missionPointName: 'Wir bringen', category: 'DECISIONS', subcategory: 'CONVERSATIONS' },
  { csvName: 'Gespräche geführt', kpiName: 'Entscheidungen (Gespräche geführt)', missionPointName: 'Wir bringen', category: 'DECISIONS', subcategory: 'CONVERSATIONS' },
  { csvName: 'Davon Erstentscheidungen/Bekehrungen', kpiName: 'Erstentscheidungen/Bekehrungen', missionPointName: 'Wir bringen', category: 'DECISIONS', subcategory: 'FIRST_DECISIONS' },
  { csvName: 'Neues Testament gegeben', kpiName: 'Neues Testament gegeben', missionPointName: 'Wir bringen', category: 'OUTREACH', subcategory: 'NEW_TESTAMENT' },
];

function parseCSV(content: string): CSVRow[] {
  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];

  // Parse header (first line) - split by semicolon
  const headers = lines[0].split(';').map(h => h.trim().replace(/^"|"$/g, ''));

  // Parse data rows
  const rows: CSVRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(';');
    const row: CSVRow = {};
    headers.forEach((header, idx) => {
      let value = values[idx] || '';
      value = value.trim().replace(/^"|"$/g, '');
      row[header] = value;
    });
    rows.push(row);
  }

  return rows;
}

function parseDate(dateStr: string): Date | null {
  if (!dateStr || dateStr.trim() === '') return null;

  // Try various date formats from CSV
  const formats = [
    /(\d{1,2})\/(\d{1,2})\/(\d{2,4})/,  // M/D/YY or M/D/YYYY
    /(\d{1,2})\.(\d{1,2})\.(\d{2,4})/,  // D.M.YY or D.M.YYYY
    /(\d{1,2})\/(\d{1,2})\/(\d{2})/     // M/D/YY
  ];

  for (const format of formats) {
    const match = dateStr.match(format);
    if (match) {
      const [, m, d, y] = match;
      const year = y.length === 2 ? (parseInt(y) > 50 ? 1900 + parseInt(y) : 2000 + parseInt(y)) : parseInt(y);
      const month = parseInt(m) - 1;
      const day = parseInt(d);
      return new Date(year, month, day);
    }
  }

  return null;
}

async function importGottesdiensteCSV(filePath: string) {
  console.log(`📄 Importing: ${path.basename(filePath)}`);
  
  const content = fs.readFileSync(filePath, 'utf-8');
  const rows = parseCSV(content);
  
  if (rows.length === 0) {
    console.log('   ⚠️  No data found in CSV');
    return;
  }

  // Get headers (first row after quote line)
  const headers = Object.keys(rows[0] || {});
  const dateHeaders = headers.filter(h => h && !h.includes('Wir zählen') && h.trim() !== '');

  // Get Mission Points
  const mpResult = await pool.query('SELECT id, name FROM "MissionPoint"');
  const missionPoints = mpResult.rows.reduce((acc, mp) => {
    acc[mp.name] = mp.id;
    return acc;
  }, {} as Record<string, string>);

  let importedCount = 0;

  for (const row of rows) {
    const rowName = row[Object.keys(row)[0]] || '';
    if (!rowName || rowName.includes('Wir zählen') || rowName.trim() === '') continue;

    // Find matching KPI mapping
    const mapping = KPI_MAPPINGS.find(m => 
      rowName.includes(m.csvName) || 
      rowName.trim() === m.csvName ||
      (m.csvName === 'Persönlich (Kontaktdaten ausgetauscht)' && rowName.includes('Persönlich'))
    );

    if (!mapping) {
      console.log(`   ⏭️  No mapping found for: ${rowName}`);
      continue;
    }

    // Find or create KPI
    const kpiResult = await pool.query(
      'SELECT id FROM "KPI" WHERE name = $1 AND "missionPointId" = $2',
      [mapping.kpiName, missionPoints[mapping.missionPointName]]
    );

    let kpiId: string;
    if (kpiResult.rows.length > 0) {
      kpiId = kpiResult.rows[0].id;
    } else {
      // Create KPI
      kpiId = `kpi-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      await pool.query(
        `INSERT INTO "KPI" (id, name, description, "missionPointId", "trackingFrequency", category, subcategory, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
        [
          kpiId,
          mapping.kpiName,
          `Imported from CSV: ${rowName}`,
          missionPoints[mapping.missionPointName],
          'WEEKLY',
          mapping.category || null,
          mapping.subcategory || null
        ]
      );
    }

    // Import records for each date
    for (const dateHeader of dateHeaders) {
      const valueStr = row[dateHeader] || '';
      if (!valueStr || valueStr.trim() === '' || valueStr === '0') continue;

      const value = parseFloat(valueStr);
      if (isNaN(value)) continue;

      const date = parseDate(dateHeader);
      if (!date) continue;

      // Check if record already exists
      const existingResult = await pool.query(
        'SELECT id FROM "KPIRecord" WHERE "kpiId" = $1 AND date = $2',
        [kpiId, date]
      );

      if (existingResult.rows.length > 0) {
        // Update existing record
        await pool.query(
          'UPDATE "KPIRecord" SET value = $1, "updatedAt" = NOW() WHERE id = $2',
          [value, existingResult.rows[0].id]
        );
      } else {
        // Create new record
        const recordId = `record-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        await pool.query(
          `INSERT INTO "KPIRecord" (id, "kpiId", value, date, "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, NOW(), NOW())`,
          [recordId, kpiId, value, date]
        );
      }

      importedCount++;
    }
  }

  console.log(`   ✅ Imported ${importedCount} records`);
}

async function importCSVFiles() {
  try {
    console.log('🚀 Starting CSV import...\n');

    const kpiFolder = path.join(__dirname, '../../../KPI');
    
    if (!fs.existsSync(kpiFolder)) {
      throw new Error(`KPI folder not found: ${kpiFolder}`);
    }

    const files = fs.readdirSync(kpiFolder).filter(f => f.endsWith('.csv'));

    console.log(`Found ${files.length} CSV files\n`);

    for (const file of files) {
      const filePath = path.join(kpiFolder, file);
      try {
        await importGottesdiensteCSV(filePath);
        console.log('');
      } catch (error: any) {
        console.error(`❌ Error importing ${file}:`, error.message);
      }
    }

    console.log('🎉 CSV import completed!');

  } catch (error: any) {
    console.error('❌ Error during CSV import:', error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  importCSVFiles()
    .then(() => {
      console.log('✅ Import completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Import failed:', error);
      process.exit(1);
    });
}

export { importCSVFiles };
