#!/usr/bin/env tsx
/**
 * Panamanian Law MCP -- Census Script
 *
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

const JUSTIA_BASE = 'https://panama.justia.com';

const USER_AGENT =
  'panamanian-law-mcp/1.0 (https://github.com/Ansvar-Systems/Panamanian-law-mcp; hello@ansvar.ai)';

const MIN_DELAY_MS = 500;

/* ---------- Types ---------- */

interface RawLawEntry {
  title: string;
  url: string;
  slug: string;
  category: string;
  date: string;
  source: 'justia';
}

/* ---------- HTTP Helpers ---------- */

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

    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

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
}

function parseArgs(): { limit: number | null } {
  const args = process.argv.slice(2);
  let limit: number | null = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--limit' && args[i + 1]) {
      limit = parseInt(args[i + 1], 10);
      i++;
    }
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
  console.log('  Primary: panama.justia.com/federales/ (8 categories)');
  console.log('  Categories: leyes, codigos, decretos, decretos-ejecutivos,');
  console.log('              decretos-de-gabinete, decretos-leyes, reglamentos, acuerdos');
  if (limit) console.log(`  --limit ${limit}`);
  console.log('');

  fs.mkdirSync(DATA_DIR, { recursive: true });

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

  const ingestable = laws.filter(l => l.classification === 'ingestable').length;
  const inaccessible = laws.filter(l => l.classification === 'inaccessible').length;

  const byCategoryCount: Record<string, number> = {};
  for (const entry of allEntries) {
    byCategoryCount[entry.category] = (byCategoryCount[entry.category] ?? 0) + 1;
  }

  const census = {
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
    laws,
  };

  fs.writeFileSync(CENSUS_PATH, JSON.stringify(census, null, 2));

  console.log('\n==================================================');
  console.log('CENSUS COMPLETE');
  console.log('==================================================');
  console.log(`  Portal:          panama.justia.com`);
  console.log(`  Total laws:      ${laws.length}`);
  console.log(`  Ingestable:      ${ingestable}`);
  console.log(`  Inaccessible:    ${inaccessible}`);
  console.log(`\n  By category:`);
  for (const [cat, count] of Object.entries(byCategoryCount)) {
    console.log(`    ${cat}: ${count}`);
  }
  console.log(`\n  Output: ${CENSUS_PATH}`);
}

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
