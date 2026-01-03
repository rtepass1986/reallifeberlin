import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Get all KPIs
router.get('/', async (req, res) => {
  try {
    const { missionPointId } = req.query;

    const where: any = {};
    if (missionPointId) {
      where.missionPointId = missionPointId as string;
    }

    const kpis = await prisma.kPI.findMany({
      where,
      include: {
        missionPoint: true,
        records: {
          orderBy: { date: 'desc' },
          take: 1
        },
        _count: {
          select: { records: true }
        }
      }
    });

    res.json(kpis);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get single KPI
router.get('/:id', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const kpi = await prisma.kPI.findUnique({
      where: { id: req.params.id },
      include: {
        missionPoint: true,
        records: {
          where: {
            ...(startDate && endDate ? {
              date: {
                gte: new Date(startDate as string),
                lte: new Date(endDate as string)
              }
            } : {})
          },
          orderBy: { date: 'asc' }
        }
      }
    });

    if (!kpi) {
      return res.status(404).json({ error: 'KPI not found' });
    }

    res.json(kpi);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create KPI
router.post('/', async (req, res) => {
  try {
    const { name, description, missionPointId } = req.body;

    const kpi = await prisma.kPI.create({
      data: {
        name,
        description,
        missionPointId
      },
      include: {
        missionPoint: true
      }
    });

    res.status(201).json(kpi);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update KPI
router.put('/:id', async (req, res) => {
  try {
    const { name, description } = req.body;

    const kpi = await prisma.kPI.update({
      where: { id: req.params.id },
      data: {
        name,
        description
      },
      include: {
        missionPoint: true
      }
    });

    res.json(kpi);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete KPI
router.delete('/:id', async (req, res) => {
  try {
    await prisma.kPI.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'KPI deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Add KPI record
router.post('/:id/records', async (req, res) => {
  try {
    const { value, date, notes } = req.body;

    const record = await prisma.kPIRecord.create({
      data: {
        kpiId: req.params.id,
        value,
        date: date ? new Date(date) : new Date(),
        notes
      }
    });

    res.status(201).json(record);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get KPI records
router.get('/:id/records', async (req, res) => {
  try {
    const { startDate, endDate, limit } = req.query;

    const records = await prisma.kPIRecord.findMany({
      where: {
        kpiId: req.params.id,
        ...(startDate && endDate ? {
          date: {
            gte: new Date(startDate as string),
            lte: new Date(endDate as string)
          }
        } : {})
      },
      orderBy: { date: 'desc' },
      take: limit ? parseInt(limit as string) : 100
    });

    res.json(records);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
