const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        results.push(file);
      }
    }
  });
  return results;
}

const BASE = 'd:/Akshaya_Projects/Fieldeaze/filedeaze-next-frontend/src';

const files = [
  ...walk(BASE + '/app'),
  ...walk(BASE + '/components'),
];

// Focused replacements: semantic color backgrounds -> surface-elevated
const replacements = [
  // Semantic icon container backgrounds -> surface-elevated (more precise than plain colors)
  [/\bbg-emerald-50\b/g, 'bg-[var(--color-surface-elevated)]'],
  [/\bbg-amber-50\b/g, 'bg-[var(--color-surface-elevated)]'],
  [/\bbg-blue-50\b/g, 'bg-[var(--color-surface-elevated)]'],
  [/\bbg-violet-50\b/g, 'bg-[var(--color-surface-elevated)]'],
  [/\bbg-red-50\b/g, 'bg-[var(--color-surface-elevated)]'],
  [/\bbg-green-50\b/g, 'bg-[var(--color-surface-elevated)]'],
  [/\bbg-indigo-50\b/g, 'bg-[var(--color-surface-elevated)]'],
  [/\bbg-teal-50\b/g, 'bg-[var(--color-surface-elevated)]'],
  [/\bbg-slate-400\b/g, 'bg-[var(--color-surface-elevated)]'],
  // Light borders that are hardcoded
  [/\bborder-gray-300\b/g, 'border-[var(--color-border-strong)]'],
  // bg-gray-200/300 sometimes used for dividers or progress bars
  [/\bbg-gray-200\b/g, 'bg-[var(--color-border)]'],
  [/\bbg-gray-300\b/g, 'bg-[var(--color-border-strong)]'],
];

let updatedCount = 0;

files.forEach(file => {
  // Skip login pages since they have intentional dark backgrounds 
  if (file.includes('\\login\\') || file.includes('/login/')) return;
  
  let content = fs.readFileSync(file, 'utf8');
  let newContent = content;
  
  replacements.forEach(([pattern, replacement]) => {
    newContent = newContent.replace(pattern, replacement);
  });
  
  if (content !== newContent) {
    fs.writeFileSync(file, newContent, 'utf8');
    console.log(`Updated: ${path.relative(BASE, file)}`);
    updatedCount++;
  }
});

console.log(`\nDone! Updated ${updatedCount} files.`);
