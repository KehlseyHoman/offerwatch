package com.offerwatch.io.repository;

import com.offerwatch.io.entity.Application;
import com.offerwatch.io.entity.ApplicationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ApplicationRepository extends JpaRepository<Application, UUID> {

    /** All applications belonging to a specific user, newest first. */
    List<Application> findByUserIdOrderByCreatedAtDesc(UUID userId);

    /** Filter by status for a specific user. */
    List<Application> findByUserIdAndStatus(UUID userId, ApplicationStatus status);

    /** Count active (non-rejected) applications for the free-tier cap check. */
    long countByUserIdAndStatusNot(UUID userId, ApplicationStatus status);

    /** Find one application, scoped to the owner (prevents cross-user access). */
    Optional<Application> findByIdAndUserId(UUID id, UUID userId);
}
