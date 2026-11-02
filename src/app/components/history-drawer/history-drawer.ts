import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FontState } from '../../core/services/font-state';
import { GlyphHistoryEntry } from '../../core/models/font.model';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-history-drawer',
  imports: [CommonModule, MatIconModule, MatTooltipModule],
  template: `
    <div class="fixed inset-0 z-50 flex justify-end">
      <!-- Backdrop Button -->
      <button
        type="button"
        class="fixed inset-0 bg-black/60 backdrop-blur-xs cursor-default"
        (click)="state.closeHistoryDrawer()"
        aria-label="Close history drawer backdrop"
      ></button>

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="history-drawer-title"
        class="relative z-10 bg-slate-900 border-l border-slate-700/80 w-full max-w-sm h-full flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-right duration-200"
      >
        <!-- Drawer Header -->
        <div class="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg bg-amber-400/20 text-amber-400 flex items-center justify-center">
              <mat-icon class="text-lg">history</mat-icon>
            </div>
            <div>
              <h3 id="history-drawer-title" class="text-sm font-bold text-white flex items-center gap-2">
                Glyph Revision History
                <span class="text-xs px-2 py-0.5 rounded bg-amber-400 text-slate-950 font-bold">
                  '{{ state.selectedCharacter() }}'
                </span>
              </h3>
              <p class="text-[11px] text-slate-400">Jump to any past point in time</p>
            </div>
          </div>
          <button
            type="button"
            (click)="state.closeHistoryDrawer()"
            matTooltip="Close history panel"
            class="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <mat-icon class="text-lg">close</mat-icon>
          </button>
        </div>

        <!-- Quick Undo / Redo Bar -->
        <div class="px-4 py-2.5 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between gap-2">
          <button
            type="button"
            (click)="state.undo()"
            [disabled]="!state.canUndo()"
            matTooltip="Undo last stroke (Ctrl+Z)"
            class="flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 disabled:opacity-40 disabled:pointer-events-none transition-colors flex items-center justify-center gap-1.5"
          >
            <mat-icon class="text-sm">undo</mat-icon>
            <span>Undo</span>
            <kbd class="text-[9px] px-1 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">Ctrl+Z</kbd>
          </button>

          <button
            type="button"
            (click)="state.redo()"
            [disabled]="!state.canRedo()"
            matTooltip="Redo next stroke (Ctrl+Y)"
            class="flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 disabled:opacity-40 disabled:pointer-events-none transition-colors flex items-center justify-center gap-1.5"
          >
            <mat-icon class="text-sm">redo</mat-icon>
            <span>Redo</span>
            <kbd class="text-[9px] px-1 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">Ctrl+Y</kbd>
          </button>
        </div>

        <!-- Timeline List -->
        <div class="flex-1 overflow-y-auto p-4 space-y-2">
          <div class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-1 mb-2">
            Timeline Steps ({{ state.currentGlyphHistory().length }})
          </div>

          @for (entry of state.currentGlyphHistory(); track entry.id; let idx = $index) {
            <button
              type="button"
              (click)="revert(entry, idx)"
              [class]="idx === state.currentHistoryIndex() ? 'bg-amber-400/20 border-amber-400/80 ring-1 ring-amber-400/40' : 'bg-slate-950/60 border-slate-800 hover:bg-slate-800 hover:border-slate-700'"
              class="w-full p-2.5 rounded-xl border text-left transition-all flex items-center gap-3 group"
              matTooltip="Restore this revision"
            >
              <!-- Mini SVG Thumbnail -->
              <div class="w-12 h-12 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 overflow-hidden p-1">
                @if (entry.svgPath) {
                  <svg viewBox="0 0 1000 1000" class="w-full h-full text-slate-200 group-hover:text-amber-300 transition-colors">
                    <path [attr.d]="entry.svgPath" fill="currentColor" fill-rule="nonzero" />
                  </svg>
                } @else {
                  <span class="text-[10px] text-slate-600 italic">Empty</span>
                }
              </div>

              <!-- Action Details -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between gap-1">
                  <span class="text-xs font-bold text-white group-hover:text-amber-300 transition-colors truncate">
                    {{ entry.actionName }}
                  </span>
                  @if (idx === state.currentHistoryIndex()) {
                    <span class="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-bold shrink-0">
                      Active
                    </span>
                  }
                </div>
                <div class="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                  <span>{{ formatTimestamp(entry.timestamp) }}</span>
                  <span class="font-mono text-[10px] text-slate-500">{{ entry.pointCount }} pts</span>
                </div>
              </div>
            </button>
          }
        </div>

        <!-- Footer -->
        <div class="px-5 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <span>Click any entry to jump back or forward</span>
          <button
            type="button"
            (click)="state.closeHistoryDrawer()"
            class="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  `,
})
export class HistoryDrawerComponent {
  readonly state = inject(FontState);

  revert(entry: GlyphHistoryEntry, index: number): void {
    this.state.revertToHistoryEntry(entry, index);
  }

  formatTimestamp(timestamp: number): string {
    const diff = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
    if (diff < 10) return 'Just now';
    if (diff < 60) return `${diff}s ago`;
    const mins = Math.floor(diff / 60);
    if (mins < 60) return `${mins}m ago`;
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}
