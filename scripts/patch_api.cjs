const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'lib', 'api.ts');
let content = fs.readFileSync(filePath, 'utf8');

const searchStr = "const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';";
const flagBlock = `const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// -- Demo Mode Flag -----------------------------------------------------------
// Set by AuthContext when enterDemoMode() is called. When true, apiFetch skips
// Supabase entirely and uses the local in-memory demo store instead.
let _isDemoMode = false;
export function setApiDemoMode(isDemoMode: boolean): void {
  _isDemoMode = isDemoMode;
}
`;

if (content.includes(searchStr) && !content.includes('setApiDemoMode')) {
  content = content.replace(searchStr, flagBlock);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✅ Demo mode flag inserted into api.ts');
} else if (content.includes('setApiDemoMode')) {
  console.log('✅ Demo mode flag already present in api.ts');
} else {
  console.error('❌ Search string not found');
  process.exit(1);
}
