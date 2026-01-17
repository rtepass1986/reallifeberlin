import express from 'express';
import pool from '../db.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { createWorkflow } from '../services/workflowService.js';
import { planningCenterService } from '../services/planningCenterService.js';

const router = express.Router();

// Get all contacts
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { source, classification, creatorId } = req.query;

    let whereConditions: string[] = [];
    const params: any[] = [];
    let paramCount = 1;

    if (source) {
      whereConditions.push(`source = $${paramCount++}`);
      params.push(source);
    }
    if (classification) {
      whereConditions.push(`classification = $${paramCount++}`);
      params.push(classification);
    }
    if (creatorId) {
      whereConditions.push(`"creatorId" = $${paramCount++}`);
      params.push(creatorId);
    } else if (req.userRole !== 'ADMIN') {
      whereConditions.push(`"creatorId" = $${paramCount++}`);
      params.push(req.userId);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    const contactsResult = await pool.query(
      `SELECT c.*, 
              u.id as creator_id, u.name as creator_name, u.email as creator_email,
              wp.id as workflow_id, wp."currentWeek" as workflow_week, wp.completed as workflow_completed
       FROM "Contact" c
       LEFT JOIN "User" u ON c."creatorId" = u.id
       LEFT JOIN "WorkflowProgress" wp ON c.id = wp."contactId"
       ${whereClause}
       ORDER BY c."createdAt" DESC`,
      params
    );

    // Get tasks for each contact
    const contacts = await Promise.all(contactsResult.rows.map(async (row: any) => {
      const contact: any = {
        id: row.id,
        name: row.name,
        email: row.email,
        phone: row.phone,
        district: row.district,
        area: row.area,
        source: row.source,
        classification: row.classification,
        registeredForSmallGroup: row.registeredForSmallGroup,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        creatorId: row.creatorId,
        creator: row.creator_id ? {
          id: row.creator_id,
          name: row.creator_name,
          email: row.creator_email
        } : null
      };

      if (row.workflow_id) {
        const tasksResult = await pool.query(
          `SELECT t.*, u.id as assigned_id, u.name as assigned_name, u.email as assigned_email
           FROM "Task" t
           LEFT JOIN "User" u ON t."assignedToId" = u.id
           WHERE t."workflowProgressId" = $1 AND t."assignedToId" = $2
           ORDER BY t."dueDate" ASC`,
          [row.workflow_id, req.userId]
        );

        contact.workflowProgress = {
          id: row.workflow_id,
          currentWeek: row.workflow_week,
          completed: row.workflow_completed,
          tasks: tasksResult.rows.map((t: any) => ({
            ...t,
            assignedTo: t.assigned_id ? {
              id: t.assigned_id,
              name: t.assigned_name,
              email: t.assigned_email
            } : null
          }))
        };
      }

      return contact;
    }));

    res.json(contacts);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get single contact
router.get('/:id', authenticate, async (req, res) => {
  try {
    const contactResult = await pool.query(
      `SELECT c.*, 
              u.id as creator_id, u.name as creator_name, u.email as creator_email,
              wp.id as workflow_id, wp."currentWeek" as workflow_week, wp.completed as workflow_completed
       FROM "Contact" c
       LEFT JOIN "User" u ON c."creatorId" = u.id
       LEFT JOIN "WorkflowProgress" wp ON c.id = wp."contactId"
       WHERE c.id = $1`,
      [req.params.id]
    );

    if (contactResult.rows.length === 0) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    const row = contactResult.rows[0];
    const contact: any = {
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      district: row.district,
      area: row.area,
      source: row.source,
      classification: row.classification,
      registeredForSmallGroup: row.registeredForSmallGroup,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      creatorId: row.creatorId,
      creator: row.creator_id ? {
        id: row.creator_id,
        name: row.creator_name,
        email: row.creator_email
      } : null
    };

    if (row.workflow_id) {
      const tasksResult = await pool.query(
        `SELECT t.*, u.id as assigned_id, u.name as assigned_name, u.email as assigned_email
         FROM "Task" t
         LEFT JOIN "User" u ON t."assignedToId" = u.id
         WHERE t."workflowProgressId" = $1
         ORDER BY t."dueDate" ASC`,
        [row.workflow_id]
      );

      contact.workflowProgress = {
        id: row.workflow_id,
        currentWeek: row.workflow_week,
        completed: row.workflow_completed,
        tasks: tasksResult.rows.map((t: any) => ({
          ...t,
          assignedTo: t.assigned_id ? {
            id: t.assigned_id,
            name: t.assigned_name,
            email: t.assigned_email
          } : null
        }))
      };
    }

    res.json(contact);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create contact
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const {
      name,
      email,
      phone,
      district,
      area,
      source,
      classification,
      registeredForSmallGroup,
      assignedToId,
      smallGroupId
    } = req.body;

    const id = `contact-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const { address, city, postalCode, notes } = req.body;

    const contactResult = await pool.query(
      `INSERT INTO "Contact" (id, name, email, phone, address, city, "postalCode", district, area, source, classification, "registeredForSmallGroup", "creatorId", "smallGroupId", notes, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW())
       RETURNING *`,
      [id, name, email || null, phone || null, address || null, city || null, postalCode || null, district || null, area || null, source, classification, registeredForSmallGroup || false, req.userId, smallGroupId || null, notes || null]
    );

    const contactRow = contactResult.rows[0];

    // Get creator info
    const creatorResult = await pool.query(
      'SELECT id, name, email FROM "User" WHERE id = $1',
      [req.userId]
    );

    const contact: any = {
      ...contactRow,
      creator: creatorResult.rows[0] || null
    };

    // Create workflow if not already registered for small group
    if (!registeredForSmallGroup) {
      await createWorkflow(contact.id, assignedToId || req.userId!);
    }

    // Sync to Planning Center (async, don't wait)
    planningCenterService.syncContactToPlanningCenter(contact.id).catch(err => {
      console.error('Failed to sync contact to Planning Center:', err);
    });

    res.status(201).json(contact);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update contact
router.put('/:id', authenticate, async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      district,
      area,
      source,
      classification,
      registeredForSmallGroup,
      smallGroupId
    } = req.body;

    const updates: string[] = [];
    const params: any[] = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      params.push(name);
    }
    if (email !== undefined) {
      updates.push(`email = $${paramCount++}`);
      params.push(email);
    }
    if (phone !== undefined) {
      updates.push(`phone = $${paramCount++}`);
      params.push(phone);
    }
    if (district !== undefined) {
      updates.push(`district = $${paramCount++}`);
      params.push(district);
    }
    if (area !== undefined) {
      updates.push(`area = $${paramCount++}`);
      params.push(area);
    }
    if (source !== undefined) {
      updates.push(`source = $${paramCount++}`);
      params.push(source);
    }
    if (classification !== undefined) {
      updates.push(`classification = $${paramCount++}`);
      params.push(classification);
    }
    if (registeredForSmallGroup !== undefined) {
      updates.push(`"registeredForSmallGroup" = $${paramCount++}`);
      params.push(registeredForSmallGroup);
    }
    if (smallGroupId !== undefined) {
      updates.push(`"smallGroupId" = $${paramCount++}`);
      params.push(smallGroupId);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push(`"updatedAt" = NOW()`);
    params.push(req.params.id);

    const result = await pool.query(
      `UPDATE "Contact" 
       SET ${updates.join(', ')}
       WHERE id = $${paramCount}
       RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete contact
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM "Contact" WHERE id = $1 RETURNING id',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    res.json({ message: 'Contact deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
