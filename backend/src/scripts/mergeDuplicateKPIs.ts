import pool from '../db.js';

/**
 * Script to merge duplicate KPIs:
 * - Find KPIs with the same name
 * - Keep the one with the most records (or the seed-created one)
 * - Move all records to the kept KPI
 * - Delete the duplicate KPIs
 */

async function mergeDuplicateKPIs() {
  try {
    console.log('🔍 Finding duplicate KPIs...\n');

    // Find all KPIs grouped by name
    const duplicatesResult = await pool.query(`
      SELECT 
        name,
        json_agg(
          json_build_object(
            'id', id,
            'recordCount', (SELECT COUNT(*) FROM "KPIRecord" WHERE "kpiId" = k.id)
          ) ORDER BY (SELECT COUNT(*) FROM "KPIRecord" WHERE "kpiId" = k.id) DESC
        ) as kpis
      FROM "KPI" k
      GROUP BY name
      HAVING COUNT(*) > 1
    `);

    if (duplicatesResult.rows.length === 0) {
      console.log('✅ No duplicate KPIs found!');
      return;
    }

    console.log(`Found ${duplicatesResult.rows.length} KPIs with duplicates\n`);

    for (const row of duplicatesResult.rows) {
      const kpis = row.kpis as Array<{ id: string; recordCount: number }>;
      
      // Keep the first one (with most records), or the seed-created one if names match pattern
      const keepKPI = kpis.find(k => k.id.startsWith('kpi-') && k.id.includes('-')) || kpis[0];
      const duplicatesToMerge = kpis.filter(k => k.id !== keepKPI.id);

      console.log(`📋 Merging KPIs for: ${row.name}`);
      console.log(`   Keeping: ${keepKPI.id} (${keepKPI.recordCount} records)`);

      for (const duplicate of duplicatesToMerge) {
        console.log(`   Merging: ${duplicate.id} (${duplicate.recordCount} records)`);

        // Move all records to the kept KPI
        const updateResult = await pool.query(
          'UPDATE "KPIRecord" SET "kpiId" = $1 WHERE "kpiId" = $2',
          [keepKPI.id, duplicate.id]
        );

        console.log(`      ✅ Moved ${updateResult.rowCount} records`);

        // Delete the duplicate KPI
        await pool.query('DELETE FROM "KPI" WHERE id = $1', [duplicate.id]);
        console.log(`      ✅ Deleted duplicate KPI`);
      }
    }

    console.log('\n✅ Duplicate KPIs merged successfully!');
  } catch (error) {
    console.error('❌ Error merging duplicate KPIs:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

mergeDuplicateKPIs();
