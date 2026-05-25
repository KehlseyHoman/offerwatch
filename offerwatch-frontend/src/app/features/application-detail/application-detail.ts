import { Component, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, Router }               from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatePipe, UpperCasePipe }              from '@angular/common';
import { forkJoin }                             from 'rxjs';

import { MatButtonModule }          from '@angular/material/button';
import { MatIconModule }            from '@angular/material/icon';
import { MatMenuModule }            from '@angular/material/menu';
import { MatChipsModule }           from '@angular/material/chips';
import { MatFormFieldModule }       from '@angular/material/form-field';
import { MatInputModule }           from '@angular/material/input';
import { MatSelectModule }          from '@angular/material/select';
import { MatDatepickerModule }      from '@angular/material/datepicker';
import { MatCheckboxModule }        from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule }         from '@angular/material/tooltip';
import { MatDividerModule }         from '@angular/material/divider';
import { MatSnackBar }              from '@angular/material/snack-bar';

import { Application, APPLICATION_STATUSES, STATUS_LABELS } from '../../core/models/application.model';
import { Note }     from '../../core/models/note.model';
import { Contact }  from '../../core/models/contact.model';
import { Followup } from '../../core/models/followup.model';

import { ApplicationService } from '../../core/services/application.service';
import { NoteService }        from '../../core/services/note.service';
import { ContactService }     from '../../core/services/contact.service';
import { FollowupService }    from '../../core/services/followup.service';

@Component({
  selector: 'app-application-detail',
  standalone: true,
  imports: [
    ReactiveFormsModule, DatePipe, UpperCasePipe,
    MatButtonModule, MatIconModule, MatMenuModule,
    MatChipsModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatDatepickerModule, MatCheckboxModule, MatProgressSpinnerModule,
    MatTooltipModule, MatDividerModule,
  ],
  templateUrl: './application-detail.html',
  styleUrl:    './application-detail.scss',
})
export class ApplicationDetailComponent implements OnInit {

  appId = '';

  // ── Data ──────────────────────────────────────────────────────────────────
  app      = signal<Application | null>(null);
  notes    = signal<Note[]>([]);
  contacts = signal<Contact[]>([]);
  followups = signal<Followup[]>([]);

  loading = signal(true);

  // ── Derived ───────────────────────────────────────────────────────────────
  readonly statuses     = APPLICATION_STATUSES;
  readonly statusLabels = STATUS_LABELS;

  readonly pendingFollowups  = computed(() => this.followups().filter(f => !f.completed));
  readonly doneFollowups     = computed(() => this.followups().filter(f =>  f.completed));

  readonly primaryContact = computed(() =>
    this.contacts().find(c => c.title?.toLowerCase().includes('recruit')) ?? this.contacts()[0] ?? null,
  );

  // ── Forms ─────────────────────────────────────────────────────────────────
  noteForm:    FormGroup;
  docsForm:    FormGroup;
  contactForm: FormGroup;
  followupForm: FormGroup;

  addingContact  = signal(false);
  addingFollowup = signal(false);
  savingNote     = signal(false);
  savingDocs     = signal(false);

  constructor(
    private route:   ActivatedRoute,
    private router:  Router,
    private fb:      FormBuilder,
    private appSvc:  ApplicationService,
    private noteSvc: NoteService,
    private ctcSvc:  ContactService,
    private fuSvc:   FollowupService,
    private snack:   MatSnackBar,
  ) {
    this.noteForm = fb.group({ body: ['', Validators.required] });

    this.docsForm = fb.group({
      applicationQuestions: [''],
      resumeVersion:        [''],
      coverLetterNotes:     [''],
    });

    this.contactForm = fb.group({
      name:        ['', Validators.required],
      title:       [''],
      email:       [''],
      phone:       [''],
      linkedinUrl: [''],
    });

    this.followupForm = fb.group({
      reason:  [''],
      dueDate: [null],
    });
  }

  ngOnInit(): void {
    this.appId = this.route.snapshot.paramMap.get('id')!;
    this.loadAll();
  }

  loadAll(): void {
    this.loading.set(true);
    forkJoin({
      app:      this.appSvc.getById(this.appId),
      notes:    this.noteSvc.getAll(this.appId),
      contacts: this.ctcSvc.getAll(this.appId),
      followups: this.fuSvc.getAll(this.appId),
    }).subscribe({
      next: ({ app, notes, contacts, followups }) => {
        this.app.set(app);
        this.notes.set(notes);
        this.contacts.set(contacts);
        this.followups.set(followups);
        this.docsForm.patchValue({
          applicationQuestions: app.applicationQuestions ?? '',
          resumeVersion:        app.resumeVersion        ?? '',
          coverLetterNotes:     app.coverLetterNotes     ?? '',
        });
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.router.navigate(['/dashboard']);
      },
    });
  }

