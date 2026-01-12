import { getAllSubjects } from './server/db.ts';

console.log('Checking subjects in database...\n');

try {
  const subjects = await getAllSubjects();
  
  console.log(`Found ${subjects.length} subjects:\n`);
  
  subjects.forEach((s, i) => {
    console.log(`${i + 1}. code: "${s.code}" | name: "${s.name}"`);
  });
  
  console.log('\n=== Checking for matematica_per_biologia ===');
  const found = subjects.find(s => s.code === 'matematica_per_biologia');
  if (found) {
    console.log('✓ Found:', found);
  } else {
    console.log('✗ NOT FOUND');
    console.log('Available codes:', subjects.map(s => s.code).join(', '));
  }
  
} catch (error) {
  console.error('Error:', error);
}
