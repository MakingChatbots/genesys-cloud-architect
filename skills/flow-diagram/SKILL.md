---
name: flow-diagram
description: This skill should be used when the user asks to create an interactive diagram, flowchart, flow visualization, dependency tree, architecture map, state machine, or pipeline view. Common trigger phrases include "visualize", "diagram", "flowchart", "graph", "map out", "show the flow", "draw the dependencies", "create a diagram", or any request where a visual representation of nodes and connections would communicate better than text.
---

# Flow Diagram Skill

Create interactive flow diagrams as standalone HTML files using React Flow (@xyflow/react). The diagrams are self-contained (no build step, no npm install), use a dark theme, and open directly in a browser.

## When to Use

Generate a React Flow diagram when:
- Displaying hierarchical relationships (dependency trees, org charts, call chains)
- Showing data/control flow between components (pipelines, workflows, request paths)
- Visualizing state machines or decision trees
- Mapping architecture (service dependencies, module relationships)
- Any scenario where a graph of connected nodes communicates better than a table or list

Prefer plain text (ASCII, markdown table) when the graph has fewer than 3 nodes or no edges. For large diagrams (30+ nodes), consider grouping related nodes into composite cards or splitting into multiple diagrams — browser rendering remains smooth up to ~100 nodes, but readability degrades well before that.

## How to Create a Diagram

### 1. Start from the template

Copy `assets/template.html` to the target location. The template contains the tested import map, dark-theme CSS, and React Flow scaffolding. Do not modify the import map URLs or `?external` parameters — they are calibrated to avoid duplicate-React issues.

### 2. Define custom node types

Create node components using `createElement` (aliased as `h`). Every node needs `Handle` components for connections. Consult `references/patterns.md` for ready-made node designs:
- **Card with sub-items** — for nodes with child lists (e.g., a flow listing its data actions)
- **Simple labeled node** — for minimal states or pipeline steps
- **Status node** — for nodes with a health/status indicator

Register node types in a `nodeTypes` object **outside the App component**.

### 3. Define data, nodes, and edges

Build the `initialNodes` and `initialEdges` arrays from the data being visualized.

Each node needs: `id`, `type` (matching a key in `nodeTypes`), `position: { x, y }`, and `data` (props passed to the node component).

Each edge needs: `id`, `source` (node id), `target` (node id). Optional: `animated`, `label`, `type` (`'smoothstep'` for flowcharts, default bezier for trees).

### 4. Layout the nodes

For manual layout strategies (trees, grids, multi-level), see `references/patterns.md` under "Layout Strategies". Use `fitView` on the ReactFlow component to auto-zoom.

### 5. Add title, legend, and type-specific CSS

Use the `.diagram-title` and `.legend` overlay classes from the template. Add type badge CSS using the accent color pattern from `references/patterns.md`.

### 6. Replace template placeholders

The template has `%%PLACEHOLDER%%` comments marking where to insert content:
- `%%TITLE%%` — page title
- `%%CUSTOM_STYLES%%` — type badge classes and additional CSS
- `%%NODE_TYPES%%` — custom node components and `nodeTypes` object
- `%%DATA%%` — the `initialNodes` and `initialEdges` arrays
- `%%LAYOUT%%` — (already part of data if positions are inline)
- `%%TITLE_OVERLAY%%` — title createElement call
- `%%LEGEND%%` — legend createElement call

### 7. Open in browser

The resulting HTML file opens directly in any modern browser. No server needed.

## Key Constraints

- **No JSX** — use `createElement` (aliased `h`). No Babel, no build step.
- **No additional CDN dependencies** — the import map in the template is sufficient.
- **`nodeTypes` must be defined outside components** — React Flow remounts nodes if the object identity changes per render.
- **Dark theme only** — the CSS is designed for the `#0f172a` background. Changing to light theme requires restyling all components.

## Additional Resources

### Reference Files
- **`references/patterns.md`** — Import map details, createElement syntax, layout strategies (tree/grid/multi-level), edge types, color palette, and ready-made node component patterns

### Asset Files
- **`assets/template.html`** — Base HTML template with the working import map, dark-theme CSS, and React Flow scaffolding. Copy this as the starting point for every diagram.

### Example Files
- **`examples/dependency-tree.html`** — Complete working diagram showing a Genesys Cloud Architect flow dependency tree with 3 nodes, custom card nodes with sub-item lists, animated edges, title overlay, and legend. Use as a reference for the expected end result.