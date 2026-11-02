import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FontState } from '../../core/services/font-state';

@Component({
  selector: 'app-kerning-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, MatTooltipModule],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 select-none">
      <!-- Backdrop Button -->
      <button
        type="button"
        class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm cursor-default"
        (click)="state.closeKerningModal()"
        aria-label="Close kerning modal backdrop"
      ></button>

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="kerning-modal-title"
        class="relative z-10 bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        <!-- Modal Header -->
        <div class="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <mat-icon class="text-base">space_bar</mat-icon>
            </div>
            <div>
              <h2 id="kerning-modal-title" class="text-sm font-bold text-white flex items-center gap-2">
                <span>Font Kerning Manager</span>
                <span class="text-[11px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                  {{ state.kerningPairCount() }} pairs
                </span>
              </h2>
              <p class="text-[11px] text-slate-400">
                Adjust optical spacing between letter pairs to prevent awkward gaps (e.g. AV, WA, To).
              </p>
            </div>
          </div>

          <button
            type="button"
            (click)="state.closeKerningModal()"
            class="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
            matTooltip="Close Kerning Manager"
            title="Close"
          >
            <mat-icon class="text-base">close</mat-icon>
          </button>
        </div>

        <!-- Scrollable Modal Body -->
        <div class="p-5 flex-1 overflow-y-auto flex flex-col gap-5 text-xs text-slate-300">
          <!-- Add New Pair Section -->
          <div class="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 flex flex-col gap-3">
            <div class="font-bold text-slate-200 text-xs flex items-center justify-between">
              <span>Add Custom Kerning Pair</span>
              <button
                type="button"
                (click)="state.loadStandardKerning()"
                class="text-[11px] text-indigo-400 hover:text-indigo-300 hover:underline flex items-center gap-1 font-medium"
                matTooltip="Load 19 standard typographic pairs (AV, WA, LT, To, etc.)"
              >
                <mat-icon class="text-xs">auto_fix_high</mat-icon>
                <span>Reset to Standard Pairs</span>
              </button>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-4 gap-2.5 items-end">
              <div>
                <label for="first-char-input" class="block text-[10px] text-slate-400 mb-1 font-medium">1st Char</label>
                <input
                  id="first-char-input"
                  type="text"
                  maxlength="1"
                  [value]="newFirstChar()"
                  (input)="onFirstCharChange($event)"
                  placeholder="A"
                  class="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-center font-bold text-white text-base uppercase outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label for="second-char-input" class="block text-[10px] text-slate-400 mb-1 font-medium">2nd Char</label>
                <input
                  id="second-char-input"
                  type="text"
                  maxlength="1"
                  [value]="newSecondChar()"
                  (input)="onSecondCharChange($event)"
                  placeholder="V"
                  class="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-center font-bold text-white text-base uppercase outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <div class="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                  <span class="font-medium">Offset:</span>
                  <span class="font-mono text-indigo-400 font-bold">{{ newOffset() }} units</span>
                </div>
                <input
                  type="range"
                  min="-200"
                  max="100"
                  step="5"
                  [value]="newOffset()"
                  (input)="onOffsetSliderChange($event)"
                  class="w-full accent-indigo-500 cursor-pointer"
                />
              </div>

              <button
                type="button"
                (click)="addNewPair()"
                [disabled]="!canAddPair()"
                class="w-full py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-semibold flex items-center justify-center gap-1 transition-colors"
                matTooltip="Add this kerning pair to font"
              >
                <mat-icon class="text-sm">add</mat-icon>
                <span>Add Pair</span>
              </button>
            </div>

            <!-- Quick Suggestions Chips -->
            <div class="flex items-center gap-1.5 flex-wrap pt-1 border-t border-slate-800/60">
              <span class="text-[10px] text-slate-500">Quick suggestions:</span>
              @for (suggested of suggestedPairs; track suggested.pair) {
                <button
                  type="button"
                  (click)="setQuickPair(suggested.pair, suggested.offset)"
                  class="px-2 py-0.5 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-[10px] font-mono transition-colors"
                  [matTooltip]="'Quick add ' + suggested.pair + ' (' + suggested.offset + ')'"
                >
                  {{ suggested.pair }} ({{ suggested.offset }})
                </button>
              }
            </div>
          </div>

          <!-- Active Kerning Pairs List -->
          <div class="flex flex-col gap-2">
            <div class="flex items-center justify-between text-xs font-semibold text-slate-300">
              <span>Configured Kerning Pairs ({{ activePairList().length }})</span>
              <span class="text-[10px] text-slate-500">Negative values pull characters closer</span>
            </div>

            @if (activePairList().length === 0) {
              <div class="p-6 text-center bg-slate-950/40 rounded-xl border border-dashed border-slate-800 text-slate-500">
                <mat-icon class="text-2xl text-slate-600 mb-1">space_bar</mat-icon>
                <p>No kerning pairs defined yet.</p>
                <button
                  type="button"
                  (click)="state.loadStandardKerning()"
                  class="mt-2 text-indigo-400 hover:underline text-xs"
                >
                  Click here to load standard typography pairs
                </button>
              </div>
            } @else {
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                @for (item of activePairList(); track item.pair) {
                  <div class="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between gap-3 group hover:border-slate-700 transition-colors">
                    <!-- Pair Preview Box -->
                    <div class="flex items-center gap-2">
                      <div
                        class="w-14 h-11 bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-center font-bold text-lg text-white tracking-normal overflow-hidden px-1"
                        [style.font-family]="state.livePreviewFamily()"
                      >
                        {{ item.pair }}
                      </div>
                      <div>
                        <div class="font-mono font-bold text-amber-300 text-sm tracking-wider">{{ item.pair }}</div>
                        <div class="text-[10px] font-mono text-indigo-400">{{ item.offset }} units</div>
                      </div>
                    </div>

                    <!-- Slider & Delete -->
                    <div class="flex items-center gap-2 flex-1 max-w-[140px]">
                      <input
                        type="range"
                        min="-200"
                        max="100"
                        step="5"
                        [value]="item.offset"
                        (input)="onPairOffsetChange(item.pair, $event)"
                        class="w-full accent-indigo-500 cursor-pointer"
                        [matTooltip]="'Adjust kerning offset for ' + item.pair"
                      />
                      <button
                        type="button"
                        (click)="state.removeKerningPair(item.pair)"
                        class="text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-slate-900 transition-colors"
                        matTooltip="Remove kerning pair"
                      >
                        <mat-icon class="text-xs">delete_outline</mat-icon>
                      </button>
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="px-5 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <span class="text-[11px] text-slate-500">
            Kerning is exported into TTF and SVG Fonts (&lt;hkern&gt; elements)
          </span>
          <button
            type="button"
            (click)="state.closeKerningModal()"
            class="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition-colors"
            matTooltip="Save changes and close"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  `,
})
export class KerningModalComponent {
  readonly state = inject(FontState);

  readonly newFirstChar = signal<string>('A');
  readonly newSecondChar = signal<string>('V');
  readonly newOffset = signal<number>(-70);

  readonly suggestedPairs = [
    { pair: 'AV', offset: -70 },
    { pair: 'AW', offset: -60 },
    { pair: 'AY', offset: -65 },
    { pair: 'LT', offset: -55 },
    { pair: 'To', offset: -45 },
    { pair: 'VA', offset: -70 },
    { pair: 'WA', offset: -60 },
    { pair: 'Yo', offset: -45 },
  ];

  readonly activePairList = computed(() => {
    const pairs = this.state.kerningPairs();
    return Object.entries(pairs).map(([pair, offset]) => ({
      pair,
      offset,
    }));
  });

  readonly canAddPair = computed(() => {
    return this.newFirstChar().length === 1 && this.newSecondChar().length === 1;
  });

  onFirstCharChange(event: Event): void {
    const val = (event.target as HTMLInputElement).value.toUpperCase().slice(0, 1);
    this.newFirstChar.set(val);
  }

  onSecondCharChange(event: Event): void {
    const val = (event.target as HTMLInputElement).value.slice(0, 1);
    this.newSecondChar.set(val);
  }

  onOffsetSliderChange(event: Event): void {
    const val = Number((event.target as HTMLInputElement).value);
    this.newOffset.set(val);
  }

  onPairOffsetChange(pair: string, event: Event): void {
    const val = Number((event.target as HTMLInputElement).value);
    this.state.setKerningPair(pair, val);
  }

  addNewPair(): void {
    const pair = this.newFirstChar() + this.newSecondChar();
    if (pair.length === 2) {
      this.state.setKerningPair(pair, this.newOffset());
    }
  }

  setQuickPair(pair: string, offset: number): void {
    this.state.setKerningPair(pair, offset);
  }
}
