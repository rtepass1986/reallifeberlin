import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { sendNotification } from '../services/notificationService.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get all tasks
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { status, assignedToId } = req.query;

    const where: any = {};
    if (status) where.status = status;
    // If not admin, only show own tasks
    if (req.userRole !== 'ADMIN') {
      where.assignedToId = req.userId;
    } else if (assignedToId) {
      where.assignedToId = assignedToId;
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        workflowProgress: {
          include: {
            contact: {
              select: {
                id: true,
                name: true,
                phone: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: { dueDate: 'asc' }
    });

    res.json(tasks);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get single task
router.get('/:id', authenticate, async (req, res) => {
  try {
    const task = await prisma.task.findUnique({
      where: { id: req.params.id },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        workflowProgress: {
          include: {
            contact: true
          }
        }
      }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(task);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update task status
router.patch('/:id/status', authenticate, async (req: AuthRequest, res) => {
  try {
    const { status, notes } = req.body;

    const task = await prisma.task.findUnique({
      where: { id: req.params.id },
      include: {
        workflowProgress: {
          include: {
            contact: true
          }
        }
      }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check if user is assigned to this task or is admin
    if (task.assignedToId !== req.userId && req.userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized to update this task' });
    }

    const updatedTask = await prisma.task.update({
      where: { id: req.params.id },
      data: {
        status,
        notes,
        completedAt: status !== 'PENDING' ? new Date() : null
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        workflowProgress: {
          include: {
            contact: true
          }
        }
      }
    });

    // If status is "ALREADY_IN_SMALL_GROUP", notify small group leader
    if (status === 'ALREADY_IN_SMALL_GROUP') {
      await sendNotification('small_group_leader', {
        contact: task.workflowProgress.contact,
        task: updatedTask
      });
    }

    res.json(updatedTask);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