  // ── Status inline change ──────────────────────────────────────────────────
  onStatusChange(newStatus: string): void {
    const current = this.app();
    if (!current || current.status === newStatus) return;
    this.app.update(a => a ? { ...a, status: newStatus as Application['status'] } : a);
    this.appSvc.update(this.appId, { status: newStatus as Application['status'] }).subscribe({
      next: updated => this.app.set(updated),
      error: () => {
        this.app.set(current);
        this.snack.open('Failed to update status.', '', { duration: 3000 });
      },
    });
  }

  // ── Docs (questions / resume / cover letter) ─────────────────────────────
  saveDocs(): void {
    this.savingDocs.set(true);
    const v = this.docsForm.value;
    this.appSvc.update(this.appId, {
      applicationQuestions: v.applicationQuestions || undefined,
      resumeVersion:        v.resumeVersion        || undefined,
      coverLetterNotes:     v.coverLetterNotes      || undefined,
    }).subscribe({
      next: updated => {
        this.app.set(updated);
        this.savingDocs.set(false);
        this.snack.open('Saved.', '', { duration: 2000 });
      },
      error: () => { this.savingDocs.set(false); this.snack.open('Failed to save.', '', { duration: 3000 }); },
    });
  }

  // ── Notes ─────────────────────────────────────────────────────────────────
  addNote(): void {
    if (this.noteForm.invalid) return;
    this.savingNote.set(true);
    this.noteSvc.create(this.appId, this.noteForm.value.body).subscribe({
      next: note => {
        this.notes.update(list => [note, ...list]);
        this.noteForm.reset();
        this.savingNote.set(false);
      },
      error: () => { this.savingNote.set(false); this.snack.open('Failed to save note.', '', { duration: 3000 }); },
    });
  }

  deleteNote(note: Note): void {
    this.noteSvc.delete(this.appId, note.id).subscribe({
      next: () => this.notes.update(list => list.filter(n => n.id !== note.id)),
      error: ()  => this.snack.open('Failed to delete note.', '', { duration: 3000 }),
    });
  }

  // ── Contacts ──────────────────────────────────────────────────────────────
  submitContact(): void {
    if (this.contactForm.invalid) return;
    const raw = this.contactForm.value;
    const payload = Object.fromEntries(Object.entries(raw).filter(([, v]) => v !== '' && v != null));
    this.ctcSvc.create(this.appId, payload).subscribe({
      next: c => {
        this.contacts.update(list => [...list, c]);
        this.contactForm.reset();
        this.addingContact.set(false);
      },
      error: () => this.snack.open('Failed to add contact.', '', { duration: 3000 }),
    });
  }

  deleteContact(c: Contact): void {
    this.ctcSvc.delete(this.appId, c.id).subscribe({
      next: () => this.contacts.update(list => list.filter(x => x.id !== c.id)),
      error: ()  => this.snack.open('Failed to delete contact.', '', { duration: 3000 }),
    });
  }

  // ── Follow-ups ────────────────────────────────────────────────────────────
  submitFollowup(): void {
    const raw = this.followupForm.value;
    const payload: { reason?: string; dueDate?: string } = {};
    if (raw.reason) payload.reason = raw.reason;
    if (raw.dueDate instanceof Date) {
      const d = raw.dueDate as Date;
      payload.dueDate = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    }
    this.fuSvc.create(this.appId, payload).subscribe({
      next: fu => {
        this.followups.update(list => [...list, fu]);
        this.followupForm.reset();
        this.addingFollowup.set(false);
      },
      error: () => this.snack.open('Failed to add follow-up.', '', { duration: 3000 }),
    });
  }

  toggleFollowup(fu: Followup): void {
    const next = !fu.completed;
    this.followups.update(list => list.map(f => f.id === fu.id ? { ...f, completed: next } : f));
    this.fuSvc.toggle(this.appId, fu.id, next).subscribe({
      next: updated => this.followups.update(list => list.map(f => f.id === updated.id ? updated : f)),
      error: () => {
        this.followups.update(list => list.map(f => f.id === fu.id ? { ...f, completed: fu.completed } : f));
        this.snack.open('Failed to update follow-up.', '', { duration: 3000 });
      },
    });
  }

  deleteFollowup(fu: Followup): void {
    this.fuSvc.delete(this.appId, fu.id).subscribe({
      next: () => this.followups.update(list => list.filter(f => f.id !== fu.id)),
      error: ()  => this.snack.open('Failed to delete follow-up.', '', { duration: 3000 }),
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  label(status: string): string {
    return this.statusLabels[status as Application['status']] ?? status;
  }

  goBack(): void { this.router.navigate(['/dashboard']); }
}
