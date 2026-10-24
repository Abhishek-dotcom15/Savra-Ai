import * as dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// Subject name mappings (database name -> config file names)
const SUBJECT_NAME_MAPPINGS: Record<string, string[]> = {
  'Maths': ['Mathematics'],
  'Mathematics': ['Maths'],
  'Civics': ['Political Science (Civics)'],
  'Political Science': ['Political Science (Civics)'],
  'History': ['History'],
  'Geography': ['Geography'],
  'Economics': ['Economics'],
  'Hindi': ['Hindi'],
  'Social Science': ['Social Science'],
  'Information Practices': ['Informatics Practices'],
  'Informatics Practices': ['Information Practices'],
  'Music': ['Hindustani Music'],
  'Hindustani Music': ['Music'],
};

// Subject code mappings (for creating new subjects)
const SUBJECT_CODE_MAPPINGS: Record<string, string> = {
  'Mathematics': 'MATH',
  'Maths': 'MATH',
  'Science': 'SCI',
  'English': 'ENG',
  'Hindi': 'HIN',
  'History': 'HIST',
  'Geography': 'GEO',
  'Political Science (Civics)': 'CIV',
  'Civics': 'CIV',
  'Political Science': 'CIV',
  'Social Science': 'SOC',
  'Physics': 'PHY',
  'Chemistry': 'CHEM',
  'Biology': 'BIO',
  'Economics': 'ECO',
  'Computer Science': 'CS',
  'Information Practices': 'IP',
  'Informatics Practices': 'IP',
  'Physical Education': 'PE',
  'Accountancy': 'ACC',
  'Hindustani Music': 'HM',
  'Psychology': 'PSY',
  'Sociology': 'SOCI',
  'Legal Studies': 'LEG',
};

interface ChaptersData {
  metadata: {
    source: string;
    totalClasses: number;
    totalSubjects: number;
    totalChapters: number;
  };
  classes: {
    [className: string]: {
      classNumber: number;
      subjects: {
        [subjectName: string]: {
          chapters: string[];
          totalChapters: number;
          parts?: {
            [partName: string]: string[];
          };
        };
      };
    };
  };
}

async function seedChapters() {
  console.log('Starting chapter seeding with grade support...\n');

  // Read chapters data
  const chaptersDataPath = path.join(__dirname, 'chapters-data.json');
  const chaptersData: ChaptersData = JSON.parse(fs.readFileSync(chaptersDataPath, 'utf-8'));

  console.log(`Loaded ${chaptersData.metadata.totalChapters} chapters from config\n`);

  // Extract all unique subjects from the JSON data
  const allSubjectsFromJson = new Set<string>();
  for (const classData of Object.values(chaptersData.classes)) {
    for (const subjectName of Object.keys(classData.subjects)) {
      allSubjectsFromJson.add(subjectName);
    }
  }

  console.log(`Found ${allSubjectsFromJson.size} unique subjects in JSON: ${Array.from(allSubjectsFromJson).join(', ')}\n`);

  // Get all existing subjects from database
  const existingSubjects = await prisma.subject.findMany({
    select: {
      id: true,
      name: true,
      code: true,
    },
  });

  console.log(`Found ${existingSubjects.length} existing subjects in database\n`);

  // Create missing subjects
  const existingSubjectNames = new Set(existingSubjects.map(s => s.name));
  const subjectsToCreate: { name: string; code: string }[] = [];

  for (const subjectName of allSubjectsFromJson) {
    // Check if subject exists (with name mapping)
    let exists = false;
    for (const [dbName, jsonNames] of Object.entries(SUBJECT_NAME_MAPPINGS)) {
      if (jsonNames.includes(subjectName) && existingSubjectNames.has(dbName)) {
        exists = true;
        break;
      }
    }
    if (!exists && !existingSubjectNames.has(subjectName)) {
      const code = SUBJECT_CODE_MAPPINGS[subjectName] || subjectName.substring(0, 4).toUpperCase();
      subjectsToCreate.push({ name: subjectName, code });
    }
  }

  if (subjectsToCreate.length > 0) {
    console.log(`Creating ${subjectsToCreate.length} missing subjects...`);
    for (const subject of subjectsToCreate) {
      try {
        await prisma.subject.create({
          data: {
            name: subject.name,
            code: subject.code,
          },
        });
        console.log(`  ✓ Created subject: ${subject.name} (${subject.code})`);
      } catch (error: any) {
        if (error.code === 'P2002') {
          console.log(`  ⚠ Subject ${subject.name} already exists (code conflict)`);
        } else {
          console.error(`  ✗ Error creating ${subject.name}:`, error.message);
        }
      }
    }
    console.log('');
  }

  // Refresh subjects list
  const subjects = await prisma.subject.findMany({
    select: {
      id: true,
      name: true,
    },
  });

  console.log(`Total subjects available: ${subjects.length}\n`);

  // First, delete all existing chapters to start fresh
  console.log('Deleting existing chapters...');
  await prisma.chapter.deleteMany({});
  console.log('Existing chapters deleted.\n');

  let totalCreated = 0;

  // For each class (grade)
  for (const [className, classData] of Object.entries(chaptersData.classes)) {
    const grade = classData.classNumber;
    console.log(`\n--- Processing ${className} (Grade ${grade}) ---`);

    // For each subject in the database
    for (const subject of subjects) {
      // Get possible names for this subject (exact + mappings)
      const possibleNames = [subject.name, ...(SUBJECT_NAME_MAPPINGS[subject.name] || [])];

      // Try to find matching subject in config
      let subjectData = null;
      for (const name of possibleNames) {
        if (classData.subjects[name]) {
          subjectData = classData.subjects[name];
          break;
        }
      }

      if (!subjectData) continue;

      const chaptersToCreate: { name: string; orderIndex: number }[] = [];

      // Handle subjects with parts (like Physics Part 1, Part 2)
      // Parts can be under a "parts" key or directly as "part1", "part2", etc.
      const rawData = subjectData as any;
      if (rawData.parts) {
        for (const [, partChapters] of Object.entries(rawData.parts)) {
          for (const chapterName of (partChapters as string[])) {
            chaptersToCreate.push({
              name: chapterName,
              orderIndex: chaptersToCreate.length + 1,
            });
          }
        }
      } else if (rawData.part1 || rawData.part2) {
        // Handle flat part1/part2 keys directly on the subject
        for (const [key, value] of Object.entries(rawData)) {
          if (key.startsWith('part') && Array.isArray(value)) {
            for (const chapterName of (value as string[])) {
              chaptersToCreate.push({
                name: chapterName,
                orderIndex: chaptersToCreate.length + 1,
              });
            }
          }
        }
      } else if (subjectData.chapters) {
        for (const chapterName of subjectData.chapters) {
          chaptersToCreate.push({
            name: chapterName,
            orderIndex: chaptersToCreate.length + 1,
          });
        }
      }

      if (chaptersToCreate.length === 0) continue;

      // Create chapters with grade
      const result = await prisma.chapter.createMany({
        data: chaptersToCreate.map((c) => ({
          subjectId: subject.id,
          name: c.name,
          grade: grade,
          orderIndex: c.orderIndex,
        })),
        skipDuplicates: true,
      });

      if (result.count > 0) {
        console.log(`  ${subject.name}: ${result.count} chapters`);
        totalCreated += result.count;
      }
    }
  }

  console.log('\n-------------------');
  console.log(`Seeding complete!`);
  console.log(`Total chapters created: ${totalCreated}`);
}

seedChapters()
  .catch((e) => {
    console.error('Error seeding chapters:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
