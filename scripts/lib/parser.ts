/**
<<<<<<< HEAD
 * Panamanian Law HTML/PDF/Text Parser
 *
 * Parses law text from Justia Panama (panama.justia.com) or from
 * PDFs downloaded from gacetaoficial.gob.pa. Applies regex-based
 * article parsing tuned for Panamanian civil law conventions.
 *
 * Panama follows Spanish civil law (Roman-Germanic tradition).
 * Laws are published in the Gaceta Oficial.
 *
 * SECURITY: Uses execFileSync with array arguments (safe from injection).
 */

import { execFileSync } from 'child_process';

/* ---------- Shared Types ---------- */

=======
 * Panamanian Law HTML Parser
 *
 * Parses law HTML from panama.justia.com into structured provisions.
 *
 * Panamanian civil law article patterns:
 *   "Articulo N."  / "Art. N" / "ARTICULO N"
 *   "Articulo Unico"
 *
 * Structure patterns:
 *   "TITULO I", "CAPITULO I", "SECCION I"
 *   "DISPOSICIONES TRANSITORIAS", "DISPOSICIONES FINALES"
 *
 * Definition patterns:
 *   "se entiende por", "a los efectos de", "se define como"
 *
 * No PDF extraction needed -- all data is HTML from Justia.
 */

>>>>>>> origin/dev
export interface ActIndexEntry {
  id: string;
  title: string;
  titleEn: string;
  shortName: string;
  status: 'in_force' | 'amended' | 'repealed' | 'not_yet_in_force';
  issuedDate: string;
  inForceDate: string;
  url: string;
  description?: string;
}

export interface ParsedProvision {
  provision_ref: string;
  chapter?: string;
  section: string;
  title: string;
  content: string;
}

export interface ParsedDefinition {
  term: string;
  definition: string;
  source_provision?: string;
}

export interface ParsedAct {
  id: string;
  type: 'statute';
  title: string;
  title_en: string;
  short_name: string;
  status: string;
  issued_date: string;
  in_force_date: string;
  url: string;
  description?: string;
  provisions: ParsedProvision[];
  definitions: ParsedDefinition[];
}

<<<<<<< HEAD
/* ---------- PDF Text Extraction ---------- */

// SECURITY: execFileSync prevents command injection -- arguments passed as array, not shell string
export function extractTextFromPdf(pdfPath: string): string {
  try {
    return execFileSync('pdftotext', ['-layout', pdfPath, '-'], {
      maxBuffer: 50 * 1024 * 1024, encoding: 'utf-8', timeout: 30000,
    });
  } catch {
    try {
      return execFileSync('pdftotext', [pdfPath, '-'], {
        maxBuffer: 50 * 1024 * 1024, encoding: 'utf-8', timeout: 30000,
      });
    } catch { return ''; }
  }
}

/* ---------- Text Cleaning ---------- */
=======
/* ---------- HTML Cleaning ---------- */
>>>>>>> origin/dev

function decodeEntities(text: string): string {
  return text
    .replace(/&aacute;/g, '\u00e1').replace(/&eacute;/g, '\u00e9')
    .replace(/&iacute;/g, '\u00ed').replace(/&oacute;/g, '\u00f3')
    .replace(/&uacute;/g, '\u00fa').replace(/&ntilde;/g, '\u00f1')
    .replace(/&Aacute;/g, '\u00c1').replace(/&Eacute;/g, '\u00c9')
    .replace(/&Iacute;/g, '\u00cd').replace(/&Oacute;/g, '\u00d3')
    .replace(/&Uacute;/g, '\u00da').replace(/&Ntilde;/g, '\u00d1')
    .replace(/&uuml;/g, '\u00fc').replace(/&Uuml;/g, '\u00dc')
<<<<<<< HEAD
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n)));
}

