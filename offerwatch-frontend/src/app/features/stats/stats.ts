import { Component, OnInit, computed, signal } from '@angular/core';
import { PercentPipe }  from '@angular/common';
import { MatProgressSpinnerModule }             from '@angular/material/progress-spinner';
import { MatIconModule }                        from '@angular/material/icon';
import { MatTooltipModule }                     from '@angular/material/tooltip';
import { MatDividerModule }                     from '@angular/material/divider';

import { Application, ApplicationStatus } from '../../core/models/application.model';
import { ApplicationService }              from '../../core/services/application.service';

interface SourceCount { source: string; count: number; pct: number; }

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [
    PercentPipe,
    MatProgressSpinnerModule, MatIconModule, MatTooltipModule, MatDividerModule,
  ],
  templateUrl: './stats.html',
  styleUrl:    './stats.scss',
})
export class StatsComponent implements OnInit {

  loading = signal(true);
  private _apps = signal<Application[]>([]);

  // ── Summary ───────────────────────────────────────────────────────────────
  readonly total       = computed(() => this._apps().length);
  readonly statCounts  = computed(() => {
    const c: Record<string, number> = {
      saved: 0, applied: 0, phone_screen: 0, interview: 0, offer: 0, rejected: 0,
    };
    for (const a of this._apps()) c[a.status]++;
    return c;
  });

  readonly activeCount  = computed(() => {
    const c = this.statCounts();
    return c['applied'] + c['phone_screen'] + c['interview'] + c['offer'];
  });

  readonly responseRate = computed(() => {
    const total = this.total();
    if (total === 0) return 0;
    const c = this.statCounts();
    return (c['phone_screen'] + c['interview'] + c['offer'] + c['rejected']) / total;
  });

  // ── Interview pipeline ────────────────────────────────────────────────────
  readonly pipeline = computed(() => {
    const c   = this.statCounts();
    const tot = this.total();
    if (tot === 0) return null;
    const applied      = c['applied'] + c['phone_screen'] + c['interview'] + c['offer'] + c['rejected'];
    const phoneScreen  = c['phone_screen'] + c['interview'] + c['offer'];
    const interview    = c['interview'] + c['offer'];
    const offer        = c['offer'];
    return {
      applied,
      phoneScreen,
      interview,
      offer,
      ratePS:  applied     > 0 ? phoneScreen / applied    : 0,
      rateInt: phoneScreen > 0 ? interview   / phoneScreen : 0,
      rateOff: interview   > 0 ? offer       / interview   : 0,
    };
  });

  // ── Applications by source ────────────────────────────────────────────────
  readonly bySource = computed<SourceCount[]>(() => {
    const map = new Map<string, number>();
    for (const a of this._apps()) {
      const key = (a.source?.trim() || 'Unknown / Direct');
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    const total = this.total();
    return [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([source, count]) => ({ source, count, pct: total > 0 ? count / total : 0 }));
  });

  // ── Activity insights ─────────────────────────────────────────────────────
  readonly thisWeek = computed(() => {
    const cutoff = Date.now() - 7 * 86_400_000;
    return this._apps().filter(a => a.appliedDate && new Date(a.appliedDate).getTime() >= cutoff).length;
  });

  readonly thisMonth = computed(() => {
    const cutoff = Date.now() - 30 * 86_400_000;
    return this._apps().filter(a => a.appliedDate && new Date(a.appliedDate).getTime() >= cutoff).length;
  });

  /** Apps in applied/phone_screen with no update in >14 days - may be ghosting */
  readonly awaitingResponse = computed(() =>
    this._apps().filter(a => {
      if (!['applied', 'phone_screen'].includes(a.status)) return false;
      if (!a.updatedAt) return false;
      return (Date.now() - new Date(a.updatedAt).getTime()) / 86_400_000 > 14;
    }),
  );

  /** Apps in applied with no update in >30 days - likely ghosted */
  readonly ghosted = computed(() =>
    this._apps().filter(a => {
      if (a.status !== 'applied') return false;
      if (!a.updatedAt) return false;
      return (Date.now() - new Date(a.updatedAt).getTime()) / 86_400_000 > 30;
    }),
  );

  constructor(private appService: ApplicationService) {}

  ngOnInit(): void {
    this.appService.getAll().subscribe({
      next:  apps => { this._apps.set(apps); this.loading.set(false); },
      error: ()   => this.loading.set(false),
    });
  }
}
