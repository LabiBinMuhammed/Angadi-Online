const fs = require('fs');
const path = require('path');

function getAllFiles(dir, exts = [], fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const items = fs.readdirSync(dir);
  for (const item of items) {
    if (['node_modules', '.next', '.git', 'build', '.dart_tool'].includes(item)) continue;
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      getAllFiles(fullPath, exts, fileList);
    } else if (!exts.length || exts.some(ext => item.endsWith(ext))) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

const rootDir = path.join(__dirname, '..', '..');

// 1. Next.js Routes and APIs
const webAppDir = path.join(rootDir, 'web', 'app');
const webFiles = getAllFiles(webAppDir, ['.tsx', '.ts']);
const webPages = webFiles.filter(f => f.endsWith('page.tsx')).map(f => path.relative(webAppDir, f).replace(/\\/g, '/'));
const webApiRoutes = webFiles.filter(f => f.endsWith('route.ts')).map(f => path.relative(webAppDir, f).replace(/\\/g, '/'));

// 2. Flutter Screens
const flutterLibDir = path.join(rootDir, 'mobile', 'lib');
const flutterFiles = getAllFiles(flutterLibDir, ['.dart']);
const flutterScreens = flutterFiles.filter(f => f.includes('screen') || f.includes('page') || f.includes('view') || f.includes('drawer'))
  .map(f => path.relative(flutterLibDir, f).replace(/\\/g, '/'));

// 3. SQL Migrations & Database Entities
const sqlDir = path.join(rootDir, 'supabase');
const sqlFiles = getAllFiles(sqlDir, ['.sql']);
const tables = new Set();
const functions = new Set();
const policies = new Set();

sqlFiles.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  const tMatches = content.matchAll(/CREATE TABLE(?:\s+IF NOT EXISTS)?\s+([a-zA-Z0-9_\.\"]+)/gi);
  for (const m of tMatches) {
    tables.add(m[1].replace(/public\.|\"/g, '').trim());
  }
  const fMatches = content.matchAll(/CREATE(?:\s+OR REPLACE)?\s+FUNCTION\s+([a-zA-Z0-9_\.\"]+)/gi);
  for (const m of fMatches) {
    functions.add(m[1].replace(/public\.|\"/g, '').trim());
  }
  const pMatches = content.matchAll(/CREATE POLICY\s+[\"a-zA-Z0-9_\s]+\s+ON\s+([a-zA-Z0-9_\.\"]+)/gi);
  for (const m of pMatches) {
    policies.add(m[1].replace(/public\.|\"/g, '').trim());
  }
});

// Output Summary
console.log('=== ANGADI SYSTEM DISCOVERY REPORT ===');
console.log(`\n1. NEXT.JS APP ROUTES (${webPages.length} Pages):`);
webPages.forEach(p => console.log('  - ' + p));

console.log(`\n2. NEXT.JS API / SERVER ROUTES (${webApiRoutes.length} APIs):`);
webApiRoutes.forEach(a => console.log('  - ' + a));

console.log(`\n3. FLUTTER SCREENS (${flutterScreens.length} Screens):`);
flutterScreens.forEach(s => console.log('  - ' + s));

console.log(`\n4. DATABASE TABLES DISCOVERED (${tables.size} Tables):`);
Array.from(tables).sort().forEach(t => console.log('  - ' + t));

console.log(`\n5. DATABASE FUNCTIONS / RPCs (${functions.size} Functions):`);
Array.from(functions).sort().forEach(fn => console.log('  - ' + fn));

console.log(`\n6. TABLES WITH RLS POLICIES (${policies.size} Tables):`);
Array.from(policies).sort().forEach(p => console.log('  - ' + p));
