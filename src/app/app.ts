import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { HeaderComponent } from './components/header/header';
import { ToolbarComponent } from './components/toolbar/toolbar';
import { VectorCanvasComponent } from './components/canvas/vector-canvas';
import { GlyphSelectorComponent } from './components/glyph-selector/glyph-selector';
import { LiveTesterComponent } from './components/live-tester/live-tester';
import { ExportModalComponent } from './components/export-modal/export-modal';
import { SvgModalComponent } from './components/svg-modal/svg-modal';
import { KerningModalComponent } from './components/kerning-modal/kerning-modal';
import { AutoTraceModalComponent } from './components/auto-trace-modal/auto-trace-modal';
import { CharacterSetModalComponent } from './components/character-set-modal/character-set-modal';
import { HistoryDrawerComponent } from './components/history-drawer/history-drawer';
import { FontState } from './core/services/font-state';

import { MatIconModule } from '@angular/material/icon';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  imports: [
    MatIconModule,
    HeaderComponent,
    ToolbarComponent,
    VectorCanvasComponent,
    GlyphSelectorComponent,
    LiveTesterComponent,
    ExportModalComponent,
    SvgModalComponent,
    KerningModalComponent,
    AutoTraceModalComponent,
    CharacterSetModalComponent,
    HistoryDrawerComponent,
  ],
  host: {
    '(window:keydown)': 'onKeyDown($event)',
  },
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  readonly state = inject(FontState);
  readonly isExportModalOpen = signal<boolean>(false);
  readonly isSvgModalOpen = signal<boolean>(false);

  onKeyDown(event: KeyboardEvent): void {
    const isInput =
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement ||
      event.target instanceof HTMLSelectElement;

    // Handle global shortcuts only when not typing inside an input
    if (isInput) return;

    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') {
      event.preventDefault();
      if (event.shiftKey) {
        this.state.redo();
      } else {
        this.state.undo();
      }
    } else if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'y') {
      event.preventDefault();
      this.state.redo();
    } else if (event.key.toLowerCase() === 'b') {
      this.state.setTool('brush');
    } else if (event.key.toLowerCase() === 'p') {
      this.state.setTool('pen');
    } else if (event.key.toLowerCase() === 'g') {
      this.state.toggleGrid();
    } else if (event.key === 'Escape') {
      this.isExportModalOpen.set(false);
      this.isSvgModalOpen.set(false);
      this.state.closeKerningModal();
      this.state.closeCharacterSetModal();
      this.state.closeAutoTraceModal();
      this.state.closeHistoryDrawer();
    }
  }
}
