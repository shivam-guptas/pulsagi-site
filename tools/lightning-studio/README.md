# Lightning Studio

Lightning Studio is a static HTML, CSS, and JavaScript web app for Salesforce developers, admins, consultants, and learners.

## Hosting

This build is GitHub Pages friendly.

- No build step is required.
- Each route is a plain `index.html` file.
- Shared behavior lives in `assets/*.js`.
- Shared styling lives in `assets/styles.css`.

## Main routes

- `tools/lightning-studio/index.html`
- `tools/lightning-studio/tools/index.html`
- `tools/lightning-studio/docs/index.html`
- `tools/lightning-studio/tools/<tool-slug>/index.html`

## Tool coverage

- Apex Formatter
- SOQL Formatter
- JSON Formatter
- XML Formatter
- JSON to Apex
- LWC Generator
- Aura Generator
- Apex Class Generator
- Apex Trigger Generator
- Lightning Message Channel Generator
- Log Inspector
- Governor Limit Analyzer
- Metadata Diff
- REST API Explorer
- GraphQL Explorer
- Salesforce Markup Builder

## Deploy on GitHub Pages

1. Push the repository.
2. Publish the branch with GitHub Pages.
3. Open `/tools/lightning-studio/`.

## Notes

- Formatting, generation, diffing, and log analysis run locally in the browser.
- REST and GraphQL explorers send requests directly from the browser, so target API CORS rules still apply.
- The top-level `tools/index.html` page now includes a Lightning Studio entry for discovery.
