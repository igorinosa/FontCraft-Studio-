import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FontState } from '../../core/services/font-state';

@Component({
  selector: 'app-toolbar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, MatTooltipModule],
  template: `
    <!-- Mobile Quick Tool Bar -->
    <div class="md:hidden bg-slate-900 border-b border-slate-800 p-2 flex items-center justify-between gap-1 shrink-0 overflow-x-auto">
      <div class="flex items-center gap-1">
        <button
          type="button"
          (click)="state.setTool('brush')"
          [class]="state.activeTool() === 'brush' ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300'"
          class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold"
          matTooltip="Brush: Freehand organic drawing"
        >
          <mat-icon class="text-sm">brush</mat-icon>
          <span>Brush</span>
        </button>

        <button
          type="button"
          (click)="state.setTool('pen')"
          [class]="state.activeTool() === 'pen' ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300'"
          class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold"
          matTooltip="Vector Pen: Click points to build custom Bézier polygons"
        >
          <mat-icon class="text-sm">edit</mat-icon>
          <span>Pen</span>
        </button>

        <button
          type="button"
          (click)="state.setTool('rect')"
          [class]="state.activeTool() === 'rect' ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300'"
          class="p-1.5 rounded-lg text-xs"
          matTooltip="Rectangle tool: Drag to draw box stems and bars"
          title="Rectangle"
        >
          <mat-icon class="text-sm">crop_square</mat-icon>
        </button>

        <button
          type="button"
          (click)="state.setTool('circle')"
          [class]="state.activeTool() === 'circle' ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300'"
          class="p-1.5 rounded-lg text-xs"
          matTooltip="Circle tool: Drag to draw circular bowls and ovals"
          title="Circle"
        >
          <mat-icon class="text-sm">radio_button_unchecked</mat-icon>
        </button>

        <button
          type="button"
          (click)="state.clearCurrentGlyph()"
          class="p-1.5 rounded-lg bg-rose-500/10 text-rose-300 text-xs"
          matTooltip="Clear current glyph strokes"
          title="Clear letter"
        >
          <mat-icon class="text-sm">delete_outline</mat-icon>
        </button>
      </div>

      <button
        type="button"
        (click)="toggleMobileDrawer()"
        [class]="isMobileDrawerOpen() ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-slate-800 text-slate-300 border-slate-700'"
        class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-medium shrink-0"
        matTooltip="Open Grids, Guides, Simplification &amp; Tools settings"
      >
        <mat-icon class="text-sm">tune</mat-icon>
        <span>Grids &amp; Guides</span>
      </button>
    </div>

    <!-- Desktop Sidebar & Mobile Expandable Drawer -->
    <aside
      [class]="
        isMobileDrawerOpen()
          ? 'fixed inset-x-0 top-14 bottom-0 z-40 bg-slate-900 flex'
          : 'hidden md:flex'
      "
      class="w-full md:w-64 bg-slate-900 border-r border-slate-800 flex-col gap-4 p-3 overflow-y-auto shrink-0 select-none shadow-2xl md:shadow-none"
    >
      <!-- Mobile Close Drawer Header -->
      @if (isMobileDrawerOpen()) {
        <div class="md:hidden flex items-center justify-between border-b border-slate-800 pb-2">
          <span class="font-bold text-white text-xs">Grids, Guides &amp; Tools</span>
          <button
            type="button"
            (click)="toggleMobileDrawer()"
            class="px-2 py-1 rounded bg-slate-800 text-slate-300 text-xs"
          >
            Close Settings
          </button>
        </div>
      }

      <!-- Drawing Tools Section -->
      <section>
        <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
          <span>Vector Tools</span>
          <span class="text-slate-500 text-[10px]">Glyph '{{ state.selectedCharacter() }}'</span>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <!-- Brush Tool -->
          <button
            type="button"
            (click)="state.setTool('brush')"
            [class]="state.activeTool() === 'brush' ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20 ring-2 ring-amber-400/50' : 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700'"
            class="flex items-center gap-2 p-2.5 rounded-xl text-xs transition-all text-left group"
          >
            <mat-icon [class]="state.activeTool() === 'brush' ? 'text-slate-950' : 'text-amber-400'">brush</mat-icon>
            <div>
              <div class="font-semibold">Brush</div>
              <div class="text-[10px] opacity-80">Freehand</div>
            </div>
          </button>

          <!-- Vector Pen Tool -->
          <button
            type="button"
            (click)="state.setTool('pen')"
            [class]="state.activeTool() === 'pen' ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20 ring-2 ring-amber-400/50' : 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700'"
            class="flex items-center gap-2 p-2.5 rounded-xl text-xs transition-all text-left group"
          >
            <mat-icon [class]="state.activeTool() === 'pen' ? 'text-slate-950' : 'text-blue-400'">edit</mat-icon>
            <div>
              <div class="font-semibold">Vector Pen</div>
              <div class="text-[10px] opacity-80">Bézier nodes</div>
            </div>
          </button>

          <!-- Rectangle Tool -->
          <button
            type="button"
            (click)="state.setTool('rect')"
            [class]="state.activeTool() === 'rect' ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20 ring-2 ring-amber-400/50' : 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700'"
            class="flex items-center gap-2 p-2.5 rounded-xl text-xs transition-all text-left group"
          >
            <mat-icon [class]="state.activeTool() === 'rect' ? 'text-slate-950' : 'text-purple-400'">crop_square</mat-icon>
            <div>
              <div class="font-semibold">Rectangle</div>
              <div class="text-[10px] opacity-80">Stems &amp; bars</div>
            </div>
          </button>

          <!-- Circle Tool -->
          <button
            type="button"
            (click)="state.setTool('circle')"
            [class]="state.activeTool() === 'circle' ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20 ring-2 ring-amber-400/50' : 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700'"
            class="flex items-center gap-2 p-2.5 rounded-xl text-xs transition-all text-left group"
          >
            <mat-icon [class]="state.activeTool() === 'circle' ? 'text-slate-950' : 'text-emerald-400'">radio_button_unchecked</mat-icon>
            <div>
              <div class="font-semibold">Circle</div>
              <div class="text-[10px] opacity-80">Bowls &amp; ovals</div>
            </div>
          </button>
        </div>

        <!-- Brush Thickness Slider / Presets -->
        @if (state.activeTool() === 'brush') {
          <div class="mt-3 bg-slate-800/60 border border-slate-800 rounded-xl p-2.5">
            <div class="flex items-center justify-between text-xs text-slate-300 font-medium mb-1.5">
              <span>Stroke Width</span>
              <span class="text-amber-400 font-mono text-[11px]">{{ state.brushSize() }}px</span>
            </div>

            <div class="grid grid-cols-4 gap-1 mb-2">
              <button
                type="button"
                (click)="state.setBrushSize(20)"
                [class]="state.brushSize() === 20 ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'"
                class="py-1 rounded text-[11px] transition-colors"
              >
                Fine
              </button>
              <button
                type="button"
                (click)="state.setBrushSize(36)"
                [class]="state.brushSize() === 36 ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'"
                class="py-1 rounded text-[11px] transition-colors"
              >
                Medium
              </button>
              <button
                type="button"
                (click)="state.setBrushSize(50)"
                [class]="state.brushSize() === 50 ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'"
                class="py-1 rounded text-[11px] transition-colors"
              >
                Chunky
              </button>
              <button
                type="button"
                (click)="state.setBrushSize(75)"
                [class]="state.brushSize() === 75 ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'"
                class="py-1 rounded text-[11px] transition-colors"
              >
                Thick
              </button>
            </div>

            <input
              type="range"
              min="10"
              max="100"
              [value]="state.brushSize()"
              (input)="onBrushSizeChange($event)"
              class="w-full accent-amber-400 cursor-pointer"
            />

            <!-- Path Smoothing Selector -->
            <div class="mt-2.5 pt-2 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-300">
              <span class="flex items-center gap-1">
                <mat-icon class="text-xs text-amber-400">auto_fix_high</mat-icon>
                <span>Smoothing:</span>
              </span>
              <div class="flex items-center gap-0.5 bg-slate-900 p-0.5 rounded-lg border border-slate-700">
                <button
                  type="button"
                  (click)="state.setPathSmoothing('off')"
                  [class]="state.pathSmoothing() === 'off' ? 'bg-amber-400 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'"
                  class="px-1.5 py-0.5 rounded text-[10px] transition-colors"
                  title="Raw points (no smoothing)"
                >
                  Off
                </button>
                <button
                  type="button"
                  (click)="state.setPathSmoothing('low')"
                  [class]="state.pathSmoothing() === 'low' ? 'bg-amber-400 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'"
                  class="px-1.5 py-0.5 rounded text-[10px] transition-colors"
                  title="Light smoothing"
                >
                  Low
                </button>
                <button
                  type="button"
                  (click)="state.setPathSmoothing('medium')"
                  [class]="state.pathSmoothing() === 'medium' ? 'bg-amber-400 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'"
                  class="px-1.5 py-0.5 rounded text-[10px] transition-colors"
                  title="Medium smooth curves"
                >
                  Med
                </button>
                <button
                  type="button"
                  (click)="state.setPathSmoothing('high')"
                  [class]="state.pathSmoothing() === 'high' ? 'bg-amber-400 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'"
                  class="px-1.5 py-0.5 rounded text-[10px] transition-colors"
                  title="Silky smooth calligraphy curves"
                >
                  Silk
                </button>
              </div>
            </div>
          </div>
        }
      </section>

      <!-- FONT WEIGHT & VARIANTS SECTION -->
      <section class="border-t border-slate-800/80 pt-3 flex flex-col gap-2.5">
        <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
          <span class="flex items-center gap-1">
            <mat-icon class="text-sm text-amber-400">format_bold</mat-icon>
            <span>Weight &amp; Variant</span>
          </span>
          <span class="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-bold font-mono">
            {{ state.fontWeight() }}
          </span>
        </div>

        <div class="bg-slate-800/60 rounded-xl p-3 border border-slate-800 space-y-3">
          <!-- Active Variant Pills -->
          <div class="grid grid-cols-2 gap-1.5">
            @for (variant of state.variants(); track variant.id) {
              <button
                type="button"
                (click)="state.setActiveVariant(variant.id)"
                [class]="state.activeVariantId() === variant.id ? 'bg-amber-400 text-slate-950 font-bold shadow-sm' : 'bg-slate-900 text-slate-300 hover:bg-slate-700'"
                class="px-2 py-1.5 rounded-lg text-xs transition-colors flex items-center justify-between"
                matTooltip="Switch active font style to {{ variant.name }}"
              >
                <span>{{ variant.name }}</span>
                <span class="text-[10px] opacity-70 font-mono">{{ variant.weight }}</span>
              </button>
            }
          </div>

          <!-- Font Weight Slider (100 to 900) -->
          <div class="space-y-1">
            <div class="flex items-center justify-between text-xs text-slate-300">
              <span class="font-medium">Weight Slider:</span>
              <span class="font-bold text-amber-400 text-[11px]">
                {{ getWeightLabel(state.fontWeight()) }}
              </span>
            </div>
            <input
              type="range"
              min="100"
              max="900"
              step="100"
              [value]="state.fontWeight()"
              (input)="onWeightSliderChange($event)"
              class="w-full accent-amber-400 cursor-pointer"
              matTooltip="Adjust stroke optical weight from Thin (100) to Black (900)"
            />
            <div class="flex justify-between text-[9px] text-slate-500 font-mono">
              <span>Thin 100</span>
              <span>Reg 400</span>
              <span>Bold 700</span>
              <span>Black 900</span>
            </div>
          </div>

          <!-- Auto-Generate Variant Quick Actions -->
          <div class="pt-2 border-t border-slate-700/60 space-y-1.5">
            <span class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Auto-Derive Variants
            </span>
            <div class="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                (click)="state.generateVariant('bold')"
                class="py-1 px-2 rounded-lg bg-slate-900 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-medium transition-colors text-left flex items-center gap-1"
                matTooltip="Derive Bold variant with heavy stroke weight"
              >
                <mat-icon class="text-xs text-amber-400">add</mat-icon>
                <span>+ Make Bold</span>
              </button>
              <button
                type="button"
                (click)="state.generateVariant('italic')"
                class="py-1 px-2 rounded-lg bg-slate-900 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-medium transition-colors text-left flex items-center gap-1"
                matTooltip="Derive Italic variant by shearing contours 12°"
              >
                <mat-icon class="text-xs text-blue-400">add</mat-icon>
                <span>+ Make Italic</span>
              </button>
              <button
                type="button"
                (click)="state.generateVariant('condensed')"
                class="py-1 px-2 rounded-lg bg-slate-900 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-medium transition-colors text-left flex items-center gap-1"
                matTooltip="Derive Condensed variant by scaling width to 82%"
              >
                <mat-icon class="text-xs text-purple-400">add</mat-icon>
                <span>+ Condensed</span>
              </button>
              <button
                type="button"
                (click)="state.generateVariant('light')"
                class="py-1 px-2 rounded-lg bg-slate-900 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-medium transition-colors text-left flex items-center gap-1"
                matTooltip="Derive Light variant with slender strokes"
              >
                <mat-icon class="text-xs text-emerald-400">add</mat-icon>
                <span>+ Make Light</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- AUTO-TRACE BITMAP VECTORIZER -->
      <section class="border-t border-slate-800/80 pt-3">
        <button
          type="button"
          (click)="state.openAutoTraceModal()"
          class="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:brightness-110 active:scale-95 text-slate-950 text-xs font-bold transition-all shadow-md shadow-amber-500/20"
          matTooltip="Import sketch, photo or logo and trace it into vectors"
        >
          <mat-icon class="text-base">auto_fix_high</mat-icon>
          <span>Auto-Trace Image...</span>
        </button>
      </section>

      <!-- REVISION HISTORY & CHARACTER SET SHORTCUTS -->
      <section class="border-t border-slate-800/80 pt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          (click)="state.toggleHistoryDrawer()"
          class="py-2 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
          matTooltip="View full revision history timeline for glyph '{{ state.selectedCharacter() }}'"
        >
          <mat-icon class="text-sm text-amber-400">history</mat-icon>
          <span>History ({{ state.currentGlyphHistory().length }})</span>
        </button>

        <button
          type="button"
          (click)="state.openCharacterSetModal()"
          class="py-2 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
          matTooltip="Open full Character Set Unicode coverage and font map"
        >
          <mat-icon class="text-sm text-emerald-400">grid_view</mat-icon>
          <span>Map ({{ state.completedGlyphCount() }})</span>
        </button>
      </section>


      <!-- PATH SIMPLIFICATION SECTION -->
      <section class="border-t border-slate-800/80 pt-3 flex flex-col gap-2">
        <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
          <span class="flex items-center gap-1">
            <mat-icon class="text-sm text-emerald-400">auto_fix_normal</mat-icon>
            <span>Path Simplification</span>
          </span>
          <span class="text-[10px] text-slate-500 font-normal">Outline Cleaner</span>
        </div>

        <div class="bg-slate-800/50 rounded-xl p-2.5 border border-slate-800 flex flex-col gap-2">
          <div class="flex items-center justify-between text-xs text-slate-300">
            <span>Strength:</span>
            <div class="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-700/80">
              <button
                type="button"
                (click)="state.setSimplificationStrength('gentle')"
                [class]="state.simplificationStrength() === 'gentle' ? 'bg-emerald-400 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'"
                class="px-2 py-0.5 rounded text-[10px] transition-colors"
                matTooltip="Gentle: Removes microscopic hand jitter while preserving curves"
              >
                Gentle
              </button>
              <button
                type="button"
                (click)="state.setSimplificationStrength('balanced')"
                [class]="state.simplificationStrength() === 'balanced' ? 'bg-emerald-400 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'"
                class="px-2 py-0.5 rounded text-[10px] transition-colors"
                matTooltip="Balanced: Optimal reduction of redundant nodes for smooth typography"
              >
                Balanced
              </button>
              <button
                type="button"
                (click)="state.setSimplificationStrength('aggressive')"
                [class]="state.simplificationStrength() === 'aggressive' ? 'bg-emerald-400 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'"
                class="px-2 py-0.5 rounded text-[10px] transition-colors"
                matTooltip="Strong: Minimal geometric nodes for crisp angular logos"
              >
                Strong
              </button>
            </div>
          </div>

          <button
            type="button"
            (click)="state.simplifyCurrentGlyph()"
            class="w-full py-1.5 px-3 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
            matTooltip="Click to simplify outline of glyph '{{ state.selectedCharacter() }}' using {{ state.simplificationStrength() }} strength"
          >
            <mat-icon class="text-xs">auto_fix_high</mat-icon>
            <span>Simplify Glyph Outline</span>
          </button>
        </div>
      </section>

      <!-- FONT KERNING SECTION -->
      <section class="border-t border-slate-800/80 pt-3 flex flex-col gap-2">
        <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
          <span class="flex items-center gap-1">
            <mat-icon class="text-sm text-indigo-400">space_bar</mat-icon>
            <span>Font Kerning</span>
          </span>
          <span class="text-[10px] text-indigo-400 font-mono font-bold">{{ state.kerningPairCount() }} pairs</span>
        </div>

        <div class="bg-slate-800/50 rounded-xl p-2.5 border border-slate-800 flex flex-col gap-2">
          <p class="text-[11px] text-slate-400 leading-relaxed">
            Adjust optical spacing between letter pairs (e.g. AV, WA, To) to avoid gaps.
          </p>
          <button
            type="button"
            (click)="state.openKerningModal()"
            class="w-full py-1.5 px-3 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
            matTooltip="Open Kerning Pairs Manager"
          >
            <mat-icon class="text-xs">tune</mat-icon>
            <span>Manage Kerning Pairs...</span>
          </button>
        </div>
      </section>

      <!-- ADVANCED GRID SECTION -->
      <section class="border-t border-slate-800/80 pt-3 flex flex-col gap-2.5">
        <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
          <span class="flex items-center gap-1">
            <mat-icon class="text-sm text-blue-400">grid_4x4</mat-icon>
            <span>Grid Settings</span>
          </span>
          <button
            type="button"
            (click)="state.toggleGrid()"
            [class]="state.gridSettings().enabled ? 'bg-blue-500 text-white font-bold' : 'bg-slate-800 text-slate-400'"
            class="text-[10px] px-2 py-0.5 rounded-full transition-colors"
          >
            {{ state.gridSettings().enabled ? 'ON' : 'OFF' }}
          </button>
        </div>

        @if (state.gridSettings().enabled) {
          <div class="bg-slate-800/50 rounded-xl p-2.5 border border-slate-800 flex flex-col gap-2.5">
            <!-- Grid Spacing: 25px / 50px / 100px -->
            <div class="flex items-center justify-between text-xs text-slate-300">
              <span>Grid Spacing:</span>
              <div class="flex items-center gap-1">
                <button
                  type="button"
                  (click)="state.setGridSize(25)"
                  [class]="state.gridSettings().size === 25 ? 'bg-blue-500 text-white font-bold' : 'bg-slate-700 text-slate-300'"
                  class="px-2 py-0.5 rounded text-[11px]"
                >
                  25px
                </button>
                <button
                  type="button"
                  (click)="state.setGridSize(50)"
                  [class]="state.gridSettings().size === 50 ? 'bg-blue-500 text-white font-bold' : 'bg-slate-700 text-slate-300'"
                  class="px-2 py-0.5 rounded text-[11px]"
                >
                  50px
                </button>
                <button
                  type="button"
                  (click)="state.setGridSize(100)"
                  [class]="state.gridSettings().size === 100 ? 'bg-blue-500 text-white font-bold' : 'bg-slate-700 text-slate-300'"
                  class="px-2 py-0.5 rounded text-[11px]"
                >
                  100px
                </button>
              </div>
            </div>

            <!-- Grid Style: Lines vs Dots -->
            <div class="flex items-center justify-between text-xs text-slate-300">
              <span>Grid Style:</span>
              <div class="flex items-center gap-1">
                <button
                  type="button"
                  (click)="state.setGridStyle('lines')"
                  [class]="state.gridSettings().style === 'lines' ? 'bg-slate-700 text-white font-semibold' : 'text-slate-400'"
                  class="px-2 py-0.5 rounded text-[11px]"
                >
                  Lines
                </button>
                <button
                  type="button"
                  (click)="state.setGridStyle('dots')"
                  [class]="state.gridSettings().style === 'dots' ? 'bg-slate-700 text-white font-semibold' : 'text-slate-400'"
                  class="px-2 py-0.5 rounded text-[11px]"
                >
                  Dots
                </button>
              </div>
            </div>

            <!-- Snap to Grid Toggle -->
            <div class="flex items-center justify-between text-xs text-slate-300 pt-1 border-t border-slate-700/60">
              <span class="flex items-center gap-1">
                <mat-icon class="text-xs text-amber-400">gps_fixed</mat-icon>
                <span>Snap to Grid</span>
              </span>
              <button
                type="button"
                (click)="state.toggleSnapToGrid()"
                [class]="state.gridSettings().snapToGrid ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-slate-700 text-slate-400'"
                class="text-[10px] px-2 py-0.5 rounded transition-colors"
              >
                {{ state.gridSettings().snapToGrid ? 'ENABLED' : 'DISABLED' }}
              </button>
            </div>
          </div>
        }
      </section>

      <!-- GUIDELINES SECTION -->
      <section class="border-t border-slate-800/80 pt-3 flex flex-col gap-2.5">
        <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
          <span class="flex items-center gap-1">
            <mat-icon class="text-sm text-amber-400">straighten</mat-icon>
            <span>Typographic Guides</span>
          </span>
          <button
            type="button"
            (click)="state.toggleMetrics()"
            [class]="state.showMetrics() ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'"
            class="text-[10px] px-2 py-0.5 rounded-full transition-colors"
          >
            {{ state.showMetrics() ? 'ON' : 'OFF' }}
          </button>
        </div>

        <div class="bg-slate-800/50 rounded-xl p-2.5 border border-slate-800 flex flex-col gap-2">
          <!-- Center Guides Toggle -->
          <div class="flex items-center justify-between text-xs text-slate-300">
            <span>Center Guides:</span>
            <button
              type="button"
              (click)="state.toggleCenterGuides()"
              [class]="state.showCenterGuides() ? 'bg-slate-700 text-cyan-300 font-semibold' : 'text-slate-400'"
              class="px-2 py-0.5 rounded text-[11px]"
            >
              {{ state.showCenterGuides() ? 'Visible' : 'Hidden' }}
            </button>
          </div>

          <!-- Add Custom Guide Buttons -->
          <div class="flex items-center justify-between gap-1 pt-1 border-t border-slate-700/60">
            <button
              type="button"
              (click)="state.addCustomGuide('horizontal', 400)"
              class="flex-1 py-1 px-1.5 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 text-[10px] text-center"
              title="Add horizontal guideline"
            >
              + Horiz Guide
            </button>
            <button
              type="button"
              (click)="state.addCustomGuide('vertical', 300)"
              class="flex-1 py-1 px-1.5 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 text-[10px] text-center"
              title="Add vertical guideline"
            >
              + Vert Guide
            </button>
            @if (state.customGuides().length > 0) {
              <button
                type="button"
                (click)="state.clearCustomGuides()"
                class="py-1 px-2 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-[10px]"
                title="Clear all custom guidelines"
              >
                Clear
              </button>
            }
          </div>
        </div>
      </section>

      <!-- TRACING GHOST GUIDE -->
      <section class="border-t border-slate-800/80 pt-3 flex flex-col gap-2">
        <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
          <span class="flex items-center gap-1">
            <mat-icon class="text-sm text-cyan-400">visibility</mat-icon>
            <span>Tracing Reference</span>
          </span>
          <button
            type="button"
            (click)="state.toggleTracingGuide()"
            [class]="state.showTracingGuide() ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'"
            class="text-[10px] px-2 py-0.5 rounded-full transition-colors"
          >
            {{ state.showTracingGuide() ? 'ON' : 'OFF' }}
          </button>
        </div>

        @if (state.showTracingGuide()) {
          <div class="bg-slate-800/50 rounded-xl p-2.5 border border-slate-800 flex flex-col gap-2">
            <div class="flex items-center justify-between text-xs text-slate-300">
              <span>Font Style:</span>
              <select
                [value]="state.tracingGuideFont()"
                (change)="onGuideFontChange($event)"
                class="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
              >
                <option value="sans-serif">Clean Sans</option>
                <option value="serif">Classic Serif</option>
                <option value="monospace">Monospace</option>
                <option value="cursive">Cursive Script</option>
              </select>
            </div>

            <div class="flex flex-col gap-1">
              <div class="flex justify-between text-[11px] text-slate-400">
                <span>Opacity</span>
                <span>{{ Math.round(state.tracingGuideOpacity() * 100) }}%</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.8"
                step="0.05"
                [value]="state.tracingGuideOpacity()"
                (input)="onOpacityChange($event)"
                class="w-full accent-cyan-400 cursor-pointer"
              />
            </div>
          </div>
        }
      </section>

      <!-- LETTER SPACING / METRICS -->
      <section class="border-t border-slate-800/80 pt-3">
        <div class="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Advance Width</div>
        <div class="bg-slate-800/50 rounded-xl p-2.5 border border-slate-800 flex flex-col gap-2">
          <div class="flex items-center justify-between text-xs text-slate-300">
            <span>Width Units:</span>
            <span class="font-mono text-amber-300 font-bold">{{ state.currentGlyph().metrics.advanceWidth }}</span>
          </div>
          <input
            type="range"
            min="200"
            max="1200"
            step="10"
            [value]="state.currentGlyph().metrics.advanceWidth"
            (input)="onWidthChange($event)"
            class="w-full accent-amber-400 cursor-pointer"
          />
        </div>
      </section>
    </aside>
  `,
})
export class ToolbarComponent {
  readonly state = inject(FontState);
  readonly Math = Math;

