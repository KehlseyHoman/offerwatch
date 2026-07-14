import { Component, OnInit, computed, signal, ChangeDetectionStrategy } from '@angular/core';
import { PercentPipe } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';

import { Application, ApplicationStatus, STAGE_ORDER } from '../../core/models/application.model';
import { ApplicationService } from '../../core/services/application.service';

interface SourceCount {
  source: string;
  count: number;
  pct: number;
}

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [
    PercentPipe,
    MatProgressSpinnerModule,
    MatIconModule,
    MatTooltipModule,
    MatDividerModule,
  ],
  templateUrl: './stats.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './stats.scss',
})
export class StatsComponent implements OnInit {
  loading = signal(true);
  private _apps = signal<Application[]>([]);

  // ── Summary ───────────────────────────────────────────────────────────────
  readonly total = computed(() => this._apps().length);
  readonly statCounts = computed(() => {
    const c: Record<string, number> = {
      saved: 0,
      applied: 0,
      phone_screen: 0,
      technical_interview: 0,
      final_round: 0,
      offer: 0,
      rejected: 0,
    };
    for (const a of this._apps()) c[a.status]++;
    return c;
  });

  readonly activeCount = computed(() => {
    const c = this.statCounts();
    return (
      c['applied'] + c['phone_screen'] + c['technical_interview'] + c['final_round'] + c['offer']
    );
  });

  readonly responseRate = computed(() => {
    const total = this.total();
    if (total === 0) return 0;
    const c = this.statCounts();
    return (
      (c['phone_screen'] +
        c['technical_interview'] +
        c['final_round'] +
        c['offer'] +
        c['rejected']) /
      total
    );
  });

  // ── Interview pipeline ────────────────────────────────────────────────────
  // Uses stageReached (falling back to current status for non-rejected apps) so
  // applications that were rejected mid-pipeline still count toward the stages they reached.
  readonly pipeline = computed(() => {
    const apps = this._apps();
    if (apps.length === 0) return null;

    const reached = (stage: ApplicationStatus): number => {
      const minIdx = STAGE_ORDER.indexOf(stage);
      return apps.filter((a) => {
        const s = a.stageReached ?? (a.status !== 'rejected' ? a.status : null);
        return s != null && STAGE_ORDER.indexOf(s) >= minIdx;
      }).length;
    };

    const applied = reached('applied');
    const phoneScreen = reached('phone_screen');
    const techInterview = reached('technical_interview');
    const finalRound = reached('final_round');
    const offer = reached('offer');

    return {
      applied,
      phoneScreen,
      techInterview,
      finalRound,
      offer,
      ratePS: applied > 0 ? phoneScreen / applied : 0,
      rateTech: phoneScreen > 0 ? techInterview / phoneScreen : 0,
      rateFinal: techInterview > 0 ? finalRound / techInterview : 0,
      rateOff: finalRound > 0 ? offer / finalRound : 0,
    };
  });

  // ── Applications by source ────────────────────────────────────────────────
  readonly bySource = computed<SourceCount[]>(() => {
    const map = new Map<string, number>();
    for (const a of this._apps()) {
      const key = a.source?.trim() || 'Unknown / Direct';
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
    return this._apps().filter((a) => a.appliedDate && new Date(a.appliedDate).getTime() >= cutoff)
      .length;
  });

  readonly thisMonth = computed(() => {
    const cutoff = Date.now() - 30 * 86_400_000;
    return this._apps().filter((a) => a.appliedDate && new Date(a.appliedDate).getTime() >= cutoff)
      .length;
  });

  /** Apps in active interview stages with no update in >14 days - may be ghosting */
  readonly awaitingResponse = computed(() =>
    this._apps().filter((a) => {
      if (!['applied', 'phone_screen', 'technical_interview', 'final_round'].includes(a.status))
        return false;
      if (!a.updatedAt) return false;
      return (Date.now() - new Date(a.updatedAt).getTime()) / 86_400_000 > 14;
    }),
  );

  /** Apps in applied with no update in >30 days - likely ghosted */
  readonly ghosted = computed(() =>
    this._apps().filter((a) => {
      if (a.status !== 'applied') return false;
      if (!a.updatedAt) return false;
      return (Date.now() - new Date(a.updatedAt).getTime()) / 86_400_000 > 30;
    }),
  );

  constructor(private appService: ApplicationService) {}

  ngOnInit(): void {
    this.appService.getAll().subscribe({
      next: (apps) => {
        this._apps.set(apps);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
