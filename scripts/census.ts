#!/usr/bin/env tsx
/**
 * Panamanian Law MCP -- Census Script
 *
<<<<<<< HEAD
 * Scrapes panama.justia.com/federales/leyes/ to enumerate Panamanian laws.
 * Justia provides a reliable, structured index of Panamanian legislation
 * with links to full-text HTML pages.
 *
 * Source: https://panama.justia.com/federales/leyes/
 * Language: Spanish (civil law)
=======
 * Scrapes panama.justia.com to enumerate federal laws, codes, decrees,
 * executive decrees, cabinet decrees, decree-laws, regulations, and agreements.
 *
 * Pipeline:
 *   1. Fetch /federales/leyes/             (federal laws)
 *   2. Fetch /federales/codigos/           (codes)
 *   3. Fetch /federales/decretos/          (decrees)
 *   4. Fetch /federales/decretos-ejecutivos/ (executive decrees)
 *   5. Fetch /federales/decretos-de-gabinete/ (cabinet decrees)
 *   6. Fetch /federales/decretos-leyes/    (decree-laws)
 *   7. Fetch /federales/reglamentos/       (regulations)
 *   8. Fetch /federales/acuerdos/          (agreements)
 *   9. Deduplicate and write data/census.json
 *
 * Sources:
 *   - Primary: https://panama.justia.com/federales/leyes/
 *   - Plus 7 additional category pages (see above)
>>>>>>> origin/dev
 *
 * Usage:
 *   npx tsx scripts/census.ts
 *   npx tsx scripts/census.ts --limit 50
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, '../data');
const CENSUS_PATH = path.join(DATA_DIR, 'census.json');

<<<<<<< HEAD
const BASE_URL = 'https://panama.justia.com';
const LAWS_INDEX = `${BASE_URL}/federales/leyes/`;

const USER_AGENT = 'panamanian-law-mcp/1.0 (https://github.com/Ansvar-Systems/Panamanian-law-mcp; hello@ansvar.ai)';
=======
const JUSTIA_BASE = 'https://panama.justia.com';

const USER_AGENT =
  'panamanian-law-mcp/1.0 (https://github.com/Ansvar-Systems/Panamanian-law-mcp; hello@ansvar.ai)';

>>>>>>> origin/dev
const MIN_DELAY_MS = 500;

/* ---------- Types ---------- */

interface RawLawEntry {
  title: string;
  url: string;
<<<<<<< HEAD
  year: string;
  normType: string;
=======
  slug: string;
  category: string;
  date: string;
  source: 'justia';
>>>>>>> origin/dev
}

/* ---------- HTTP ---------- */

<<<<<<< HEAD
async function fetchPage(url: string): Promise<string | null> {
  await new Promise(resolve => setTimeout(resolve, MIN_DELAY_MS));

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html, */*',
        'Accept-Language': 'es,en;q=0.5',
      },
      redirect: 'follow',
      signal: controller.signal,
    });

    clearTimeout(timeout);
    if (response.status !== 200) {
      console.log(`  HTTP ${response.status} for ${url}`);
      return null;
    }
    return response.text();
  } catch (err) {
    clearTimeout(timeout);
    console.log(`  Error: ${err instanceof Error ? err.message : String(err)}`);
    return null;
  }
}

/* ---------- Parsing ---------- */

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim();
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&aacute;/gi, '\u00e1').replace(/&eacute;/gi, '\u00e9')
    .replace(/&iacute;/gi, '\u00ed').replace(/&oacute;/gi, '\u00f3')
    .replace(/&uacute;/gi, '\u00fa').replace(/&ntilde;/gi, '\u00f1')
    .replace(/&Aacute;/gi, '\u00c1').replace(/&Eacute;/gi, '\u00c9')
    .replace(/&Iacute;/gi, '\u00cd').replace(/&Oacute;/gi, '\u00d3')
    .replace(/&Uacute;/gi, '\u00da').replace(/&Ntilde;/gi, '\u00d1')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n)));
}

