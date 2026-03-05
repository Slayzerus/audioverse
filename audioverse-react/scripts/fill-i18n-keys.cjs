// fill-i18n-keys.cjs — Scan all source t('key', 'Fallback') calls and populate missing keys in en.json and pl.json
const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src');
const localesDir = path.join(srcDir, 'i18n', 'locales');

// ── 1. Collect all t('key', 'Fallback') from source ──
const tCalls = new Map(); // key -> fallback

function scanDir(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fp = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (['node_modules', 'dist', '.git', 'build', 'locales'].includes(entry.name)) continue;
            scanDir(fp);
        } else if (/\.[jt]sx?$/.test(entry.name)) {
            const src = fs.readFileSync(fp, 'utf8');
            const re = /\bt\(\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"]\s*\)/g;
            let m;
            while ((m = re.exec(src))) {
                tCalls.set(m[1], m[2]);
            }
        }
    }
}
scanDir(srcDir);

// ── 2. Helper: set nested key in object ──
function setNested(obj, key, value) {
    const parts = key.split('.');
    let current = obj;
    for (let i = 0; i < parts.length - 1; i++) {
        if (!(parts[i] in current) || typeof current[parts[i]] !== 'object') {
            current[parts[i]] = {};
        }
        current = current[parts[i]];
    }
    const last = parts[parts.length - 1];
    if (!(last in current)) {
        current[last] = value;
        return true;
    }
    return false;
}

// ── 3. Helper: get nested key from object ──
function getNested(obj, key) {
    const parts = key.split('.');
    let current = obj;
    for (const part of parts) {
        if (current == null || typeof current !== 'object') return undefined;
        current = current[part];
    }
    return current;
}

// ── 4. Process locale files ──
const locales = ['en', 'pl'];
for (const locale of locales) {
    const filePath = path.join(localesDir, `${locale}.json`);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    let added = 0;

    for (const [key, fallback] of tCalls) {
        if (getNested(data, key) === undefined) {
            setNested(data, key, fallback);
            added++;
        }
    }

    // Sort top-level keys alphabetically
    const sorted = {};
    for (const k of Object.keys(data).sort()) {
        sorted[k] = data[k];
    }

    fs.writeFileSync(filePath, JSON.stringify(sorted, null, 2) + '\n');
    console.log(`${locale}.json: ${added} keys added`);
}

console.log(`\nTotal t() calls found: ${tCalls.size}`);
