// Draws the menu from menu.yml. All the rules live in menu.js; this file only builds the page.

import { buildMenu, describeTemps } from './menu.js';

const els = {
  menu: document.getElementById('menu'),
  name: document.getElementById('cafe-name'),
  tagline: document.getElementById('cafe-tagline'),
  legend: document.getElementById('legend'),
};

main();

async function main() {
  let source;
  try {
    const res = await fetch('menu.yml', { cache: 'no-cache' });
    if (!res.ok) throw new Error(`the server answered ${res.status}`);
    source = await res.text();
  } catch (e) {
    console.error('[menu] could not load menu.yml:', e);
    showNotice(['The menu didn’t load. Check your connection and refresh the page.']);
    return;
  }

  const { menu, errors, warnings } = buildMenu(source);
  warnings.forEach((w) => console.warn('[menu]', w));
  errors.forEach((e) => console.error('[menu]', e));

  if (!menu) {
    showNotice(errors);
    return;
  }

  renderMasthead(menu.cafe);
  els.menu.replaceChildren(...menu.sections.map(renderSection).filter(Boolean));
  els.legend.hidden = menu.stats.out === 0;

  // Errors never reach the live site (GitHub stops the publish), so this
  // only shows up while previewing locally.
  if (errors.length) showNotice(errors, { prepend: true });
}

function renderMasthead(cafe) {
  els.name.textContent = cafe.name;
  document.title = cafe.name;
  els.tagline.textContent = cafe.tagline;
  els.tagline.hidden = !cafe.tagline;
}

function renderSection(section) {
  const drinks = section.drinks.filter((d) => !d.hidden);
  if (!drinks.length) return null;

  // Options that every drink in the section offers are written once under
  // the heading, like a chalkboard would, instead of repeating on each drink.
  const shared = sharedGroups(drinks);
  const sharedIds = new Set(shared.map((g) => g.id));

  const id = `section-${slug(section.name)}`;
  return h('section', { class: 'menu-section', 'aria-labelledby': id }, [
    h('h2', { class: 'section-title chalk-grain', id }, section.name),
    shared.length
      ? h('div', { class: 'section-options' }, [
          h('p', { class: 'section-options-intro' }, 'For every drink below'),
          renderOptions(shared),
        ])
      : null,
    h(
      'ul',
      { class: 'drinks', role: 'list' },
      drinks.map((d) => renderDrink(d, sharedIds))
    ),
  ]);
}

function sharedGroups(drinks) {
  if (drinks.length < 2) return [];
  const [first, ...rest] = drinks;
  return first.groups.filter((g) =>
    rest.every((d) => d.groups.some((o) => o.id === g.id && o.required === g.required))
  );
}

function renderDrink(drink, sharedIds = new Set()) {
  const groups = drink.groups.filter((g) => !sharedIds.has(g.id));
  const temps = describeTemps(drink.temps);
  const item = h('li', { class: 'drink', 'data-out': drink.out ? '' : null }, [
    h('div', { class: 'drink-head' }, [
      h('h3', { class: 'drink-name' }, [
        drink.name,
        drink.out ? h('span', { class: 'visually-hidden' }, ' (out today)') : null,
      ]),
      temps ? h('span', { class: 'temps' }, temps) : null,
    ]),
    drink.description ? h('p', { class: 'drink-desc' }, drink.description) : null,
    groups.length ? renderOptions(groups) : null,
  ]);
  return item;
}

function renderOptions(groups) {
  return h(
    'dl',
    { class: 'options' },
    groups.flatMap((g) => [
      h('dt', {}, g.label),
      h(
        'dd',
        {},
        h(
          'ul',
          { class: 'choices', role: 'list' },
          g.choices.map((c) =>
            h('li', { class: 'choice', 'data-out': c.out ? '' : null }, [
              c.name,
              c.out ? h('span', { class: 'visually-hidden' }, ' (out today)') : null,
            ])
          )
        )
      ),
    ])
  );
}

function showNotice(messages, { prepend = false } = {}) {
  const box = h('div', { class: 'notice', role: 'alert' }, [
    h('p', {}, messages.length > 1 ? 'menu.yml needs a few fixes:' : 'Something needs fixing:'),
    h('ul', {}, messages.map((m) => h('li', {}, m))),
  ]);
  if (messages.length === 1 && !prepend) box.replaceChildren(h('p', {}, messages[0]));
  if (prepend) els.menu.prepend(box);
  else els.menu.replaceChildren(box);
}

/** Tiny element helper: h('p', { class: 'x' }, ['text', child]) */
function h(tag, attrs = {}, children = []) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v !== null && v !== undefined && v !== false) el.setAttribute(k, v);
  }
  for (const child of [].concat(children)) {
    if (child === null || child === undefined || child === false) continue;
    el.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return el;
}

function slug(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
