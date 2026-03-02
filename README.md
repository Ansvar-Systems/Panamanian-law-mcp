# Panamanian Law MCP Server

**The SINFO alternative for the AI age.**

[![npm version](https://badge.fury.io/js/@ansvar%2Fpanamanian-law-mcp.svg)](https://www.npmjs.com/package/@ansvar/panamanian-law-mcp)
[![MCP Registry](https://img.shields.io/badge/MCP-Registry-blue)](https://registry.modelcontextprotocol.io)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![GitHub stars](https://img.shields.io/github/stars/Ansvar-Systems/Panamanian-law-mcp?style=social)](https://github.com/Ansvar-Systems/Panamanian-law-mcp)
[![CI](https://github.com/Ansvar-Systems/Panamanian-law-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/Ansvar-Systems/Panamanian-law-mcp/actions/workflows/ci.yml)
[![Daily Data Check](https://github.com/Ansvar-Systems/Panamanian-law-mcp/actions/workflows/check-updates.yml/badge.svg)](https://github.com/Ansvar-Systems/Panamanian-law-mcp/actions/workflows/check-updates.yml)
[![Database](https://img.shields.io/badge/database-pre--built-green)](docs/INTERNATIONAL_INTEGRATION_GUIDE.md)
[![Provisions](https://img.shields.io/badge/provisions-11%2C240-blue)](docs/INTERNATIONAL_INTEGRATION_GUIDE.md)

Query **5,290 Panamanian laws** -- from Ley 81 de Protección de Datos Personales and the Código Judicial to the Código de Comercio, Código Penal, and more -- directly from Claude, Cursor, or any MCP-compatible client.

If you're building legal tech, compliance tools, or doing Panamanian legal research, this is your verified reference database.

Built by [Ansvar Systems](https://ansvar.eu) -- Stockholm, Sweden

---

## Why This Exists

Panamanian legal research means navigating the Asamblea Nacional portal, the Gaceta Oficial, and SINFO (Sistema de Información Normativa y Jurisprudencial), manually cross-referencing between codes and leyes. Whether you're:
- A **lawyer** validating citations in a brief or contract
- A **compliance officer** checking obligations under Ley 81 (data protection) or AML/CFT requirements
- A **legal tech developer** building tools on Latin American or international financial law
- A **researcher** tracing legislative provisions across 5,290 Panamanian laws

...you shouldn't need dozens of browser tabs and manual PDF cross-referencing. Ask Claude. Get the exact provision. With context.

This MCP server makes Panamanian law **searchable, cross-referenceable, and AI-readable**.

---

## Quick Start

### Use Remotely (No Install Needed)

> Connect directly to the hosted version -- zero dependencies, nothing to install.

**Endpoint:** `https://panamanian-law-mcp.vercel.app/mcp`

| Client | How to Connect |
|--------|---------------|
| **Claude.ai** | Settings > Connectors > Add Integration > paste URL |
| **Claude Code** | `claude mcp add panamanian-law --transport http https://panamanian-law-mcp.vercel.app/mcp` |
| **Claude Desktop** | Add to config (see below) |
| **GitHub Copilot** | Add to VS Code settings (see below) |

**Claude Desktop** -- add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "panamanian-law": {
      "type": "url",
      "url": "https://panamanian-law-mcp.vercel.app/mcp"
    }
  }
}
```

**GitHub Copilot** -- add to VS Code `settings.json`:

```json
{
  "github.copilot.chat.mcp.servers": {
    "panamanian-law": {
      "type": "http",
      "url": "https://panamanian-law-mcp.vercel.app/mcp"
    }
  }
}
```

### Use Locally (npm)

```bash
npx @ansvar/panamanian-law-mcp
```

**Claude Desktop** -- add to `claude_desktop_config.json`:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "panamanian-law": {
      "command": "npx",
      "args": ["-y", "@ansvar/panamanian-law-mcp"]
    }
  }
}
```

**Cursor / VS Code:**

```json
{
  "mcp.servers": {
    "panamanian-law": {
      "command": "npx",
      "args": ["-y", "@ansvar/panamanian-law-mcp"]
    }
  }
}
```

## Example Queries

Once connected, just ask naturally (in Spanish or English):

- *"¿Qué dice el artículo 10 de la Ley 81 sobre protección de datos personales?"*
- *"¿Está vigente el Código de Comercio?"*
- *"Buscar disposiciones sobre protección de datos personales en la legislación panameña"*
- *"¿Cuáles son los derechos del titular de datos bajo la Ley 81?"*
- *"¿Qué dice el Código Judicial sobre el proceso ejecutivo?"*
- *"Buscar disposiciones sobre lavado de dinero en el Código Penal"*
- *"Validar la cita 'Art. 5 Ley 81 de 2019'"*
- *"Construir una posición jurídica sobre responsabilidad civil en Panamá"*

---

## What's Included

| Category | Count | Details |
|----------|-------|---------|
| **Laws** | 5,290 laws | Panamanian legislation from official sources |
| **Provisions** | 11,240 sections | Full-text searchable with FTS5 |
| **Database Size** | ~53 MB | Optimized SQLite, portable |
| **Freshness Checks** | Automated | Drift detection against official sources |

**Verified data only** -- every citation is validated against official Panamanian sources. Zero LLM-generated content.

---

## See It In Action

### Why This Works

**Verbatim Source Text (No LLM Processing):**
- All statute text is ingested from official Panamanian legal sources (Gaceta Oficial, Asamblea Nacional)
- Provisions are returned **unchanged** from SQLite FTS5 database rows
- Zero LLM summarization or paraphrasing -- the database contains statute text, not AI interpretations

**Smart Context Management:**
- Search returns ranked provisions with BM25 scoring (safe for context)
- Provision retrieval gives exact text by law identifier + article number
- Cross-references help navigate without loading everything at once

**Technical Architecture:**
```
Gaceta Oficial / Asamblea Nacional --> Parse --> SQLite --> FTS5 snippet() --> MCP response
                                         ^                        ^
                                  Provision parser         Verbatim database query
```

### Traditional Research vs. This MCP

| Traditional Approach | This MCP Server |
|---------------------|-----------------|
| Search SINFO by law name | Search by plain Spanish: *"protección de datos personales"* |
| Navigate multi-chapter codes manually | Get the exact provision with context |
| Manual cross-referencing between laws | `build_legal_stance` aggregates across sources |
| "¿Está vigente esta ley?" -> check manually | `check_currency` tool -> answer in seconds |
| Find OAS or international alignment -> dig manually | `get_eu_basis` -> linked frameworks instantly |
| No API, no integration | MCP protocol -> AI-native |

**Traditional:** Search SINFO -> Download PDF from Gaceta Oficial -> Ctrl+F -> Cross-reference between codes -> Repeat

**This MCP:** *"¿Qué dispone la Ley 81 sobre el consentimiento para el tratamiento de datos sensibles?"* -> Done.

---

## Available Tools (13)

### Core Legal Research Tools (8)

| Tool | Description |
|------|-------------|
| `search_legislation` | FTS5 full-text search across 11,240 provisions with BM25 ranking |
| `get_provision` | Retrieve specific provision by law identifier + article number |
| `check_currency` | Check if a law is in force, amended, or repealed |
| `validate_citation` | Validate citation against database -- zero-hallucination check |
| `build_legal_stance` | Aggregate citations from multiple laws for a legal topic |
| `format_citation` | Format citations per Panamanian legal conventions |
| `list_sources` | List all available laws with metadata, coverage scope, and data provenance |
| `about` | Server info, capabilities, dataset statistics, and coverage summary |

### International Law Integration Tools (5)

| Tool | Description |
|------|-------------|
| `get_eu_basis` | Get international frameworks (OAS, CAFTA-DR) that a Panamanian law aligns with |
| `get_panamanian_implementations` | Find Panamanian laws aligning with a specific international framework |
| `search_eu_implementations` | Search international documents with Panamanian alignment counts |
| `get_provision_eu_basis` | Get international law references for a specific provision |
| `validate_eu_compliance` | Check alignment status of Panamanian laws against international frameworks |

---

## International Law Alignment

Panama is not an EU member state. International alignment for Panamanian law is anchored in:

- **OAS frameworks** -- Panama participates in Organization of American States conventions, including the Inter-American Convention against Corruption and the Inter-American Convention on Mutual Assistance in Criminal Matters
- **FATF** -- Panama has undergone Financial Action Task Force mutual evaluations, shaping its AML/CFT legislation (Ley 23 de 2015 and amendments)
- **US-Panama Trade Promotion Agreement** -- The bilateral trade agreement with the United States (in force 2012) establishes IP, labor, and trade obligations that shape commercial law
- **Data protection trajectory** -- Ley 81 de 2019 (Ley de Protección de Datos Personales) draws substantially on GDPR principles, making Panamanian data protection one of the most EU-aligned in Latin America
- **UN conventions** -- Panama has ratified key UN conventions including UNCAC, UNCLOS (maritime jurisdiction), and UNTOC

The international bridge tools allow you to explore these alignment relationships -- identifying where Panamanian provisions correspond to international frameworks.

> **Note:** International cross-references reflect alignment and treaty relationships, not direct transposition. Panama adopts its own legislative approach.

---

## Data Sources & Freshness

All content is sourced from authoritative Panamanian legal databases:

- **[Gaceta Oficial](https://www.gacetaoficial.gob.pa/)** -- Official government gazette of Panama
- **[Asamblea Nacional](https://www.asamblea.gob.pa/)** -- National Assembly legislative database

### Data Provenance

| Field | Value |
|-------|-------|
| **Authority** | Asamblea Nacional de Panamá / Gaceta Oficial |
| **Retrieval method** | Official legislative portal ingestion |
| **Language** | Spanish |
| **Coverage** | 5,290 laws across all legal domains |
| **Last ingested** | 2026-02-25 |

### Automated Freshness Checks

A GitHub Actions workflow monitors official sources for changes:

| Check | Method |
|-------|--------|
| **Law amendments** | Drift detection against known provision anchors |
| **New laws** | Comparison against official index |
| **Repealed laws** | Status change detection |

**Verified data only** -- every citation is validated against official sources. Zero LLM-generated content.

---

## Security

This project uses multiple layers of automated security scanning:

| Scanner | What It Does | Schedule |
|---------|-------------|----------|
| **CodeQL** | Static analysis for security vulnerabilities | Weekly + PRs |
| **Semgrep** | SAST scanning (OWASP top 10, secrets, TypeScript) | Every push |
| **Gitleaks** | Secret detection across git history | Every push |
| **Trivy** | CVE scanning on filesystem and npm dependencies | Daily |
| **Socket.dev** | Supply chain attack detection | PRs |
| **Dependabot** | Automated dependency updates | Weekly |

See [SECURITY.md](SECURITY.md) for the full policy and vulnerability reporting.

---

## Important Disclaimers

### Legal Advice

> **THIS TOOL IS NOT LEGAL ADVICE**
>
> Statute text is sourced from official Panamanian government sources (Gaceta Oficial, Asamblea Nacional). However:
> - This is a **research tool**, not a substitute for professional legal counsel
> - **Court case coverage is not included** -- do not rely solely on this for case law research
> - **Verify critical citations** against primary sources for court filings
> - **International cross-references** reflect alignment relationships, not direct transposition
> - **Regulatory instruments** (executive decrees, resoluciones) may have partial coverage

**Before using professionally, read:** [DISCLAIMER.md](DISCLAIMER.md) | [SECURITY.md](SECURITY.md)

### Client Confidentiality

Queries go through the Claude API. For privileged or confidential matters, use on-premise deployment. See [PRIVACY.md](PRIVACY.md) for guidance on professional use in accordance with Colegio Nacional de Abogados de Panamá (CONAP) standards.

---

## Development

### Setup

```bash
git clone https://github.com/Ansvar-Systems/Panamanian-law-mcp
cd Panamanian-law-mcp
npm install
npm run build
npm test
```

### Running Locally

```bash
npm run dev                                       # Start MCP server
npx @anthropic/mcp-inspector node dist/index.js   # Test with MCP Inspector
```

### Data Management

```bash
npm run ingest                    # Ingest laws from official sources
npm run build:db                  # Rebuild SQLite database
npm run check-updates             # Check for amendments and new laws
```

### Performance

- **Search Speed:** <100ms for most FTS5 queries
- **Database Size:** ~53 MB (efficient, portable)
- **Reliability:** 100% ingestion success rate

---

## Related Projects: Complete Compliance Suite

This server is part of **Ansvar's Compliance Suite** -- MCP servers that work together for end-to-end compliance coverage:

### [@ansvar/eu-regulations-mcp](https://github.com/Ansvar-Systems/EU_compliance_MCP)
**Query 49 EU regulations directly from Claude** -- GDPR, AI Act, DORA, NIS2, MiFID II, eIDAS, and more. Full regulatory text with article-level search. `npx @ansvar/eu-regulations-mcp`

### [@ansvar/us-regulations-mcp](https://github.com/Ansvar-Systems/US_Compliance_MCP)
**Query US federal and state compliance laws** -- HIPAA, CCPA, SOX, GLBA, FERPA, and more. `npx @ansvar/us-regulations-mcp`

### [@ansvar/security-controls-mcp](https://github.com/Ansvar-Systems/security-controls-mcp)
**Query 261 security frameworks** -- ISO 27001, NIST CSF, SOC 2, CIS Controls, SCF, and more. `npx @ansvar/security-controls-mcp`

### [@ansvar/salvadoran-law-mcp](https://github.com/Ansvar-Systems/Salvadoran-law-mcp)
**Query 359 Salvadoran laws** -- covering civil, commercial, criminal, and data protection law. `npx @ansvar/salvadoran-law-mcp`

**70+ national law MCPs** covering Australia, Brazil, Canada, Colombia, Denmark, Finland, France, Germany, Guatemala, Ireland, Italy, Japan, Netherlands, Norway, Serbia, Slovenia, South Korea, Sweden, Taiwan, UK, and more.

---

## Contributing

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

Priority areas:
- Court case law expansion (Corte Suprema de Justicia, Tribunal Electoral)
- Executive decrees and resoluciones
- Historical statute versions and amendment tracking
- English translations for key statutes

---

## Roadmap

- [x] Core statute database with FTS5 search
- [x] Full corpus ingestion (5,290 laws, 11,240 provisions)
- [x] International law alignment tools
- [x] Vercel Streamable HTTP deployment
- [x] npm package publication
- [ ] Court case law expansion (Corte Suprema de Justicia)
- [ ] Executive decrees and resoluciones
- [ ] Historical statute versions (amendment tracking)
- [ ] English translations for key statutes

---

## Citation

If you use this MCP server in academic research:

```bibtex
@software{panamanian_law_mcp_2026,
  author = {Ansvar Systems AB},
  title = {Panamanian Law MCP Server: AI-Powered Legal Research Tool},
  year = {2026},
  url = {https://github.com/Ansvar-Systems/Panamanian-law-mcp},
  note = {5,290 Panamanian laws with 11,240 provisions}
}
```

---

## License

Apache License 2.0. See [LICENSE](./LICENSE) for details.

### Data Licenses

- **Statutes & Legislation:** Asamblea Nacional de Panamá / Gaceta Oficial (public domain)
- **International Framework Metadata:** OAS, UN (public domain)

---

## About Ansvar Systems

We build AI-accelerated compliance and legal research tools for the global market. This MCP server started as our internal reference tool -- turns out everyone building compliance tools has the same research frustrations.

So we're open-sourcing it. Navigating 5,290 Panamanian laws shouldn't require a law degree.

**[ansvar.eu](https://ansvar.eu)** -- Stockholm, Sweden

---

<p align="center">
  <sub>Built with care in Stockholm, Sweden</sub>
</p>
