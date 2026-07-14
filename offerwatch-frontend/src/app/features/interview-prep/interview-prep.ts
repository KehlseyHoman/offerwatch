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
import { MatSnackBar } from '@angular/material/snack-bar';
import { DatePipe } from '@angular/common';

import {
  InterviewPrep,
  PREP_CATEGORIES,
  SUGGESTED_QUESTIONS,
} from '../../core/models/interview-prep.model';
import { InterviewPrepService } from '../../core/services/interview-prep.service';

@Component({
  selector: 'app-interview-prep',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    DatePipe,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatTooltipModule,
    MatDividerModule,
  ],
  templateUrl: './interview-prep.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './interview-prep.scss',
})
export class InterviewPrepComponent implements OnInit {
  loading = signal(true);

  // ── Data ──────────────────────────────────────────────────────────────────
  private _items = signal<InterviewPrep[]>([]);

  // ── UI state ──────────────────────────────────────────────────────────────
  activeCategory = signal<string>('All');
  showAddForm = signal(false);
  editingId = signal<string | null>(null);

  // ── Config ────────────────────────────────────────────────────────────────
  readonly categories = ['All', ...PREP_CATEGORIES];
  readonly suggestedGroups = SUGGESTED_QUESTIONS;

  // ── Filtered views ────────────────────────────────────────────────────────
  readonly filteredItems = computed(() => {
    const cat = this.activeCategory();
    return cat === 'All' ? this._items() : this._items().filter((i) => i.category === cat);
  });

  readonly filteredSuggestions = computed(() => {
    const cat = this.activeCategory();
    return cat === 'All'
      ? this.suggestedGroups
      : this.suggestedGroups.filter((g) => g.category === cat);
  });

  // ── Forms ─────────────────────────────────────────────────────────────────
  addForm: FormGroup;
  editForm: FormGroup;

  constructor(
    private svc: InterviewPrepService,
    private fb: FormBuilder,
    private snack: MatSnackBar,
  ) {
    this.addForm = fb.group({
      category: ['Behavioral', Validators.required],
      question: ['', Validators.required],
      notes: [''],
    });

    this.editForm = fb.group({
      notes: [''],
    });
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.svc.getAll().subscribe({
      next: (items) => {
        this._items.set(items);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  // ── Add ───────────────────────────────────────────────────────────────────
  submitAdd(): void {
    if (this.addForm.invalid) return;
    const v = this.addForm.value;
    this.svc
      .create({ category: v.category, question: v.question, notes: v.notes || undefined })
      .subscribe({
        next: (item) => {
          this._items.update((list) => [...list, item]);
          this.addForm.reset({ category: 'Behavioral' });
          this.showAddForm.set(false);
          this.snack.open('Question added!', '', { duration: 2000 });
        },
        error: () => this.snack.open('Failed to add.', '', { duration: 3000 }),
      });
  }

  /** Pre-fill the add form from a suggested question. */
  addSuggested(category: string, question: string): void {
    this.addForm.patchValue({ category, question });
    this.showAddForm.set(true);
    setTimeout(
      () => document.getElementById('notes-field')?.scrollIntoView({ behavior: 'smooth' }),
      80,
    );
  }

  // ── Edit (notes only) ─────────────────────────────────────────────────────
  startEdit(item: InterviewPrep): void {
    this.editingId.set(item.id);
    this.editForm.patchValue({ notes: item.notes ?? '' });
  }

  saveEdit(item: InterviewPrep): void {
    this.svc.update(item.id, { notes: this.editForm.value.notes || undefined }).subscribe({
      next: (updated) => {
        this._items.update((list) => list.map((i) => (i.id === updated.id ? updated : i)));
        this.editingId.set(null);
        this.snack.open('Saved.', '', { duration: 2000 });
      },
      error: () => this.snack.open('Failed to save.', '', { duration: 3000 }),
    });
  }

  cancelEdit(): void {
    this.editingId.set(null);
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  delete(item: InterviewPrep): void {
    this.svc.delete(item.id).subscribe({
      next: () => this._items.update((list) => list.filter((i) => i.id !== item.id)),
      error: () => this.snack.open('Failed to delete.', '', { duration: 3000 }),
    });
  }

  /** Check if a suggested question is already saved by the user. */
  isSaved(question: string): boolean {
    return this._items().some((i) => i.question === question);
  }
}
