package com.offerwatch.io.repository;

import com.offerwatch.io.entity.InterviewPrep;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface InterviewPrepRepository extends JpaRepository<InterviewPrep, UUID> {
    List<InterviewPrep> findByUserIdOrderByCategoryAscCreatedAtDesc(UUID userId);
}
