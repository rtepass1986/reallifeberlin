import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Get all mission points
router.get('/', async (req, res) => {
  try {
    const missionPoints = await prisma.missionPoint.findMany({
      include: {
        kpis: {
          include: {
            _count: {
              select: { records: true }
            }
          }
        }
      },
      orderBy: { order: 'asc' }
    });

    res.json(missionPoints);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get single mission point
router.get('/:id', async (req, res) => {
  try {
    const missionPoint = await prisma.missionPoint.findUnique({
      where: { id: req.params.id },
      include: {
        kpis: {
          include: {
            records: {
              orderBy: { date: 'desc' },
              take: 10
            }
          }
        }
      }
    });

    if (!missionPoint) {
      return res.status(404).json({ error: 'Mission point not found' });
    }

    res.json(missionPoint);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create mission point
router.post('/', async (req, res) => {
  try {
    const { name, description, order } = req.body;

    const missionPoint = await prisma.missionPoint.create({
      data: {
        name,
        description,
        order: order || 0
      }
    });

    res.status(201).json(missionPoint);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update mission point
router.put('/:id', async (req, res) => {
  try {
    const { name, description, order } = req.body;

    const missionPoint = await prisma.missionPoint.update({
      where: { id: req.params.id },
      data: {
        name,
        description,
        order
      }
    });

    res.json(missionPoint);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete mission point
router.delete('/:id', async (req, res) => {
  try {
    await prisma.missionPoint.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Mission point deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
