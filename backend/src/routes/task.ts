import express from 'express';
import pool from '../db.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { sendNotification } from '../services/notificationService.js';

const router = express.Router();

// Get all tasks
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { status, assignedToId } = req.query;

    let whereConditions: string[] = [];
    const params: any[] = [];
    let paramCount = 1;

    if (status) {
      whereConditions.push(`t.status = $${paramCount++}`);
      params.push(status);
    }

    // If not admin, only show own tasks
    if (req.userRole !== 'ADMIN') {
      whereConditions.push(`t."assignedToId" = $${paramCount++}`);
      params.push(req.userId);
    } else if (assignedToId) {
      whereConditions.push(`t."assignedToId" = $${paramCount++}`);
      params.push(assignedToId);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    const tasksResult = await pool.query(
      `SELECT t.*,
              u.id as assigned_id, u.name as assigned_name, u.email as assigned_email,
              wp.id as workflow_id, wp."currentWeek" as workflow_week, wp.completed as workflow_completed,
              c.id as contact_id, c.name as contact_name, c.phone as contact_phone, c.email as contact_email
       FROM "Task" t
       LEFT JOIN "User" u ON t."assignedToId" = u.id
       LEFT JOIN "WorkflowProgress" wp ON t."workflowProgressId" = wp.id
       LEFT JOIN "Contact" c ON wp."contactId" = c.id
       ${whereClause}
       ORDER BY t."dueDate" ASC`,
      params
    );

    const tasks = tasksResult.rows.map((row: any) => ({
      ...row,
      assignedTo: row.assigned_id ? {
        id: row.assigned_id,
        name: row.assigned_name,
        email: row.assigned_email
      } : null,
      workflowProgress: row.workflow_id ? {
        id: row.workflow_id,
        currentWeek: row.workflow_week,
        completed: row.workflow_completed,
        contact: row.contact_id ? {
          id: row.contact_id,
          name: row.contact_name,
          phone: row.contact_phone,
          email: row.contact_email
        } : null
      } : null
    }));

    res.json(tasks);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get single task
router.get('/:id', authenticate, async (req, res) => {
  try {
    const taskResult = await pool.query(
      `SELECT t.*,
              u.id as assigned_id, u.name as assigned_name, u.email as assigned_email,
              wp.id as workflow_id, wp."currentWeek" as workflow_week, wp.completed as workflow_completed,
              c.id as contact_id, c.name as contact_name, c.email as contact_email, c.phone as contact_phone,
              c.district as contact_district, c.area as contact_area, c.source as contact_source,
              c.classification as contact_classification, c."registeredForSmallGroup" as contact_registered
       FROM "Task" t
       LEFT JOIN "User" u ON t."assignedToId" = u.id
       LEFT JOIN "WorkflowProgress" wp ON t."workflowProgressId" = wp.id
       LEFT JOIN "Contact" c ON wp."contactId" = c.id
       WHERE t.id = $1`,
      [req.params.id]
    );

    if (taskResult.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const row = taskResult.rows[0];
    const task: any = {
      id: row.id,
      workflowProgressId: row.workflowProgressId,
      assignedToId: row.assignedToId,
      week: row.week,
      taskType: row.taskType,
      description: row.description,
      dueDate: row.dueDate,
      status: row.status,
      completedAt: row.completedAt,
      notes: row.notes,
      communicationMethod: row.communicationMethod,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      assignedTo: row.assigned_id ? {
        id: row.assigned_id,
        name: row.assigned_name,
        email: row.assigned_email
      } : null,
      workflowProgress: row.workflow_id ? {
        id: row.workflow_id,
        currentWeek: row.workflow_week,
        completed: row.workflow_completed,
        contact: row.contact_id ? {
          id: row.contact_id,
          name: row.contact_name,
          email: row.contact_email,
          phone: row.contact_phone,
          district: row.contact_district,
          area: row.contact_area,
          source: row.contact_source,
          classification: row.contact_classification,
          registeredForSmallGroup: row.contact_registered
        } : null
      } : null
    };

    res.json(task);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update task status
router.patch('/:id/status', authenticate, async (req: AuthRequest, res) => {
  try {
    const { status, notes, communicationMethod } = req.body;

    // Get task with workflow and contact info
    const taskResult = await pool.query(
      `SELECT t.*, 
              u.id as assigned_id, u.name as assigned_name, u.email as assigned_email,
              wp.id as workflow_id, wp."contactId" as contact_id,
              c.id as contact_id_full, c.name as contact_name, c.email as contact_email, c.phone as contact_phone
       FROM "Task" t
       LEFT JOIN "User" u ON t."assignedToId" = u.id
       LEFT JOIN "WorkflowProgress" wp ON t."workflowProgressId" = wp.id
       LEFT JOIN "Contact" c ON wp."contactId" = c.id
       WHERE t.id = $1`,
      [req.params.id]
    );

    if (taskResult.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const task = taskResult.rows[0];

    // Check if user is assigned to this task or is admin
    if (task.assignedToId !== req.userId && req.userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized to update this task' });
    }

    // Update task
    const updates: string[] = [];
    const params: any[] = [];
    let paramCount = 1;

    if (status !== undefined) {
      updates.push(`status = $${paramCount++}`);
      params.push(status);
      if (status !== 'PENDING') {
        updates.push(`"completedAt" = NOW()`);
      } else {
        updates.push(`"completedAt" = NULL`);
      }
    }
    if (notes !== undefined) {
      updates.push(`notes = $${paramCount++}`);
      params.push(notes);
    }
    if (communicationMethod !== undefined) {
      updates.push(`"communicationMethod" = $${paramCount++}`);
      params.push(communicationMethod);
    }

    updates.push(`"updatedAt" = NOW()`);
    params.push(req.params.id);

    const updateResult = await pool.query(
      `UPDATE "Task" 
       SET ${updates.join(', ')}
       WHERE id = $${paramCount}
       RETURNING *`,
      params
    );

    const updatedTaskRow = updateResult.rows[0];

    // Build response with relations
    const updatedTask: any = {
      ...updatedTaskRow,
      assignedTo: task.assigned_id ? {
        id: task.assigned_id,
        name: task.assigned_name,
        email: task.assigned_email
      } : null,
      workflowProgress: task.workflow_id ? {
        id: task.workflow_id,
        contact: task.contact_id ? {
          id: task.contact_id,
          name: task.name,
          email: task.email,
          phone: task.phone
        } : null
      } : null
    };

    // If status is "ALREADY_IN_SMALL_GROUP" or "CONTACT_ENDED", mark workflow as completed
    if (status === 'ALREADY_IN_SMALL_GROUP' || status === 'CONTACT_ENDED') {
      await pool.query(
        'UPDATE "WorkflowProgress" SET completed = true, "updatedAt" = NOW() WHERE id = $1',
        [task.workflow_id]
      );

      // Cancel remaining tasks for this workflow
      await pool.query(
        `UPDATE "Task" 
         SET status = 'CONTACT_ENDED', "updatedAt" = NOW()
         WHERE "workflowProgressId" = $1 AND status = 'PENDING'`,
        [task.workflow_id]
      );
    }

    // If status is "ALREADY_IN_SMALL_GROUP", notify small group leader
    if (status === 'ALREADY_IN_SMALL_GROUP') {
      const contact = {
        id: task.contact_id_full || task.contact_id,
        name: task.contact_name,
        email: task.contact_email,
        phone: task.contact_phone
      };
      await sendNotification('small_group_leader', {
        contact,
        task: updatedTask
      });
    }

    res.json(updatedTask);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
