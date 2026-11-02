import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FontState } from '../../core/services/font-state';
import {
  contourToSvgPath,
  createCircleContour,
  createRectContour,
  expandStrokeToOutline,
} from '../../core/vector/path-math';

@Component({
  selector: 'app-vector-canvas',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule, MatTooltipModule],
  template: `
    <div class="relative flex-1 bg-slate-950 flex flex-col h-full overflow-hidden select-none">
      <!-- Simplification Notification Toast -->
      @if (state.lastSimplificationMessage()) {
        <div class="absolute top-14 left-1/2 -translate-x-1/2 z-30 px-3.5 py-1.5 rounded-xl bg-slate-900/95 backdrop-blur border border-emerald-500/50 text-emerald-300 text-xs shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <mat-icon class="text-sm text-emerald-400">auto_fix_high</mat-icon>
          <span class="font-medium">{{ state.lastSimplificationMessage() }}</span>
        </div>
      }

      <!-- Top Primary Canvas Bar -->
      <div class="px-2.5 sm:px-3 py-1.5 sm:py-2 border-b border-slate-900 bg-slate-900/70 backdrop-blur flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 text-xs text-slate-300 shrink-0">
        <!-- Glyph Info & Editable Name -->
        <div class="flex items-center justify-between sm:justify-start gap-1.5 sm:gap-2">
          <div class="flex items-center gap-1.5">
            <span class="font-bold text-white text-sm">Glyph '{{ state.selectedCharacter() }}'</span>
            <div
              class="flex items-center gap-1 bg-slate-950 border border-slate-700/80 rounded-lg px-2 py-0.5"
              matTooltip="Click to rename this glyph"
            >
              <span class="text-[9px] sm:text-[10px] text-slate-400 uppercase font-semibold">Name:</span>
              <input
                type="text"
                [value]="state.currentGlyph().name"
                (change)="onGlyphNameChange($event)"
                class="bg-transparent text-amber-300 font-mono text-xs w-12 sm:w-18 outline-none"
                title="Click to rename this glyph"
              />
            </div>
          </div>

          <div class="flex items-center gap-1.5">
            <span class="text-amber-400 font-mono text-[11px]" matTooltip="Character advance width in font units">
              W: {{ state.currentGlyph().metrics.advanceWidth }}
            </span>
            <!-- Active Variant & Font Weight Indicator -->
            <div class="flex items-center gap-1 bg-slate-800/80 px-2 py-0.5 rounded-lg border border-slate-700/60 text-[10px] sm:text-[11px]">
              <span class="text-amber-300 font-bold capitalize">{{ state.activeVariant().name }}</span>
              <span class="text-slate-400 font-mono">({{ state.fontWeight() }})</span>
            </div>
          </div>
        </div>

        <!-- Quick Actions & Tools (Horizontal scroll strip on mobile) -->
        <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 whitespace-nowrap">
          <!-- Snap Toggle -->
          <button
            type="button"
            (click)="state.toggleSnapToGrid()"
            [class]="state.gridSettings().snapToGrid ? 'bg-amber-400 text-slate-950 font-bold shadow-sm' : 'bg-slate-800 text-slate-300 hover:text-white'"
            class="flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 transition-colors"
            matTooltip="Toggle Snap to Grid (G)"
            title="Snap to Grid"
          >
            <mat-icon class="text-xs">gps_fixed</mat-icon>
            <span>Snap: {{ state.gridSettings().snapToGrid ? 'ON' : 'OFF' }}</span>
          </button>

          <!-- Guides & Snapping Menu Button -->
          <button
            type="button"
            (click)="toggleGuidesMenu()"
            [class]="isGuidesMenuOpen() ? 'bg-sky-500/20 text-sky-300 border-sky-400/50' : 'bg-slate-800 text-slate-300 hover:text-white border-slate-700'"
            class="px-2 sm:px-2.5 py-1 rounded-lg border text-xs font-medium shrink-0 transition-colors flex items-center gap-1"
            matTooltip="Configure snapping and custom draggable guidelines"
            title="Guides & Snapping"
          >
            <mat-icon class="text-xs">straighten</mat-icon>
            <span>Guides</span>
          </button>

          <!-- Auto-Trace Trigger Button -->
          <button
            type="button"
            (click)="state.openAutoTraceModal()"
            class="px-2 sm:px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold shrink-0 transition-all flex items-center gap-1"
            matTooltip="Auto-trace an image or sketch into vector outlines"
            title="Auto-Trace Image"
          >
            <mat-icon class="text-xs text-amber-400">auto_fix_high</mat-icon>
            <span>Auto-Trace</span>
          </button>

          <!-- Path Simplification Quick Button -->
          <button
            type="button"
            (click)="state.simplifyCurrentGlyph()"
            class="px-2 sm:px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-medium shrink-0 transition-colors flex items-center gap-1"
            matTooltip="Simplify vector outline: removes jittery nodes and redundant points"
            title="Simplify Path"
          >
            <mat-icon class="text-xs">auto_fix_normal</mat-icon>
            <span>Simplify</span>
          </button>

          <!-- Glyph History Button -->
          <button
            type="button"
            (click)="state.toggleHistoryDrawer()"
            [class]="state.isHistoryDrawerOpen() ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300 hover:text-white border-slate-700'"
            class="px-2 sm:px-2.5 py-1 rounded-lg border text-xs font-medium shrink-0 transition-colors flex items-center gap-1"
            matTooltip="Open Glyph revision history timeline"
            title="Revision History"
          >
            <mat-icon class="text-xs">history</mat-icon>
            <span>History ({{ state.currentGlyphHistory().length }})</span>
          </button>

          <!-- Character Set Full Preview -->
          <button
            type="button"
            (click)="state.openCharacterSetModal()"
            class="px-2 sm:px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium shrink-0 transition-colors flex items-center gap-1"
            matTooltip="View complete character set coverage and font map"
            title="Character Set Preview"
          >
            <mat-icon class="text-xs">grid_view</mat-icon>
            <span>Map</span>
          </button>

          <!-- Kerning Button -->
          <button
            type="button"
            (click)="openKerningModal.emit()"
            class="px-2 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-medium shrink-0 transition-colors flex items-center gap-1"
            matTooltip="Manage typographic kerning pairs (AV, WA, etc.)"
            title="Kerning Pairs"
          >
            <mat-icon class="text-xs">space_bar</mat-icon>
            <span>Kern ({{ state.kerningPairCount() }})</span>
          </button>

          <!-- SVG Code Direct Edit Button -->
          <button
            type="button"
            (click)="openSvgModal.emit()"
            class="px-2 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-medium shrink-0 transition-colors flex items-center gap-1"
            matTooltip="Inspect, copy, or edit raw SVG code for this glyph"
            title="SVG Code"
          >
            <mat-icon class="text-xs">code</mat-icon>
            <span>SVG</span>
          </button>

          <button
            type="button"
            (click)="state.clearCurrentGlyph()"
            class="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-medium shrink-0 transition-colors"
            matTooltip="Clear vector strokes for this glyph"
            title="Clear canvas"
          >
            Clear
          </button>
        </div>
      </div>

      <!-- Guides & Snapping Flyout Drawer -->
      @if (isGuidesMenuOpen()) {
        <div class="absolute top-12 right-4 z-40 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-4 w-72 space-y-3.5 text-xs animate-in fade-in slide-in-from-top-2 duration-150">
          <div class="flex items-center justify-between pb-2 border-b border-slate-800">
            <span class="font-bold text-white flex items-center gap-1.5">
              <mat-icon class="text-amber-400 text-sm">straighten</mat-icon>
              <span>Guides &amp; Snapping</span>
            </span>
            <button
              type="button"
              (click)="isGuidesMenuOpen.set(false)"
              class="text-slate-400 hover:text-white p-1"
            >
              <mat-icon class="text-sm">close</mat-icon>
            </button>
          </div>

          <!-- Toggles -->
          <div class="space-y-2">
            <label class="flex items-center justify-between cursor-pointer">
              <span class="text-slate-300">Snap to Grid</span>
              <input
                type="checkbox"
                [checked]="state.gridSettings().snapToGrid"
                (change)="state.toggleSnapToGrid()"
                class="rounded border-slate-700 text-amber-500 focus:ring-amber-400"
              />
            </label>

            <label class="flex items-center justify-between cursor-pointer">
              <span class="text-slate-300">Snap to Typographic Guides</span>
              <input
                type="checkbox"
                [checked]="state.gridSettings().snapToGuides"
                (change)="state.toggleSnapToGuides()"
                class="rounded border-slate-700 text-amber-500 focus:ring-amber-400"
              />
            </label>

            <label class="flex items-center justify-between cursor-pointer">
              <span class="text-slate-300">Show Typographic Guides</span>
              <input
                type="checkbox"
                [checked]="state.showMetrics()"
                (change)="state.toggleMetrics()"
                class="rounded border-slate-700 text-amber-500 focus:ring-amber-400"
              />
            </label>

            <label class="flex items-center justify-between cursor-pointer">
              <span class="text-slate-300">Show Center Guides</span>
              <input
                type="checkbox"
                [checked]="state.showCenterGuides()"
                (change)="state.toggleCenterGuides()"
                class="rounded border-slate-700 text-amber-500 focus:ring-amber-400"
              />
            </label>
          </div>

          <!-- Custom Guides List & Quick Add -->
          <div class="pt-2 border-t border-slate-800 space-y-2">
            <span class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Custom Guides</span>
            <div class="flex items-center gap-2">
              <button
                type="button"
                (click)="addCustomGuideAtCursor('horizontal')"
                class="flex-1 py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 text-[11px] font-medium transition-colors"
                matTooltip="Add horizontal guide line"
              >
                + Horizontal (Y)
              </button>
              <button
                type="button"
                (click)="addCustomGuideAtCursor('vertical')"
                class="flex-1 py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 text-[11px] font-medium transition-colors"
                matTooltip="Add vertical guide line"
              >
                + Vertical (X)
              </button>
            </div>

            @if (state.customGuides().length > 0) {
              <div class="max-h-28 overflow-y-auto space-y-1 pt-1">
                @for (g of state.customGuides(); track g.id) {
                  <div class="flex items-center justify-between bg-slate-950 px-2 py-1 rounded text-[11px] text-slate-300">
                    <span>{{ g.orientation === 'horizontal' ? 'H (Y:' + g.position + ')' : 'V (X:' + g.position + ')' }}</span>
                    <button
                      type="button"
                      (click)="state.removeCustomGuide(g.id)"
                      class="text-rose-400 hover:text-rose-300 text-xs"
                      matTooltip="Delete guide"
                    >
                      ×
                    </button>
                  </div>
                }
              </div>
              <button
                type="button"
                (click)="state.clearCustomGuides()"
                class="w-full text-center text-[10px] text-rose-400 hover:underline pt-1"
              >
                Clear all custom guides
              </button>
            }
          </div>
        </div>
      }

      <!-- Main SVG Canvas Area -->
      <div class="relative flex-1 flex items-center justify-center p-4 overflow-hidden bg-dot-grid">
        <div
          class="relative w-full max-w-[850px] aspect-square bg-slate-900/90 rounded-2xl border border-slate-800/80 shadow-2xl overflow-hidden flex items-center justify-center"
          [style.transform]="'scale(' + state.zoom() + ')'"
          style="transition: transform 0.1s ease-out; touch-action: none;"
        >
          <svg
            #svgCanvas
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1000 1000"
            class="w-full h-full cursor-crosshair"
            (pointerdown)="onPointerDown($event)"
            (pointermove)="onPointerMove($event)"
            (pointerup)="onPointerUp($event)"
            (pointercancel)="onPointerCancel($event)"
            (pointerleave)="onPointerCancel($event)"
          >
            <defs>
              @if (state.gridSettings().enabled) {
                @if (state.gridSettings().style === 'lines') {
                  <pattern
                    id="gridLines"
                    [attr.width]="state.gridSettings().size"
                    [attr.height]="state.gridSettings().size"
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      [attr.d]="'M ' + state.gridSettings().size + ' 0 L 0 0 0 ' + state.gridSettings().size"
                      fill="none"
                      stroke="rgba(255,255,255,0.05)"
                      stroke-width="1"
                    />
                  </pattern>
                } @else {
                  <pattern
                    id="gridDots"
                    [attr.width]="state.gridSettings().size"
                    [attr.height]="state.gridSettings().size"
                    patternUnits="userSpaceOnUse"
                  >
                    <circle cx="1" cy="1" r="1.5" fill="rgba(255,255,255,0.12)" />
                  </pattern>
                }
              }
            </defs>

            <!-- Grid Fill Layer -->
            @if (state.gridSettings().enabled) {
              <rect
                width="1000"
                height="1000"
                [attr.fill]="state.gridSettings().style === 'lines' ? 'url(#gridLines)' : 'url(#gridDots)'"
                pointer-events="none"
              />
            }

            <!-- Tracing Reference / Onion Skin Ghost -->
            @if (state.showTracingGuide()) {
              <text
                x="60"
                y="800"
                font-size="820"
                [attr.font-family]="state.tracingGuideFont()"
                fill="#38bdf8"
                [attr.opacity]="state.tracingGuideOpacity()"
                font-weight="normal"
                text-anchor="start"
                pointer-events="none"
                style="user-select: none;"
              >
                {{ state.selectedCharacter() }}
              </text>
            }

            <!-- Center Guides (Horizontal & Vertical Center) -->
            @if (state.showCenterGuides()) {
              <line x1="500" y1="0" x2="500" y2="1000" stroke="#06b6d4" stroke-dasharray="3 3" stroke-width="1" opacity="0.4" />
              <line x1="0" y1="450" x2="1000" y2="450" stroke="#06b6d4" stroke-dasharray="3 3" stroke-width="1" opacity="0.4" />
            }

            <!-- Typographic Metric Guidelines -->
            @if (state.showMetrics()) {
              <!-- Ascender (Y=100) -->
              <line x1="0" y1="100" x2="1000" y2="100" stroke="#34d399" stroke-dasharray="4 4" stroke-width="1.5" />
              <text x="10" y="92" fill="#34d399" font-size="12" font-family="monospace" opacity="0.8">ASCENDER (+800)</text>

              <!-- Cap Height (Y=200) -->
              <line x1="0" y1="200" x2="1000" y2="200" stroke="#60a5fa" stroke-dasharray="6 4" stroke-width="1.5" />
              <text x="10" y="192" fill="#60a5fa" font-size="12" font-family="monospace" opacity="0.8">CAP HEIGHT (+700)</text>

              <!-- X-Height (Y=450) -->
              <line x1="0" y1="450" x2="1000" y2="450" stroke="#c084fc" stroke-dasharray="6 4" stroke-width="1.5" />
              <text x="10" y="442" fill="#c084fc" font-size="12" font-family="monospace" opacity="0.8">X-HEIGHT (+500)</text>

              <!-- Baseline (Y=800) Solid Warm Amber -->
              <line x1="0" y1="800" x2="1000" y2="800" stroke="#f59e0b" stroke-width="2.5" />
              <rect x="8" y="776" width="105" height="20" rx="4" fill="#f59e0b" opacity="0.9" />
              <text x="14" y="791" fill="#020617" font-size="11" font-weight="bold" font-family="monospace">BASELINE (0)</text>

              <!-- Descender (Y=950) -->
              <line x1="0" y1="950" x2="1000" y2="950" stroke="#f43f5e" stroke-dasharray="4 4" stroke-width="1.5" />
              <text x="10" y="942" fill="#f43f5e" font-size="12" font-family="monospace" opacity="0.8">DESCENDER (-200)</text>

              <!-- Left Sidebearing (X=60) -->
              <line x1="60" y1="0" x2="60" y2="1000" stroke="#22d3ee" stroke-width="1.5" stroke-dasharray="3 3" opacity="0.6" />

              <!-- Right Sidebearing / Advance Width Guide -->
              <g class="cursor-ew-resize">
                <line
                  [attr.x1]="state.currentGlyph().metrics.advanceWidth"
                  y1="0"
                  [attr.x2]="state.currentGlyph().metrics.advanceWidth"
                  y2="1000"
                  stroke="#38bdf8"
                  stroke-width="2.5"
                />
                <circle
                  [attr.cx]="state.currentGlyph().metrics.advanceWidth"
                  cy="20"
                  r="12"
                  fill="#38bdf8"
                  stroke="#0f172a"
                  stroke-width="2"
                />
                <text
                  [attr.x]="state.currentGlyph().metrics.advanceWidth + 14"
                  y="24"
                  fill="#38bdf8"
                  font-size="11"
                  font-family="monospace"
                  font-weight="bold"
                >
                  WIDTH: {{ state.currentGlyph().metrics.advanceWidth }}
                </text>
              </g>
            }

            <!-- Custom User Guidelines -->
            @for (guide of state.customGuides(); track guide.id) {
              @if (guide.orientation === 'horizontal') {
                <line
                  x1="0"
                  [attr.y1]="guide.position"
                  x2="1000"
                  [attr.y2]="guide.position"
                  stroke="#38bdf8"
                  stroke-dasharray="5 5"
                  stroke-width="1.5"
                />
                <text x="920" [attr.y]="guide.position - 4" fill="#38bdf8" font-size="11" font-family="monospace" font-weight="bold">
                  Y:{{ guide.position }}
                </text>
              } @else {
                <line
                  [attr.x1]="guide.position"
                  y1="0"
                  [attr.x2]="guide.position"
                  y2="1000"
                  stroke="#38bdf8"
                  stroke-dasharray="5 5"
                  stroke-width="1.5"
                />
                <text [attr.x]="guide.position + 4" y="990" fill="#38bdf8" font-size="11" font-family="monospace" font-weight="bold">
                  X:{{ guide.position }}
                </text>
              }
            }

            <!-- User's Drawn Glyph Path -->
            @if (state.currentGlyph().svgPath) {
              <path
                [attr.d]="state.currentGlyph().svgPath"
                fill="#f8fafc"
                fill-rule="nonzero"
                stroke="none"
              />
            }

            <!-- Live Active Drawing Stroke (Brush preview) -->
            @if (liveStrokePath()) {
              <path
                [attr.d]="liveStrokePath()"
                fill="#f59e0b"
                fill-opacity="0.95"
                stroke="none"
              />
            }

            <!-- Live Active Shape Preview -->
            @if (liveShapePath()) {
              <path
                [attr.d]="liveShapePath()"
                fill="#f59e0b"
                fill-opacity="0.8"
                stroke="#fbbf24"
                stroke-width="2"
              />
            }

            <!-- Live Pen Tool Points & Lines -->
            @if (state.activeTool() === 'pen' && penPoints().length > 0) {
              <polyline
                [attr.points]="getPolylinePointsString()"
                fill="none"
                stroke="#60a5fa"
                stroke-width="3"
                stroke-dasharray="6 3"
              />
              @for (pt of penPoints(); track $index) {
                <circle
                  [attr.cx]="pt.x"
                  [attr.cy]="pt.y"
                  r="7"
                  [attr.fill]="$index === 0 ? '#34d399' : '#60a5fa'"
                  stroke="#0f172a"
                  stroke-width="2"
                />
              }
            }

            <!-- Magnetic Snapping Visual Guides & Indicators -->
            @for (snapGuide of state.activeSnapGuides(); track snapGuide.label) {
              @if (snapGuide.orientation === 'horizontal') {
                <line
                  x1="0"
                  [attr.y1]="snapGuide.position"
                  x2="1000"
                  [attr.y2]="snapGuide.position"
                  stroke="#f59e0b"
                  stroke-width="2"
                  stroke-dasharray="4 2"
                  class="animate-pulse"
                />
                <g [attr.transform]="'translate(840, ' + (snapGuide.position - 8) + ')'">
                  <rect x="0" y="0" width="140" height="18" rx="4" fill="#f59e0b" />
                  <text x="6" y="13" fill="#0f172a" font-size="10" font-weight="bold" font-family="monospace">
                    {{ snapGuide.label }}
                  </text>
                </g>
              } @else {
                <line
                  [attr.x1]="snapGuide.position"
                  y1="0"
                  [attr.x2]="snapGuide.position"
                  y2="1000"
                  stroke="#38bdf8"
                  stroke-width="2"
                  stroke-dasharray="4 2"
                  class="animate-pulse"
                />
                <g [attr.transform]="'translate(' + (snapGuide.position + 4) + ', 20)'">
                  <rect x="0" y="0" width="130" height="18" rx="4" fill="#38bdf8" />
                  <text x="6" y="13" fill="#0f172a" font-size="10" font-weight="bold" font-family="monospace">
                    {{ snapGuide.label }}
                  </text>
                </g>
              }
            }

            <!-- Cursor preview while hovering -->
            @if (hoverPos() && state.activeTool() === 'brush' && !isDrawing()) {
              <circle
                [attr.cx]="hoverPos()!.x"
                [attr.cy]="hoverPos()!.y"
                [attr.r]="state.brushSize() / 2"
                fill="none"
                stroke="#f59e0b"
                stroke-width="1.5"
                stroke-dasharray="3 3"
                pointer-events="none"
              />
            }
          </svg>
        </div>
      </div>

      <!-- Bottom Studio Status Bar -->
      <div class="bg-slate-900 border-t border-slate-800 px-4 py-2 flex items-center justify-between text-xs text-slate-400">
        <div class="flex items-center gap-3">
          <span class="flex items-center gap-1.5 font-medium text-slate-300">
            <mat-icon class="text-sm text-amber-400">mode_edit</mat-icon>
            <span class="capitalize">Tool: {{ state.activeTool() }}</span>
          </span>
          <span class="text-slate-600">|</span>
          <span>Grid: {{ state.gridSettings().enabled ? state.gridSettings().size + 'px ' + state.gridSettings().style : 'Off' }}</span>
          @if (state.gridSettings().snapToGrid) {
            <span class="text-amber-400 font-semibold">[Snap To Grid]</span>
          }
          @if (state.gridSettings().snapToGuides) {
            <span class="text-sky-400 font-semibold">[Snap To Guides]</span>
          }
        </div>

        <div class="flex items-center gap-3">
          <span class="font-mono text-[11px] text-slate-300">Weight: {{ state.fontWeight() }}</span>
          <span class="text-slate-600">|</span>
          <button
            type="button"
            (click)="state.resetZoomPan()"
            class="text-[11px] text-slate-400 hover:text-white"
            matTooltip="Reset zoom level to 100%"
          >
            Reset View (100%)
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .bg-dot-grid {
        background-color: #030712;
        background-image: radial-gradient(#1e293b 1px, transparent 1px);
        background-size: 24px 24px;
      }
    `,
  ],
})
export class VectorCanvasComponent {
  readonly state = inject(FontState);
  readonly openSvgModal = output<void>();
  readonly openKerningModal = output<void>();

