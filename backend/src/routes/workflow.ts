import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get all workflows
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const workflows = await prisma.workflowProgress.findMany({
      include: {
        contact: true,
        tasks: {
          include: {
            assignedTo: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: { dueDate: 'asc' }
        }
      },
      orderBy: { startDate: 'desc' }
    });

    res.json(workflows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get single workflow
router.get('/:id', authenticate, async (req, res) => {
  try {
    const workflow = await prisma.workflowProgress.findUnique({
      where: { id: req.params.id },
      include: {
        contact: {
          include: {
            creator: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        tasks: {
          include: {
            assignedTo: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: { dueDate: 'asc' }
        }
      }
    });

    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    res.json(workflow);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
