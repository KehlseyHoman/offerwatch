import {
  Component, OnInit, AfterViewInit,
  ViewChild, computed, signal,
} from '@angular/core';
import { RouterLink }               from '@angular/router';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSort, MatSortModule }   from '@angular/material/sort';
import { MatButtonModule }          from '@angular/material/button';
import { MatIconModule }            from '@angular/material/icon';
import { MatChipsModule }           from '@angular/material/chips';
import { MatMenuModule }            from '@angular/material/menu';
import { MatDialog }                from '@angular/material/dialog';
import { MatSnackBar }              from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule }         from '@angular/material/tooltip';
import { MatFormFieldModule }       from '@angular/material/form-field';
import { MatInputModule }           from '@angular/material/input';
import { DecimalPipe, DatePipe }    from '@angular/common';

import {
  Application, ApplicationStatus,
  APPLICATION_STATUSES, STATUS_LABELS,
} from '../../core/models/application.model';
import { ApplicationService }       from '../../core/services/application.service';
import { ApplicationFormComponent } from '../application-form/application-form';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    RouterLink,
    MatTableModule, MatSortModule,
    MatButtonModule, MatIconModule,
    MatChipsModule, MatMenuModule,
    MatProgressSpinnerModule, MatTooltipModule,
    MatFormFieldModule, MatInputModule,
    DecimalPipe, DatePipe,
  ],
  templateUrl: './dashboard.html',
  styleUrl:    './dashboard.scss',
})
export class DashboardComponent implements OnInit, AfterViewInit {

  @ViewChild(MatSort) sort!: MatSort;

  // ── Data source (supports sorting) ───────────────────────────────────────
  dataSource = new MatTableDataSource<Application>([]);
  loading    = signal(true);

  // ── Metrics (computed from the underlying data array) ─────────────────────
  private _apps = signal<Application[]>([]);

  readonly total = computed(() => this._apps().length);

  readonly statCounts = computed(() => {
    const counts: Record<ApplicationStatus, number> = {
      saved: 0, applied: 0, phone_screen: 0,
      technical_interview: 0, final_round: 0, offer: 0, rejected: 0,
    };
    for (const app of this._apps()) counts[app.status]++;
    return counts;
  });

  readonly activeCount = computed(() => {
    const c = this.statCounts();
    return c.applied + c.phone_screen + c.technical_interview + c.final_round + c.offer;
  });

  // ── Table config ──────────────────────────────────────────────────────────
  private readonly ALL_COLUMNS = [
    'company', 'status', 'location', 'salary', 'appliedDate', 'lastActivity', 'link', 'actions',
  ];

  readonly optionalColumns: { key: string; label: string }[] = [
    { key: 'status',       label: 'Status'        },
    { key: 'location',     label: 'Location'      },
    { key: 'salary',       label: 'Salary'        },
    { key: 'appliedDate',  label: 'Applied date'  },
    { key: 'lastActivity', label: 'Last activity' },
    { key: 'link',         label: 'Job link'      },
  ];

  private readonly hiddenCols = signal(new Set<string>());

  readonly displayedColumns = computed(() =>
    this.ALL_COLUMNS.filter(col => !this.hiddenCols().has(col))
  );

  isVisible(col: string): boolean { return !this.hiddenCols().has(col); }

  toggleColumn(col: string): void {
    this.hiddenCols.update(s => {
      const next = new Set(s);
      next.has(col) ? next.delete(col) : next.add(col);
      return next;
    });
  }

  // ── Filters ───────────────────────────────────────────────────────────────
  textFilter   = signal('');
  statusFilter = signal(new Set<ApplicationStatus>());

  readonly statuses     = APPLICATION_STATUSES;
  readonly statusLabels = STATUS_LABELS;

  readonly metricRows: { key: ApplicationStatus; label: string }[] = [
    { key: 'saved',               label: 'Saved'        },
    { key: 'applied',             label: 'Applied'      },
    { key: 'phone_screen',        label: 'Phone Screen' },
    { key: 'technical_interview', label: 'Technical'    },
    { key: 'final_round',         label: 'Final Round'  },
    { key: 'offer',               label: 'Offer'        },
    { key: 'rejected',            label: 'Rejected'     },
  ];

  constructor(
    private appService: ApplicationService,
    private dialog:     MatDialog,
    private snack:      MatSnackBar,
  ) {}

  ngOnInit(): void { this.load(); }

  ngAfterViewInit(): void {
    // Set the accessor immediately - it doesn't need the MatSort instance.
    // We connect this.sort to the dataSource AFTER data loads (see load()) because
    // the table lives inside an @else block and won't be in the DOM until then.
    this.dataSource.sortingDataAccessor = (app, col) => {
      switch (col) {
        case 'company':      return (app.company + (app.roleTitle ?? '')).toLowerCase();
        case 'status':       return app.status ?? '';
        case 'location':     return app.location ?? '';
        case 'salary':       return app.salaryMin ?? 0;
        case 'appliedDate':  return app.appliedDate ?? '';
        case 'lastActivity': return app.updatedAt ?? '';
        default:             return '';
      }
    };

    this.dataSource.filterPredicate = (app, filterStr) => {
      const { text, statuses } = JSON.parse(filterStr) as { text: string; statuses: ApplicationStatus[] };
      if (statuses.length && !statuses.includes(app.status)) return false;
      if (!text) return true;
      return [app.company, app.roleTitle, app.location]
        .filter(Boolean).join(' ').toLowerCase().includes(text);
    };
  }

