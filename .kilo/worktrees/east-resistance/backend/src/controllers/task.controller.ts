import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { prisma } from '../config/db';

export const getCatalog = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        tasks: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    res.status(200).json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch task catalogue', error });
  }
};

export const selectTasks = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  const { taskIds }: { taskIds: string[] } = req.body;

  if (!userId) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  try {
    await prisma.$transaction([
      prisma.userTask.deleteMany({ where: { userId } }),
      prisma.userTask.createMany({
        data: taskIds.map((taskId) => ({
          userId,
          taskId,
        })),
      }),
    ]);

    const selectedTasks = await prisma.userTask.findMany({
      where: { userId },
      include: {
        task: {
          include: { category: true },
        },
      },
    });

    res.status(200).json({
      success: true,
      message: 'Tasks updated successfully',
      tasks: selectedTasks.map((st) => st.task),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update selected tasks', error });
  }
};

export const getSelectedTasks = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.userId;

  try {
    const selected = await prisma.userTask.findMany({
      where: { userId },
      include: {
        task: {
          include: { category: true },
        },
      },
    });

    res.status(200).json({
      success: true,
      tasks: selected.map((s) => s.task),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch user tasks', error });
  }
};