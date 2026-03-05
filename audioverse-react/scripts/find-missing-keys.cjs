const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, '..', 'src', 'i18n', 'locales', 'en.json');
const plPath = path.join(__dirname, '..', 'src', 'i18n', 'locales', 'pl.json');

const en = JSON.parse(fs.readFileSync(enPath, 'utf-8'));
const pl = JSON.parse(fs.readFileSync(plPath, 'utf-8'));

function getLeafPaths(obj, prefix = '') {
  const paths = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      paths.push(...getLeafPaths(value, fullKey));
    } else {
      paths.push(fullKey);
    }
  }
  return paths;
}

function getByPath(obj, pathStr) {
  const parts = pathStr.split('.');
  let cur = obj;
  for (const p of parts) {
    if (cur === undefined || cur === null || typeof cur !== 'object') return undefined;
    cur = cur[p];
  }
  return cur;
}

const enPaths = getLeafPaths(en);
const plPaths = new Set(getLeafPaths(pl));

const missing = enPaths.filter(p => !plPaths.has(p));

console.log(`EN leaf keys: ${enPaths.length}`);
console.log(`PL leaf keys: ${plPaths.size}`);
console.log(`Missing in PL: ${missing.length}`);
console.log('---');

for (const m of missing) {
  const enVal = getByPath(en, m);
  console.log(`"${m}": ${JSON.stringify(enVal)}`);
}
