import express from 'express';
import pool from '../db.js';

const router = express.Router();

// Get all KPIs
router.get('/', async (req, res) => {
  try {
    const { missionPointId, location, category, subcategory } = req.query;

    let query = `
      SELECT 
        k.*,
        json_build_object(
          'id', mp.id,
          'name', mp.name,
          'description', mp.description
        ) as "missionPoint",
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
      JOIN "MissionPoint" mp ON mp.id = k."missionPointId"
    `;

    const params: any[] = [];
    const conditions: string[] = [];
    let paramCount = 1;

    if (missionPointId) {
      conditions.push(`k."missionPointId" = $${paramCount++}`);
      params.push(missionPointId);
    }
    if (location) {
      conditions.push(`k.location = $${paramCount++}`);
      params.push(location);
    }
    if (category) {
      conditions.push(`k.category = $${paramCount++}`);
      params.push(category);
    }
    if (subcategory) {
      conditions.push(`k.subcategory = $${paramCount++}`);
      params.push(subcategory);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ` ORDER BY k."createdAt" DESC`;

    const result = await pool.query(query, params);

    const kpis = result.rows.map(row => ({
      ...row,
      records: row.records || []
    }));

    res.json(kpis);
  } catch (error: any) {
    console.error('Error fetching KPIs:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get single KPI
router.get('/:id', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let query = `
      SELECT 
        k.*,
        json_build_object(
          'id', mp.id,
          'name', mp.name,
          'description', mp.description
        ) as "missionPoint",
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
    `;

    const params: any[] = [req.params.id];
    if (startDate && endDate) {
      query += ` AND kr.date >= $2 AND kr.date <= $3`;
      params.push(startDate, endDate);
    }

    query += `) as records FROM "KPI" k JOIN "MissionPoint" mp ON mp.id = k."missionPointId" WHERE k.id = $1`;

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'KPI not found' });
    }

    const kpi = {
      ...result.rows[0],
      records: result.rows[0].records || []
    };

    res.json(kpi);
  } catch (error: any) {
    console.error('Error fetching KPI:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create KPI
router.post('/', async (req, res) => {
  try {
    const { name, description, missionPointId, trackingFrequency, location, category, subcategory, metadata } = req.body;
    const id = `kpi-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const result = await pool.query(`
      INSERT INTO "KPI" (id, name, description, "missionPointId", "trackingFrequency", location, category, subcategory, metadata, "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      RETURNING *
    `, [
      id, 
      name, 
      description || null, 
      missionPointId, 
      trackingFrequency || 'MANUAL',
      location || null,
      category || null,
      subcategory || null,
      metadata ? JSON.stringify(metadata) : null
    ]);

    // Get mission point info
    const mpResult = await pool.query('SELECT id, name, description FROM "MissionPoint" WHERE id = $1', [missionPointId]);
    
    const kpi = {
      ...result.rows[0],
      missionPoint: mpResult.rows[0] || null
    };

    res.status(201).json(kpi);
  } catch (error: any) {
    console.error('Error creating KPI:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update KPI
router.put('/:id', async (req, res) => {
  try {
    const { name, description, trackingFrequency, missionPointId, location, category, subcategory, metadata } = req.body;

    const updates: string[] = [];
    const params: any[] = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      params.push(name);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      params.push(description);
    }
    if (trackingFrequency !== undefined) {
      updates.push(`"trackingFrequency" = $${paramCount++}`);
      params.push(trackingFrequency);
    }
    if (missionPointId !== undefined) {
      updates.push(`"missionPointId" = $${paramCount++}`);
      params.push(missionPointId);
    }
    if (location !== undefined) {
      updates.push(`location = $${paramCount++}`);
      params.push(location);
    }
    if (category !== undefined) {
      updates.push(`category = $${paramCount++}`);
      params.push(category);
    }
    if (subcategory !== undefined) {
      updates.push(`subcategory = $${paramCount++}`);
      params.push(subcategory);
    }
    if (metadata !== undefined) {
      updates.push(`metadata = $${paramCount++}`);
      params.push(metadata ? JSON.stringify(metadata) : null);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push(`"updatedAt" = NOW()`);
    params.push(req.params.id);

    const result = await pool.query(`
      UPDATE "KPI"
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'KPI not found' });
    }

    // Get mission point info
    const mpResult = await pool.query('SELECT id, name, description FROM "MissionPoint" WHERE id = $1', [result.rows[0].missionPointId]);
    
    const kpi = {
      ...result.rows[0],
      missionPoint: mpResult.rows[0] || null
    };

    res.json(kpi);
  } catch (error: any) {
    console.error('Error updating KPI:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete KPI
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query(`
      DELETE FROM "KPI"
      WHERE id = $1
      RETURNING id
    `, [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'KPI not found' });
    }

    res.json({ message: 'KPI deleted' });
  } catch (error: any) {
    console.error('Error deleting KPI:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add KPI record
router.post('/:id/records', async (req, res) => {
  try {
    const { value, date, notes } = req.body;
    const recordId = `kpr-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const result = await pool.query(`
      INSERT INTO "KPIRecord" (id, "kpiId", value, date, notes, "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING *
    `, [recordId, req.params.id, value, date ? new Date(date) : new Date(), notes || null]);

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error('Error adding KPI record:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get KPI records
router.get('/:id/records', async (req, res) => {
  try {
    const { startDate, endDate, limit } = req.query;

    let query = `
      SELECT *
      FROM "KPIRecord"
      WHERE "kpiId" = $1
    `;

    const params: any[] = [req.params.id];

    if (startDate && endDate) {
      query += ` AND date >= $2 AND date <= $3`;
      params.push(startDate, endDate);
    }

    query += ` ORDER BY date DESC LIMIT $${params.length + 1}`;
    params.push(limit ? parseInt(limit as string) : 100);

    const result = await pool.query(query, params);

    res.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching KPI records:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
