import express from 'express';
import pool from '../db.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// Get all workflows
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const workflowsResult = await pool.query(
      `SELECT wp.*, c.*
       FROM "WorkflowProgress" wp
       LEFT JOIN "Contact" c ON wp."contactId" = c.id
       ORDER BY wp."startDate" DESC`
    );

    const workflows = await Promise.all(workflowsResult.rows.map(async (row: any) => {
      const tasksResult = await pool.query(
        `SELECT t.*, u.id as assigned_id, u.name as assigned_name, u.email as assigned_email
         FROM "Task" t
         LEFT JOIN "User" u ON t."assignedToId" = u.id
         WHERE t."workflowProgressId" = $1
         ORDER BY t."dueDate" ASC`,
        [row.id]
      );

      return {
        ...row,
        contact: row.contact_id ? {
          id: row.contact_id || row.id,
          name: row.name,
          email: row.email,
          phone: row.phone,
          district: row.district,
          area: row.area,
          source: row.source,
          classification: row.classification,
          registeredForSmallGroup: row.registeredForSmallGroup
        } : null,
        tasks: tasksResult.rows.map((t: any) => ({
          ...t,
          assignedTo: t.assigned_id ? {
            id: t.assigned_id,
            name: t.assigned_name,
            email: t.assigned_email
          } : null
        }))
      };
    }));

    res.json(workflows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get single workflow
router.get('/:id', authenticate, async (req, res) => {
  try {
    const workflowResult = await pool.query(
      `SELECT wp.*, c.*, u.id as creator_id, u.name as creator_name, u.email as creator_email
       FROM "WorkflowProgress" wp
       LEFT JOIN "Contact" c ON wp."contactId" = c.id
       LEFT JOIN "User" u ON c."creatorId" = u.id
       WHERE wp.id = $1`,
      [req.params.id]
    );

    if (workflowResult.rows.length === 0) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    const row = workflowResult.rows[0];

    const tasksResult = await pool.query(
      `SELECT t.*, u.id as assigned_id, u.name as assigned_name, u.email as assigned_email
       FROM "Task" t
       LEFT JOIN "User" u ON t."assignedToId" = u.id
       WHERE t."workflowProgressId" = $1
       ORDER BY t."dueDate" ASC`,
      [req.params.id]
    );

    const workflow: any = {
      id: row.id,
      contactId: row.contactId,
      currentWeek: row.currentWeek,
      startDate: row.startDate,
      completed: row.completed,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      contact: row.contact_id ? {
        id: row.contact_id || row.contactId,
        name: row.name,
        email: row.email,
        phone: row.phone,
        district: row.district,
        area: row.area,
        source: row.source,
        classification: row.classification,
        registeredForSmallGroup: row.registeredForSmallGroup,
        creator: row.creator_id ? {
          id: row.creator_id,
          name: row.creator_name,
          email: row.creator_email
        } : null
      } : null,
      tasks: tasksResult.rows.map((t: any) => ({
        ...t,
        assignedTo: t.assigned_id ? {
          id: t.assigned_id,
          name: t.assigned_name,
          email: t.assigned_email
        } : null
      }))
    };

    res.json(workflow);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
