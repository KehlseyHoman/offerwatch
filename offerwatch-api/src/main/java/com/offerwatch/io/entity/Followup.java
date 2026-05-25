package com.offerwatch.io.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.UUID;

/** Maps to the `followups` table. */
@Entity
@Table(name = "followups")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Followup {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "application_id", nullable = false)
    private Application application;

    @Column
    private String reason;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Column(nullable = false)
    @Builder.Default
    private boolean completed = false;
}
