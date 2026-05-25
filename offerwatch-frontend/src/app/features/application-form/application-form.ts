import { Component, Inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule }          from '@angular/material/button';
import { MatFormFieldModule }       from '@angular/material/form-field';
import { MatInputModule }           from '@angular/material/input';
import { MatSelectModule }          from '@angular/material/select';
import { MatDatepickerModule }      from '@angular/material/datepicker';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Application, APPLICATION_STATUSES, STATUS_LABELS } from '../../core/models/application.model';
import { ApplicationService } from '../../core/services/application.service';

@Component({
  selector: 'app-application-form',
  standalone: true,
  imports: [
    ReactiveFormsModule, MatDialogModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatDatepickerModule, MatProgressSpinnerModule,
  ],
  templateUrl: './application-form.html',
  styleUrl:    './application-form.scss',
})
export class ApplicationFormComponent {
  form: FormGroup;
  loading  = signal(false);
  error    = signal('');
  isEdit   = false;

  readonly statuses     = APPLICATION_STATUSES;
  readonly statusLabels = STATUS_LABELS;

  constructor(
    fb: FormBuilder,
    private svc: ApplicationService,
    private ref: MatDialogRef<ApplicationFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Application | null,
  ) {
    this.isEdit = !!data;

    this.form = fb.group({
      company:     [data?.company ?? '',                              Validators.required],
      roleTitle:   [data?.roleTitle ?? '',                           []],
      status:      [data?.status ?? 'saved',                         Validators.required],
      location:    [data?.location ?? '',                            []],
      jobUrl:      [data?.jobUrl ?? '',                              []],
      salaryMin:   [data?.salaryMin ?? null,                         []],
      salaryMax:   [data?.salaryMax ?? null,                         []],
      source:      [data?.source ?? '',                              []],
      // Datepicker works with Date objects; convert the ISO string on load
      appliedDate: [data?.appliedDate ? parseLocalDate(data.appliedDate) : null, []],
    });
  }

  submit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set('');

    const payload = this.cleanPayload(this.form.value);
    const req$ = this.isEdit
      ? this.svc.update(this.data!.id!, payload)
      : this.svc.create(payload);

    req$.subscribe({
      next:  app  => this.ref.close(app),
      error: err  => {
        const detail = err?.error?.detail ?? '';
        this.error.set(
          err.status === 402 ? detail : 'Failed to save. Please try again.',
        );
        this.loading.set(false);
      },
    });
  }

  cancel(): void { this.ref.close(null); }

  /** Strip empties; convert Date → yyyy-MM-dd string for the API */
  private cleanPayload(raw: Record<string, unknown>): Partial<Application> {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(raw)) {
      if (v === '' || v === null || v === undefined) continue;
      if (k === 'appliedDate' && v instanceof Date) {
        out[k] = toIsoDate(v);
      } else {
        out[k] = v;
      }
    }
    return out as Partial<Application>;
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────

/**
 * Parse an ISO date string (yyyy-MM-dd) as a local Date (avoids UTC midnight
 * shifting the day back by the user's UTC offset).
 */
function parseLocalDate(iso: string): Date | null {
  if (!iso) return null;
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Format a local Date as yyyy-MM-dd without timezone conversion. */
function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
