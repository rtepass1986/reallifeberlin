import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Get dashboard data
router.get('/', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const dateFilter = startDate && endDate ? {
      date: {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      }
    } : {};

    // Get all mission points with KPIs and their latest records
    const missionPoints = await prisma.missionPoint.findMany({
      include: {
        kpis: {
          include: {
            records: {
              where: dateFilter,
              orderBy: { date: 'desc' },
              take: 1
            },
            _count: {
              select: { records: true }
            }
          }
        }
      },
      orderBy: { order: 'asc' }
    });

    // Get workflow statistics
    const totalContacts = await prisma.contact.count();
    const activeWorkflows = await prisma.workflowProgress.count({
      where: { completed: false }
    });
    const pendingTasks = await prisma.task.count({
      where: { status: 'PENDING' }
    });

    res.json({
      missionPoints,
      statistics: {
        totalContacts,
        activeWorkflows,
        pendingTasks
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get KPI trends
router.get('/kpi-trends/:kpiId', async (req, res) => {
  try {
    const { kpiId } = req.params;
    const { startDate, endDate, groupBy = 'day' } = req.query;

    const where: any = { kpiId };
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    }

    const records = await prisma.kPIRecord.findMany({
      where,
      orderBy: { date: 'asc' }
    });

    // Group records by time period
    const grouped: Record<string, { date: string; value: number; count: number }> = {};

    records.forEach(record => {
      const date = new Date(record.date);
      let key: string;

      if (groupBy === 'month') {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      } else if (groupBy === 'week') {
        const week = Math.ceil(date.getDate() / 7);
        key = `${date.getFullYear()}-W${String(week).padStart(2, '0')}`;
      } else {
        key = date.toISOString().split('T')[0];
      }

      if (!grouped[key]) {
        grouped[key] = { date: key, value: 0, count: 0 };
      }
      grouped[key].value += record.value;
      grouped[key].count += 1;
    });

    const trends = Object.values(grouped).map(item => ({
      date: item.date,
      value: item.value / item.count // Average value
    }));

    res.json(trends);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
