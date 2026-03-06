/**
 * Response metadata utilities for Panamanian Law MCP.
 */

import type Database from '@ansvar/mcp-sqlite';

export interface ResponseMetadata {
  data_source: string;
  jurisdiction: string;
  disclaimer: string;
  freshness?: string;
  note?: string;
  query_strategy?: string;
}

export interface ToolResponse<T> {
  results: T;
  _metadata: ResponseMetadata;
}

export function generateResponseMetadata(
  db: InstanceType<typeof Database>,
): ResponseMetadata {
  let freshness: string | undefined;
  try {
    const row = db.prepare(
      "SELECT value FROM db_metadata WHERE key = 'built_at'"
    ).get() as { value: string } | undefined;
    if (row) freshness = row.value;
  } catch {
    // Ignore
  }

  return {
    data_source: 'Asamblea Nacional / Gaceta Oficial / SINFO (asamblea.gob.pa) — Republic of Panama',
    jurisdiction: 'PA',
    disclaimer:
      'This data is sourced from Panamanian official legal portals (Asamblea Nacional, Gaceta Oficial, SINFO). ' +
      'The authoritative versions are in Spanish. ' +
      'Always verify with the official Gaceta Oficial or SINFO portal (sfranciscoj.gob.pa).',
    freshness,
  };
}
