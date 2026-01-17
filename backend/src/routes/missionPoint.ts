import express from 'express';
import pool from '../db.js';

const router = express.Router();

// Get all mission points
router.get('/', async (req, res) => {
  try {
    // First, get all mission points
    const missionPointsResult = await pool.query(`
      SELECT * FROM "MissionPoint"
      ORDER BY "order" ASC
    `);

    // Then, get KPIs for each mission point
    const missionPoints = await Promise.all(missionPointsResult.rows.map(async (mp: any) => {
      const kpisResult = await pool.query(`
        SELECT 
          k.*,
          (
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
            LIMIT 1
          ) as records
        FROM "KPI" k
        WHERE k."missionPointId" = $1
      `, [mp.id]);

      return {
        ...mp,
        kpis: kpisResult.rows.map((kpi: any) => ({
          ...kpi,
          records: kpi.records || []
        })) || []
      };
    }));

    console.log('Mission Points fetched:', missionPoints.length);
    res.json(missionPoints);
  } catch (error: any) {
    console.error('Error fetching mission points:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get single mission point
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(`
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
                LIMIT 10
              )
            )
          ) FILTER (WHERE k.id IS NOT NULL),
          '[]'
        ) as kpis
      FROM "MissionPoint" mp
      LEFT JOIN "KPI" k ON k."missionPointId" = mp.id
      WHERE mp.id = $1
      GROUP BY mp.id
    `, [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Mission point not found' });
    }

    const missionPoint = {
      ...result.rows[0],
      kpis: result.rows[0].kpis || []
    };

    res.json(missionPoint);
  } catch (error: any) {
    console.error('Error fetching mission point:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create mission point
router.post('/', async (req, res) => {
  try {
    const { name, description, order } = req.body;
    const id = `mp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const result = await pool.query(`
      INSERT INTO "MissionPoint" (id, name, description, "order", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, NOW(), NOW())
      RETURNING *
    `, [id, name, description || null, order || 0]);

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error('Error creating mission point:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update mission point
router.put('/:id', async (req, res) => {
  try {
    const { name, description, order } = req.body;

    const result = await pool.query(`
      UPDATE "MissionPoint"
      SET 
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        "order" = COALESCE($3, "order"),
        "updatedAt" = NOW()
      WHERE id = $4
      RETURNING *
    `, [name, description, order, req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Mission point not found' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error updating mission point:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete mission point
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query(`
      DELETE FROM "MissionPoint"
      WHERE id = $1
      RETURNING id
    `, [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Mission point not found' });
    }

    res.json({ message: 'Mission point deleted' });
  } catch (error: any) {
    console.error('Error deleting mission point:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
