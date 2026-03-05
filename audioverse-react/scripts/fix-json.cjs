const fs = require('fs');

// Fix en.json BOM
let en = fs.readFileSync('src/i18n/locales/en.json', 'utf8');
if (en.charCodeAt(0) === 0xFEFF) en = en.slice(1);
// Strip any leading whitespace/null bytes before {
en = en.replace(/^[^{]*/, '');
fs.writeFileSync('src/i18n/locales/en.json', en, 'utf8');
console.log('en.json: BOM stripped');

// Fix fr.json and zh.json over-escaped backslashes
for (const lang of ['fr', 'zh']) {
    let text = fs.readFileSync(`src/i18n/locales/${lang}.json`, 'utf8');
    // Replace 4+ backslashes followed by quote with just backslash-quote 
    // In the file content: \\\\\" should become \\\"
    // Multiple passes to collapse
    let prev;
    do {
        prev = text;
        text = text.replace(/\\\\\\\\"/g, '\\\\"');
    } while (text !== prev);
    
    fs.writeFileSync(`src/i18n/locales/${lang}.json`, text, 'utf8');
    console.log(`${lang}.json: fixed escaping`);
}

// Validate all
for (const lang of ['en', 'pl', 'de', 'es', 'fr', 'ja', 'zh']) {
    try {
        JSON.parse(fs.readFileSync(`src/i18n/locales/${lang}.json`, 'utf8'));
        console.log(`${lang}.json: VALID`);
    } catch (e) {
        console.log(`${lang}.json: INVALID - ${e.message.substring(0, 100)}`);
    }
}
