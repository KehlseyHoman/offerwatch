package com.offerwatch.io.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "behavioral_stories")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class BehavioralStory {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /** e.g. "Leadership", "Conflict", "Failure", "Teamwork" */
    @Column(nullable = false)
    private String theme;

    /** Short title for the story — your own label */
    @Column
    private String title;

    @Column(columnDefinition = "TEXT")
    private String situation;

    @Column(columnDefinition = "TEXT")
    private String task;

    @Column(columnDefinition = "TEXT")
    private String action;

    @Column(columnDefinition = "TEXT")
    private String result;

    /** What question variants this story can answer */
    @Column(name = "applicable_questions", columnDefinition = "TEXT")
    private String applicableQuestions;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;
}
