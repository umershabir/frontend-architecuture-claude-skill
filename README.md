# frontend-architecture — Claude skill

A Claude skill for setting up, restructuring and extending the frontend architecture of immersive,
animation-heavy websites: a framework-free class-based app shell with SPA page transitions, virtual smooth
scroll, data-attribute–driven DOM animations, a WebGL layer (OGL) positioned by DOM placeholders,
preloaded textures, GSAP, Pug + SCSS/BEM, and content rendered from static data with no backend.

It ships a tested Vite starter (`assets/starter/`) to scaffold new projects from.

## Install

**Claude Code** (available in every project):

```bash
git clone https://github.com/umershabir/frontend-architecuture-claude-skill.git ~/.claude/skills/frontend-architecture
```

**Claude apps (claude.ai / desktop):** zip this folder (with `SKILL.md` inside a top-level
`frontend-architecture/` directory) and upload it under Settings → Capabilities → Skills.

## Use

Ask naturally — e.g. "set up a new immersive portfolio site in this folder", "add a WebGL gallery to the
work page", "my page transition flickers" — or name it: "use the frontend-architecture skill".

## Contents

| Path | Purpose |
|---|---|
| `SKILL.md` | Entry point: when to use, core ideas, layers, workflows, contracts |
| `references/architecture.md` | Boot, routing, loop, events, lifecycles, virtual scroll |
| `references/webgl.md` | Canvas, DOM→world mapping, scenes, infinite loops, shaders |
| `references/content-and-build.md` | Content model, templates, CMS at build time, hosting |
| `references/recipes.md` | Add a page, animation, scene, shader, transition |
| `references/pitfalls.md` | Symptom → cause → fix, plus a pre-ship checklist |
| `assets/starter/` | Vite starter: `npm install && npm run dev` |
