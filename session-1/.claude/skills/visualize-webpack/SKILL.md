---
name: visualize-webpack
description: >
  Visualize and analyze webpack configuration by generating a Mermaid flowchart diagram.
  Use this skill whenever the user asks about the webpack setup, wants to understand the
  build pipeline, needs to see entry points, loaders, plugins, code splitting, dev server
  proxy, or path aliases — even if they don't say "webpack" explicitly but are asking about
  bundling, build config, or asset pipeline. Also use when comparing before/after webpack
  changes or explaining the build to someone.
---

# Webpack Config Visualizer

This skill bundles a script at `scripts/visualize-webpack.js` (relative to this skill's directory) that reads a webpack config and outputs a Mermaid `flowchart TD` diagram to stdout.

## What it visualizes

- Entry points and their referenced files
- Loader rules (file types and loader chains)
- Plugins and their purposes
- Output configuration (path, filenames, public path)
- Code splitting / splitChunks cache groups
- Optimization and minimizers
- Dev server proxy configuration
- Path aliases

## How to use

Run the bundled script from the project root, passing the path to the webpack config as an argument. If no argument is given it defaults to `./client/webpack.config.js`.

```bash
# From the project root (uses default client/webpack.config.js)
node /home/martin/.claude/skills/visualize-webpack/scripts/visualize-webpack.js

# Or with an explicit config path
node /home/martin/.claude/skills/visualize-webpack/scripts/visualize-webpack.js path/to/webpack.config.js
```

This prints valid Mermaid syntax to stdout. To save it:

```bash
node /home/martin/.claude/skills/visualize-webpack/scripts/visualize-webpack.js > webpack.md
```

Wrap the output in a ` ```mermaid ` fenced code block if writing to a markdown file so it renders as a diagram.

## When to read the script itself

If the user wants to customize the visualization (add new sections, change formatting, filter certain nodes), read the bundled `scripts/visualize-webpack.js` to understand its structure before making changes.
