package com.offerwatch.io.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "applications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Application {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    /** Hidden from JSON to avoid circular reference and leaking user data. */
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @NotBlank
    @Column(nullable = false)
    private String company;

    @Column(name = "role_title")
    private String roleTitle;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    @Builder.Default
    private ApplicationStatus status = ApplicationStatus.saved;

    @Column
    private String location;

    @Column(name = "job_url")
    private String jobUrl;

    @Column(name = "salary_min")
    private Integer salaryMin;

    @Column(name = "salary_max")
    private Integer salaryMax;

    @Column(name = "applied_date")
    private LocalDate appliedDate;

    /** Where the user found this job (e.g. "LinkedIn", "Referral", "Company site"). */
    @Column
    private String source;

    /** Questions asked on the application form (paste them here for reference). */
    @Column(name = "application_questions", columnDefinition = "TEXT")
    private String applicationQuestions;

    /** Resume version used, e.g. "engineering-v3" or "generic-2026". */
    @Column(name = "resume_version")
    private String resumeVersion;

    /** Cover letter notes, e.g. "Custom — led with distributed systems exp." or "None". */
    @Column(name = "cover_letter_notes", columnDefinition = "TEXT")
    private String coverLetterNotes;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    // ── Related collections — excluded from list responses to avoid N+1
    // Fetch separately via /api/applications/{id}/notes etc. (future endpoints)

    @JsonIgnore
    @OneToMany(mappedBy = "application", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Note> notes = new ArrayList<>();

    @JsonIgnore
    @OneToMany(mappedBy = "application", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Contact> contacts = new ArrayList<>();

    @JsonIgnore
    @OneToMany(mappedBy = "application", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Followup> followups = new ArrayList<>();
}
