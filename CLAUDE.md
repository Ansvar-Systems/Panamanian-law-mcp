# Panama Law MCP

## Quick Reference

- **Jurisdiction**: Panama (PA)
- **Source**: gacetaoficial.gob.pa
- **Language**: Spanish
- **Tools**: 8 core (non-EU jurisdiction)
- **Template**: Dominican-law-mcp

## Development

```bash
npm run census     # Enumerate laws from gacetaoficial.gob.pa
npm run ingest     # Download full text
npm run build:db   # Build SQLite DB
npm run build      # Compile TS
npm test           # Run tests
```

## Status

- [ ] Census script customized for gacetaoficial.gob.pa
- [ ] Ingestion script customized
- [ ] Database built
- [ ] Tests passing
- [ ] Deployed to Vercel
- [ ] Published to npm
