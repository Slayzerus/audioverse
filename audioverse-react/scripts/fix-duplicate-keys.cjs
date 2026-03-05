/**
 * Fix duplicate signUp/signup keys in locale JSON files.
 * Keeps the first occurrence of each key variant, removes duplicates.
 */
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'src', 'i18n', 'locales');

for (const file of fs.readdirSync(dir).filter(f => f.endsWith('.json'))) {
  const fp = path.join(dir, file);
  const lines = fs.readFileSync(fp, 'utf8').split('\n');
  const seen = {};
  const keep = [];
  let removed = 0;

  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^\s*"(signUp|signup)"\s*:/);
    if (m) {
      const key = m[1];
      if (seen[key]) {
        removed++;
        continue;
      }
      seen[key] = true;
    }
    keep.push(lines[i]);
  }

  fs.writeFileSync(fp, keep.join('\n'), 'utf8');
  console.log(`${file}: removed ${removed} duplicate line(s)`);
}
