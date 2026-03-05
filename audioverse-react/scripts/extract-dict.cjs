// Extract dictionary from translate-de.cjs and save as JSON
const fs = require('fs');
const path = require('path');

const content = fs.readFileSync(path.resolve(__dirname, 'translate-de.cjs'), 'utf8');
const lines = content.split('\n');
let startLine = -1, endLine = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('const dictionary = {')) startLine = i;
  if (startLine > -1 && i > startLine && lines[i].trim() === '};') { endLine = i; break; }
}

// Build a module that exports the dictionary
const dictLines = lines.slice(startLine, endLine + 1);
dictLines[0] = 'module.exports = {';
const tmpFile = path.resolve(__dirname, '_tmp_dict.cjs');
fs.writeFileSync(tmpFile, dictLines.join('\n'), 'utf8');

const dict = require(tmpFile);
fs.unlinkSync(tmpFile);

fs.writeFileSync(
  path.resolve(__dirname, 'dict-de.json'),
  JSON.stringify(dict, null, 2) + '\n',
  'utf8'
);
console.log('Dict entries:', Object.keys(dict).length);