  load(): void {
    this.loading.set(true);
    this.appService.getAll().subscribe({
      next: apps => {
        this.dataSource.data = apps;
        this._apps.set(apps);
        this.loading.set(false);
        // Give Angular one tick to render the @else block, then connect MatSort
        setTimeout(() => { if (this.sort) this.dataSource.sort = this.sort; });
      },
      error: () => this.loading.set(false),
    });
  }

  // ── Inline status change ──────────────────────────────────────────────────
  onStatusChange(app: Application, newStatus: ApplicationStatus): void {
    if (app.status === newStatus) return;
    const prev = app.status;
    // Optimistic update in place
    const updated = { ...app, status: newStatus };
    this.dataSource.data = this.dataSource.data.map(a => a.id === app.id ? updated : a);
    this._apps.set(this.dataSource.data);

    this.appService.update(app.id!, { status: newStatus }).subscribe({
      next: fresh => {
        this.dataSource.data = this.dataSource.data.map(a => a.id === fresh.id ? fresh : a);
        this._apps.set(this.dataSource.data);
        this.snack.open(`→ ${this.statusLabels[newStatus]}`, '', { duration: 2000 });
      },
      error: () => {
        this.dataSource.data = this.dataSource.data.map(a => a.id === app.id ? { ...a, status: prev } : a);
        this._apps.set(this.dataSource.data);
        this.snack.open('Failed to update status.', '', { duration: 3000 });
      },
    });
  }

  // ── CRUD dialogs ──────────────────────────────────────────────────────────
  openCreate(): void {
    const ref = this.dialog.open(ApplicationFormComponent, {
      width: '560px', maxWidth: '95vw', data: null,
    });
    ref.afterClosed().subscribe(created => {
      if (created) { this.load(); this.snack.open('Application added!', '', { duration: 3000 }); }
    });
  }

  openEdit(app: Application): void {
    const ref = this.dialog.open(ApplicationFormComponent, {
      width: '560px', maxWidth: '95vw', data: app,
    });
    ref.afterClosed().subscribe(updated => {
      if (updated) { this.load(); this.snack.open('Saved.', '', { duration: 2500 }); }
    });
  }

  delete(app: Application): void {
    if (!confirm(`Delete application at ${app.company}?`)) return;
    this.appService.delete(app.id!).subscribe({
      next:  () => { this.load(); this.snack.open('Deleted.', '', { duration: 2000 }); },
      error: ()  => this.snack.open('Failed to delete.', '', { duration: 3000 }),
    });
  }

  // ── Filter actions ────────────────────────────────────────────────────────
  onSearch(value: string): void {
    this.textFilter.set(value);
    this.applyFilter();
  }

  onStatusFilterChange(selected: string[]): void {
    this.statusFilter.set(new Set(selected as ApplicationStatus[]));
    this.applyFilter();
  }

  clearFilters(): void {
    this.textFilter.set('');
    this.statusFilter.set(new Set());
    this.dataSource.filter = '';
  }

  private applyFilter(): void {
    const text    = this.textFilter().toLowerCase().trim();
    const statuses = [...this.statusFilter()];
    this.dataSource.filter = (text || statuses.length)
      ? JSON.stringify({ text, statuses })
      : '';
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  trackById(_: number, app: Application) { return app.id; }

  label(status: string): string {
    return this.statusLabels[status as ApplicationStatus] ?? status;
  }

  /** Returns a human-friendly relative time string, e.g. "Today", "3d ago", "2w ago". */
  relativeTime(dateStr: string | undefined): string {
    if (!dateStr) return '-';
    const diffDays = this.calendarDayDiff(dateStr);
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays <   7) return `${diffDays}d ago`;
    if (diffDays <  30) return `${Math.floor(diffDays / 7)}w ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
    return `${Math.floor(diffDays / 365)}y ago`;
  }

  /** CSS class for the activity badge based on how stale the application is. */
  activityClass(dateStr: string | undefined): string {
    if (!dateStr) return '';
    const diffDays = this.calendarDayDiff(dateStr);
    if (diffDays <= 3)  return 'activity-fresh';
    if (diffDays <= 14) return 'activity-recent';
    if (diffDays <= 30) return 'activity-stale';
    return 'activity-cold';
  }

  // Compare calendar dates (midnight-to-midnight) so day boundaries are accurate regardless of time of day
  private calendarDayDiff(dateStr: string): number {
    const now  = new Date();
    const date = new Date(dateStr);
    const todayMidnight = new Date(now.getFullYear(),  now.getMonth(),  now.getDate());
    const dateMidnight  = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    return Math.round((todayMidnight.getTime() - dateMidnight.getTime()) / 86_400_000);
  }
}
