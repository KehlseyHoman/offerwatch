package com.offerwatch.io.repository;

import com.offerwatch.io.entity.BehavioralStory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface BehavioralStoryRepository extends JpaRepository<BehavioralStory, UUID> {
    List<BehavioralStory> findByUserIdOrderByThemeAsc(UUID userId);
}