  readonly isMobileDrawerOpen = signal<boolean>(false);

  toggleMobileDrawer(): void {
    this.isMobileDrawerOpen.update((v) => !v);
  }

  onBrushSizeChange(event: Event): void {
    const val = Number((event.target as HTMLInputElement).value);
    this.state.setBrushSize(val);
  }

  onOpacityChange(event: Event): void {
    const val = Number((event.target as HTMLInputElement).value);
    this.state.setTracingGuideOpacity(val);
  }

  onGuideFontChange(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.state.setTracingGuideFont(val);
  }

  onWidthChange(event: Event): void {
    const val = Number((event.target as HTMLInputElement).value);
    this.state.updateGlyphAdvanceWidth(val);
  }

  onWeightSliderChange(event: Event): void {
    const val = Number((event.target as HTMLInputElement).value);
    this.state.setFontWeight(val);
  }

  getWeightLabel(w: number): string {
    if (w <= 100) return 'Thin (100)';
    if (w <= 200) return 'ExtraLight (200)';
    if (w <= 300) return 'Light (300)';
    if (w <= 400) return 'Regular (400)';
    if (w <= 500) return 'Medium (500)';
    if (w <= 600) return 'SemiBold (600)';
    if (w <= 700) return 'Bold (700)';
    if (w <= 800) return 'ExtraBold (800)';
    return 'Black (900)';
  }
}
