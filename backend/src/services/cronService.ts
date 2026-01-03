import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { sendNotification } from './notificationService.js';

const prisma = new PrismaClient();

// Run every day at 8 AM to check for due tasks
cron.schedule('0 8 * * *', async () => {
  console.log('Running daily task check...');
  
  try {
    const dueTasks = await prisma.task.findMany({
      where: {
        status: 'PENDING',
        dueDate: {
          lte: new Date()
        }
      },
      include: {
        assignedTo: true,
        workflowProgress: {
          include: {
            contact: true
          }
        }
      }
    });

    for (const task of dueTasks) {
      await sendNotification('connector', {
        taskId: task.id,
        taskDescription: task.description,
        contactName: task.workflowProgress.contact.name,
        dueDate: task.dueDate,
        message: `Erinnerung: ${task.description} für ${task.workflowProgress.contact.name}`
      });
    }

    console.log(`Sent notifications for ${dueTasks.length} due tasks`);
  } catch (error: any) {
    console.error('Error in daily task check:', error);
  }
});

// Run every Monday at 9 AM to advance workflows
cron.schedule('0 9 * * 1', async () => {
  console.log('Running weekly workflow advancement...');
  
  try {
    const workflows = await prisma.workflowProgress.findMany({
      where: {
        completed: false
      },
      include: {
        tasks: {
          where: {
            status: 'PENDING'
          }
        }
      }
    });

    for (const workflow of workflows) {
      // Check if all tasks for current week are completed
      const currentWeekTasks = workflow.tasks.filter(
        t => t.week === workflow.currentWeek && t.status === 'PENDING'
      );

      if (currentWeekTasks.length === 0) {
        // Advance to next week
        const nextWeekMap: Record<string, string> = {
          'WEEK_1': 'WEEK_2',
          'WEEK_2': 'WEEK_3',
          'WEEK_3': 'WEEK_4',
          'WEEK_4': 'WEEK_4'
        };

        const nextWeek = nextWeekMap[workflow.currentWeek] || 'WEEK_2';

        await prisma.workflowProgress.update({
          where: { id: workflow.id },
          data: {
            currentWeek: nextWeek as any,
            completed: nextWeek === 'WEEK_4' && workflow.currentWeek === 'WEEK_4'
          }
        });
      }
    }

    console.log('Workflow advancement completed');
  } catch (error: any) {
    console.error('Error in workflow advancement:', error);
  }
});

console.log('Cron jobs initialized');