function slugify(text: string): string {
  return text.toLowerCase().normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '').substring(0, 60);
}

function classifyNormType(title: string): string {
  const t = title.toLowerCase();
  if (/\bdecreto[\s-]*ley\b/.test(t)) return 'decreto-ley';
  if (/\bconstituci[\u00f3o]n\b/.test(t)) return 'constitucion';
  if (/\bc[\u00f3o]digo\b/.test(t)) return 'codigo';
  if (/\bley\b/.test(t)) return 'ley';
  if (/\bdecreto\b/.test(t)) return 'decreto';
  if (/\bresoluci[\u00f3o]n\b/.test(t)) return 'resolucion';
  if (/\bacuerdo\b/.test(t)) return 'acuerdo';
  return 'other';
}

function extractYear(text: string): string {
  const match = text.match(/\b(19\d{2}|20[0-2]\d)\b/);
  return match ? match[1] : '';
}

function parseLawIndex(html: string): RawLawEntry[] {
  const entries: RawLawEntry[] = [];
  const seen = new Set<string>();

  const linkRe = /<a\s+[^>]*href="([^"]*\/federales\/leyes\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;

  while ((match = linkRe.exec(html)) !== null) {
    let href = match[1];
    const rawTitle = stripHtml(match[2]).trim();

    if (!rawTitle || rawTitle.length < 3) continue;
    if (/^(ver|m\u00e1s|siguiente|anterior|inicio)$/i.test(rawTitle)) continue;

    if (!href.startsWith('http')) {
      href = `${BASE_URL}${href.startsWith('/') ? '' : '/'}${href}`;
    }

    if (href === LAWS_INDEX || href === `${LAWS_INDEX}/`) continue;
    if (seen.has(href)) continue;
    seen.add(href);

    const title = decodeHtmlEntities(rawTitle);
    entries.push({ title, url: href, year: extractYear(title) || extractYear(href), normType: classifyNormType(title) });
  }
=======
let lastRequestTime = 0;

async function rateLimit(): Promise<void> {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < MIN_DELAY_MS) {
    await new Promise(resolve => setTimeout(resolve, MIN_DELAY_MS - elapsed));
  }
  lastRequestTime = Date.now();
}

