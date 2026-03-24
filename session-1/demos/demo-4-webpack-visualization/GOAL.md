# Demo 4: Webpack Visualization Tool

## Goal

Demonstrate that AI can parse and visualize complex configuration files. Webpack configs are notoriously hard to read — AI generates a tool that produces a visual summary as a Mermaid flowchart.

## Duration

~5-6 minutes

## Setup

```bash
cd session-1/legacy-app
npm install
```

## Steps

### Step 1: Ask Claude Code to Generate the Tool

Use this prompt:

```
Generate a script called `visualize-webpack.js` that reads the webpack configuration at `client/webpack.config.js` and outputs a Mermaid flowchart diagram. It should visualize:
- Entry points and what files they reference
- Loader rules (what file types each loader handles)
- Plugins and what they do
- Output configuration
- Split chunks / code splitting setup
- Dev server proxy configuration
- Path aliases

Output valid Mermaid `flowchart TD` syntax to stdout.
```

### Step 2: Run the Generated Tool

```bash
node visualize-webpack.js
```

Copy the Mermaid output.

### Step 3: Render the Flowchart

Paste into [mermaid.live](https://mermaid.live) or a VS Code Mermaid extension.

The diagram should show the webpack pipeline:
- 2 entry points (main + vendor-bundle)
- 6 loader rules (JS/Babel, SCSS, CSS, images, fonts, CSV)
- 5+ plugins (HtmlWebpack, MiniCssExtract, Terser, CssMinimizer, Copy, Define, optionally BundleAnalyzer)
- Output config (dist/, content hash naming)
- 3 split chunk groups (vendor, common, styles)
- Dev server proxy (→ localhost:3000)
- 5 path aliases (@components, @styles, @utils, @assets, @src)

### Step 4: Discussion

Walk through the diagram with the audience:
- How much faster is this than reading 160 lines of webpack config?
- The diagram can be regenerated when the config changes
- It captures the structure, not just individual settings

## Takeaway

Complex configs are hard to read; AI can generate **parsers that produce visual summaries**. This pattern applies to webpack, Docker Compose, CI/CD pipelines, Terraform — any complex configuration format.

## What the Audience Learns

- How to use AI to understand build tool configurations
- Mermaid flowchart syntax for visualizing pipelines
- The pattern of "config → parser → diagram" as a reusable technique
- That webpack configs are often more complex than they need to be
