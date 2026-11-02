# ✒️ FontCraft Studio

> **Modern, 100% Client-Side Vector Font Creator & SVG Typography Engine**  
> *Design, vectorize, kern, preview, and export production-ready TrueType (`.ttf`) and SVG fonts directly in the browser.*

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Angular](https://img.shields.io/badge/Angular-21.0.0-dd0031.svg)](https://angular.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.2-3178c6.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.1.12-38bdf8.svg)](https://tailwindcss.com/)
[![Tests](https://img.shields.io/badge/Tests-18%20Passed-emerald.svg)]()
[![Code Quality](https://img.shields.io/badge/Linter-0%20Errors-success.svg)]()

---

## 🌟 Overview

**FontCraft Studio** is an open-source, high-performance web application designed for typography lovers, type designers, graphic artists, and web developers. It provides a complete digital type foundry environment operating entirely in client-side memory—with zero server uploads, zero telemetry, and zero third-party dependencies required for glyph generation.

Whether you are designing a playful handwriting font, drafting geometric display letters, auto-tracing hand-drawn paper sketches, or generating multi-weight font families, FontCraft Studio makes the entire workflow intuitive, visual, and fast.

---

## 🚀 Key Features

### 1. Vector Drawing & Shape Tools
- **Freehand Organic Brush**: Pressure-responsive vector stroke capture with 4 smoothing presets (`Off`, `Low`, `Med`, `Silk`) powered by quadratic Bézier midpoint interpolation.
- **Precision Vector Pen**: Click to place anchors, adjust directional Bézier control handles, and construct custom polygonal or curved contours.
- **Parametric Geometric Primitives**: Draw perfectly aligned rectangular stems, circular bowls, ovals, and bars with real-time bounding box feedback.
- **Configurable Stroke Width**: Fine (16px), Medium (32px), Chunky (48px), and Thick (64px) with continuous slider control.

### 2. Algorithmic Vector Auto-Trace Engine
- **Client-Side Image Vectorizer**: Convert bitmap sketches, logos, or photos (PNG, JPG, WebP, GIF, SVG) into clean vector outlines in milliseconds.
- **Moore-Neighbor Boundary Tracing**: Robust 8-connected contour extraction capable of handling both external perimeters and inner counter-forms.
- **Douglas-Peucker Simplification**: Removes high-frequency jitter and redundant anchor points while preserving natural curves.
- **Interactive Threshold & Detail Tuning**: Real-time binarization slider, curve smoothing slider, invert colors toggle, and automatic bounding fit to the font's typographic em-square.

### 3. Variable Typography & Font Variants
- **Continuous Weight Slider**: 100 (Thin) to 900 (Black) with instant optical weight recalculation and live rendering feedback.
- **Algorithmic Variant Derivation**:
  - **Italic**: Mathematical oblique shear transform ($\Delta x = \tan(12^\circ) \times (y - \text{baseline})$).
  - **Condensed / Expanded**: Proportional horizontal coordinate scaling with automatic advance width adjustment.
  - **Bold / Light**: Optical stroke expansion and weight scaling.
- **Variant Selector**: Seamlessly switch between `Regular`, `Bold`, `Light`, `Italic`, and `Condensed` weights.

### 4. Typographic Guides & Magnetic Snapping
- **Standard Reference Lines**: Ascender (+800), Cap Height (+700), X-Height (+500), Baseline (0), Descender (-200), Left Bearing (0), and Advance Width.
- **Magnetic Snapping**: Proximity detection that snaps cursor coordinates to active metric guides and user-defined grid lines (25px, 50px, 100px).
- **Custom Guidelines**: Create and manage custom horizontal and vertical guides with custom colors and labels.
- **Visual Feedback**: Animated snap lines highlight when alignment thresholds are met.

### 5. Character Set & Unicode Coverage Map
- **Comprehensive Unicode Map**: Visual progress dashboard showing designed vs. remaining glyphs across full character sets.
- **Category Filtering**: Instantly filter between `Uppercase (A-Z)`, `Lowercase (a-z)`, `Numbers (0-9)`, `Punctuation`, `Symbols`, `Designed`, and `Empty`.
- **Quick-Add Extensions**: Single-click addition of extended Latin diacritics (`À, é, ñ...`) and mathematical/currency symbols.
- **Waterfall Specimen Preview**: Inspect live rendered vector glyphs at standard optical sizes (60px, 44px, 32px, 20px).

### 6. Typographic Kerning Manager
- **Pair Kerning Table**: Adjust optical spacing between awkward letter combinations (e.g., `AV`, `WA`, `To`, `LT`).
- **Standard Typographic Pairs**: Pre-loaded with 19 standard typographic pairs.
- **Live Pair Preview**: Real-time side-by-side preview with distance markers and step sliders.

### 7. Non-Destructive Glyph Revision History
- **Per-Glyph Revision Timeline**: Track every brush stroke, pen edit, auto-trace import, or simplification step.
- **Mini SVG Thumbnails**: Visual snapshot history displaying node counts and relative timestamps.
- **Instant Rollback**: Jump back or forward to any point in a glyph's history with one click.
- **Global Undo/Redo**: Full keyboard shortcut support (`Ctrl+Z` / `Ctrl+Y`).

### 8. Multi-Format Export Engine
- **Installable TrueType (`.ttf`)**: Generates real binary TTF font files with complete OpenType tables (`cmap`, `glyf`, `head`, `hhea`, `hmtx`, `loca`, `maxp`, `name`, `post`, `OS/2`). Ready to install on macOS, Windows, Linux, iOS, and Android.
- **SVG Font 1.1 (`.svg`)**: Valid W3C SVG font specification file containing embedded glyph paths, unicode bindings, and `<hkern>` tags.
- **Individual SVG Glyphs (`.zip`)**: Download all designed letters as separate standalone SVG files for Figma, Adobe Illustrator, Inkscape, or vinyl cutters (Cricut/Silhouette).
- **SVG Sprite Sheet**: Combined `<symbol>` sprite sheet for modern web development.
- **Web Font CSS**: Copy-paste `@font-face` CSS definitions for instant website integration.

### 9. Responsive Mobile & Desktop Workspace
- **Desktop Layout (1440×900+)**: 3-column docked layout with persistent left tool palette, central vector canvas, horizontal glyph catalog, and bottom live type tester.
- **Mobile Layout (390×844)**: Adaptive 3-tab navigation (`Canvas`, `Glyphs`, `Type Test`) with zero layout overlapping, compact header strips, and full touch-drawing support.

---

## 🛠️ Tech Stack & Architecture

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Framework** | Angular 21 (Zoneless) | Modern signal-based reactive architecture (`ChangeDetectionStrategy.OnPush`) |
| **Language** | TypeScript 5.9 | Strictest type-checking rules, exhaustive null/undefined safety |
| **Styling** | Tailwind CSS 4 | Utility-first, zero-pill modern typography design palette |
| **Icons** | Google Material Icons | Crisp, accessible iconography (`@angular/material/icon`) |
| **Font Binary** | `opentype.js` 2.0 | Pure JavaScript TrueType and OpenType font parser and writer |
| **Packaging** | `JSZip` 3.10 | In-browser client-side ZIP archive generation |
| **Animations** | `motion` 12.23 | Smooth UI transitions and interactions |
| **Testing** | Node.js Test Runner + Playwright | 18 unit tests for pure vector algorithms + 14 E2E browser test suites |

---

## 📊 Codebase Statistics

```
================================================================================
Language                     Files         Lines         Blank       Comment
================================================================================
TypeScript (.ts)                26         7,910           620           440
HTML (.html)                     2           163            12             8
CSS (.css)                       2            64             8             6
--------------------------------------------------------------------------------
Total Source                    30         8,137           640           454
Unit & E2E Tests                 4         1,120            80            60
Configuration Files              8           340            25            10
================================================================================
Grand Total                     42         9,597           745           524
================================================================================
```

- **Clean Architecture**: Domain models (`/core/models/`), functional vector algorithms (`/core/vector/`), reactive state management (`/core/services/`), and decoupled presentational components (`/components/`).
- **Zero Server Overhead**: 100% of vector mathematics, bitmap binarization, contour tracing, and font compilation execute client-side.

---

## 📁 Project Directory Structure

```
fontcraft-studio/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── auto-trace-modal/     # Image upload, canvas binarization & Moore-Neighbor tracing
│   │   │   ├── canvas/               # SVG drawing canvas, grid rendering, handles & snapping
│   │   │   ├── character-set-modal/  # Unicode coverage grid & waterfall specimen viewer
│   │   │   ├── export-modal/         # TTF, SVG Font, ZIP & CSS export dialogues
│   │   │   ├── glyph-selector/       # Horizontal glyph carousel & quick-add input
│   │   │   ├── header/               # Brand header, family name input, presets & export CTA
│   │   │   ├── history-drawer/       # Non-destructive revision timeline & restore cards
│   │   │   ├── kerning-modal/        # Kerning pair manager & optical spacing editor
│   │   │   ├── live-tester/          # Dynamic type playground with pangrams & theme switcher
│   │   │   ├── svg-modal/            # Raw SVG path code editor & direct vector importer
│   │   │   └── toolbar/              # Drawing tools, stroke width, weight slider & variants
│   │   ├── core/
│   │   │   ├── models/
│   │   │   │   └── font.model.ts     # Domain interfaces, glyph contracts & metrics types
│   │   │   ├── services/
│   │   │   │   ├── font-generator.ts # TTF binary compilation, SVG font XML & ZIP builder
│   │   │   │   ├── font-presets.ts   # Typography templates (Casual, Geometric, Blank)
│   │   │   │   └── font-state.ts     # Global reactive signals store & command dispatchers
│   │   │   └── vector/
│   │   │       ├── auto-tracer.ts    # Moore-Neighbor contour tracing & thresholding engine
│   │   │       ├── font-transforms.ts# Oblique shear slant, condensing & variant derivation
│   │   │       ├── path-math.ts      # Bézier math, SVG parser, stroke expansion & snapping
│   │   │       └── *.test.ts         # Unit tests for vector math and algorithmic functions
│   │   ├── app.html                  # Root layout with desktop split & mobile tab switcher
│   │   ├── app.ts                    # Root component with global keyboard shortcut handling
│   │   └── app.css                   # Component-level styles
│   ├── index.html                    # Application HTML shell
│   ├── main.ts                       # Zoneless Angular bootstrapping
│   └── styles.css                    # Tailwind CSS 4 theme imports
├── package.json                      # Dependencies and automation scripts
└── README.md                         # Project documentation
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| <kbd>B</kbd> | Select Freehand Brush tool |
| <kbd>P</kbd> | Select Vector Pen tool |
| <kbd>G</kbd> | Toggle Grid visibility |
| <kbd>Ctrl</kbd> + <kbd>Z</kbd> / <kbd>Cmd</kbd> + <kbd>Z</kbd> | Undo last stroke or drawing operation |
| <kbd>Ctrl</kbd> + <kbd>Y</kbd> / <kbd>Cmd</kbd> + <kbd>Shift</kbd> + <kbd>Z</kbd> | Redo previously undone operation |
| <kbd>Esc</kbd> | Dismiss any open modal dialog or slide-over drawer |

---

## 🚀 Getting Started

### Prerequisites
- Node.js `20.x` or later
- npm `10.x` or later

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/fontcraft-studio.git
   cd fontcraft-studio
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the local development server**:
   ```bash
   npm run dev
   ```
   Open your browser and navigate to `http://localhost:3000`.

### Building for Production

Compile an optimized production bundle:
```bash
npm run build
```
Build output will be generated in `dist/app/browser`.

---

## 🧪 Testing

### Unit Tests (Vector Mathematics & Algorithms)
Run the unit test suite covering Moore-Neighbor auto-tracing, Douglas-Peucker point reduction, Bézier curves, slant transforms, and SVG font XML generators:
```bash
npx --yes tsx --test src/app/core/vector/auto-tracer.test.ts src/app/core/vector/font-transforms.test.ts src/app/core/vector/path-math.test.ts
```

### End-to-End Test Suite (Playwright)
Run the 14-suite automated browser test covering every button, modal, drawing tool, variant change, and mobile viewport interaction:
```bash
node test-all-features.js
```

### Linter Check
Verify strict TypeScript and Angular ESLint rules:
```bash
npm run lint
```

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the Project.
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`).
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`).
4. Run tests and linting (`npm run lint && npm test`).
5. Push to the Branch (`git push origin feature/AmazingFeature`).
6. Open a Pull Request.

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.
