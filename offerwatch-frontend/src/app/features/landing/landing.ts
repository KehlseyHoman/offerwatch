import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule],
  templateUrl: './landing.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './landing.scss',
})
export class LandingComponent implements OnInit {
  constructor(
    private auth: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    if (this.auth.isLoggedIn() && !this.auth.isTokenExpired()) {
      this.router.navigate(['/dashboard']);
    }
  }

  readonly features = [
    {
      icon: 'table_chart',
      title: 'Pipeline Dashboard',
      desc: 'Track every application from Saved to Offer. Inline status updates, staleness indicators, and sortable columns with no clicking around.',
      color: '#6366f1',
      bg: '#eef2ff',
    },
    {
      icon: 'analytics',
      title: 'Smart Analytics',
      desc: 'Pipeline funnel with conversion rates, sources breakdown, response-rate trends, and ghosting detection. All computed live.',
      color: '#0ea5e9',
      bg: '#e0f2fe',
    },
    {
      icon: 'psychology',
      title: 'Interview Prep',
      desc: '50+ curated questions structured like a senior recruiter would ask them. Save your answers and build a personal notes library.',
      color: '#10b981',
      bg: '#d1fae5',
    },
    {
      icon: 'auto_stories',
      title: 'STAR Stories',
      desc: 'Write behavioral stories once in Situation / Task / Action / Result format, tag them to question variations, and reuse them everywhere.',
      color: '#f59e0b',
      bg: '#fef3c7',
    },
    {
      icon: 'contact_page',
      title: 'Contacts & Follow-ups',
      desc: 'Log recruiters, hiring managers, and networking contacts per application. Set follow-up due dates and mark them complete.',
      color: '#ec4899',
      bg: '#fce7f3',
    },
    {
      icon: 'lock',
      title: 'Secure by Default',
      desc: 'JWT in httpOnly cookies, BCrypt passwords, all data scoped to your account. Your job search is private.',
      color: '#8b5cf6',
      bg: '#ede9fe',
    },
  ];

  readonly steps = [
    { number: '01', label: 'Create an account', sub: 'Free to start, no credit card needed.' },
    {
      number: '02',
      label: 'Add your first application',
      sub: 'Paste the job URL and role info in seconds.',
    },
    {
      number: '03',
      label: 'Track & prep',
      sub: 'Move statuses, log notes, and prep your answers.',
    },
    { number: '04', label: 'Land the offer', sub: 'Know exactly where each opportunity stands.' },
  ];
}
