import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { successResponse } from '../utils/response';

const router = Router();

// GET /api/chapters - List all chapters (optionally filtered by subject and grade)
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { subject: subjectId, grade } = req.query;

    const where: any = {};
    if (subjectId) {
      where.subjectId = subjectId as string;
    }
    if (grade) {
      where.grade = parseInt(grade as string, 10);
    }

    const chapters = await prisma.chapter.findMany({
      where,
      select: {
        id: true,
        name: true,
        grade: true,
        orderIndex: true,
        subject: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        { orderIndex: 'asc' },
      ],
    });

    return successResponse(res, chapters);
  } catch (error) {
    next(error);
  }
});

export default router;
