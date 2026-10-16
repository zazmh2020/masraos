@AGENTS.md

## Design System

All UI work MUST follow @DESIGN.md.

Before creating or modifying any UI component:
- Read DESIGN.md
- Use only the defined colors (tokens — no raw hex in new components)
- Follow the typography system (Qomra; weights 400/500/600/700; min text 11.5px)
- Follow the spacing system (4px base: 4 · 8 · 12 · 16 · 24 · 32 · 40 · 48)
- Follow radius and shadow rules (one soft shadow, only for floating/hover)
- Maintain RTL and LTR compatibility (logical CSS properties)
- Use only the Tabler icon family via `<Icon />` / `src/lib/icons.ts`
- Inside the org dashboard (`.org-app`) never hard-code brand colors — derive from `--purple-*` / `--c-*` so each organization's identity applies
- Do not introduce random design patterns or new UI libraries

@docs/engineering/CLAUDE-MASRA.md
