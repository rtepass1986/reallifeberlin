import cron from 'node-cron';
import pool from '../db.js';
import { sendNotification } from './notificationService.js';

// Run every day at 8 AM to check for due tasks
cron.schedule('0 8 * * *', async () => {
  console.log('Running daily task check...');
  
  try {
    const dueTasksResult = await pool.query(
      `SELECT t.*, 
              c.id as contact_id, c.name as contact_name
       FROM "Task" t
       LEFT JOIN "WorkflowProgress" wp ON t."workflowProgressId" = wp.id
       LEFT JOIN "Contact" c ON wp."contactId" = c.id
       WHERE t.status = 'PENDING' AND t."dueDate" <= NOW()`
    );

    for (const task of dueTasksResult.rows) {
      await sendNotification('connector', {
        taskId: task.id,
        taskDescription: task.description,
        contactName: task.contact_name,
        dueDate: task.dueDate,
        message: `Erinnerung: ${task.description} für ${task.contact_name}`
      });
    }

    console.log(`Sent notifications for ${dueTasksResult.rows.length} due tasks`);
  } catch (error: any) {
    console.error('Error in daily task check:', error);
  }
});

// Run every Monday at 9 AM to advance workflows
cron.schedule('0 9 * * 1', async () => {
  console.log('Running weekly workflow advancement...');
  
  try {
    const workflowsResult = await pool.query(
      'SELECT * FROM "WorkflowProgress" WHERE completed = false'
    );

    for (const workflow of workflowsResult.rows) {
      // Check if all tasks for current week are completed
      const currentWeekTasksResult = await pool.query(
        `SELECT * FROM "Task" 
         WHERE "workflowProgressId" = $1 
         AND week = $2 
         AND status = 'PENDING'`,
        [workflow.id, workflow.currentWeek]
      );

      if (currentWeekTasksResult.rows.length === 0) {
        // Advance to next week
        const nextWeekMap: Record<string, string> = {
          'WEEK_1': 'WEEK_2',
          'WEEK_2': 'WEEK_3',
          'WEEK_3': 'WEEK_4',
          'WEEK_4': 'WEEK_4'
        };

        const nextWeek = nextWeekMap[workflow.currentWeek] || 'WEEK_2';
        const completed = nextWeek === 'WEEK_4' && workflow.currentWeek === 'WEEK_4';

        await pool.query(
          `UPDATE "WorkflowProgress" 
           SET "currentWeek" = $1, completed = $2, "updatedAt" = NOW()
           WHERE id = $3`,
          [nextWeek, completed, workflow.id]
        );
      }
    }

    console.log('Workflow advancement completed');
  } catch (error: any) {
    console.error('Error in workflow advancement:', error);
  }
});

console.log('Cron jobs initialized');
