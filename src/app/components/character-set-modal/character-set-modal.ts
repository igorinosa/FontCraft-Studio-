import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FontState } from '../../core/services/font-state';
import { FontGlyph } from '../../core/models/font.model';

type CharacterSetFilter = 'all' | 'uppercase' | 'lowercase' | 'numbers' | 'punctuation' | 'symbols' | 'completed' | 'missing';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-character-set-modal',
  imports: [CommonModule, MatIconModule, MatTooltipModule],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        class="fixed inset-0 bg-black/80 backdrop-blur-sm cursor-default"
        (click)="close()"
        aria-label="Close modal backdrop"
      ></button>

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="charset-modal-title"
        class="relative z-10 bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-5xl h-[88vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        <!-- Modal Header -->
        <div class="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 shadow-md">
              <mat-icon>grid_view</mat-icon>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h2 id="charset-modal-title" class="text-lg font-bold text-white">Character Set &amp; Font Map</h2>
                <span class="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                  {{ state.completedGlyphCount() }} / {{ state.totalGlyphCount() }} Designed
                </span>
                <span class="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                  {{ completionPercentage() }}% Complete
                </span>
              </div>
              <p class="text-xs text-slate-400">Preview complete unicode character coverage, specimen samples, and jump to edit any glyph</p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <!-- Specimen / Grid Mode Switcher -->
            <div class="flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700">
              <button
                type="button"
                (click)="viewMode.set('grid')"
                [class]="viewMode() === 'grid' ? 'bg-amber-400 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'"
                class="px-3 py-1 rounded text-xs transition-colors flex items-center gap-1"
                matTooltip="View character tiles grid"
              >
                <mat-icon class="text-sm">view_module</mat-icon>
                <span>Grid</span>
              </button>
              <button
                type="button"
                (click)="viewMode.set('waterfall')"
                [class]="viewMode() === 'waterfall' ? 'bg-amber-400 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'"
                class="px-3 py-1 rounded text-xs transition-colors flex items-center gap-1"
                matTooltip="View specimen waterfall scale"
              >
                <mat-icon class="text-sm">format_size</mat-icon>
                <span>Waterfall Specimen</span>
              </button>
            </div>

            <button
              type="button"
              (click)="close()"
              matTooltip="Close dialog"
              class="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors ml-2"
            >
              <mat-icon>close</mat-icon>
            </button>
          </div>
        </div>

        <!-- Filter Bar & Quick Actions -->
        <div class="px-6 py-3 border-b border-slate-800/80 bg-slate-950/40 flex flex-wrap items-center justify-between gap-3">
          <!-- Category Pills -->
          <div class="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              (click)="setFilter('all')"
              [class]="activeFilter() === 'all' ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'"
              class="px-3 py-1 rounded-lg text-xs transition-colors"
            >
              All ({{ state.totalGlyphCount() }})
            </button>
            <button
              type="button"
              (click)="setFilter('uppercase')"
              [class]="activeFilter() === 'uppercase' ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'"
              class="px-3 py-1 rounded-lg text-xs transition-colors"
            >
              A-Z
            </button>
            <button
              type="button"
              (click)="setFilter('lowercase')"
              [class]="activeFilter() === 'lowercase' ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'"
              class="px-3 py-1 rounded-lg text-xs transition-colors"
            >
              a-z
            </button>
            <button
              type="button"
              (click)="setFilter('numbers')"
              [class]="activeFilter() === 'numbers' ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'"
              class="px-3 py-1 rounded-lg text-xs transition-colors"
            >
              0-9
            </button>
            <button
              type="button"
              (click)="setFilter('punctuation')"
              [class]="activeFilter() === 'punctuation' ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'"
              class="px-3 py-1 rounded-lg text-xs transition-colors"
            >
              Punctuation
            </button>
            <button
              type="button"
              (click)="setFilter('symbols')"
              [class]="activeFilter() === 'symbols' ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'"
              class="px-3 py-1 rounded-lg text-xs transition-colors"
            >
              Symbols
            </button>
            <button
              type="button"
              (click)="setFilter('completed')"
              [class]="activeFilter() === 'completed' ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-800 text-emerald-400 hover:bg-slate-700'"
              class="px-3 py-1 rounded-lg text-xs transition-colors flex items-center gap-1"
            >
              <mat-icon class="text-xs">check</mat-icon>
              <span>Designed ({{ state.completedGlyphCount() }})</span>
            </button>
            <button
              type="button"
              (click)="setFilter('missing')"
              [class]="activeFilter() === 'missing' ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'"
              class="px-3 py-1 rounded-lg text-xs transition-colors"
            >
              Empty ({{ missingCount() }})
            </button>
          </div>

          <!-- Quick Add Buttons -->
          <div class="flex items-center gap-2">
            <button
              type="button"
              (click)="state.addMissingCategoryGlyphs('accents')"
              matTooltip="Add accented European characters: À, é, ñ, ü, ç, etc."
              class="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 transition-colors flex items-center gap-1"
            >
              <mat-icon class="text-xs">add</mat-icon>
              <span>+ Add Accents (À, é, ñ...)</span>
            </button>
            <button
              type="button"
              (click)="state.addMissingCategoryGlyphs('symbols')"
              matTooltip="Add currency and math symbols: €, £, ¥, ©, etc."
              class="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 transition-colors flex items-center gap-1"
            >
              <mat-icon class="text-xs">add</mat-icon>
              <span>+ Add Currency &amp; Math</span>
            </button>
          </div>
        </div>

        <!-- Progress Bar -->
        <div class="w-full bg-slate-800 h-1.5 overflow-hidden">
          <div
            class="bg-gradient-to-r from-amber-400 to-emerald-400 h-full transition-all duration-300"
            [style.width.%]="completionPercentage()"
          ></div>
        </div>

        <!-- Modal Content: Grid or Waterfall -->
        <div class="flex-1 overflow-y-auto p-6">
          @if (viewMode() === 'grid') {
            <!-- Character Tiles Grid -->
            <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3">
              @for (glyph of displayedGlyphs(); track glyph.character) {
                <button
                  type="button"
                  (click)="selectAndEdit(glyph.character)"
                  [class]="getTileClass(glyph)"
                  class="group relative flex flex-col items-center justify-between p-3 rounded-xl border transition-all text-left aspect-square hover:scale-105 active:scale-95"
                  matTooltip="Click to edit '{{ glyph.character }}' ({{ glyph.name }})"
                >
                  <!-- Top Bar: Unicode & Status Dot -->
                  <div class="w-full flex items-center justify-between text-[10px] text-slate-400">
                    <span class="font-mono text-[9px]">U+{{ getUnicodeHex(glyph.character) }}</span>
                    @if (!glyph.isEmpty && glyph.svgPath) {
                      <span class="w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-emerald-400/20"></span>
                    } @else {
                      <span class="w-2 h-2 rounded-full bg-slate-600"></span>
                    }
                  </div>

                  <!-- Center: Glyph Preview -->
                  <div class="flex-1 w-full flex items-center justify-center overflow-hidden py-1">
                    @if (!glyph.isEmpty && glyph.svgPath) {
                      <svg viewBox="0 0 1000 1000" class="w-12 h-12 text-slate-100 group-hover:text-amber-400 transition-colors">
                        <path [attr.d]="glyph.svgPath" fill="currentColor" fill-rule="nonzero" />
                      </svg>
                    } @else {
                      <span class="text-2xl font-light text-slate-600 group-hover:text-slate-400 transition-colors">
                        {{ glyph.character }}
                      </span>
                    }
                  </div>

                  <!-- Bottom: Character Name -->
                  <div class="w-full text-center">
                    <span class="text-xs font-bold text-slate-300 group-hover:text-amber-300 transition-colors truncate block">
                      {{ glyph.character === ' ' ? 'Space' : glyph.character }}
                    </span>
                  </div>
                </button>
              }
            </div>

            @if (displayedGlyphs().length === 0) {
              <div class="text-center py-16 text-slate-500">
                <mat-icon class="text-4xl mb-2">search_off</mat-icon>
                <p>No glyphs match the selected filter.</p>
              </div>
            }
          } @else {
            <!-- Waterfall Specimen View -->
            <div class="space-y-8 max-w-4xl mx-auto bg-slate-950 p-6 rounded-2xl border border-slate-800">
              <div class="border-b border-slate-800 pb-3 flex items-center justify-between">
                <span class="text-xs font-bold uppercase tracking-wider text-amber-400">
                  Live Font Waterfall Preview • {{ state.project().metadata.familyName }}
                </span>
                <span class="text-xs text-slate-400 font-mono">Weight: {{ state.fontWeight() }}</span>
              </div>

              <!-- 60px -->
              <div class="space-y-1">
                <span class="text-[10px] text-slate-500 font-mono">60px</span>
                <p
                  class="text-white tracking-normal leading-tight break-words"
                  [style.font-family]="state.livePreviewFamily()"
                  [style.font-weight]="state.fontWeight()"
                  style="font-size: 60px;"
                >
                  The quick brown fox jumps over the lazy dog.
                </p>
              </div>

              <!-- 44px -->
              <div class="space-y-1">
                <span class="text-[10px] text-slate-500 font-mono">44px</span>
                <p
                  class="text-slate-200 tracking-normal leading-tight break-words"
                  [style.font-family]="state.livePreviewFamily()"
                  [style.font-weight]="state.fontWeight()"
                  style="font-size: 44px;"
                >
                  PACK MY BOX WITH FIVE DOZEN LIQUOR JUGS.
                </p>
              </div>

              <!-- 32px -->
              <div class="space-y-1">
                <span class="text-[10px] text-slate-500 font-mono">32px</span>
                <p
                  class="text-slate-200 tracking-normal leading-snug break-words"
                  [style.font-family]="state.livePreviewFamily()"
                  [style.font-weight]="state.fontWeight()"
                  style="font-size: 32px;"
                >
                  Sphinx of black quartz, judge my vow! 0123456789
                </p>
              </div>

              <!-- 20px -->
              <div class="space-y-1">
                <span class="text-[10px] text-slate-500 font-mono">20px</span>
                <p
                  class="text-slate-300 tracking-normal leading-relaxed break-words"
                  [style.font-family]="state.livePreviewFamily()"
                  [style.font-weight]="state.fontWeight()"
                  style="font-size: 20px;"
                >
                  Typography is two-dimensional architecture, based on experience and imagination.
                  Calligraphy and hand-crafted letterforms bring warmth and human spirit to modern digital interfaces.
                </p>
              </div>
            </div>
          }
        </div>

        <!-- Modal Footer -->
        <div class="px-6 py-3 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <span class="text-xs text-slate-400">
            Tip: Click any character tile to jump directly into the vector drawing canvas.
          </span>
          <button
            type="button"
            (click)="close()"
            class="px-5 py-2 rounded-xl text-xs font-bold bg-amber-400 text-slate-950 hover:bg-amber-300 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  `,
})
export class CharacterSetModalComponent {
  readonly state = inject(FontState);
  readonly viewMode = signal<'grid' | 'waterfall'>('grid');
  readonly activeFilter = signal<CharacterSetFilter>('all');

