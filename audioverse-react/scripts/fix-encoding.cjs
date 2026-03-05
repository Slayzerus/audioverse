// fix-encoding.js — Fix double-encoded UTF-8 in locale files
const fs = require('fs');
const path = require('path');

// Windows-1252 to byte mapping for the CP1252-specific chars (0x80-0x9F)
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
    if (code >= 0xA0 && code <= 0xFF) return code; // Latin-1 supplement
    if (cp1252Map[code] !== undefined) return cp1252Map[code];
    return null;
}

function fixDoubleEncoded(str) {
    let result = '';
    let i = 0;
    while (i < str.length) {
        const b = unicodeToByte(str[i]);
        if (b !== null && b >= 0xC0 && b <= 0xF4) {
            // Potential UTF-8 lead byte
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

function fixFile(filePath) {
    console.log(`Processing: ${filePath}`);
    let text = fs.readFileSync(filePath, 'utf8');

    // Count before
    const beforeCount = (text.match(/Ã/g) || []).length;
    console.log(`  Before: ${beforeCount} 'Ã' occurrences`);

    if (beforeCount === 0) {
        console.log('  No corruption found, skipping.');
        return;
    }

    // Fix all string values that contain Ã
    text = text.replace(/"([^"]*Ã[^"]*)"/g, (match, val) => {
        const decoded = fixDoubleEncoded(val);
        // Re-escape for JSON
        return '"' + decoded
            .replace(/\\/g, '\\\\')
            .replace(/"/g, '\\"')
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r')
            .replace(/\t/g, '\\t') + '"';
    });

    const afterCount = (text.match(/Ã/g) || []).length;
    console.log(`  After: ${afterCount} 'Ã' occurrences`);

    fs.writeFileSync(filePath, text, 'utf8');
    console.log(`  Saved.`);
}

const localesDir = path.join(__dirname, '..', 'src', 'i18n', 'locales');
const files = ['en.json', 'de.json', 'es.json', 'fr.json', 'ja.json', 'zh.json'];

for (const f of files) {
    const fp = path.join(localesDir, f);
    if (fs.existsSync(fp)) {
        fixFile(fp);
    } else {
        console.log(`File not found: ${fp}`);
    }
}

console.log('\nDone!');
