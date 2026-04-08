import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

const files = execSync('dir /s /b src\\*.tsx src\\*.ts src\\*.css').toString().split('\n').filter(Boolean);

let changedFiles = 0;

for (const file of files) {
  const filePath = file.trim();
  if (!filePath) continue;
  try {
    let content = readFileSync(filePath, 'utf-8');
    const original = content;

    // Replace gradients
    content = content.replace(/linear-gradient\(135deg, #1a1a2e, #16213e\)/g, 'linear-gradient(135deg, #7a1b32, #5c1425)');
    content = content.replace(/linear-gradient\(135deg, #8a1538 0%, #5c0e26 50%, #1a1a2e 100%\)/g, 'linear-gradient(135deg, #7a1b32 0%, #5c1425 50%, #3e0c17 100%)');
    content = content.replace(/linear-gradient\(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%\)/g, 'linear-gradient(180deg, #7a1b32 0%, #5c1425 50%, #3e0c17 100%)');
    content = content.replace(/linear-gradient\(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%\)/g, 'linear-gradient(135deg, #7a1b32 0%, #5c1425 50%, #3e0c17 100%)');
    content = content.replace(/linear-gradient\(135deg, #1a1a2e, #8a1538\)/g, 'linear-gradient(135deg, #7a1b32, #5c1425)');
    
    // Replace hex codes
    content = content.replace(/#1a1a2e/gi, '#7a1b32');
    content = content.replace(/#16213e/gi, '#5c1425');
    content = content.replace(/#0f3460/gi, '#3e0c17');
    
    // Replace red theme to new maroon
    content = content.replace(/#8a1538/gi, '#7a1b32');
    
    // Replace container backgrounds to cream
    content = content.replace(/bg-gray-50/g, 'bg-[#fdfaf6]');
    content = content.replace(/bg-gray-100/g, 'bg-[#f8f5f0]');

    // Replace button hovers to gold
    content = content.replace(/hover:bg-red-700/g, 'hover:bg-[#5c1425]');
    content = content.replace(/hover:bg-[#8a1538]/g, 'hover:bg-[#5c1425]');
    
    if (content !== original) {
      writeFileSync(filePath, content, 'utf-8');
      changedFiles++;
      console.log('Updated:', filePath);
    }
  } catch(e) {
    // console.error('Error with file', filePath, e.message);
  }
}

console.log(`Updated ${changedFiles} files with new theme.`);
