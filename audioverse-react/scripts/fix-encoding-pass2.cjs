// fix-encoding-pass2.cjs — Second pass: fix remaining double-encoded characters
// that no longer contain Ã but are still at intermediate encoding level
const fs = require('fs');
const path = require('path');

const cp1252Map = {
    0x20AC: 0x80, 0x201A: 0x82, 0x0192: 0x83, 0x201E: 0x84,
    0x2026: 0x85, 0x2020: 0x86, 0x2021: 0x87, 0x02C6: 0x88,
    0x2030: 0x89, 0x0160: 0x8A, 0x2039: 0x8B, 0x0152: 0x8C,
    0x017D: 0x8E, 0x2018: 0x91, 0x2019: 0x92, 0x201C: 0x93,
    0x201D: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97,
    0x02DC: 0x98, 0x2122: 0x99, 0x0161: 0x9A, 0x203A: 0x9B,
    0x0153: 0x9C, 0x017E: 0x9E, 0x0178: 0x9F,
};

function unicodeToByte(ch) {
    const code = ch.charCodeAt(0);
    if (code < 0x80) return code;
    if (code >= 0xA0 && code <= 0xFF) return code;
    if (cp1252Map[code] !== undefined) return cp1252Map[code];
    return null;
}

function hasDoubleEncoding(str) {
    for (let i = 0; i < str.length; i++) {
        const b = unicodeToByte(str[i]);
        if (b !== null && b >= 0xC0 && b <= 0xF4) {
            const seqLen = b < 0xE0 ? 2 : b < 0xF0 ? 3 : 4;
            let valid = true;
            for (let j = 1; j < seqLen && i + j < str.length; j++) {
                const cb = unicodeToByte(str[i + j]);
                if (cb === null || cb < 0x80 || cb > 0xBF) { valid = false; break; }
            }
            if (valid) return true;
        }
    }
    return false;
}

function fixDoubleEncoded(str) {
    let result = '';
    let i = 0;
    while (i < str.length) {
        const b = unicodeToByte(str[i]);
        if (b !== null && b >= 0xC0 && b <= 0xF4) {
            const seqLen = b < 0xE0 ? 2 : b < 0xF0 ? 3 : 4;
            const bytes = [b];
            let valid = true;
            for (let j = 1; j < seqLen && i + j < str.length; j++) {
                const cb = unicodeToByte(str[i + j]);
                if (cb !== null && cb >= 0x80 && cb <= 0xBF) {
                    bytes.push(cb);
                } else {
                    valid = false;
                    break;
                }
            }
            if (valid && bytes.length === seqLen) {
                const buf = Buffer.from(bytes);
                const decoded = buf.toString('utf8');
                if (!decoded.includes('\uFFFD')) {
                    result += decoded;
                    i += seqLen;
                    continue;
                }
            }
        }
        result += str[i];
        i++;
    }
    return result;
}

function fixJsonValues(obj) {
    if (typeof obj === 'string') {
        return hasDoubleEncoding(obj) ? fixDoubleEncoded(obj) : obj;
    }
    if (Array.isArray(obj)) return obj.map(fixJsonValues);
    if (obj && typeof obj === 'object') {
        const result = {};
        for (const [k, v] of Object.entries(obj)) {
            result[k] = fixJsonValues(v);
        }
        return result;
    }
    return obj;
}

const localesDir = path.join(__dirname, '..', 'src', 'i18n', 'locales');

for (const lang of ['en', 'de', 'es', 'fr', 'ja', 'zh']) {
    const fp = path.join(localesDir, `${lang}.json`);
    const raw = fs.readFileSync(fp, 'utf8');
    let obj;
    try { obj = JSON.parse(raw); } catch { console.log(`${lang}.json: PARSE ERROR, skipping`); continue; }

    const fixed = fixJsonValues(obj);
    const output = JSON.stringify(fixed, null, 2);

    // Count how many values changed
    const countChanges = (a, b, prefix = '') => {
        let n = 0;
        if (typeof a === 'string' && typeof b === 'string' && a !== b) return 1;
        if (a && b && typeof a === 'object' && typeof b === 'object') {
            for (const k of Object.keys(a)) {
                n += countChanges(a[k], b[k], prefix + k + '.');
            }
        }
        return n;
    };
    const changes = countChanges(obj, fixed);
    console.log(`${lang}.json: ${changes} values fixed`);

    fs.writeFileSync(fp, output, 'utf8');
}

// Validate
for (const lang of ['en', 'pl', 'de', 'es', 'fr', 'ja', 'zh']) {
    try {
        JSON.parse(fs.readFileSync(path.join(localesDir, `${lang}.json`), 'utf8'));
        console.log(`${lang}.json: VALID`);
    } catch (e) {
        console.log(`${lang}.json: INVALID - ${e.message.substring(0, 80)}`);
    }
}

// Spot check
const en = JSON.parse(fs.readFileSync(path.join(localesDir, 'en.json'), 'utf8'));
console.log('\nSpot checks (EN):');
console.log('joinPhone:', JSON.stringify(en.nav?.joinPhone));
console.log('confirmSelection:', JSON.stringify(en.karaoke?.confirmSelection));
