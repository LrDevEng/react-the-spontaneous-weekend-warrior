# Legacy reference (do not edit)

Frozen copy of the pre-TypeScript JavaScript sources, taken from git commit `fcfb479` (`src/App.js`, `src/App.css`, `src/components/`, `src/utils/`, `src/styles/`; the `src/index.js` entry point is omitted).

It exists only so the back-to-back tests in `src/__tests__/b2b/` can run the original code and the live code on identical inputs and compare their outputs.

- Do not edit, format or port these files.
- Nothing in the app may import from this folder.
- Delete this folder (and `src/__tests__/b2b/`, plus the `src/__legacy__` entries in `eslint.config.js` and `.prettierignore`) once the TypeScript migration has been accepted.
