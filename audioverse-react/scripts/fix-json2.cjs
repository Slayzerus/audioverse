const fs = require('fs');

// Fix zh.json line 372 - presetSaved has \\" which breaks JSON
let zh = fs.readFileSync('src/i18n/locales/zh.json', 'utf8');
const zhLines = zh.split('\n');
// The problematic line looks like: "presetSaved": "预设\\"{{name}}\"已保存",
// Should be: "presetSaved": "预设\"{{name}}\"已保存",
for (let i = 0; i < zhLines.length; i++) {
    if (zhLines[i].includes('presetSaved')) {
        console.log('ZH before:', JSON.stringify(zhLines[i]));
        // Replace \\" with \" 
        zhLines[i] = zhLines[i].replace(/\\\\"/g, '\\"');
        console.log('ZH after:', JSON.stringify(zhLines[i]));
    }
}
fs.writeFileSync('src/i18n/locales/zh.json', zhLines.join('\n'), 'utf8');

// Validate both
for (const lang of ['fr', 'zh']) {
    try {
        JSON.parse(fs.readFileSync(`src/i18n/locales/${lang}.json`, 'utf8'));
        console.log(`${lang}.json: VALID`);
    } catch (e) {
        console.log(`${lang}.json: INVALID - ${e.message.substring(0, 120)}`);
    }
}