function cleanText(text: string): string {
  return decodeEntities(text)
    .replace(/<[^>]*>/g, '').replace(/\r\n/g, '\n')
    .replace(/\f/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

/* ---------- Article/Section Parsing ---------- */

const ARTICLE_PATTERNS = [
  /(?:^|\n)\s*(?:Art[\u00ed]culo|ART[\u00cdI]CULO|Art\.?)\s+((?:\d+[\s.]*(?:bis|ter|quater)?|\d+[A-Z]?(?:\.\d+)?|[\u00daU]NICO|PRIMERO|SEGUNDO))\s*[.\u00b0\u00ba]*[-.:;\u2013]?\s*([^\n]*)/gimu,
  /(?:^|\n)\s*ART[\u00cdI]CULO\s+(\d+)\s*[oO\u00ba\u00b0]\s*[.]*[-.:;\u2013]?\s*([^\n]*)/gimu,
];

const CHAPTER_RE = /(?:^|\n)\s*((?:T[\u00cdI]TULO|CAP[\u00cdI]TULO|SECCI[\u00d3O]N|LIBRO|DISPOSICIONES?\s+(?:TRANSITORIAS?|FINALES?|GENERALES?|COMPLEMENTARIAS?|DEROGATORIAS?))\s*[IVXLC0-9]*[^\n]*)/gimu;

const DEFINITION_PATTERNS = [
  /se\s+(?:entiende|entender[\u00e1a])\s+por\s+"?([^".:,]{3,80})"?\s*[,:]\s*([^.;]+[.;])/gi,
  /(?:(?:a|para)\s+los\s+efectos?\s+de\s+(?:esta|la\s+presente)\s+(?:ley|decreto|c[\u00f3o]digo)[^:]*:\s*)\n?\s*(?:\d+[.)]\s*)?([^:;\u2013-]+)\s*[:;\u2013-]\s*([^.;]+[.;])/gim,
  /se\s+(?:define|denomina)\s+(?:como\s+)?"?([^".:]{3,80})"?\s*(?:a|al|la|el)?\s*([^.;]+[.;])/gi,
  /["\u201C]([^"\u201D]{2,60})["\u201D]\s*[:;\u2013-]\s*([^.;]+[.;])/gi,
];

function findLawTextStart(text: string): number {
  const startPatterns = [
    /\bLA\s+ASAMBLEA\s+(?:NACIONAL|LEGISLATIVA)\b/i,
    /\bDECRETA\s*:/i, /\bRESUELVE\s*:/i, /\bCONSIDERANDO\b/i, /\bPOR\s+CUANTO\b/i,
    /(?:^|\n)\s*(?:ART[\u00cdI]CULO|Art[\u00ed]culo)\s+(?:1|PRIMERO|[\u00daU]NICO)\s*[.\u00b0\u00ba]*[-.:;\u2013]/im,
    /(?:^|\n)\s*T[\u00cdI]TULO\s+(?:I|1|PRIMERO)\b/im,
    /\bDISPOSICIONES\s+GENERALES\b/i,
=======
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&laquo;/g, '\u00ab').replace(/&raquo;/g, '\u00bb')
    .replace(/&mdash;/g, '\u2014').replace(/&ndash;/g, '\u2013')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
}

/**
 * Strip HTML tags and normalize whitespace.
 * Converts block-level tags to newlines for structure preservation.
 */
function htmlToText(html: string): string {
  return html
    .replace(/<\/?(p|div|br|li|h[1-6]|tr|dt|dd|blockquote)\b[^>]*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&[a-zA-Z]+;/g, m => decodeEntities(m))
    .replace(/&#\d+;/g, m => decodeEntities(m))
    .replace(/&#x[0-9a-fA-F]+;/g, m => decodeEntities(m))
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n /g, '\n')
    .replace(/ \n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/* ---------- Article Patterns ---------- */

/**
 * Panamanian article heading patterns.
 *
 * Standard forms:
 *   Articulo 1.    / Art. 1.    / ARTICULO 1.
 *   Articulo 1.-   / Art. 1.-
 *   Articulo Unico
 */
const ARTICLE_PATTERNS = [
  /(?:^|\n)\s*(?:ART[ÍI]CULO|Art[íi]culo|ARTICULO|ART\.?)\s+((?:\d+[\s.]*(?:bis|ter)?|\d+[A-Z]?(?:\.\d+)?|[ÚU]NICO|[ÚU]nico|UNICO))\s*[.°º]*[-.:–]?\s*([^\n]*)/gimu,
];

const STRUCTURE_RE = /(?:^|\n)\s*((?:T[ÍI]TULO|TITULO|CAP[ÍI]TULO|CAPITULO|SECCI[ÓO]N|SECCION|DISPOSICION(?:ES)?(?:\s+(?:TRANSITORIAS?|FINALES?|DEROGATORIAS?|GENERALES?|COMPLEMENTARIAS?))?)\s+[IVXLC0-9]+[^\n]*)/gimu;

const DISPOSICIONES_RE = /(?:^|\n)\s*(DISPOSICION(?:ES)?\s+(?:TRANSITORIAS?|FINALES?|DEROGATORIAS?|GENERALES?|COMPLEMENTARIAS?))\s*$/gimu;

const DEFINITION_PATTERNS = [
  /se\s+(?:entiende|entender[áa])\s+por\s+"?([^".:,]+)"?\s*(?:,|:)\s*([^.]+\.)/gi,
  /a\s+los\s+efectos\s+de\s+(?:esta|la\s+presente)\s+(?:ley|norma)[^:]*:\s*\n?\s*(?:\d+[.)]\s*)?([^:–-]+)\s*[:–-]\s*([^.;]+[.;])/gim,
  /se\s+define(?:n)?\s+como\s+"?([^".:,]+)"?\s*(?:,|a|:)\s*([^.]+\.)/gi,
  /(?:^|\n)\s*\d+[.)]\s*([^:–.\n]{3,60})\s*[:–.]-?\s+([^.;]{20,}[.;])/gim,
];

