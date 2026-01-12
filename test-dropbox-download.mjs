import { downloadDropboxFile } from './server/services/dropbox.ts';

// Test download del framework di Economia Politica
const userId = 1; // Admin user
const filePath = '/1_framework/framework_Economia_politica.json';

console.log('Downloading file from Dropbox:', filePath);

try {
  const content = await downloadDropboxFile(userId, filePath);
  
  console.log('\n=== File Content Analysis ===');
  console.log('Type:', typeof content);
  console.log('Is Object:', typeof content === 'object');
  console.log('Is Array:', Array.isArray(content));
  
  const jsonString = JSON.stringify(content, null, 2);
  const lines = jsonString.split('\n');
  
  console.log('\n=== JSON String Analysis ===');
  console.log('Total lines:', lines.length);
  console.log('Total characters:', jsonString.length);
  
  console.log('\n=== First 10 lines ===');
  console.log(lines.slice(0, 10).join('\n'));
  
  console.log('\n=== Last 10 lines ===');
  console.log(lines.slice(-10).join('\n'));
  
  // Check if it starts correctly
  if (jsonString.trim().startsWith('{')) {
    console.log('\n✓ JSON starts correctly with {');
  } else {
    console.log('\n✗ JSON does NOT start with {');
    console.log('First 100 chars:', jsonString.substring(0, 100));
  }
  
  // Save to file for inspection
  const fs = await import('fs');
  fs.writeFileSync('/home/ubuntu/downloaded-framework.json', jsonString);
  console.log('\n✓ Saved to /home/ubuntu/downloaded-framework.json');
  
} catch (error) {
  console.error('Error:', error);
}