  private readonly canvasEl = viewChild<ElementRef<SVGSVGElement>>('svgCanvas');

  readonly isDrawing = signal<boolean>(false);
  readonly isDraggingWidth = signal<boolean>(false);
  readonly isGuidesMenuOpen = signal<boolean>(false);
  readonly hoverPos = signal<{ x: number; y: number } | null>(null);

  toggleGuidesMenu(): void {
    this.isGuidesMenuOpen.update((v) => !v);
  }

  // Brush points while drawing
  private rawBrushPoints: { x: number; y: number }[] = [];
  readonly liveStrokePath = signal<string>('');

  // Pen points while clicking
  readonly penPoints = signal<{ x: number; y: number }[]>([]);

  // Shape drag points
  private shapeStart: { x: number; y: number } | null = null;
  readonly liveShapePath = signal<string>('');

  getUnicodeHex(char: string): string {
    return char.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0');
  }

  onGlyphNameChange(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.state.updateGlyphName(val);
  }

  getPolylinePointsString(): string {
    return this.penPoints()
      .map((p) => `${p.x},${p.y}`)
      .join(' ');
  }

  addCustomGuideAtCursor(orientation: 'horizontal' | 'vertical'): void {
    const cur = this.hoverPos() || { x: 500, y: 500 };
    const pos = orientation === 'horizontal' ? cur.y : cur.x;
    this.state.addCustomGuide(orientation, pos);
  }

