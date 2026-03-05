/**
 * translate-locale.cjs
 * Generic locale translator — reads a dictionary JSON file and applies translations.
 * Usage: node scripts/translate-locale.cjs <lang> <dictionary.json>
 * Example: node scripts/translate-locale.cjs es scripts/dict-es.json
 */
const fs = require('fs');
const path = require('path');

const lang = process.argv[2];
const dictPath = process.argv[3];

if (!lang || !dictPath) {
  console.error('Usage: node scripts/translate-locale.cjs <lang> <dictionary.json>');
  process.exit(1);
}

const EN_PATH = path.resolve(__dirname, '..', 'src', 'i18n', 'locales', 'en.json');
const LOCALE_PATH = path.resolve(__dirname, '..', 'src', 'i18n', 'locales', `${lang}.json`);
const DICT_PATH = path.resolve(dictPath);

function getLeafPaths(obj, prefix = '') {
  const result = [];
  for (const [k, v] of Object.entries(obj)) {
    const p = prefix ? `${prefix}.${k}` : k;
    if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
      result.push(...getLeafPaths(v, p));
    } else {
      result.push({ path: p, value: v });
    }
  }
  return result;
}

function setNestedValue(obj, pathParts, value) {
  let current = obj;
  for (let i = 0; i < pathParts.length - 1; i++) {
    const part = pathParts[i];
    if (!(part in current) || typeof current[part] !== 'object') {
      current[part] = {};
    }
    current = current[part];
  }
  current[pathParts[pathParts.length - 1]] = value;
}

function main() {
  console.log(`Translating ${lang}.json using ${dictPath}...`);

  const en = JSON.parse(fs.readFileSync(EN_PATH, 'utf8'));
  const locale = JSON.parse(fs.readFileSync(LOCALE_PATH, 'utf8'));
  const dictionary = JSON.parse(fs.readFileSync(DICT_PATH, 'utf8'));

  const enLeaves = getLeafPaths(en);
  const localeLeaves = getLeafPaths(locale);
  const localeMap = new Map(localeLeaves.map(l => [l.path, l.value]));

  // Find untranslated leaves (locale value === en value)
  const untranslated = [];
  for (const leaf of enLeaves) {
    const locVal = localeMap.get(leaf.path);
    if (locVal === leaf.value && typeof leaf.value === 'string') {
      untranslated.push(leaf);
    }
  }

  console.log(`Found ${untranslated.length} untranslated leaves.`);

  let translated = 0;
  let unchanged = 0;
  let missing = 0;
  const missingValues = new Set();

  for (const leaf of untranslated) {
    const parts = leaf.path.split('.');
    const enVal = leaf.value;

    if (dictionary.hasOwnProperty(enVal)) {
      const tVal = dictionary[enVal];
      setNestedValue(locale, parts, tVal);
      if (tVal !== enVal) translated++;
      else unchanged++;
    } else {
      missing++;
      missingValues.add(enVal);
    }
  }

  const output = JSON.stringify(locale, null, 2) + '\n';
  fs.writeFileSync(LOCALE_PATH, output, 'utf8');

  console.log(`\n=== ${lang.toUpperCase()} Translation Results ===`);
  console.log(`Total untranslated leaves: ${untranslated.length}`);
  console.log(`Translated:                ${translated}`);
  console.log(`Unchanged (technical):     ${unchanged}`);
  console.log(`Missing from dictionary:   ${missing}`);

  if (missingValues.size > 0) {
    const sorted = [...missingValues].sort();
    const missingPath = path.resolve(__dirname, `missing-${lang}.json`);
    fs.writeFileSync(missingPath, JSON.stringify(sorted, null, 2) + '\n', 'utf8');
    console.log(`\nMissing values (${missingValues.size}) written to scripts/missing-${lang}.json`);
  }

  console.log(`\nDone! ${lang}.json has been updated.`);
}

main();
