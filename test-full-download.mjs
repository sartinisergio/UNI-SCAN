import { downloadDropboxFile } from './server/services/dropbox.ts';
import fs from 'fs';

const userId = 1;
const filePath = '/1_framework/framework_Economia_politica.json';

console.log('Testing full download from Dropbox...');
console.log('File:', filePath);
console.log('');

try {
  console.log('Downloading...');
  const content = await downloadDropboxFile(userId, filePath);
  
  const jsonString = JSON.stringify(content, null, 2);
  const lines = jsonString.split('\n');
  
  console.log('✓ Download completed');
  console.log('');
  console.log('=== Content Analysis ===');
  console.log('Type:', typeof content);
  console.log('Total lines:', lines.length);
  console.log('Total characters:', jsonString.length);
  console.log('Total bytes:', Buffer.from(jsonString).length);
  console.log('');
  console.log('First line:', lines[0]);
  console.log('Last line:', lines[lines.length - 1]);
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
  }
  
  // Save to file
  fs.writeFileSync('/home/ubuntu/downloaded-economia.json', jsonString);
  console.log('');
  console.log('✓ Saved to /home/ubuntu/downloaded-economia.json');
  console.log('You can inspect it with: cat /home/ubuntu/downloaded-economia.json | head -20');
  console.log('And: cat /home/ubuntu/downloaded-economia.json | tail -20');
  
} catch (error) {
  console.error('✗ Error:', error.message);
  if (error.cause) {
    console.error('Cause:', error.cause);
  }
}
