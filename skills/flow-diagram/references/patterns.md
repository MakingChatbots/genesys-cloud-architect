# React Flow Diagram Patterns

## Import Map (Critical)

The import map in the template uses esm.sh to load React and @xyflow/react without a build step. This exact pattern is tested and working — do not modify the URLs or query parameters.

Key details:
- `?external=react,react-dom` on `@xyflow/react` prevents bundling a separate React copy, which would break hooks
- `"react/": "https://esm.sh/react@18.3.1/"` handles subpath imports like `react/jsx-runtime`
- The CSS is loaded from jsdelivr (not esm.sh) because esm.sh does not serve CSS files

## createElement Pattern

Since there is no build step, all components use `createElement` (aliased as `h`) instead of JSX:

```js
import { createElement as h } from 'react';

// JSX equivalent: <div className="card"><span>Hello</span></div>
h('div', { className: 'card' }, h('span', null, 'Hello'))

// JSX equivalent: <Handle type="target" position={Position.Top} />
h(Handle, { type: 'target', position: Position.Top })

// Conditional rendering
condition ? h('div', null, 'Yes') : null

// Mapping arrays (spread into parent's children)
h('div', null, ...items.map((item, i) => h('span', { key: i }, item)))
```

## Custom Node Types

Every custom node must be defined as a component and registered in a `nodeTypes` object **outside the App component** (React Flow requirement — defining inside causes remounts):

```js
function MyNode({ data }) {
    return h('div', { className: 'node-card' },
        h(Handle, { type: 'target', position: Position.Top, style: { background: '#475569', width: 8, height: 8 } }),
        h('div', { className: 'node-title' }, data.label),
        h(Handle, { type: 'source', position: Position.Bottom, style: { background: '#475569', width: 8, height: 8 } }),
    );
}

// MUST be outside the component
const nodeTypes = { myNode: MyNode };
```

Nodes reference the type by key: `{ id: '1', type: 'myNode', position: { x: 0, y: 0 }, data: { label: 'Hello' } }`.

## Layout Strategies

### Manual Tree Layout

For small trees (< 20 nodes), calculate positions directly:

```js
const childCount = children.length;
const spacing = 300;
const totalWidth = (childCount - 1) * spacing;
const startX = -totalWidth / 2;

const nodes = [
    { id: 'root', position: { x: 0, y: 0 }, ... },
    ...children.map((child, i) => ({
        id: child.id,
        position: { x: startX + i * spacing, y: 320 },
        ...
    })),
];
```

### Multi-Level Tree Layout

For deeper trees, assign y based on depth and x based on sibling index:

```js
const LEVEL_HEIGHT = 300;
const SIBLING_SPACING = 280;

function layoutTree(node, depth = 0, siblingIndex = 0, siblingCount = 1) {
    const totalWidth = (siblingCount - 1) * SIBLING_SPACING;
    return {
        id: node.id,
        position: {
            x: -totalWidth / 2 + siblingIndex * SIBLING_SPACING,
            y: depth * LEVEL_HEIGHT,
        },
        ...
    };
}
```

### Grid Layout

For flat collections (no hierarchy):

```js
const COLS = 4;
const COL_WIDTH = 300;
const ROW_HEIGHT = 200;

const nodes = items.map((item, i) => ({
    id: item.id,
    position: {
        x: (i % COLS) * COL_WIDTH,
        y: Math.floor(i / COLS) * ROW_HEIGHT,
    },
    ...
}));
```

## Edge Patterns

### Basic directed edge

```js
{ id: 'e1', source: 'a', target: 'b', animated: true, style: { stroke: '#475569', strokeWidth: 2 } }
```

### Labeled edge

```js
{ id: 'e1', source: 'a', target: 'b', label: 'calls', labelStyle: { fill: '#94a3b8', fontSize: 11 }, labelBgStyle: { fill: '#1e293b' } }
```

### Edge types

- `default` — bezier curve (best for trees)
- `smoothstep` — right-angled with rounded corners (best for flowcharts)
- `step` — right-angled sharp corners
- `straight` — direct line

