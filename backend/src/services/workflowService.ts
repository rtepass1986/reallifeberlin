import { PrismaClient } from '@prisma/client';
import { sendNotification } from './notificationService.js';

const prisma = new PrismaClient();

export async function createWorkflow(contactId: string, assignedToId: string) {
  const workflow = await prisma.workflowProgress.create({
    data: {
      contactId,
      currentWeek: 'WEEK_1',
      startDate: new Date()
    }
  });

  // Create tasks for Week 1
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() + (1 + 7 - now.getDay()) % 7); // Next Monday
  monday.setHours(9, 0, 0, 0);

  const thursday = new Date(monday);
  thursday.setDate(monday.getDate() + 3);
  thursday.setHours(9, 0, 0, 0);

  // Week 1: Monday message + Thursday reminder
  await prisma.task.create({
    data: {
      workflowProgressId: workflow.id,
      assignedToId,
      week: 'WEEK_1',
      taskType: 'MESSAGE',
      description: 'Send "Thanks for coming" message',
      dueDate: monday
    }
  });

  await prisma.task.create({
    data: {
      workflowProgressId: workflow.id,
      assignedToId,
      week: 'WEEK_1',
      taskType: 'REMINDER',
      description: 'Remind to invite to service',
      dueDate: thursday
    }
  });

  // Schedule tasks for weeks 2-4
  for (let week = 2; week <= 4; week++) {
    const weekStart = new Date(monday);
    weekStart.setDate(monday.getDate() + (week - 1) * 7);
    
    const weekThursday = new Date(weekStart);
    weekThursday.setDate(weekStart.getDate() + 3);
    weekThursday.setHours(9, 0, 0, 0);

    await prisma.task.create({
      data: {
        workflowProgressId: workflow.id,
        assignedToId,
        week: `WEEK_${week}` as any,
        taskType: 'REMINDER',
        description: 'Remind to invite to service',
        dueDate: weekThursday
      }
    });

    // Week 4: Add status check
    if (week === 4) {
      const statusCheckDate = new Date(weekThursday);
      statusCheckDate.setDate(weekThursday.getDate() + 1);
      statusCheckDate.setHours(9, 0, 0, 0);

      await prisma.task.create({
        data: {
          workflowProgressId: workflow.id,
          assignedToId,
          week: 'WEEK_4',
          taskType: 'STATUS_CHECK',
          description: 'Confirm if person joined small group',
          dueDate: statusCheckDate
        }
      });
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
  const workflow = await prisma.workflowProgress.findUnique({
    where: { id: workflowId },
    include: { tasks: true }
  });

  if (!workflow) return;

  const nextWeekMap: Record<string, string> = {
    'WEEK_1': 'WEEK_2',
    'WEEK_2': 'WEEK_3',
    'WEEK_3': 'WEEK_4',
    'WEEK_4': 'WEEK_4' // Stay at week 4
  };

  const nextWeek = nextWeekMap[workflow.currentWeek] || 'WEEK_2';

  await prisma.workflowProgress.update({
    where: { id: workflowId },
    data: {
      currentWeek: nextWeek as any,
      completed: nextWeek === 'WEEK_4' && workflow.currentWeek === 'WEEK_4'
    }
  });
}
