import pool from '../db.js';
import { sendNotification } from './notificationService.js';

export async function createWorkflow(contactId: string, assignedToId: string) {
  const workflowId = `workflow-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  const workflowResult = await pool.query(
    `INSERT INTO "WorkflowProgress" (id, "contactId", "currentWeek", "startDate", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, NOW(), NOW(), NOW())
     RETURNING *`,
    [workflowId, contactId, 'WEEK_1']
  );

  const workflow = workflowResult.rows[0];

  // Create tasks for Week 1
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() + (1 + 7 - now.getDay()) % 7); // Next Monday
  monday.setHours(9, 0, 0, 0);

  const thursday = new Date(monday);
  thursday.setDate(monday.getDate() + 3);
  thursday.setHours(9, 0, 0, 0);

  // Week 1: Monday message + Thursday reminder
  const task1Id = `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  await pool.query(
    `INSERT INTO "Task" (id, "workflowProgressId", "assignedToId", week, "taskType", description, "dueDate", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
    [task1Id, workflow.id, assignedToId, 'WEEK_1', 'MESSAGE', 'Send "Thanks for coming" message', monday]
  );

  const task2Id = `task-${Date.now() + 1}-${Math.random().toString(36).substring(2, 9)}`;
  await pool.query(
    `INSERT INTO "Task" (id, "workflowProgressId", "assignedToId", week, "taskType", description, "dueDate", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
    [task2Id, workflow.id, assignedToId, 'WEEK_1', 'REMINDER', 'Remind to invite to service', thursday]
  );

  // Schedule tasks for weeks 2-4
  for (let week = 2; week <= 4; week++) {
    const weekStart = new Date(monday);
    weekStart.setDate(monday.getDate() + (week - 1) * 7);
    
    const weekThursday = new Date(weekStart);
    weekThursday.setDate(weekStart.getDate() + 3);
    weekThursday.setHours(9, 0, 0, 0);

    const taskId = `task-${Date.now() + week}-${Math.random().toString(36).substring(2, 9)}`;
    await pool.query(
      `INSERT INTO "Task" (id, "workflowProgressId", "assignedToId", week, "taskType", description, "dueDate", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
      [taskId, workflow.id, assignedToId, `WEEK_${week}`, 'REMINDER', 'Remind to invite to service', weekThursday]
    );

    // Week 4: Add status check
    if (week === 4) {
      const statusCheckDate = new Date(weekThursday);
      statusCheckDate.setDate(weekThursday.getDate() + 1);
      statusCheckDate.setHours(9, 0, 0, 0);

      const statusCheckTaskId = `task-${Date.now() + week + 10}-${Math.random().toString(36).substring(2, 9)}`;
      await pool.query(
        `INSERT INTO "Task" (id, "workflowProgressId", "assignedToId", week, "taskType", description, "dueDate", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
        [statusCheckTaskId, workflow.id, assignedToId, 'WEEK_4', 'STATUS_CHECK', 'Confirm if person joined small group', statusCheckDate]
      );
    }
  }

  // Send initial notification
  await sendNotification('connector', {
    workflowId: workflow.id,
    message: 'New contact assigned. Workflow started.'
  });

  return workflow;
}

export async function advanceWorkflow(workflowId: string) {
  const workflowResult = await pool.query(
    'SELECT * FROM "WorkflowProgress" WHERE id = $1',
    [workflowId]
  );

  if (workflowResult.rows.length === 0) return;

  const workflow = workflowResult.rows[0];

  const nextWeekMap: Record<string, string> = {
    'WEEK_1': 'WEEK_2',
    'WEEK_2': 'WEEK_3',
    'WEEK_3': 'WEEK_4',
    'WEEK_4': 'WEEK_4' // Stay at week 4
  };

  const nextWeek = nextWeekMap[workflow.currentWeek] || 'WEEK_2';
  const completed = nextWeek === 'WEEK_4' && workflow.currentWeek === 'WEEK_4';

  await pool.query(
    `UPDATE "WorkflowProgress" 
     SET "currentWeek" = $1, completed = $2, "updatedAt" = NOW()
     WHERE id = $3`,
    [nextWeek, completed, workflowId]
  );
}
