# Project Data JSON Reference

This folder contains project objects used by `scripts/projects.js`.

## File Structure

- `projects.index.json` is the manifest of project files to load.
- Each listed file is a single project object (for example `talson_dev.json`).

## `projects.index.json`

Supported formats:

```json
{
  "projects": ["talson_dev.json", "casa-ridge.json", "kevduit.json"]
}
```

or:

```json
["talson_dev.json", "casa-ridge.json", "kevduit.json"]
```

## Common Project Fields

These fields can exist on any project type:

- `projectType`: `"website" | "ux" | "code"` (defaults to legacy rendering if omitted)
- `slug`: slug-safe id used for naming and asset path normalization
- `title`: display title
- `logoImage`: logo path or URL
- `heroBackgroundImage`: hero image path or URL
- `heroBackgroundVideo`: hero video path or URL (used in modal top "window")
- `colorPrimary`, `colorSecondary`, `colorAccent`: optional theme colors

Paths can be:

- absolute web paths (e.g. `/assets/foo/bar.png`)
- relative project asset names (auto-normalized to `./assets/projects/<slug>/...`)
- full URLs

## Website Project Schema (`projectType: "website"`)

Typical fields:

- `title` (required)
- `slug` (recommended)
- `company`
- `status`
- `liveUrl`
- `githubLink`
- `tagline`
- `problem`
- `solution`
- `stack` (string or array)
- `keyFeatures` (string or array)
- `deployment`
- `logoImage`
- `heroBackgroundImage`
- `heroBackgroundVideo`
- `gallery` (string csv or array)
- `colorPrimary`, `colorSecondary`, `colorAccent`
- `category`
- `completionDate`

## UX Project Schema (`projectType: "ux"`)

Typical fields:

- `title` (required)
- `slug` (recommended)
- `role`
- `duration`
- `challenge`
- `methods`
- `persona`
- `keyInsight`
- `userFlow`
- `wireframes`
- `prototypes`
- `accessibility`
- `usabilityResults`
- `designChanges`
- `styleGuide`
- `beforeAfter` (string csv or array)
- `metric`
- `logoImage`
- `heroBackgroundImage`
- `heroBackgroundVideo`
- `colorPrimary`, `colorSecondary`, `colorAccent`

## Code Project Schema (`projectType: "code"`)

Typical fields:

- `title` (required)
- `slug` (recommended)
- `repoUrl`
- `demoLink`
- `primaryLanguage`
- `libraries` (string csv or array)
- `environment`
- `hardestPart`
- `architecture`
- `perfSecurity`
- `lessonsLearned`
- `futureImprovements`
- `prerequisites`
- `installCommand`
- `logoImage`
- `heroBackgroundImage`
- `heroBackgroundVideo`
- `colorPrimary`, `colorSecondary`, `colorAccent`

## Notes

- `slug` and `typography` are no longer shown in modal details.
- Bottom modal links are generated from project-type-specific link fields.
- Top modal "window" navigation uses the primary project link (`liveUrl`, `prototypes`, `demoLink`, etc.).
