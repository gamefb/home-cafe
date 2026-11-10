// Menu logic shared by the page (assets/app.js) and the checker (scripts/validate.mjs).
// It turns the text of menu.yml into a ready-to-draw menu and lists any mistakes found.
// No browser or Node-specific code lives here.

import { load } from './vendor/js-yaml.js';

const LEVELS = ['required', 'optional', 'none'];
const TEMPS = ['hot', 'iced'];

const KNOWN_KEYS = {
  top: ['cafe', 'out', 'options', 'sections'],
  cafe: ['name', 'tagline'],
  option: ['label', 'choices'],
  section: ['name', 'needs', 'options', 'drinks'],
  drink: ['name', 'description', 'temps', 'needs', 'options', 'hidden'],
};

const keyOf = (s) => String(s).trim().toLowerCase();
const text = (v) => (v === undefined || v === null ? '' : String(v).trim());
const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const asList = (v) => (v === undefined || v === null ? [] : Array.isArray(v) ? v : [v]);

/**
 * Parse and check menu.yml.
 * @param {string} source  contents of menu.yml
 * @returns {{ menu: object|null, errors: string[], warnings: string[] }}
 */
export function buildMenu(source) {
  const errors = [];
  const warnings = [];

  let raw;
  try {
    raw = load(source);
  } catch (e) {
    const where = e.mark ? ` (line ${e.mark.line + 1})` : '';
    errors.push(`menu.yml isn't valid YAML${where}: ${e.reason || e.message}`);
    return { menu: null, errors, warnings };
  }
  if (raw === undefined || raw === null) raw = {};
  if (!isObject(raw)) {
    errors.push('menu.yml should be made of sections like cafe:, out:, options: and sections:.');
    return { menu: null, errors, warnings };
  }

  checkKeys(raw, KNOWN_KEYS.top, 'the top of menu.yml', warnings);

  // ── cafe ──
  const cafeRaw = isObject(raw.cafe) ? raw.cafe : {};
  if (raw.cafe !== undefined && !isObject(raw.cafe)) errors.push('cafe: should contain name: and tagline:.');
  checkKeys(cafeRaw, KNOWN_KEYS.cafe, 'cafe', warnings);
  const cafe = {
    name: text(cafeRaw.name) || 'Home Cafe',
    tagline: text(cafeRaw.tagline),
  };

  // ── out ──
  const outEntries = [];
  for (const entry of asList(raw.out)) {
    if (typeof entry === 'string' || typeof entry === 'number') outEntries.push(text(entry));
    else errors.push(`Everything under out: should be a plain name. Found: ${JSON.stringify(entry)}`);
  }
  const outSet = new Set(outEntries.map(keyOf));
  const isOut = (name) => outSet.has(keyOf(name));
  const knownNames = new Set(); // everything an `out` entry could refer to

  // ── options ──
  const options = new Map(); // id → { id, label, choices: [name] }, in file order
  if (raw.options !== undefined && raw.options !== null && !isObject(raw.options)) {
    errors.push('options: should be a list of named options (milk:, sweetener:, …).');
  }
  for (const [id, def] of Object.entries(isObject(raw.options) ? raw.options : {})) {
    if (!isObject(def)) {
      errors.push(`Option "${id}" needs a label: and choices:.`);
      continue;
    }
    checkKeys(def, KNOWN_KEYS.option, `option "${id}"`, warnings);
    const choices = [];
    for (const c of asList(def.choices)) {
      const name = isObject(c) ? text(c.name) : text(c);
      if (!name) {
        errors.push(`Option "${id}" has an empty choice.`);
        continue;
      }
      if (choices.some((n) => keyOf(n) === keyOf(name))) warnings.push(`Option "${id}" lists "${name}" twice.`);
      choices.push(name);
      knownNames.add(keyOf(name));
    }
    if (!choices.length) errors.push(`Option "${id}" has no choices. Add some, e.g. choices: [One, Two].`);
    options.set(id, { id, label: text(def.label) || id, choices });
  }
  const optionOrder = [...options.keys()];

  const readLevels = (value, where) => {
    const levels = {};
    if (value === undefined || value === null) return levels;
    if (!isObject(value)) {
      errors.push(`options: on ${where} should look like  milk: required`);
      return levels;
    }
    for (const [id, level] of Object.entries(value)) {
      if (!options.has(id)) {
        errors.push(`${cap(where)} uses option "${id}", which isn't defined under options: at the top.`);
        continue;
      }
      const l = keyOf(level);
      if (!LEVELS.includes(l)) {
        errors.push(`${cap(where)}: option "${id}" should be required, optional or none (found "${text(level)}").`);
        continue;
      }
      levels[id] = l;
    }
    return levels;
  };

  // ── sections & drinks ──
  if (raw.sections !== undefined && !Array.isArray(raw.sections)) {
    errors.push('sections: should be a list, each starting with  - name:');
  }
  const sections = [];
  const drinkNames = new Map();
  let drinkCount = 0;
  let outCount = 0;

  asList(raw.sections).forEach((sec, si) => {
    if (!isObject(sec) || !text(sec.name)) {
      errors.push(`Section ${si + 1} needs a name:.`);
      return;
    }
    const secName = text(sec.name);
    const where = `section "${secName}"`;
    checkKeys(sec, KNOWN_KEYS.section, where, warnings);
    const secLevels = readLevels(sec.options, where);
    const secNeeds = asList(sec.needs).map(text).filter(Boolean);
    secNeeds.forEach((n) => knownNames.add(keyOf(n)));

    if (sec.drinks !== undefined && !Array.isArray(sec.drinks)) {
      errors.push(`drinks: in ${where} should be a list, each starting with  - name:`);
    }
    const drinks = [];
    asList(sec.drinks).forEach((d, di) => {
      if (!isObject(d) || !text(d.name)) {
        errors.push(`Drink ${di + 1} in ${where} needs a name:.`);
        return;
      }
      const name = text(d.name);
      const dWhere = `drink "${name}"`;
      checkKeys(d, KNOWN_KEYS.drink, dWhere, warnings);
      knownNames.add(keyOf(name));

      const seenIn = drinkNames.get(keyOf(name));
      if (seenIn) warnings.push(`There are two drinks called "${name}" (in ${seenIn} and ${where}).`);
      else drinkNames.set(keyOf(name), where);

      const needs = [...secNeeds, ...asList(d.needs).map(text).filter(Boolean)];
      needs.forEach((n) => knownNames.add(keyOf(n)));

      const temps = [];
      for (const t of asList(d.temps)) {
        const k = keyOf(t);
        if (TEMPS.includes(k)) temps.push(k);
        else warnings.push(`${cap(dWhere)}: temps should be hot and/or iced (found "${text(t)}").`);
      }

      const levels = { ...secLevels, ...readLevels(d.options, dWhere) };
      const groups = optionOrder
        .filter((id) => levels[id] && levels[id] !== 'none')
        .map((id) => {
          const opt = options.get(id);
          return {
            id,
            label: opt.label,
            required: levels[id] === 'required',
            choices: opt.choices.map((c) => ({ name: c, out: isOut(c) })),
          };
        });

      const out =
        isOut(name) ||
        needs.some(isOut) ||
        groups.some((g) => g.required && g.choices.length > 0 && g.choices.every((c) => c.out));

      if (d.hidden !== undefined && typeof d.hidden !== 'boolean') {
        warnings.push(`${cap(dWhere)}: hidden should be true or false.`);
      }
      const hidden = d.hidden === true;
      if (!hidden) {
        drinkCount += 1;
        if (out) outCount += 1;
      }

      drinks.push({ name, description: text(d.description), temps, groups, out, hidden });
    });

    sections.push({ name: secName, drinks });
  });

  if (!sections.length) errors.push('The menu has no sections yet. Add one under sections:.');

  for (const entry of outEntries) {
    if (!knownNames.has(keyOf(entry))) {
      warnings.push(`"${entry}" is listed under out:, but no drink, choice or need has that name. Check the spelling.`);
    }
  }

  return {
    menu: { cafe, sections, stats: { sections: sections.length, drinks: drinkCount, out: outCount } },
    errors,
    warnings,
  };
}

/** "hot" → "hot", ["hot","iced"] → "hot or iced" */
export function describeTemps(temps) {
  if (temps.includes('hot') && temps.includes('iced')) return 'hot or iced';
  return temps[0] || '';
}

function checkKeys(obj, allowed, where, warnings) {
  for (const k of Object.keys(obj)) {
    if (!allowed.includes(k)) {
      warnings.push(`Unknown field "${k}" in ${where}. Expected one of: ${allowed.join(', ')}.`);
    }
  }
}

function cap(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
