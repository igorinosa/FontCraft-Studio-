import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FontState } from '../../core/services/font-state';
import { PRESET_LIST } from '../../core/services/font-presets';
import { FontGenerator } from '../../core/services/font-generator';

@Component({
  selector: 'app-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, MatTooltipModule],
  template: `
    <header class="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-3 sm:px-4 py-2 flex items-center justify-between gap-2 sticky top-0 z-30">
      <!-- Brand & Project Name -->
      <div class="flex items-center gap-2 sm:gap-3 min-w-0">
        <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-slate-950 shadow-md font-bold text-lg sm:text-xl shrink-0">
          <mat-icon class="text-base sm:text-lg">gesture</mat-icon>
        </div>
        <div class="min-w-0">
          <div class="flex items-center gap-1.5">
            <h1 class="text-sm sm:text-base font-bold text-white tracking-tight truncate">FontCraft</h1>
            <span class="hidden md:inline-flex text-[11px] px-2 py-0.5 rounded-full bg-cyan-400/10 text-cyan-300 font-medium border border-cyan-400/20">
              Vector &amp; SVG Studio
            </span>
          </div>
          <div class="flex items-center gap-1.5 text-[11px] sm:text-xs text-slate-400 truncate">
            <input
              type="text"
              [value]="state.project().metadata.familyName"
              (change)="onNameChange($event)"
              class="bg-transparent border-b border-transparent hover:border-slate-600 focus:border-amber-400 focus:outline-none text-slate-200 font-medium px-0.5 max-w-[80px] xs:max-w-[110px] sm:max-w-[180px] truncate"
              matTooltip="Click to edit font family name"
              title="Click to edit font family name"
            />
            <span aria-hidden="true" class="hidden sm:inline">·</span>
            <span class="hidden sm:inline text-slate-400" matTooltip="Completed glyphs count">{{ state.completedGlyphCount() }}/{{ state.totalGlyphCount() }}</span>
          </div>
        </div>
      </div>

      <!-- Action Tools -->
      <div class="flex items-center gap-1.5 shrink-0">
        <!-- Preset Dropdown -->
        <div class="relative">
          <button
            type="button"
            (click)="togglePresetMenu()"
            class="flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/80 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
            matTooltip="Choose starter typography templates (Casual Brush, Geometric, Blank)"
            title="Choose starter font template"
          >
            <mat-icon class="text-amber-400 text-sm">auto_awesome</mat-icon>
            <span class="hidden md:inline">Starter Presets</span>
            <mat-icon class="text-xs">expand_more</mat-icon>
          </button>

          @if (showPresets()) {
            <div class="absolute right-0 sm:left-0 mt-1.5 w-60 sm:w-64 bg-slate-800 border border-slate-700 rounded-xl shadow-xl p-1.5 z-50">
              <div class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-1">Choose a Template</div>
              @for (preset of presets; track preset.id) {
                <button
                  type="button"
                  (click)="loadPreset(preset.id)"
                  class="w-full text-left p-2 rounded-lg hover:bg-slate-700/70 text-slate-200 text-xs transition-colors flex items-start gap-2.5 group"
                >
                  <div class="w-7 h-7 rounded-md bg-slate-900 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                    <mat-icon class="text-sm">{{ preset.icon }}</mat-icon>
                  </div>
                  <div>
                    <div class="font-semibold text-slate-100 group-hover:text-amber-300">{{ preset.name }}</div>
                    <div class="text-[11px] text-slate-400 leading-snug">{{ preset.tagline }}</div>
                  </div>
                </button>
              }
            </div>
          }
        </div>

        <!-- Character Set & Unicode Coverage Map -->
        <button
          type="button"
          (click)="state.openCharacterSetModal()"
          class="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 hover:text-emerald-200 border border-emerald-500/30 text-xs font-medium transition-colors"
          matTooltip="Open full Unicode Character Set Preview &amp; Glyphs Map"
          title="Character Set Preview"
        >
          <mat-icon class="text-sm">grid_view</mat-icon>
          <span class="hidden md:inline">Map</span>
          <span class="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
            {{ state.completedGlyphCount() }}/{{ state.totalGlyphCount() }}
          </span>
        </button>

        <!-- Auto-Trace Button -->
        <button
          type="button"
          (click)="state.openAutoTraceModal()"
          class="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 border border-amber-500/30 text-xs font-medium transition-colors"
          matTooltip="Auto-Trace bitmap image or sketch into vector outlines"
          title="Auto-Trace"
        >
          <mat-icon class="text-sm">auto_fix_high</mat-icon>
          <span class="hidden lg:inline">Auto-Trace</span>
        </button>

        <!-- SVG Direct Code / Import Button (Desktop only, mobile has it in canvas) -->
        <button
          type="button"
          (click)="openSvgModal.emit()"
          class="hidden sm:flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-cyan-200 border border-cyan-500/30 text-xs font-medium transition-colors"
          matTooltip="Directly inspect, edit, or import raw SVG code"
          title="Directly inspect, edit, or import raw SVG code"
        >
          <mat-icon class="text-sm">code</mat-icon>
          <span class="hidden md:inline">SVG Code</span>
        </button>

        <!-- Kerning Button (Desktop only, mobile has it in canvas & tester) -->
        <button
          type="button"
          (click)="openKerningModal.emit()"
          class="hidden sm:flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-indigo-200 border border-indigo-500/30 text-xs font-medium transition-colors"
          matTooltip="Manage font kerning pairs (e.g. AV, WA, To)"
          title="Kerning"
        >
          <mat-icon class="text-sm">space_bar</mat-icon>
          <span class="hidden md:inline">Kerning ({{ state.kerningPairCount() }})</span>
        </button>


        <!-- Undo / Redo -->
        <div class="flex items-center bg-slate-800 border border-slate-700 rounded-lg p-0.5">
          <button
            type="button"
            (click)="state.undo()"
            [disabled]="!state.canUndo()"
            class="p-1 sm:p-1.5 rounded text-slate-300 hover:text-white disabled:opacity-30 transition-colors"
            matTooltip="Undo last stroke or edit"
            title="Undo"
          >
            <mat-icon class="text-sm sm:text-base">undo</mat-icon>
          </button>
          <button
            type="button"
            (click)="state.redo()"
            [disabled]="!state.canRedo()"
            class="p-1 sm:p-1.5 rounded text-slate-300 hover:text-white disabled:opacity-30 transition-colors"
            matTooltip="Redo last stroke or edit"
            title="Redo"
          >
            <mat-icon class="text-sm sm:text-base">redo</mat-icon>
          </button>
        </div>

        <!-- Save / Load Project JSON -->
        <button
          type="button"
          (click)="saveProjectJson()"
          class="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs border border-slate-700 transition-colors"
          matTooltip="Save font project to computer (.json)"
          title="Save font project to computer"
        >
          <mat-icon class="text-sm">save</mat-icon>
          <span>Save</span>
        </button>

        <label
          class="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs border border-slate-700 cursor-pointer transition-colors"
          matTooltip="Open a saved font project (.json)"
          title="Open a saved font project (.json)"
        >
          <mat-icon class="text-sm">folder_open</mat-icon>
          <span>Open</span>
          <input type="file" accept=".json" (change)="loadProjectJson($event)" class="hidden" />
        </label>

        <!-- Primary Export Button -->
        <button
          type="button"
          (click)="openExport.emit()"
          class="flex items-center gap-1 sm:gap-2 px-2.5 sm:px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0"
          matTooltip="Export to TrueType (.ttf), SVG Font (.svg), and individual SVG glyphs (.zip)"
        >
          <mat-icon class="text-base">file_download</mat-icon>
          <span class="hidden sm:inline">Export Font &amp; SVGs</span>
          <span class="sm:hidden">Export</span>
        </button>
      </div>
    </header>
  `,
})
export class HeaderComponent {
  readonly state = inject(FontState);
  private readonly generator = inject(FontGenerator);

  readonly presets = PRESET_LIST;
  readonly showPresets = signal(false);

  readonly openExport = output<void>();
  readonly openSvgModal = output<void>();
  readonly openKerningModal = output<void>();

  togglePresetMenu(): void {
    this.showPresets.update((v) => !v);
  }

  loadPreset(presetId: string): void {
    this.state.loadPreset(presetId);
    this.showPresets.set(false);
  }

  onNameChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.value.trim()) {
      this.state.updateProjectMetadata({ familyName: input.value.trim() });
    }
  }

  saveProjectJson(): void {
    const json = JSON.stringify(this.state.project(), null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const filename = `${this.state.project().metadata.familyName.replace(/\s+/g, '_')}_project.json`;
    this.generator.downloadBlob(blob, filename);
  }

  loadProjectJson(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        if (parsed.glyphs && parsed.metadata) {
          this.state.project.set(parsed);
          this.state.refreshLiveFont();
        }
      } catch (err) {
        console.error('Invalid font project file', err);
      }
    };
    reader.readAsText(file);
    input.value = '';
  }
}
