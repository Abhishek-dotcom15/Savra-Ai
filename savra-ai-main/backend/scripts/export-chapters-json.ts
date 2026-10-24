import { CLASS_CHAPTERS } from '../../frontend/src/lib/chapters-config';
import * as fs from 'fs';
import * as path from 'path';

// Export chapters as JSON for easy programmatic access
function exportChaptersToJSON() {
  const output: Record<string, any> = {};
  
  // Sort classes numerically
  const classNumbers = Object.keys(CLASS_CHAPTERS)
    .map(Number)
    .sort((a, b) => a - b);
  
  for (const classNum of classNumbers) {
    const classData = CLASS_CHAPTERS[classNum];
    const subjects: Record<string, any> = {};
    
    for (const [subjectName, chaptersData] of Object.entries(classData)) {
      // Check if chapters are organized by parts
      if (typeof chaptersData === 'object' && 'part1' in chaptersData) {
        const parts = chaptersData as { part1?: string[]; part2?: string[] };
        subjects[subjectName] = {
          part1: parts.part1 || [],
          part2: parts.part2 || [],
          totalChapters: (parts.part1?.length || 0) + (parts.part2?.length || 0)
        };
      } else {
        const chapters = chaptersData as string[];
        subjects[subjectName] = {
          chapters: chapters,
          totalChapters: chapters.length
        };
      }
    }
    
    output[`Class ${classNum}`] = {
      classNumber: classNum,
      subjects: subjects,
      totalSubjects: Object.keys(subjects).length,
      totalChapters: Object.values(subjects).reduce((sum: number, subj: any) => {
        return sum + (subj.totalChapters || 0);
      }, 0)
    };
  }
  
  // Add summary
  const totalClasses = classNumbers.length;
  const totalSubjects = Object.values(output).reduce((sum: number, cls: any) => sum + cls.totalSubjects, 0);
  const totalChapters = Object.values(output).reduce((sum: number, cls: any) => sum + cls.totalChapters, 0);
  
  const jsonOutput = {
    metadata: {
      source: "NCERT Curriculum - Classes 6-12",
      reference: "https://drive.google.com/drive/folders/1PJzK5mRmTbw9Jo4p2QxFUBcZNPKpDmAr",
      generatedAt: new Date().toISOString(),
      totalClasses,
      totalSubjects,
      totalChapters
    },
    classes: output
  };
  
  // Write to file
  const outputPath = path.join(__dirname, 'chapters-data.json');
  fs.writeFileSync(outputPath, JSON.stringify(jsonOutput, null, 2), 'utf-8');
  
  console.log(`✅ Chapters data exported to: ${outputPath}`);
  console.log(`\nSummary:`);
  console.log(`  - Classes: ${totalClasses}`);
  console.log(`  - Subjects: ${totalSubjects}`);
  console.log(`  - Chapters: ${totalChapters}`);
  
  return jsonOutput;
}

exportChaptersToJSON();
