package com.offerwatch.io.repository;

import com.offerwatch.io.entity.Followup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface FollowupRepository extends JpaRepository<Followup, UUID> {

    List<Followup> findByApplicationIdOrderByDueDateAsc(UUID applicationId);

    /** Pending follow-ups across all applications for a user. */
    List<Followup> findByApplicationUserIdAndCompletedFalseOrderByDueDateAsc(UUID userId);
}
