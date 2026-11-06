# Codex instructions — German Circle

## Product truth
- The club is the product; importation/concierge is an optional, transparent commercial spin-off.
- My German Dream Garage is the primary navigation and member value: 0–5 desired cars.
- Only these brands in MVP: Porsche, Mercedes-Benz, BMW, Audi.
- A preference or dream is **not** purchase intent; budget and horizon are optional.
- No verified vehicle quotes or market valuations are currently connected. Do not invent them.
- Privacy by default, including hidden member profiles and dream garages.

## Visual direction
- Heritage x Quiet Luxury: deep forest #0D2A26, dark charcoal, ivory #F4F1E9, brushed brass #B89B67.
- German black/red/yellow only as a minimal accent. No large tricolor banners.
- Editorial titles, readable interface, understated affordances, high contrast.
- Monogram GC is provisional; do not claim registered mark or manufacturer affiliation.

## Engineering workflow
- Read `.agents/skills/gc-brand-guardian/SKILL.md`, `.agents/skills/gc-ux-architect/SKILL.md`, `.agents/skills/gc-ui-builder/SKILL.md` and `.agents/skills/gc-accessibility-reviewer/SKILL.md` before changing user-visible flows.
- Start with one issue, write a small acceptance test, implement, run tests, review on mobile and desktop.
- Avoid expensive dependencies for trivial needs. Use standards and semantic HTML.
- Never commit secrets, deploy unreviewed scraping, or expose member collections publicly.
- Separate UI mock data from verified market information; show timestamp/source/confidence on any future numeric valuation.
- Do not automate contractual commitments, purchases or payments without an explicit user-approved flow.

## Definition of done
- Works in modern Chromium and Safari, mobile viewport 390px and desktop 1440px.
- Meets keyboard navigation and labels; focus visible; no obvious contrast failures.
- Validation present, error and empty states tested.
- No exposed member data and no ungrounded financial claims.
- Documented and reproducible run commands.

### v0.7 regras do comparador
- Nunca mostre "poupança garantida" baseada em preços anunciados. O valor comparado é meramente indicativo.
- Não crie dados sintéticos no banco de produção para preencher cards.
- Não implemente scraping de classificados sem autorização jurídica e técnica documentada.
- Qualquer ISV/IVA calculado automaticamente exige regras oficiais, testes e revisão fiscal antes de uso comercial.
- Preserve os testes de `tests/market-comparison.test.mjs`, validade temporal e revisão humana.
