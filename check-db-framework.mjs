import { getAllSubjects, getActiveFramework } from './server/db.ts';

console.log('Checking framework in database...\n');

try {
  const subjects = await getAllSubjects();
  const economiaPolitica = subjects.find(s => s.code === 'economia_politica');
  
  if (!economiaPolitica) {
    console.log('✗ Subject economia_politica not found');
    process.exit(1);
  }
  
  console.log('✓ Found subject:', economiaPolitica.name);
  console.log('  ID:', economiaPolitica.id);
  console.log('');
  
  const framework = await getActiveFramework(economiaPolitica.id);
  
  if (!framework) {
    console.log('✗ No active framework found');
    process.exit(1);
  }
  
  console.log('✓ Found framework');
  console.log('  Version:', framework.version);
  console.log('  Created:', framework.createdAt);
  console.log('  Updated:', framework.updatedAt);
  console.log('');
  
  const jsonString = JSON.stringify(framework.content, null, 2);
  const lines = jsonString.split('\n');
  
  console.log('=== Content Analysis ===');
  console.log('Total lines:', lines.length);
  console.log('Total characters:', jsonString.length);
  console.log('Total bytes:', Buffer.from(jsonString).length);
  console.log('');
  console.log('First 3 lines:');
  console.log(lines.slice(0, 3).join('\n'));
  console.log('...');
  console.log('Last 3 lines:');
  console.log(lines.slice(-3).join('\n'));
  console.log('');
  
  // Check if complete
  const startsCorrect = jsonString.trim().startsWith('{');
  const endsCorrect = jsonString.trim().endsWith('}');
  
  console.log('=== Validation ===');
  console.log('Starts with {:', startsCorrect ? '✓' : '✗');
  console.log('Ends with }:', endsCorrect ? '✓' : '✗');
  console.log('');
  
  if (startsCorrect && endsCorrect) {
    console.log('✓ Content appears complete');
  } else {
    console.log('✗ Content is TRUNCATED');
    console.log('');
    console.log('Expected: 554 lines from Dropbox');
    console.log('Got:', lines.length, 'lines in database');
  }
  
} catch (error) {
  console.error('Error:', error);
}