async function fetchPage(url: string): Promise<string> {
  await rateLimit();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html, */*',
        'Accept-Language': 'es-PA,es;q=0.9,en;q=0.5',
      },
      redirect: 'follow',
      signal: controller.signal,
    });

    if (response.status !== 200) {
      throw new Error(`HTTP ${response.status} for ${url}`);
    }
>>>>>>> origin/dev

    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

<<<<<<< HEAD
function extractSubPages(html: string): string[] {
  const pages: string[] = [];
  const seen = new Set<string>();

  // Year-based sub-pages
  const yearRe = /<a\s+[^>]*href="([^"]*\/federales\/leyes\/\d{4}\/[^"]*)"[^>]*>/gi;
  let match: RegExpExecArray | null;
  while ((match = yearRe.exec(html)) !== null) {
    let href = match[1];
    if (!href.startsWith('http')) href = `${BASE_URL}${href.startsWith('/') ? '' : '/'}${href}`;
    if (!seen.has(href)) { seen.add(href); pages.push(href); }
  }

  // Pagination
  const pageRe = /href="([^"]*\?page=\d+[^"]*)"/gi;
  while ((match = pageRe.exec(html)) !== null) {
    let href = match[1];
    if (!href.startsWith('http')) href = `${BASE_URL}${href.startsWith('/') ? '' : '/'}${href}`;
    if (!seen.has(href)) { seen.add(href); pages.push(href); }
  }

  return pages;
=======
/* ---------- Parsing Helpers ---------- */

function stripTags(text: string): string {
  return text.replace(/<[^>]*>/g, '');
}

function decodeEntities(text: string): string {
  return text
    .replace(/&#209;/g, 'N').replace(/&#241;/g, 'n')
    .replace(/&#193;/g, 'A').replace(/&#225;/g, 'a')
    .replace(/&#201;/g, 'E').replace(/&#233;/g, 'e')
    .replace(/&#205;/g, 'I').replace(/&#237;/g, 'i')
    .replace(/&#211;/g, 'O').replace(/&#243;/g, 'o')
    .replace(/&#218;/g, 'U').replace(/&#250;/g, 'u')
    .replace(/&#252;/g, 'u').replace(/&#220;/g, 'U')
    .replace(/&aacute;/g, 'a').replace(/&eacute;/g, 'e')
    .replace(/&iacute;/g, 'i').replace(/&oacute;/g, 'o')
    .replace(/&uacute;/g, 'u').replace(/&ntilde;/g, 'n')
    .replace(/&Aacute;/g, 'A').replace(/&Eacute;/g, 'E')
    .replace(/&Iacute;/g, 'I').replace(/&Oacute;/g, 'O')
    .replace(/&Uacute;/g, 'U').replace(/&Ntilde;/g, 'N')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n)));
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 60);
>>>>>>> origin/dev
}

function parseArgs(): { limit: number | null } {
  const args = process.argv.slice(2);
  let limit: number | null = null;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--limit' && args[i + 1]) { limit = parseInt(args[i + 1], 10); i++; }
  }
  return { limit };
}

/* ---------- Justia Parsing ---------- */

/**
 * Justia category pages list laws as anchor tags:
 *   <a href="/federales/leyes/{slug}/">{Title}</a>
 *   <a href="/federales/codigos/{slug}/">{Title}</a>
 *   <a href="/federales/decretos/{slug}/">{Title}</a>
 *   etc.
 *
 * The listing pages show all entries on a single page (no pagination).
 */
function parseJustiaListingPage(
  html: string,
  sectionPath: string,
  category: string,
): RawLawEntry[] {
  const entries: RawLawEntry[] = [];
  const seen = new Set<string>();

  const escapedPath = sectionPath.replace(/\//g, '\\/');
  const linkRe = new RegExp(
    `<a\\s[^>]*href=["'](${escapedPath}([^"'/]+)(?:\\/[^"']*)?)["'][^>]*>([\\s\\S]*?)<\\/a>`,
    'gi',
  );
  let match: RegExpExecArray | null;

  while ((match = linkRe.exec(html)) !== null) {
    const href = match[1];
    const slug = match[2];
    const rawTitle = stripTags(match[3]).trim();

    if (!rawTitle || rawTitle.length < 5) continue;
    if (!slug || slug.length < 2) continue;
    if (seen.has(slug)) continue;
    seen.add(slug);

    const title = decodeEntities(rawTitle);
    const url = `${JUSTIA_BASE}${href}`;

    entries.push({
      title,
      url,
      slug,
      category,
      date: '',
      source: 'justia',
    });
  }

  return entries;
}

/**
 * Fetch all Justia category pages and combine results.
 */
async function censusFromJustia(limit: number | null): Promise<RawLawEntry[]> {
  const allEntries: RawLawEntry[] = [];

  const categories: Array<{ path: string; label: string; category: string }> = [
    { path: '/federales/leyes/', label: 'Federal Laws', category: 'leyes' },
    { path: '/federales/codigos/', label: 'Codes', category: 'codigos' },
    { path: '/federales/decretos/', label: 'Decrees', category: 'decretos' },
    { path: '/federales/decretos-ejecutivos/', label: 'Executive Decrees', category: 'decretos-ejecutivos' },
    { path: '/federales/decretos-de-gabinete/', label: 'Cabinet Decrees', category: 'decretos-de-gabinete' },
    { path: '/federales/decretos-leyes/', label: 'Decree-Laws', category: 'decretos-leyes' },
    { path: '/federales/reglamentos/', label: 'Regulations', category: 'reglamentos' },
    { path: '/federales/acuerdos/', label: 'Agreements', category: 'acuerdos' },
  ];

  for (const { path: sectionPath, label, category } of categories) {
    const url = `${JUSTIA_BASE}${sectionPath}`;
    process.stdout.write(`  Fetching ${label} (${url})... `);

    try {
      const html = await fetchPage(url);
      const entries = parseJustiaListingPage(html, sectionPath, category);
      allEntries.push(...entries);
      console.log(`${entries.length} entries`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`FAILED: ${msg}`);
    }

    if (limit && allEntries.length >= limit) break;
  }

  return allEntries;
}

/* ---------- Main ---------- */

async function main(): Promise<void> {
  const { limit } = parseArgs();

  console.log('Panamanian Law MCP -- Census');
  console.log('============================\n');
<<<<<<< HEAD
  console.log('  Source: panama.justia.com/federales/leyes/');
  console.log('  Language: Spanish (civil law)');
=======
  console.log('  Primary: panama.justia.com/federales/ (8 categories)');
  console.log('  Categories: leyes, codigos, decretos, decretos-ejecutivos,');
  console.log('              decretos-de-gabinete, decretos-leyes, reglamentos, acuerdos');
>>>>>>> origin/dev
  if (limit) console.log(`  --limit ${limit}`);
  console.log('');

  fs.mkdirSync(DATA_DIR, { recursive: true });

<<<<<<< HEAD
  console.log('  Step 1: Fetching main law index...');
  const mainHtml = await fetchPage(LAWS_INDEX);

  if (!mainHtml) {
    console.error('  ERROR: Could not fetch main index page');
    process.exit(1);
  }

  const allEntries: RawLawEntry[] = [];
  const mainEntries = parseLawIndex(mainHtml);
  console.log(`    Found ${mainEntries.length} entries on main page`);
  allEntries.push(...mainEntries);

  const subPages = extractSubPages(mainHtml);
  if (subPages.length > 0) {
    console.log(`\n  Step 2: Following ${subPages.length} sub-pages...`);
    for (const pageUrl of subPages) {
      if (limit && allEntries.length >= limit) break;
      process.stdout.write(`    ${pageUrl.replace(BASE_URL, '')}...`);
      const html = await fetchPage(pageUrl);
      if (html) {
        const entries = parseLawIndex(html);
        const newEntries = entries.filter(e => !allEntries.some(a => a.url === e.url));
        allEntries.push(...newEntries);
        console.log(` ${entries.length} entries (${newEntries.length} new)`);
        const morePages = extractSubPages(html).filter(p => !subPages.includes(p));
        subPages.push(...morePages);
      } else { console.log(' failed'); }
    }
  }

  const seenUrls = new Map<string, RawLawEntry>();
  for (const entry of allEntries) {
    const key = entry.url.toLowerCase();
    if (!seenUrls.has(key)) seenUrls.set(key, entry);
  }
=======
  // Step 1: Primary source -- Justia
  console.log('[1/1] Justia (primary)\n');
  let allEntries = await censusFromJustia(limit);
  console.log(`\n  Justia total: ${allEntries.length} entries\n`);

  // Deduplicate by slug
  const deduped = new Map<string, RawLawEntry>();
  for (const entry of allEntries) {
    const key = entry.slug || slugify(entry.title);
    if (!deduped.has(key)) {
      deduped.set(key, entry);
    }
  }
  allEntries = Array.from(deduped.values());

  // Apply limit
  if (limit && allEntries.length > limit) {
    allEntries = allEntries.slice(0, limit);
  }

  // Build census entries
  const laws = allEntries.map((entry) => {
    const id = `pa-${entry.category}-${slugify(entry.title).substring(0, 50)}`;

    return {
      id,
      title: entry.title,
      identifier: entry.title,
      url: entry.url,
      status: 'in_force' as const,
      category: mapCategory(entry.category),
      classification: 'ingestable' as const,
      ingested: false,
      provision_count: 0,
      ingestion_date: null as string | null,
      issued_date: entry.date || '',
      portal_slug: entry.slug,
    };
  });
>>>>>>> origin/dev

  const unique = Array.from(seenUrls.values());
  const finalEntries = limit ? unique.slice(0, limit) : unique;

  const laws = finalEntries.map((entry) => ({
    id: `pa-${slugify(entry.title)}`,
    title: entry.title,
    identifier: entry.title,
    url: entry.url,
    status: 'in_force' as const,
    category: 'act' as const,
    classification: 'ingestable' as const,
    ingested: false,
    provision_count: 0,
    ingestion_date: null as string | null,
    issued_date: entry.year ? `${entry.year}-01-01` : '',
    norm_type: entry.normType,
  }));

  const normTypeCounts: Record<string, number> = {};
  for (const entry of finalEntries) {
    normTypeCounts[entry.normType] = (normTypeCounts[entry.normType] || 0) + 1;
  }

  const byCategoryCount: Record<string, number> = {};
  for (const entry of allEntries) {
    byCategoryCount[entry.category] = (byCategoryCount[entry.category] ?? 0) + 1;
  }

  const census = {
<<<<<<< HEAD
    schema_version: '2.0', jurisdiction: 'PA', jurisdiction_name: 'Panama',
    portal: 'panama.justia.com', portal_url: LAWS_INDEX,
    census_date: new Date().toISOString().split('T')[0],
    agent: 'panamanian-law-mcp/census.ts',
    summary: { total_laws: laws.length, ingestable: laws.length, ocr_needed: 0, inaccessible: 0, excluded: 0 },
    breakdown: { by_norm_type: normTypeCounts },
=======
    schema_version: '2.0',
    jurisdiction: 'PA',
    jurisdiction_name: 'Panama',
    portal: 'panama.justia.com',
    census_date: new Date().toISOString().split('T')[0],
    agent: 'panamanian-law-mcp/census.ts',
    summary: {
      total_laws: laws.length,
      ingestable,
      ocr_needed: 0,
      inaccessible,
      excluded: 0,
      by_category: byCategoryCount,
    },
>>>>>>> origin/dev
    laws,
  };

  fs.writeFileSync(CENSUS_PATH, JSON.stringify(census, null, 2));

  console.log('\n==================================================');
  console.log('CENSUS COMPLETE');
  console.log('==================================================');
<<<<<<< HEAD
  console.log(`  Total laws discovered:  ${laws.length}`);
  console.log(`  All ingestable (HTML):  ${laws.length}`);
  console.log('');
  console.log('  By norm type:');
  for (const [type, count] of Object.entries(normTypeCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`    ${type}: ${count}`);
=======
  console.log(`  Portal:          panama.justia.com`);
  console.log(`  Total laws:      ${laws.length}`);
  console.log(`  Ingestable:      ${ingestable}`);
  console.log(`  Inaccessible:    ${inaccessible}`);
  console.log(`\n  By category:`);
  for (const [cat, count] of Object.entries(byCategoryCount)) {
    console.log(`    ${cat}: ${count}`);
>>>>>>> origin/dev
  }
  console.log(`\n  Output: ${CENSUS_PATH}`);
}

<<<<<<< HEAD
main().catch(error => { console.error('Fatal error:', error); process.exit(1); });
=======
function mapCategory(category: string): 'act' | 'code' | 'decree' | 'regulation' | 'agreement' {
  switch (category) {
    case 'codigos': return 'code';
    case 'decretos':
    case 'decretos-ejecutivos':
    case 'decretos-de-gabinete':
    case 'decretos-leyes': return 'decree';
    case 'reglamentos': return 'regulation';
    case 'acuerdos': return 'agreement';
    default: return 'act';
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
>>>>>>> origin/dev