/* ---------- Parsing ---------- */

function findLawTextStart(text: string): number {
  const startPatterns = [
    /\bLA\s+ASAMBLEA\s+NACIONAL\b/i,
    /\bLA\s+ASAMBLEA\s+LEGISLATIVA\b/i,
    /\bEL\s+CONSEJO\s+DE\s+GABINETE\b/i,
    /\bEL\s+PRESIDENTE\s+DE\s+LA\s+REP[ÚU]BLICA\b/i,
    /\bCONSIDERANDO\b/i,
    /\bDECRETA\s*:/i,
    /\bRESUELVE\s*:/i,
    /(?:^|\n)\s*(?:ART[ÍI]CULO|Art[íi]culo|ARTICULO)\s+(?:1|PRIMERO|[ÚU]NICO|UNICO)\s*[.°º]*[-.:–]/im,
>>>>>>> origin/dev
  ];
  let earliestPos = text.length;
  for (const pattern of startPatterns) {
    const match = pattern.exec(text);
    if (match && match.index < earliestPos) earliestPos = match.index;
  }
  return earliestPos === text.length ? 0 : earliestPos;
}

<<<<<<< HEAD
/* ---------- Main Parse Functions ---------- */

export function parsePALawText(text: string, act: ActIndexEntry): ParsedAct {
  const cleaned = cleanText(text);
=======
export function parsePALawText(text: string, act: ActIndexEntry): ParsedAct {
  const cleaned = htmlToText(text);
>>>>>>> origin/dev
  const startIdx = findLawTextStart(cleaned);
  const lawText = cleaned.substring(startIdx);

  const provisions: ParsedProvision[] = [];
  const definitions: ParsedDefinition[] = [];

  interface Heading { ref: string; title: string; position: number; }
  const headings: Heading[] = [];

  for (const pattern of ARTICLE_PATTERNS) {
    const re = new RegExp(pattern.source, pattern.flags);
    let match: RegExpExecArray | null;
    while ((match = re.exec(lawText)) !== null) {
      const num = match[1].replace(/\s+/g, '').replace(/\.$/, '');
      const title = (match[2] ?? '').trim();
      const ref = `art${num.toLowerCase()}`;
<<<<<<< HEAD
      if (!headings.some(h => h.ref === ref && Math.abs(h.position - match!.index) < 20)) {
        headings.push({ ref, title: title || `Art\u00edculo ${num}`, position: match.index });
=======

      if (!headings.some(h => h.ref === ref && Math.abs(h.position - match!.index) < 20)) {
        headings.push({
          ref,
          title: title || `Art\u00edculo ${num}`,
          position: match.index,
        });
>>>>>>> origin/dev
      }
    }
  }

  headings.sort((a, b) => a.position - b.position);

<<<<<<< HEAD
  const chapterRe = new RegExp(CHAPTER_RE.source, CHAPTER_RE.flags);
  const chapterPositions: { chapter: string; position: number }[] = [];
  let match: RegExpExecArray | null;
  while ((match = chapterRe.exec(lawText)) !== null) {
    chapterPositions.push({ chapter: match[1].trim(), position: match.index });
  }

=======
  const chapterPositions: { chapter: string; position: number }[] = [];

  const structRe = new RegExp(STRUCTURE_RE.source, STRUCTURE_RE.flags);
  let match: RegExpExecArray | null;
  while ((match = structRe.exec(lawText)) !== null) {
    chapterPositions.push({
      chapter: match[1].trim(),
      position: match.index,
    });
  }

  const dispRe = new RegExp(DISPOSICIONES_RE.source, DISPOSICIONES_RE.flags);
  while ((match = dispRe.exec(lawText)) !== null) {
    if (!chapterPositions.some(cp => Math.abs(cp.position - match!.index) < 10)) {
      chapterPositions.push({
        chapter: match[1].trim(),
        position: match.index,
      });
    }
  }

  chapterPositions.sort((a, b) => a.position - b.position);

>>>>>>> origin/dev
  let currentChapter = '';
  for (let i = 0; i < headings.length; i++) {
    const heading = headings[i];
    const nextHeading = headings[i + 1];
    const endPos = nextHeading ? nextHeading.position : lawText.length;
<<<<<<< HEAD
    const content = lawText.substring(heading.position, endPos).trim();
=======
    const rawBlock = lawText.substring(heading.position, endPos).trim();

>>>>>>> origin/dev
    for (const cp of chapterPositions) {
      if (cp.position <= heading.position) currentChapter = cp.chapter;
    }
<<<<<<< HEAD
    const cleanedContent = content.split('\n').map(l => l.trim()).filter(l => l.length > 0).join('\n');
    if (cleanedContent.length > 10) {
      provisions.push({ provision_ref: heading.ref, chapter: currentChapter || undefined,
        section: currentChapter || act.title, title: heading.title, content: cleanedContent });
=======

    const cleanedBlock = rawBlock
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\n');

    if (cleanedBlock.length > 10) {
      provisions.push({
        provision_ref: heading.ref,
        chapter: currentChapter || undefined,
        section: currentChapter || act.title,
        title: heading.title,
        content: cleanedBlock,
      });
>>>>>>> origin/dev
    }
  }

  for (const pattern of DEFINITION_PATTERNS) {
    const defRe = new RegExp(pattern.source, pattern.flags);
    while ((match = defRe.exec(lawText)) !== null) {
      const term = (match[1] ?? '').trim();
      const definition = (match[2] ?? '').trim();

      if (term.length > 2 && term.length < 100 && definition.length > 10) {
        let sourceProvision: string | undefined;
        for (let i = headings.length - 1; i >= 0; i--) {
          if (headings[i].position <= match.index) { sourceProvision = headings[i].ref; break; }
        }

        if (!definitions.some(d => d.term.toLowerCase() === term.toLowerCase())) {
          definitions.push({ term, definition, source_provision: sourceProvision });
        }
      }
    }
  }

  if (provisions.length === 0 && lawText.length > 50) {
    provisions.push({ provision_ref: 'full-text', section: act.title, title: act.title, content: lawText.substring(0, 50000) });
  }

  return { id: act.id, type: 'statute', title: act.title, title_en: act.titleEn,
    short_name: act.shortName, status: act.status,
    issued_date: act.issuedDate, in_force_date: act.inForceDate, url: act.url,
    provisions, definitions };
}

<<<<<<< HEAD
export function parsePALawPdf(pdfPath: string, act: ActIndexEntry): ParsedAct {
  const text = extractTextFromPdf(pdfPath);
=======
/**
 * Parse raw HTML (as fetched from the portal) into a ParsedAct.
 */
export function parsePALawHtml(html: string, act: ActIndexEntry): ParsedAct {
  let bodyHtml = html;

  const wrapperPatterns = [
    /<div[^>]*class=["'][^"']*(?:entry-content|law-content|post-content|article-content|content-body)[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
    /<article[^>]*>([\s\S]*?)<\/article>/i,
    /<main[^>]*>([\s\S]*?)<\/main>/i,
    /<div[^>]*id=["'](?:content|page-content|main-content)["'][^>]*>([\s\S]*?)<\/div>/i,
  ];

  for (const pattern of wrapperPatterns) {
    const m = pattern.exec(html);
    if (m && m[1] && m[1].length > 200) {
      bodyHtml = m[1];
      break;
    }
  }

  const text = htmlToText(bodyHtml);

>>>>>>> origin/dev
  if (!text || text.trim().length < 50) {
    return { id: act.id, type: 'statute', title: act.title, title_en: act.titleEn,
      short_name: act.shortName, status: act.status,
      issued_date: act.issuedDate, in_force_date: act.inForceDate, url: act.url,
      provisions: [], definitions: [] };
  }
<<<<<<< HEAD
  return parsePALawText(text, act);
}

export function parsePALawHtml(html: string, act: ActIndexEntry): ParsedAct {
  return parsePALawText(html, act);
}

export function parseHtml(html: string, act: ActIndexEntry): ParsedAct {
  return parsePALawText(html, act);
=======

  return parsePALawText(text, act);
>>>>>>> origin/dev
}
