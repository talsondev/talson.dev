# Project Form

Small React helper app for generating project JSON files used by the portfolio site.

## What it exports

- One JSON file per project (`<slug>.json`)
- `projects.index.json` manifest listing all exported project files

## Project types

- `website`
- `ux`
- `code`

Each type has type-specific fields in `src/ProjectForm.jsx`.

## Recent schema updates reflected in the form

- Added `heroBackgroundVideo` support (used in modal top window/video area)
- Added optional visual/theming fields to UX + Code:
  - `heroBackgroundImage`
  - `heroBackgroundVideo`
  - `logoImage`
  - `colorPrimary`, `colorSecondary`, `colorAccent`
- Removed `typography` from website fields (no longer used in modal details)

## Data docs

See project JSON schema and field reference in:

- `../data/README.md`