  private getSvgCoords(event: PointerEvent): { x: number; y: number } {
    const svg = this.canvasEl()?.nativeElement;
    if (!svg) return { x: event.clientX, y: event.clientY };

    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: event.clientX, y: event.clientY };

    const inverse = ctm.inverse();
    const pt = svg.createSVGPoint();
    pt.x = event.clientX;
    pt.y = event.clientY;
    const transformed = pt.matrixTransform(inverse);

    const rawX = Math.round(transformed.x);
    const rawY = Math.round(transformed.y);

    // Magnetic Snapping system (checks guides and grid)
    return this.state.snapCoordinate(rawX, rawY);
  }

  onPointerDown(event: PointerEvent): void {
    const coords = this.getSvgCoords(event);
    const svg = this.canvasEl()?.nativeElement;
    if (svg) {
      svg.setPointerCapture(event.pointerId);
    }

    // Check if clicking near the Advance Width guide (within 25px)
    const currentWidth = this.state.currentGlyph().metrics.advanceWidth;
    if (Math.abs(coords.x - currentWidth) < 25) {
      this.isDraggingWidth.set(true);
      return;
    }

    const tool = this.state.activeTool();

    if (tool === 'brush') {
      this.isDrawing.set(true);
      this.rawBrushPoints = [coords];
      const outline = expandStrokeToOutline(
        this.rawBrushPoints,
        this.state.brushSize(),
        this.state.smoothingTolerance()
      );
      this.liveStrokePath.set(outline);
    } else if (tool === 'pen') {
      const currentPts = this.penPoints();
      // If clicking near first point, close contour
      if (currentPts.length > 2 && Math.hypot(coords.x - currentPts[0].x, coords.y - currentPts[0].y) < 20) {
        const pathD =
          `M ${currentPts[0].x} ${currentPts[0].y} ` +
          currentPts.slice(1).map((p) => `L ${p.x} ${p.y}`).join(' ') +
          ' Z';
        this.commitNewPath(pathD, 'Pen closed polygon');
        this.penPoints.set([]);
      } else {
        this.penPoints.update((pts) => [...pts, coords]);
      }
    } else if (tool === 'rect' || tool === 'circle') {
      this.isDrawing.set(true);
      this.shapeStart = coords;
      this.liveShapePath.set('');
    }
  }

  onPointerMove(event: PointerEvent): void {
    const coords = this.getSvgCoords(event);
    this.hoverPos.set(coords);

    if (this.isDraggingWidth()) {
      this.state.updateGlyphAdvanceWidth(coords.x);
      return;
    }

    if (!this.isDrawing()) return;

    const tool = this.state.activeTool();

    if (tool === 'brush') {
      this.rawBrushPoints.push(coords);
      const outline = expandStrokeToOutline(
        this.rawBrushPoints,
        this.state.brushSize(),
        this.state.smoothingTolerance()
      );
      this.liveStrokePath.set(outline);
    } else if (tool === 'rect' && this.shapeStart) {
      const minX = Math.min(this.shapeStart.x, coords.x);
      const minY = Math.min(this.shapeStart.y, coords.y);
      const w = Math.abs(coords.x - this.shapeStart.x);
      const h = Math.abs(coords.y - this.shapeStart.y);
      const rect = createRectContour(minX, minY, w, h);
      this.liveShapePath.set(contourToSvgPath(rect));
    } else if (tool === 'circle' && this.shapeStart) {
      const rx = Math.abs(coords.x - this.shapeStart.x);
      const ry = Math.abs(coords.y - this.shapeStart.y);
      const circle = createCircleContour(this.shapeStart.x, this.shapeStart.y, rx, ry);
      this.liveShapePath.set(contourToSvgPath(circle));
    }
  }

  onPointerUp(event: PointerEvent): void {
    const svg = this.canvasEl()?.nativeElement;
    if (svg && svg.hasPointerCapture(event.pointerId)) {
      svg.releasePointerCapture(event.pointerId);
    }

    this.state.clearSnapGuides();

    if (this.isDraggingWidth()) {
      this.isDraggingWidth.set(false);
      return;
    }

    if (!this.isDrawing()) return;
    this.isDrawing.set(false);

    const tool = this.state.activeTool();

    if (tool === 'brush') {
      const outline = this.liveStrokePath();
      this.liveStrokePath.set('');
      this.rawBrushPoints = [];
      if (outline) {
        this.commitNewPath(outline, 'Brush stroke');
      }
    } else if (tool === 'rect' || tool === 'circle') {
      const shapePath = this.liveShapePath();
      this.liveShapePath.set('');
      this.shapeStart = null;
      if (shapePath) {
        this.commitNewPath(shapePath, tool === 'rect' ? 'Rectangle shape' : 'Circle shape');
      }
    }
  }

  onPointerCancel(event: PointerEvent): void {
    const svg = this.canvasEl()?.nativeElement;
    if (svg && svg.hasPointerCapture(event.pointerId)) {
      svg.releasePointerCapture(event.pointerId);
    }
    this.state.clearSnapGuides();
    this.isDrawing.set(false);
    this.isDraggingWidth.set(false);
    this.liveStrokePath.set('');
    this.liveShapePath.set('');
    this.rawBrushPoints = [];
    this.shapeStart = null;
    this.hoverPos.set(null);
  }

  private commitNewPath(pathToAdd: string, actionName = 'Drawing edit'): void {
    if (!pathToAdd || pathToAdd.trim().length === 0) return;
    const current = this.state.currentGlyph().svgPath || '';
    const combined = current.trim().length > 0 ? `${current} ${pathToAdd}` : pathToAdd;
    this.state.updateGlyphPath(combined, undefined, actionName);
  }
}
