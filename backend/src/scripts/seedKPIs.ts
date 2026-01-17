import pool from '../db.js';

/**
 * Seed Script for Standard KPIs based on CSV analysis
 * Creates all standard KPIs that match the tracking structure from CSV files
 */

const LOCATIONS = [
  'Moabit/Schöneberg',
  'Wilmersdorf',
  'Mitte',
  'Lichtenberg',
  'Tempelhof',
  'Rathenow'
];

async function seedKPIs() {
  try {
    console.log('🌱 Starting KPI seed...');

    // Get Mission Points
    const missionPointsResult = await pool.query(
      'SELECT * FROM "MissionPoint" ORDER BY "order" ASC'
    );

    const missionPoints = missionPointsResult.rows.reduce((acc, mp) => {
      acc[mp.name] = mp.id;
      return acc;
    }, {} as Record<string, string>);

    if (!missionPoints['Wir bringen'] || !missionPoints['Wir begleiten'] || !missionPoints['Wir gehen']) {
      throw new Error('Mission Points not found. Please run mission point seed first.');
    }

    // Standard KPIs for "Wir bringen" (Sunday Services)
    const gottesdienstKPIs = [
      {
        name: 'Besucher gesamt inkl. Kids',
        description: 'Gesamtzahl der Besucher einschließlich Kids Church',
        category: 'ATTENDANCE',
        subcategory: 'TOTAL',
        trackingFrequency: 'WEEKLY'
      },
      {
        name: 'Besucher Saal (ohne Kids Church)',
        description: 'Anzahl der Besucher im Hauptsaal ohne Kids Church',
        category: 'ATTENDANCE',
        subcategory: 'MAIN_SERVICE',
        trackingFrequency: 'WEEKLY'
      },
      {
        name: 'Kids-Mitarbeiter (+Eltern in Kids Church)',
        description: 'Anzahl der Kids-Mitarbeiter und Eltern in Kids Church',
        category: 'ATTENDANCE',
        subcategory: 'KIDS_WORKERS',
        trackingFrequency: 'WEEKLY'
      },
      {
        name: 'Kids in Kids Church',
        description: 'Anzahl der Kinder in Kids Church',
        category: 'KIDS',
        subcategory: 'KIDS_CHURCH',
        trackingFrequency: 'WEEKLY'
      },
      {
        name: 'Erstbesucher',
        description: 'Anzahl der Erstbesucher im Gottesdienst',
        category: 'OUTREACH',
        subcategory: 'FIRST_TIME_VISITORS',
        trackingFrequency: 'WEEKLY'
      },
      {
        name: 'Connectet (Persönlich)',
        description: 'Personen, mit denen Kontaktdaten ausgetauscht wurden',
        category: 'CONNECTION',
        subcategory: 'PERSONAL',
        trackingFrequency: 'WEEKLY'
      },
      {
        name: 'Connectet (Connect-Karte)',
        description: 'Anzahl der ausgegebenen Connect-Karten',
        category: 'CONNECTION',
        subcategory: 'CONNECT_CARD',
        trackingFrequency: 'WEEKLY'
      },
      {
        name: 'Entscheidungen (Gespräche geführt)',
        description: 'Anzahl der geführten Entscheidungsgespräche',
        category: 'DECISIONS',
        subcategory: 'CONVERSATIONS',
        trackingFrequency: 'WEEKLY'
      },
      {
        name: 'Erstentscheidungen/Bekehrungen',
        description: 'Anzahl der Erstentscheidungen und Bekehrungen',
        category: 'DECISIONS',
        subcategory: 'FIRST_DECISIONS',
        trackingFrequency: 'WEEKLY'
      },
      {
        name: 'Neues Testament gegeben',
        description: 'Anzahl der ausgegebenen Neuen Testamente',
        category: 'OUTREACH',
        subcategory: 'NEW_TESTAMENT',
        trackingFrequency: 'WEEKLY'
      }
    ];

    // KPIs for "Wir begleiten" (Friends & Food - Small Groups)
    const friendsAndFoodKPIs = LOCATIONS.map(location => [
      {
        name: `Teilnehmer gesamt [${location}]`,
        description: `Gesamtteilnehmerzahl bei Friends & Food in ${location}`,
        category: 'ATTENDANCE',
        subcategory: 'TOTAL',
        location,
        trackingFrequency: 'WEEKLY'
      },
      {
        name: `Kids [${location}]`,
        description: `Anzahl der Kids (bis 12 Jahre) bei Friends & Food in ${location}`,
        category: 'KIDS',
        subcategory: 'TOTAL',
        location,
        trackingFrequency: 'WEEKLY'
      },
      {
        name: `Erstbesucher bei FF [${location}]`,
        description: `Erstbesucher bei Friends & Food in ${location}`,
        category: 'OUTREACH',
        subcategory: 'FIRST_TIME_FF',
        location,
        trackingFrequency: 'WEEKLY'
      },
      {
        name: `Erstbesucher bei RL [${location}]`,
        description: `Erstbesucher bei RealLife Berlin in ${location}`,
        category: 'OUTREACH',
        subcategory: 'FIRST_TIME_RL',
        location,
        trackingFrequency: 'WEEKLY'
      },
      {
        name: `VIPs [${location}]`,
        description: `VIP-Kontakte bei Friends & Food in ${location}`,
        category: 'OUTREACH',
        subcategory: 'VIP',
        location,
        trackingFrequency: 'WEEKLY'
      }
    ]).flat();

    // KPIs for "Wir gehen" (FUTURE Youth + Community Events)
    const outreachKPIs = [
      // FUTURE Youth Group
      {
        name: 'FUTURE: Besucher gesamt',
        description: 'Gesamtbesucherzahl bei FUTURE (Jugendgruppe)',
        category: 'ATTENDANCE',
        subcategory: 'TOTAL',
        trackingFrequency: 'WEEKLY'
      },
      {
        name: 'FUTURE: Jugendliche',
        description: 'Anzahl der Jugendlichen bei FUTURE',
        category: 'ATTENDANCE',
        subcategory: 'YOUTH',
        trackingFrequency: 'WEEKLY'
      },
      {
        name: 'FUTURE: Mitarbeiter',
        description: 'Anzahl der Mitarbeiter bei FUTURE',
        category: 'ATTENDANCE',
        subcategory: 'STAFF',
        trackingFrequency: 'WEEKLY'
      },
      {
        name: 'FUTURE: Erstbesucher',
        description: 'Erstbesucher bei FUTURE',
        category: 'OUTREACH',
        subcategory: 'FIRST_TIME_VISITORS',
        trackingFrequency: 'WEEKLY'
      },
      // Community Events
      {
        name: 'Community Events: Besucher gesamt',
        description: 'Gesamtbesucherzahl bei Community Events',
        category: 'ATTENDANCE',
        subcategory: 'TOTAL',
        trackingFrequency: 'MANUAL'
      },
      {
        name: 'Community Events: Erstbesucher',
        description: 'Erstbesucher bei Community Events',
        category: 'OUTREACH',
        subcategory: 'FIRST_TIME_VISITORS',
        trackingFrequency: 'MANUAL'
      },
      {
        name: 'Community Events: VIPs',
        description: 'VIP-Kontakte bei Community Events',
        category: 'OUTREACH',
        subcategory: 'VIP',
        trackingFrequency: 'MANUAL'
      }
    ];

    // Create KPIs
    const allKPIs = [
      ...gottesdienstKPIs.map(kpi => ({ ...kpi, missionPointId: missionPoints['Wir bringen'] })),
      ...friendsAndFoodKPIs.map(kpi => ({ ...kpi, missionPointId: missionPoints['Wir begleiten'] })),
      ...outreachKPIs.map(kpi => ({ ...kpi, missionPointId: missionPoints['Wir gehen'] }))
    ];

    let createdCount = 0;
    let skippedCount = 0;

    for (const kpi of allKPIs) {
      // Check if KPI already exists
      const existingResult = await pool.query(
        'SELECT id FROM "KPI" WHERE name = $1 AND "missionPointId" = $2',
        [kpi.name, kpi.missionPointId]
      );

      if (existingResult.rows.length > 0) {
        console.log(`⏭️  Skipping existing KPI: ${kpi.name}`);
        skippedCount++;
        continue;
      }

      const id = `kpi-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      
      await pool.query(
        `INSERT INTO "KPI" (id, name, description, "missionPointId", "trackingFrequency", location, category, subcategory, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
        [
          id,
          kpi.name,
          kpi.description,
          kpi.missionPointId,
          kpi.trackingFrequency,
          kpi.location || null,
          kpi.category || null,
          kpi.subcategory || null
        ]
      );

      console.log(`✅ Created KPI: ${kpi.name}`);
      createdCount++;
    }

    console.log(`\n🎉 KPI seed completed!`);
    console.log(`   Created: ${createdCount} KPIs`);
    console.log(`   Skipped: ${skippedCount} existing KPIs`);

  } catch (error: any) {
    console.error('❌ Error seeding KPIs:', error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedKPIs()
    .then(() => {
      console.log('✅ Seed completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seed failed:', error);
      process.exit(1);
    });
}

export { seedKPIs };
