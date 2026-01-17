import express from 'express';
import pool from '../db.js';

const router = express.Router();

// Get dashboard data
router.get('/', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Get all mission points with KPIs and their latest records
    let missionPointsQuery = `
      SELECT 
        mp.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id', k.id,
              'name', k.name,
              'description', k.description,
              'missionPointId', k."missionPointId",
              'trackingFrequency', k."trackingFrequency",
              'createdAt', k."createdAt",
              'updatedAt', k."updatedAt",
              'records', (
                SELECT json_agg(
                  json_build_object(
                    'id', kr.id,
                    'value', kr.value,
                    'date', kr.date,
                    'notes', kr.notes
                  ) ORDER BY kr.date DESC
                )
                FROM "KPIRecord" kr
                WHERE kr."kpiId" = k.id
    `;

    if (startDate && endDate) {
      missionPointsQuery += ` AND kr.date >= '${startDate}' AND kr.date <= '${endDate}'`;
    }

    missionPointsQuery += `
                LIMIT 1
              )
            )
          ) FILTER (WHERE k.id IS NOT NULL),
          '[]'
        ) as kpis
      FROM "MissionPoint" mp
      LEFT JOIN "KPI" k ON k."missionPointId" = mp.id
      GROUP BY mp.id
      ORDER BY mp."order" ASC
    `;

    const missionPointsResult = await pool.query(missionPointsQuery);
    const missionPoints = missionPointsResult.rows.map(row => ({
      ...row,
      kpis: row.kpis || []
    }));

    // Get workflow statistics
    const totalContactsResult = await pool.query('SELECT COUNT(*) as count FROM "Contact"');
    const totalContacts = parseInt(totalContactsResult.rows[0].count);

    const activeWorkflowsResult = await pool.query('SELECT COUNT(*) as count FROM "WorkflowProgress" WHERE completed = false');
    const activeWorkflows = parseInt(activeWorkflowsResult.rows[0].count);

    const pendingTasksResult = await pool.query('SELECT COUNT(*) as count FROM "Task" WHERE status = \'PENDING\'');
    const pendingTasks = parseInt(pendingTasksResult.rows[0].count);

    res.json({
      missionPoints,
      statistics: {
        totalContacts,
        activeWorkflows,
        pendingTasks
      }
    });
  } catch (error: any) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get KPI trends
router.get('/kpi-trends/:kpiId', async (req, res) => {
  try {
    const { kpiId } = req.params;
    const { startDate, endDate, groupBy = 'day' } = req.query;

    let query = 'SELECT * FROM "KPIRecord" WHERE "kpiId" = $1';
    const params: any[] = [kpiId];

    if (startDate && endDate) {
      query += ' AND date >= $2 AND date <= $3';
      params.push(startDate, endDate);
    }

    query += ' ORDER BY date ASC';

    const result = await pool.query(query, params);
    const records = result.rows;

    // Group records by time period
    const grouped: Record<string, { date: string; value: number; count: number }> = {};

    records.forEach((record: any) => {
      const date = new Date(record.date);
      let key: string;

      if (groupBy === 'month') {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      } else if (groupBy === 'week') {
        const week = Math.ceil(date.getDate() / 7);
        key = `${date.getFullYear()}-W${String(week).padStart(2, '0')}`;
      } else {
        key = date.toISOString().split('T')[0];
      }

      if (!grouped[key]) {
        grouped[key] = { date: key, value: 0, count: 0 };
      }
      grouped[key].value += record.value;
      grouped[key].count += 1;
    });

    const trends = Object.values(grouped).map(item => ({
      date: item.date,
      value: item.value / item.count // Average value
    }));

    res.json(trends);
  } catch (error: any) {
    console.error('Error fetching KPI trends:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