  readonly completionPercentage = computed<number>(() => {
    const total = this.state.totalGlyphCount();
    if (total === 0) return 0;
    return Math.round((this.state.completedGlyphCount() / total) * 100);
  });

  readonly missingCount = computed<number>(() => {
    return Math.max(0, this.state.totalGlyphCount() - this.state.completedGlyphCount());
  });

  readonly displayedGlyphs = computed<FontGlyph[]>(() => {
    const all = this.state.allGlyphsList();
    const filter = this.activeFilter();

    switch (filter) {
      case 'all':
        return all;
      case 'uppercase':
      case 'lowercase':
      case 'numbers':
      case 'punctuation':
      case 'symbols':
        return all.filter((g) => g.category === filter);
      case 'completed':
        return all.filter((g) => !g.isEmpty && g.svgPath.trim().length > 0);
      case 'missing':
        return all.filter((g) => g.isEmpty || !g.svgPath.trim());
    }
  });

  close(): void {
    this.state.closeCharacterSetModal();
  }

  setFilter(filter: CharacterSetFilter): void {
    this.activeFilter.set(filter);
  }

  selectAndEdit(char: string): void {
    this.state.selectCharacter(char);
    this.state.setMobileTab('canvas');
    this.close();
  }

  getUnicodeHex(char: string): string {
    const code = char.charCodeAt(0);
    return code.toString(16).toUpperCase().padStart(4, '0');
  }

  getTileClass(glyph: FontGlyph): string {
    const isSelected = this.state.selectedCharacter() === glyph.character;
    const hasPath = !glyph.isEmpty && glyph.svgPath;

    if (isSelected) {
      return 'bg-amber-400/20 border-amber-400 text-amber-300 shadow-md ring-2 ring-amber-400/40';
    }
    if (hasPath) {
      return 'bg-slate-950/80 border-slate-700/80 hover:border-amber-400/60 hover:bg-slate-800';
    }
    return 'bg-slate-950/40 border-dashed border-slate-800 hover:border-slate-600 hover:bg-slate-900';
  }
}