Set via `type` property: `{ id: 'e1', source: 'a', target: 'b', type: 'smoothstep' }`.

## Color Palette (Dark Theme)

| Purpose | Color | Usage |
|---------|-------|-------|
| Background | `#0f172a` | Page/canvas |
| Card bg | `#1e293b` | Node cards |
| Card border | `#334155` | Default border |
| Card border hover | `#475569` | Hover state |
| Primary text | `#f1f5f9` | Titles, names |
| Secondary text | `#cbd5e1` | List items |
| Muted text | `#64748b` | Labels, captions |
| Dim text | `#475569` | Disabled, empty states |
| Edge default | `#475569` | Connection lines |
| Edge animated | `#60a5fa` | Active connections |
| Blue accent | `#3b82f6` / `#60a5fa` | — |
| Purple accent | `#8b5cf6` / `#a78bfa` | — |
| Green accent | `#10b981` / `#34d399` | — |
| Amber accent | `#f59e0b` / `#fbbf24` | — |
| Red accent | `#ef4444` / `#f87171` | — |

### Type badge CSS pattern

```css
.type-example {
    background: rgba(59, 130, 246, 0.15);
    color: #60a5fa;
    border: 1px solid rgba(59, 130, 246, 0.3);
}
```

Replace the RGB values with any accent color. The pattern is: 15% opacity background, full-brightness text, 30% opacity border.

## Title and Legend

### Title overlay

```js
h('div', { className: 'diagram-title' },
    'Main Title',
    h('div', { className: 'subtitle' }, 'Subtitle text'),
)
```

### Legend overlay

```js
h('div', { className: 'legend' },
    h('div', { className: 'legend-item' },
        h('div', { className: 'legend-dot', style: { background: '#3b82f6' } }),
        'Label',
    ),
    // ... more items
)
```

## Common Node Designs

### Card with sub-items

For nodes that have a list of children (e.g., a flow with data actions):

```js
function CardWithList({ data }) {
    return h('div', { className: 'node-card' },
        h(Handle, { type: 'target', position: Position.Top, style: { background: '#475569', width: 8, height: 8 } }),
        h('div', { className: `type-badge ${data.badgeClass}` }, data.badgeLabel),
        h('div', { className: 'node-title' }, data.label),
        data.items.length > 0
            ? h('div', null,
                h('div', { className: 'section-label' }, data.itemsLabel),
                ...data.items.map((item, i) =>
                    h('div', { key: i, className: 'list-item' }, item)
                )
            )
            : h('div', { className: 'muted' }, `No ${data.itemsLabel.toLowerCase()}`),
        h(Handle, { type: 'source', position: Position.Bottom, style: { background: '#475569', width: 8, height: 8 } }),
    );
}
```

### Simple labeled node

For minimal nodes (state machine states, simple pipeline steps):

```js
function SimpleNode({ data }) {
    return h('div', { className: 'node-card', style: { textAlign: 'center', minWidth: 120 } },
        h(Handle, { type: 'target', position: Position.Top, style: { background: '#475569', width: 8, height: 8 } }),
        h('div', { className: 'node-title', style: { marginBottom: 0 } }, data.label),
        h(Handle, { type: 'source', position: Position.Bottom, style: { background: '#475569', width: 8, height: 8 } }),
    );
}
```

### Node with status indicator

```js
function StatusNode({ data }) {
    const statusColors = { healthy: '#10b981', warning: '#f59e0b', error: '#ef4444' };
    return h('div', { className: 'node-card' },
        h(Handle, { type: 'target', position: Position.Top, style: { background: '#475569', width: 8, height: 8 } }),
        h('div', { style: { display: 'flex', alignItems: 'center', gap: 8 } },
            h('div', { style: { width: 8, height: 8, borderRadius: '50%', background: statusColors[data.status] || '#475569' } }),
            h('div', { className: 'node-title', style: { marginBottom: 0 } }, data.label),
        ),
        h(Handle, { type: 'source', position: Position.Bottom, style: { background: '#475569', width: 8, height: 8 } }),
    );
}
```