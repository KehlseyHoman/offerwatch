import { Component, OnInit, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SlicePipe } from '@angular/common';

import {
  BehavioralStory,
  STORY_THEMES,
  THEME_TIPS,
} from '../../core/models/behavioral-story.model';
import { BehavioralStoryService } from '../../core/services/behavioral-story.service';

@Component({
  selector: 'app-behavioral-stories',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    SlicePipe,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatTooltipModule,
    MatDividerModule,
    MatExpansionModule,
  ],
  templateUrl: './behavioral-stories.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './behavioral-stories.scss',
})
export class BehavioralStoriesComponent implements OnInit {
  loading = signal(true);
  private _stories = signal<BehavioralStory[]>([]);

  // ── UI state ──────────────────────────────────────────────────────────────
  filterTheme = signal<string>('All');
  showAddForm = signal(false);
  editingId = signal<string | null>(null);
  expandedId = signal<string | null>(null);

  // ── Config ────────────────────────────────────────────────────────────────
  readonly themes = ['All', ...STORY_THEMES];
  readonly themeTips = THEME_TIPS;

  // ── Filtered ──────────────────────────────────────────────────────────────
  readonly filteredStories = computed(() => {
    const f = this.filterTheme();
    return f === 'All' ? this._stories() : this._stories().filter((s) => s.theme === f);
  });

  readonly themeCounts = computed(() => {
    const map: Record<string, number> = {};
    for (const s of this._stories()) map[s.theme] = (map[s.theme] ?? 0) + 1;
    return map;
  });

  // ── Forms ─────────────────────────────────────────────────────────────────
  addForm: FormGroup;
  editForm: FormGroup;

  constructor(
    private svc: BehavioralStoryService,
    private fb: FormBuilder,
    private snack: MatSnackBar,
  ) {
    const storyFields = {
      theme: ['', Validators.required],
      title: [''],
      situation: [''],
      task: [''],
      action: [''],
      result: [''],
      applicableQuestions: [''],
    };
    this.addForm = fb.group(storyFields);
    this.editForm = fb.group(storyFields);
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.svc.getAll().subscribe({
      next: (stories) => {
        this._stories.set(stories);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  // ── Add ───────────────────────────────────────────────────────────────────
  submitAdd(): void {
    if (this.addForm.invalid) return;
    const v = this.addForm.value;
    const payload = Object.fromEntries(
      Object.entries(v).filter(([, val]) => val !== '' && val != null),
    );
    this.svc.create(payload).subscribe({
      next: (story) => {
        this._stories.update((list) => [...list, story]);
        this.addForm.reset();
        this.showAddForm.set(false);
        this.expandedId.set(story.id);
        this.snack.open('Story saved!', '', { duration: 2000 });
      },
      error: () => this.snack.open('Failed to save story.', '', { duration: 3000 }),
    });
  }

  // ── Edit ──────────────────────────────────────────────────────────────────
  startEdit(story: BehavioralStory): void {
    this.editingId.set(story.id);
    this.editForm.patchValue({
      theme: story.theme,
      title: story.title ?? '',
      situation: story.situation ?? '',
      task: story.task ?? '',
      action: story.action ?? '',
      result: story.result ?? '',
      applicableQuestions: story.applicableQuestions ?? '',
    });
  }

  saveEdit(story: BehavioralStory): void {
    const v = this.editForm.value;
    const payload = Object.fromEntries(
      Object.entries(v).filter(([, val]) => val !== '' && val != null),
    );
    this.svc.update(story.id, payload).subscribe({
      next: (updated) => {
        this._stories.update((list) => list.map((s) => (s.id === updated.id ? updated : s)));
        this.editingId.set(null);
        this.snack.open('Story updated.', '', { duration: 2000 });
      },
      error: () => this.snack.open('Failed to update.', '', { duration: 3000 }),
    });
  }

  cancelEdit(): void {
    this.editingId.set(null);
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  delete(story: BehavioralStory): void {
    if (!confirm(`Delete "${story.title || story.theme}" story?`)) return;
    this.svc.delete(story.id).subscribe({
      next: () => this._stories.update((list) => list.filter((s) => s.id !== story.id)),
      error: () => this.snack.open('Failed to delete.', '', { duration: 3000 }),
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  toggleExpand(id: string): void {
    this.expandedId.set(this.expandedId() === id ? null : id);
  }

  themeColor(theme: string): string {
    const map: Record<string, string> = {
      Leadership: '#1565c0',
      Failure: '#c62828',
      Teamwork: '#2e7d32',
      Conflict: '#e65100',
      Achievement: '#6a1b9a',
      Growth: '#00838f',
      Communication: '#0277bd',
      'Problem-Solving': '#558b2f',
      Innovation: '#f57f17',
      Other: '#555',
    };
    return map[theme] ?? '#555';
  }

  themeBg(theme: string): string {
    const map: Record<string, string> = {
      Leadership: '#e3f2fd',
      Failure: '#ffebee',
      Teamwork: '#e8f5e9',
      Conflict: '#fff3e0',
      Achievement: '#f3e5f5',
      Growth: '#e0f7fa',
      Communication: '#e1f5fe',
      'Problem-Solving': '#f1f8e9',
      Innovation: '#fffde7',
      Other: '#f5f5f5',
    };
    return map[theme] ?? '#f5f5f5';
  }
}
