import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import * as admin from 'firebase-admin';
import prisma from '../lib/prisma';
import { validate } from '../middleware/validate';
import {
  authMiddleware,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../middleware/auth';
import { registerSchema, loginSchema, refreshTokenSchema, deleteAccountSchema, googleAuthSchema } from '../schemas/auth';
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  notFoundResponse,
} from '../utils/response';

const router = Router();

// POST /api/auth/register
router.post(
  '/register',
  validate(registerSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password, name, role, schoolCode, classId, location } = req.body;

      // Password is required for non-Google users
      if (!password) {
        return errorResponse(res, 'Password is required', 400, 'VALIDATION_ERROR');
      }

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return errorResponse(res, 'User with this email already exists', 400, 'DUPLICATE_ENTRY');
      }

      // Resolve school: teachers without schoolCode use dummy default SAVRA001
      // Students and admins can optionally provide schoolCode
      let school = null;
      if (schoolCode) {
        school = await prisma.school.findUnique({
          where: { code: schoolCode },
        });

        if (!school) {
          return errorResponse(
            res,
            'Invalid school code',
            400,
            'INVALID_SCHOOL_CODE'
          );
        }
      } else if (role === 'teacher') {
        // Teachers without schoolCode use default SAVRA001
        const schoolCodeToUse = 'SAVRA001';
        school = await prisma.school.findUnique({
          where: { code: schoolCodeToUse },
        });

        if (!school) {
          return errorResponse(
            res,
            'Default school not configured. Please run db:seed.',
            400,
            'INVALID_SCHOOL_CODE'
          );
        }
      } else if (role === 'admin') {
        // Admins require schoolCode
        return errorResponse(
          res,
          'School code is required for admins',
          400,
          'VALIDATION_ERROR'
        );
      }

      // For students, validate classId if provided, or prepare to assign to default class
      let studentClassId: string | null = null;
      if (role === 'student') {
        if (classId) {
          // Validate provided classId
          const classExists = await prisma.class.findUnique({
            where: { id: classId },
          });

          if (!classExists) {
            return errorResponse(res, 'Invalid class ID', 400, 'INVALID_CLASS_ID');
          }
          studentClassId = classId;
        }
        // If no classId provided, we'll assign to default class in transaction
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 12);

      // Create user with role-specific profile in a transaction
      const user = await prisma.$transaction(async (tx) => {
        // Create base user
        const newUser = await tx.user.create({
          data: {
            email,
            passwordHash,
            name,
            role,
          },
        });

        // Create role-specific profile
        if (role === 'teacher') {
          if (!school) {
            throw new Error('School is required for teacher registration');
          }
          await tx.teacher.create({
            data: {
              userId: newUser.id,
              schoolId: school.id,
              location: location || null,
            },
          });
        } else if (role === 'student') {
          let finalClassId = studentClassId;

          // If no classId provided, assign to default class in Savra International School
          if (!finalClassId) {
            // Find Savra International School (SAVRA001)
            const savraSchool = await tx.school.findUnique({
              where: { code: 'SAVRA001' },
              include: {
                classes: {
                  where: { section: 'A' },
                  orderBy: [{ grade: 'asc' }],
                  take: 1, // Get the first section A class (lowest grade)
                },
              },
            });

            if (!savraSchool) {
              throw new Error('Default school not configured. Please run db:seed.');
            }

            // Use the first available class in Savra International School
            if (savraSchool.classes.length > 0) {
              finalClassId = savraSchool.classes[0].id;
            } else {
              // If no classes exist, create a default class (Grade 1, Section A)
              const defaultClass = await tx.class.create({
                data: {
                  schoolId: savraSchool.id,
                  grade: 1,
                  section: 'A',
                  name: 'Class 1-A',
                },
              });
              finalClassId = defaultClass.id;
            }
          }

          await tx.student.create({
            data: {
              userId: newUser.id,
              classId: finalClassId,
            },
          });
        } else if (role === 'admin') {
          if (!school) {
            throw new Error('School is required for admin registration');
          }
          await tx.admin.create({
            data: {
              userId: newUser.id,
              schoolId: school.id,
            },
          });
        }

        return newUser;
      });

      // Generate tokens
      const tokenPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
      };

      const accessToken = generateAccessToken(tokenPayload);
      const refreshToken = generateRefreshToken(tokenPayload);

      // New teachers need onboarding
      const onboardingCompleted = role !== 'teacher' ? true : false;

      return successResponse(
        res,
        {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            avatarUrl: user.avatarUrl,
            onboardingCompleted,
          },
          accessToken,
          refreshToken,
        },
        201
      );
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/auth/login
router.post(
  '/login',
  validate(loginSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;

      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        return unauthorizedResponse(res, 'Invalid email or password');
      }

      // Check if account is deleted
      if (user.deletedAt) {
        return errorResponse(
          res,
          'This account has been deleted. Please contact support if you wish to recover it.',
          403,
          'ACCOUNT_DELETED'
        );
      }

      // Check if user has a password (Google users don't have passwords)
      if (!user.passwordHash) {
        return unauthorizedResponse(res, 'This account uses Google sign-in. Please sign in with Google.');
      }

      // Verify password (passwordHash is guaranteed to be non-null after the check above)
      const passwordHash = user.passwordHash;
      const isPasswordValid = await bcrypt.compare(password, passwordHash);

      if (!isPasswordValid) {
        return unauthorizedResponse(res, 'Invalid email or password');
      }

      // Generate tokens
      const tokenPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
      };

      const accessToken = generateAccessToken(tokenPayload);
      const refreshToken = generateRefreshToken(tokenPayload);

      // Check onboarding status for teachers
      let onboardingCompleted = true; // Default to true for non-teachers
      if (user.role === 'teacher') {
        const teacher = await prisma.teacher.findUnique({
          where: { userId: user.id },
          select: { onboardingCompleted: true },
        });
        onboardingCompleted = teacher?.onboardingCompleted ?? false;
      }

      return successResponse(res, {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatarUrl: user.avatarUrl,
          onboardingCompleted,
        },
        accessToken,
        refreshToken,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Initialize Firebase Admin (lazy initialization)
let firebaseAdminInitialized = false;
function initializeFirebaseAdmin() {
  if (firebaseAdminInitialized || admin.apps.length > 0) {
    firebaseAdminInitialized = true;
    return;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || 'savra-ai';
  
  try {
    // Initialize with project ID - this works for token verification
    // Firebase Admin will automatically fetch public keys for verification
    admin.initializeApp({
      projectId,
    });
    firebaseAdminInitialized = true;
    console.log('Firebase Admin initialized successfully with project:', projectId);
  } catch (error: any) {
    // If already initialized, that's fine
    if (error.code !== 'app/duplicate-app') {
      console.error('Firebase Admin initialization error:', error);
    } else {
      firebaseAdminInitialized = true;
    }
  }
}

// POST /api/auth/google
router.post(
  '/google',
  validate(googleAuthSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { idToken, role } = req.body;

      // Initialize Firebase Admin if not already done
      initializeFirebaseAdmin();

      try {
        // Verify the Firebase ID token using Firebase Admin SDK
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        
        const googleId = decodedToken.uid;
        const email = decodedToken.email;
        const name = decodedToken.name || decodedToken.email?.split('@')[0] || 'User';
        const picture = decodedToken.picture || null;

        if (!email || !name || !googleId) {
          return errorResponse(res, 'Missing required user information from Google', 400, 'INVALID_TOKEN');
        }

        // Check if user exists by email or googleId
        const existingUser = await prisma.user.findFirst({
          where: {
            OR: [
              { email },
              { googleId },
            ],
          },
        });

        // Resolve school: teachers use default SAVRA001
        const schoolCodeToUse = role === 'teacher' ? 'SAVRA001' : undefined;
        const school = schoolCodeToUse
          ? await prisma.school.findUnique({
              where: { code: schoolCodeToUse },
            })
          : null;

        if (!school && role === 'teacher') {
          return errorResponse(
            res,
            'Default school not configured. Please run db:seed.',
            400,
            'INVALID_SCHOOL_CODE'
          );
        }

        let user;
        let onboardingCompleted = false;

        if (existingUser) {
          // Check if existing user's role matches requested role
          if (existingUser.role !== role) {
            const roleMessage = existingUser.role === 'teacher' 
              ? 'This Google account is registered as a teacher. Please use the teacher login page.'
              : 'This Google account is registered as a student. Please use the student login page.';
            return errorResponse(res, roleMessage, 400, 'ROLE_MISMATCH');
          }

          // User exists - update googleId if missing, then login
          if (!existingUser.googleId) {
            await prisma.user.update({
              where: { id: existingUser.id },
              data: { googleId },
            });
          }

          // Update avatar if available and not set
          if (picture && !existingUser.avatarUrl) {
            await prisma.user.update({
              where: { id: existingUser.id },
              data: { avatarUrl: picture },
            });
          }

          user = await prisma.user.findUnique({
            where: { id: existingUser.id },
          });

          // Check onboarding status for teachers
          if (user && user.role === 'teacher') {
            const teacher = await prisma.teacher.findUnique({
              where: { userId: user.id },
              select: { onboardingCompleted: true },
            });
            onboardingCompleted = teacher?.onboardingCompleted ?? false;
          } else {
            onboardingCompleted = true;
          }
        } else {
          // New user - create account
          user = await prisma.$transaction(async (tx) => {
            // Create base user
            const newUser = await tx.user.create({
              data: {
                email,
                passwordHash: null, // No password for Google users
                googleId,
                name,
                role,
                avatarUrl: picture || null,
              },
            });

            // Create role-specific profile
            if (role === 'teacher') {
              if (school) {
                await tx.teacher.create({
                  data: {
                    userId: newUser.id,
                    schoolId: school.id,
                    location: null,
                  },
                });
              }
            } else if (role === 'student') {
              // Find Savra International School (SAVRA001)
              const savraSchool = await tx.school.findUnique({
                where: { code: 'SAVRA001' },
                include: {
                  classes: {
                    where: { section: 'A' },
                    orderBy: [{ grade: 'asc' }],
                    take: 1, // Get the first section A class (lowest grade)
                  },
                },
              });

              if (!savraSchool) {
                throw new Error('Default school not configured. Please run db:seed.');
              }

              let finalClassId: string | null = null;

              // Use the first available class in Savra International School
              if (savraSchool.classes.length > 0) {
                finalClassId = savraSchool.classes[0].id;
              } else {
                // If no classes exist, create a default class (Grade 1, Section A)
                const defaultClass = await tx.class.create({
                  data: {
                    schoolId: savraSchool.id,
                    grade: 1,
                    section: 'A',
                    name: 'Class 1-A',
                  },
                });
                finalClassId = defaultClass.id;
              }

              await tx.student.create({
                data: {
                  userId: newUser.id,
                  classId: finalClassId,
                },
              });
            }

            return newUser;
          });

          // New teachers need onboarding, students don't
          onboardingCompleted = role === 'teacher' ? false : true;
        }

        if (!user) {
          return errorResponse(res, 'Failed to create or retrieve user', 500, 'INTERNAL_ERROR');
        }

        // Generate tokens
        const tokenPayload = {
          userId: user.id,
          email: user.email,
          role: user.role,
        };

        const accessToken = generateAccessToken(tokenPayload);
        const refreshToken = generateRefreshToken(tokenPayload);

        return successResponse(res, {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            avatarUrl: user.avatarUrl,
            onboardingCompleted,
          },
          accessToken,
          refreshToken,
        });
      } catch (error) {
        console.error('Firebase token verification error:', error);
        return unauthorizedResponse(res, 'Invalid Google ID token');
      }
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/auth/me
router.get('/me', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const role = req.user!.role;

    // Get base user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    if (!user) {
      return notFoundResponse(res, 'User not found');
    }

    // Get role-specific profile
    let profile: Record<string, unknown> = {};

    if (role === 'teacher') {
      const teacher = await prisma.teacher.findUnique({
        where: { userId },
        select: {
          id: true,
          location: true,
          teacherRole: true,
          onboardingCompleted: true,
          school: {
            select: { id: true, name: true, code: true },
          },
          subjects: {
            select: {
              subject: { select: { id: true, name: true } },
            },
          },
          classes: {
            where: { class: { section: 'A' } },
            select: {
              class: { select: { id: true, name: true, grade: true, section: true } },
            },
          },
        },
      });

      if (teacher) {
        profile = {
          teacherId: teacher.id,
          location: teacher.location,
          teacherRole: teacher.teacherRole,
          onboardingCompleted: teacher.onboardingCompleted,
          school: teacher.school,
          subjects: teacher.subjects.map((s) => s.subject),
          classes: teacher.classes.map((c) => c.class),
        };
      }
    } else if (role === 'student') {
      const student = await prisma.student.findUnique({
        where: { userId },
        select: {
          id: true,
          rollNumber: true,
          totalPoints: true,
          class: {
            select: {
              id: true,
              name: true,
              grade: true,
              section: true,
              school: { select: { id: true, name: true } },
            },
          },
          subjects: {
            select: {
              subject: { select: { id: true, name: true, code: true } },
            },
          },
        },
      });

      if (student) {
        profile = {
          studentId: student.id,
          rollNumber: student.rollNumber,
          totalPoints: student.totalPoints,
          class: student.class || null,
          subjects: student.subjects.map((s) => s.subject),
        };
      }
    } else if (role === 'admin') {
      const admin = await prisma.admin.findUnique({
        where: { userId },
        select: {
          id: true,
          school: { select: { id: true, name: true, code: true } },
        },
      });

      if (admin) {
        profile = {
          adminId: admin.id,
          school: admin.school,
        };
      }
    }

    return successResponse(res, {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
      profile,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/logout
router.post('/logout', authMiddleware, async (_req: Request, res: Response) => {
  // For JWT, logout is handled client-side by removing the token
  // Optionally, you could implement a token blacklist here
  return successResponse(res, { message: 'Logged out successfully' });
});

// POST /api/auth/refresh-token
router.post(
  '/refresh-token',
  validate(refreshTokenSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { refreshToken } = req.body;

      // Verify refresh token
      let decoded;
      try {
        decoded = verifyRefreshToken(refreshToken);
      } catch {
        return unauthorizedResponse(res, 'Invalid or expired refresh token');
      }

      // Check if user still exists
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      if (!user) {
        return unauthorizedResponse(res, 'User not found');
      }

      // Generate new tokens
      const tokenPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
      };

      const newAccessToken = generateAccessToken(tokenPayload);
      const newRefreshToken = generateRefreshToken(tokenPayload);

      return successResponse(res, {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/auth/account - Soft delete user account
router.delete(
  '/account',
  authMiddleware,
  validate(deleteAccountSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { password } = req.body;

      // Get user with password hash
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return notFoundResponse(res, 'User not found');
      }

      // Check if already deleted
      if (user.deletedAt) {
        return errorResponse(res, 'Account is already scheduled for deletion', 400, 'ALREADY_DELETED');
      }

      // Check if user has a password (Google users don't have passwords)
      if (!user.passwordHash) {
        return errorResponse(res, 'Google-authenticated accounts cannot be deleted using password verification. Please contact support.', 400, 'GOOGLE_USER');
      }

      // Verify password (passwordHash is guaranteed to be non-null after the check above)
      const passwordHash = user.passwordHash;
      const isPasswordValid = await bcrypt.compare(password, passwordHash);
      if (!isPasswordValid) {
        return unauthorizedResponse(res, 'Invalid password');
      }

      // Soft delete - set deletedAt timestamp
      await prisma.user.update({
        where: { id: userId },
        data: {
          deletedAt: new Date(),
        },
      });

      // Log deletion for audit purposes
      console.log(`Account deletion requested: User ${userId} (${user.email}) at ${new Date().toISOString()}`);

      return successResponse(res, {
        message: 'Account has been scheduled for deletion. You can recover your account within 30 days by contacting support.',
        deletedAt: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
