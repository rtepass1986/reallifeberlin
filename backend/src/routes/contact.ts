import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { createWorkflow } from '../services/workflowService.js';
import { planningCenterService } from '../services/planningCenterService.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get all contacts
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { source, classification, creatorId } = req.query;

    const where: any = {};
    if (source) where.source = source;
    if (classification) where.classification = classification;
    if (creatorId) where.creatorId = creatorId;
    // If user is not admin, only show their own contacts
    if (req.userRole !== 'ADMIN' && !creatorId) {
      where.creatorId = req.userId;
    }

    const contacts = await prisma.contact.findMany({
      where,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        workflowProgress: {
          include: {
            tasks: {
              where: {
                assignedToId: req.userId
              },
              orderBy: { dueDate: 'asc' }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(contacts);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get single contact
router.get('/:id', authenticate, async (req, res) => {
  try {
    const contact = await prisma.contact.findUnique({
      where: { id: req.params.id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        workflowProgress: {
          include: {
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
        }
      }
    });

    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
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
      assignedToId
    } = req.body;

    const contact = await prisma.contact.create({
      data: {
        name,
        email,
        phone,
        district,
        area,
        source,
        classification,
        registeredForSmallGroup: registeredForSmallGroup || false,
        creatorId: req.userId
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

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
      registeredForSmallGroup
    } = req.body;

    const contact = await prisma.contact.update({
      where: { id: req.params.id },
      data: {
        name,
        email,
        phone,
        district,
        area,
        source,
        classification,
        registeredForSmallGroup
      }
    });

    res.json(contact);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete contact
router.delete('/:id', authenticate, async (req, res) => {
  try {
    await prisma.contact.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Contact deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
