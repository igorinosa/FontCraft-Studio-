import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FontState } from '../../core/services/font-state';

@Component({
  selector: 'app-live-tester',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, MatTooltipModule],
  template: `
    <section class="bg-slate-900 border-t border-slate-800 p-3 select-none flex flex-col gap-2.5">
      <!-- Controls Bar -->
      <div class="flex items-center justify-between gap-3 flex-wrap">
        <div class="flex items-center gap-2">
          <div class="flex items-center gap-1.5 text-xs font-bold text-slate-200">
            <mat-icon class="text-sm text-emerald-400">text_fields</mat-icon>
            <span>Live Type Tester</span>
          </div>
          <span class="text-xs text-slate-500">· Type anything below to test your font!</span>
        </div>

        <div class="flex items-center gap-3 flex-wrap">
          <!-- Kerning Manager Button -->
          <button
            type="button"
            (click)="state.openKerningModal()"
            class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-medium transition-colors"
            matTooltip="Tune pair kerning spacing (AV, WA, To) to eliminate gaps"
          >
            <mat-icon class="text-xs">space_bar</mat-icon>
            <span>Kerning ({{ state.kerningPairCount() }})</span>
          </button>

          <!-- Pangram Presets -->
          <div class="hidden md:flex items-center gap-1.5">
            <span class="text-[11px] text-slate-500">Pangrams:</span>
            <button
              type="button"
              (click)="setPangram('HELLO WORLD! 123')"
              class="text-[11px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              matTooltip="Fill sample text with common words"
            >
              Short
            </button>
            <button
              type="button"
              (click)="setPangram('THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG!')"
              class="text-[11px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              matTooltip="Fill with full alphabet pangram containing every letter A-Z"
            >
              Alphabet
            </button>
            <button
              type="button"
              (click)="setPangram('0 1 2 3 4 5 6 7 8 9 ! ? . ,')"
              class="text-[11px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              matTooltip="Test all digits and punctuation marks"
            >
              Numbers
            </button>
          </div>

          <!-- Variant Switcher Pills -->
          <div class="hidden lg:flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
            @for (variant of state.variants(); track variant.id) {
              <button
                type="button"
                (click)="state.setActiveVariant(variant.id)"
                [class]="state.activeVariantId() === variant.id ? 'bg-amber-400 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'"
                class="px-2 py-0.5 text-xs rounded transition-colors"
                matTooltip="Test text in {{ variant.name }} style"
              >
                {{ variant.name }}
              </button>
            }
          </div>

          <!-- Font Weight Slider -->
          <div
            class="flex items-center gap-2 bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800"
            matTooltip="Adjust optical font weight in real time (100 Thin to 900 Black)"
          >
            <span class="text-[11px] text-slate-400">Weight</span>
            <input
              type="range"
              min="100"
              max="900"
              step="100"
              [value]="state.fontWeight()"
              (input)="onWeightChange($event)"
              class="w-16 accent-amber-400 cursor-pointer"
            />
            <span class="text-[11px] text-amber-400 font-mono w-7 text-right">{{ state.fontWeight() }}</span>
          </div>

          <!-- Font Size Slider -->
          <div
            class="flex items-center gap-2 bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800"
            matTooltip="Adjust preview text size"
          >
            <span class="text-[11px] text-slate-400">Size</span>
            <input
              type="range"
              min="16"
              max="96"
              [value]="state.livePreviewSize()"
              (input)="onSizeChange($event)"
              class="w-16 accent-emerald-400 cursor-pointer"
            />
            <span class="text-[11px] text-emerald-400 font-mono w-8 text-right">{{ state.livePreviewSize() }}px</span>
          </div>

          <!-- Background theme for test area -->
          <div class="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800">
            <button
              type="button"
              (click)="previewTheme.set('dark')"
              [class]="previewTheme() === 'dark' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'"
              class="px-2 py-0.5 text-xs rounded transition-colors"
              matTooltip="Dark studio background"
              title="Dark background"
            >
              Dark
            </button>
            <button
              type="button"
              (click)="previewTheme.set('light')"
              [class]="previewTheme() === 'light' ? 'bg-slate-200 text-slate-900 font-semibold' : 'text-slate-500 hover:text-slate-300'"
              class="px-2 py-0.5 text-xs rounded transition-colors"
              matTooltip="Crisp light background"
              title="Light background"
            >
              Light
            </button>
            <button
              type="button"
              (click)="previewTheme.set('paper')"
              [class]="previewTheme() === 'paper' ? 'bg-amber-100 text-amber-950 font-semibold' : 'text-slate-500 hover:text-slate-300'"
              class="px-2 py-0.5 text-xs rounded transition-colors"
              matTooltip="Warm paper notebook background"
              title="Paper notebook"
            >
              Paper
            </button>
          </div>
        </div>
      </div>

      <!-- Real-Time Interactive Text Display Box -->
      <div
        [class]="
          previewTheme() === 'dark'
            ? 'bg-slate-950 text-slate-100 border-slate-800'
            : previewTheme() === 'light'
              ? 'bg-slate-100 text-slate-950 border-slate-300 shadow-inner'
              : 'bg-[#fffbeb] text-amber-950 border-amber-200 shadow-inner'
        "
        class="w-full min-h-[90px] rounded-xl border p-4 flex items-center justify-start overflow-x-auto transition-colors"
      >
        <input
          type="text"
          [value]="state.livePreviewText()"
          (input)="onTextChange($event)"
          [style.font-family]="state.livePreviewFamily()"
          [style.font-size.px]="state.livePreviewSize()"
          [style.font-weight]="state.fontWeight()"
          [style.font-style]="state.activeVariant().isItalic ? 'italic' : 'normal'"
          [style.letter-spacing.px]="state.liveLetterSpacing()"
          class="w-full bg-transparent border-none outline-none font-normal leading-normal select-text"
          placeholder="Type here to test your font..."
        />
      </div>
    </section>
  `,
})
export class LiveTesterComponent {
  readonly state = inject(FontState);
  readonly previewTheme = signal<'dark' | 'light' | 'paper'>('dark');

  onSizeChange(event: Event): void {
    const val = Number((event.target as HTMLInputElement).value);
    this.state.setLivePreviewSize(val);
  }

  onWeightChange(event: Event): void {
    const val = Number((event.target as HTMLInputElement).value);
    this.state.setFontWeight(val);
  }

  onTextChange(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.state.setLivePreviewText(val);
  }

  setPangram(text: string): void {
    this.state.setLivePreviewText(text);
  }
}
