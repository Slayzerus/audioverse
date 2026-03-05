const fs = require('fs')
const path = require('path')

// Generates a manifest.json listing all files under the Tiny Swords folder.
// Run: node scripts/generate-tiny-swords-manifest.js

const base = path.join(__dirname, '..', 'public', 'assets', 'sprites', 'Tiny Swords')
function walk(dir) {
  let results = []
  const list = fs.readdirSync(dir)
  list.forEach(function(file) {
    const full = path.join(dir, file)
    const stat = fs.statSync(full)
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(full))
    } else {
      results.push(full)
    }
  })
  return results
}

try {
  if (!fs.existsSync(base)) {
    console.error('Tiny Swords folder not found at', base)
    process.exit(1)
  }
  const files = walk(base)
    .map(f => path.relative(path.join(__dirname, '..', 'public'), f).replaceAll('\\', '/'))
  const out = { generatedAt: new Date().toISOString(), files }
  const outPath = path.join(base, 'manifest.json')
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2), 'utf8')
  console.log('Wrote', outPath, 'with', files.length, 'entries')
} catch (err) {
  console.error(err)
  process.exit(2)
}
