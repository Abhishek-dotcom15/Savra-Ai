import { CLASS_CHAPTERS } from '../../frontend/src/lib/chapters-config';

// Extract and display all chapters organized by class and subject
function extractAllChapters() {
  const output: string[] = [];
  
  // Sort classes numerically
  const classNumbers = Object.keys(CLASS_CHAPTERS)
    .map(Number)
    .sort((a, b) => a - b);
  
  for (const classNum of classNumbers) {
    output.push(`\n${'='.repeat(80)}`);
    output.push(`CLASS ${classNum}`);
    output.push('='.repeat(80));
    
    const classData = CLASS_CHAPTERS[classNum];
    const subjects = Object.keys(classData).sort();
    
    for (const subject of subjects) {
      output.push(`\n📚 ${subject}`);
      output.push('-'.repeat(80));
      
      const chaptersData = classData[subject];
      
      // Check if chapters are organized by parts (for classes 11-12)
      if (typeof chaptersData === 'object' && 'part1' in chaptersData) {
        const parts = chaptersData as { part1?: string[]; part2?: string[] };
        
        if (parts.part1 && parts.part1.length > 0) {
          output.push(`\n  Part 1:`);
          parts.part1.forEach((chapter, index) => {
            output.push(`    ${index + 1}. ${chapter}`);
          });
        }
        
        if (parts.part2 && parts.part2.length > 0) {
          output.push(`\n  Part 2:`);
          parts.part2.forEach((chapter, index) => {
            output.push(`    ${index + 1}. ${chapter}`);
          });
        }
      } else {
        // Simple array format
        const chapters = chaptersData as string[];
        chapters.forEach((chapter, index) => {
          output.push(`  ${index + 1}. ${chapter}`);
        });
      }
    }
  }
  
  return output.join('\n');
}

// Generate summary statistics
function generateSummary() {
  const summary: string[] = [];
  summary.push('\n' + '='.repeat(80));
  summary.push('SUMMARY STATISTICS');
  summary.push('='.repeat(80));
  
  const classNumbers = Object.keys(CLASS_CHAPTERS)
    .map(Number)
    .sort((a, b) => a - b);
  
  let totalSubjects = 0;
  let totalChapters = 0;
  
  for (const classNum of classNumbers) {
    const classData = CLASS_CHAPTERS[classNum];
    const subjects = Object.keys(classData);
    totalSubjects += subjects.length;
    
    let classChapterCount = 0;
    for (const subject of subjects) {
      const chaptersData = classData[subject];
      
      if (typeof chaptersData === 'object' && 'part1' in chaptersData) {
        const parts = chaptersData as { part1?: string[]; part2?: string[] };
        classChapterCount += (parts.part1?.length || 0) + (parts.part2?.length || 0);
      } else {
        classChapterCount += (chaptersData as string[]).length;
      }
    }
    
    totalChapters += classChapterCount;
    summary.push(`\nClass ${classNum}: ${subjects.length} subjects, ${classChapterCount} chapters`);
  }
  
  summary.push(`\n${'='.repeat(80)}`);
  summary.push(`TOTAL: ${classNumbers.length} classes, ${totalSubjects} subjects, ${totalChapters} chapters`);
  summary.push('='.repeat(80));
  
  return summary.join('\n');
}

// Main execution
const allChapters = extractAllChapters();
const summary = generateSummary();

console.log(allChapters);
console.log(summary);

// Export for use in other scripts
export { extractAllChapters, generateSummary };
