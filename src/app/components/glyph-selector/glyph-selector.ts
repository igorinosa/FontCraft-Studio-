import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FontState } from '../../core/services/font-state';
import { FontGlyph } from '../../core/models/font.model';

@Component({
  selector: 'app-glyph-selector',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, MatTooltipModule],
  template: `
    <section class="bg-slate-900 border-t border-slate-800 p-2.5 sm:p-3 flex flex-col gap-2 shrink-0 select-none">
      <!-- Tabs & Controls -->
      <div class="flex items-center justify-between gap-2 flex-wrap">
        <!-- Filter Tabs (Scrollable on small mobile) -->
        <div class="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-medium max-w-full overflow-x-auto">
          <button
            type="button"
            (click)="state.setFilter('uppercase')"
            [class]="state.activeFilter() === 'uppercase' ? 'bg-amber-500 text-slate-950 font-bold shadow-sm' : 'text-slate-400 hover:text-slate-200'"
            class="px-2.5 sm:px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
            matTooltip="Filter to uppercase characters (A-Z)"
          >
            A-Z
          </button>
          <button
            type="button"
            (click)="state.setFilter('lowercase')"
            [class]="state.activeFilter() === 'lowercase' ? 'bg-amber-500 text-slate-950 font-bold shadow-sm' : 'text-slate-400 hover:text-slate-200'"
            class="px-2.5 sm:px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
            matTooltip="Filter to lowercase characters (a-z)"
          >
            a-z
          </button>
          <button
            type="button"
            (click)="state.setFilter('numbers')"
            [class]="state.activeFilter() === 'numbers' ? 'bg-amber-500 text-slate-950 font-bold shadow-sm' : 'text-slate-400 hover:text-slate-200'"
            class="px-2.5 sm:px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
            matTooltip="Filter to numeric digits (0-9)"
          >
            0-9
          </button>
          <button
            type="button"
            (click)="state.setFilter('punctuation')"
            [class]="state.activeFilter() === 'punctuation' ? 'bg-amber-500 text-slate-950 font-bold shadow-sm' : 'text-slate-400 hover:text-slate-200'"
            class="px-2.5 sm:px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
            matTooltip="Filter to punctuation marks and symbols"
          >
            Symbols
          </button>
          <button
            type="button"
            (click)="state.setFilter('all')"
            [class]="state.activeFilter() === 'all' ? 'bg-amber-500 text-slate-950 font-bold shadow-sm' : 'text-slate-400 hover:text-slate-200'"
            class="px-2.5 sm:px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
            matTooltip="Show all glyphs in project"
          >
            All
          </button>
        </div>

        <!-- Progress and Custom Character Input -->
        <div class="flex items-center gap-2">
          <div class="hidden sm:flex items-center gap-2 text-xs text-slate-400">
            <span>Progress:</span>
            <span class="font-bold text-amber-400">{{ state.completedGlyphCount() }}/{{ state.totalGlyphCount() }}</span>
            <div class="w-20 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
              <div
                class="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-300"
                [style.width.%]="(state.completedGlyphCount() / state.totalGlyphCount()) * 100"
              ></div>
            </div>
          </div>

          <!-- Add Custom Character -->
          <div class="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-xl px-2 py-1">
            <input
              #customInput
              type="text"
              maxlength="1"
              placeholder="+ Char"
              class="w-10 sm:w-12 bg-transparent text-center text-xs text-white placeholder-slate-600 focus:outline-none"
              (keydown.enter)="addChar(customInput)"
              matTooltip="Type a character or symbol and click Add"
            />
            <button
              type="button"
              (click)="addChar(customInput)"
              class="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
              matTooltip="Add custom character or symbol to font"
              title="Add character"
            >
              Add
            </button>
          </div>
        </div>
      </div>

      <!-- Scrollable / Grid Glyph Cards -->
      <div class="flex items-center gap-2 overflow-x-auto py-1.5 px-0.5 custom-scrollbar">
        @for (glyph of state.filteredGlyphs(); track glyph.character) {
          <button
            type="button"
            (click)="selectGlyph(glyph)"
            [class]="
              state.selectedCharacter() === glyph.character
                ? 'bg-amber-500/20 border-amber-400 ring-2 ring-amber-400/40 text-amber-300 scale-105'
                : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white'
            "
            class="relative w-14 h-18 sm:h-20 rounded-xl border flex flex-col items-center justify-between p-1.5 shrink-0 transition-all duration-150 group"
            [matTooltip]="getGlyphTooltip(glyph)"
          >
            <!-- Drawn Indicator Dot -->
            @if (!glyph.isEmpty) {
              <span class="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-400" matTooltip="Glyph has vector contours"></span>
            }

            <!-- Character Glyph Thumbnail Preview -->
            <div class="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center overflow-hidden">
              @if (glyph.svgPath) {
                <svg viewBox="0 0 1000 1000" class="w-full h-full">
                  <path [attr.d]="glyph.svgPath" fill="currentColor" />
                </svg>
              } @else {
                <span class="text-[10px] text-slate-600 font-mono italic">empty</span>
              }
            </div>

            <!-- Letter Label & Name -->
            <div class="flex flex-col items-center w-full">
              <span class="text-xs font-bold leading-none">{{ glyph.character }}</span>
              <span class="text-[9px] text-slate-400 truncate max-w-full font-mono mt-0.5">{{ glyph.name || glyph.character }}</span>
            </div>
          </button>
        }
      </div>
    </section>
  `,
  styles: [
    `
      .custom-scrollbar::-webkit-scrollbar {
        height: 5px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #334155;
        border-radius: 9999px;
      }
    `,
  ],
})
export class GlyphSelectorComponent {
  readonly state = inject(FontState);

  getGlyphTooltip(glyph: FontGlyph): string {
    return `Select '${glyph.character}' (${glyph.name || glyph.character})`;
  }

  selectGlyph(glyph: FontGlyph): void {
    this.state.selectCharacter(glyph.character);
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      this.state.setMobileTab('canvas');
    }
  }

  addChar(input: HTMLInputElement): void {
    if (input.value && input.value.trim()) {
      this.state.addCustomCharacter(input.value.trim());
      input.value = '';
    }
  }
}
