package com.offerwatch.io.service;

import com.offerwatch.io.entity.Application;
import com.offerwatch.io.entity.ApplicationStatus;
import com.offerwatch.io.entity.User;
import com.offerwatch.io.repository.ApplicationRepository;
import com.offerwatch.io.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ApplicationService {

    /** Free-tier cap: max active (non-rejected) applications. */
    private static final long FREE_TIER_LIMIT = 10;

    private final ApplicationRepository applicationRepository;
    private final UserRepository userRepository;

    // ── READ ──────────────────────────────────────────────────────────────────

    /** Returns all applications for the given user, newest first. */
    public List<Application> getAllForUser(UUID userId) {
        return applicationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    /**
     * Returns a single application owned by the user.
     * Throws {@link EntityNotFoundException} if not found (also handles wrong owner).
     */
    public Application getByIdForUser(UUID applicationId, UUID userId) {
        return applicationRepository.findByIdAndUserId(applicationId, userId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Application not found: " + applicationId));
    }

    // ── CREATE ────────────────────────────────────────────────────────────────

    @Transactional
    public Application create(Application application, UUID userId) {
        User owner = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + userId));

        if (!owner.isPro()) enforceFreeTierCap(userId);

        application.setUser(owner);
        if (application.getStatus() == null) {
            application.setStatus(ApplicationStatus.saved);
        }
        return applicationRepository.save(application);
    }

    // ── UPDATE ────────────────────────────────────────────────────────────────

    @Transactional
    public Application update(UUID applicationId, Application patch, UUID userId) {
        Application existing = getByIdForUser(applicationId, userId);

        if (patch.getCompany() != null)     existing.setCompany(patch.getCompany());
        if (patch.getRoleTitle() != null)   existing.setRoleTitle(patch.getRoleTitle());
        if (patch.getStatus() != null)      existing.setStatus(patch.getStatus());
        if (patch.getLocation() != null)    existing.setLocation(patch.getLocation());
        if (patch.getJobUrl() != null)      existing.setJobUrl(patch.getJobUrl());
        if (patch.getSalaryMin() != null)   existing.setSalaryMin(patch.getSalaryMin());
        if (patch.getSalaryMax() != null)   existing.setSalaryMax(patch.getSalaryMax());
        if (patch.getAppliedDate() != null)           existing.setAppliedDate(patch.getAppliedDate());
        if (patch.getSource() != null)                existing.setSource(patch.getSource());
        if (patch.getApplicationQuestions() != null)  existing.setApplicationQuestions(patch.getApplicationQuestions());
        if (patch.getResumeVersion() != null)         existing.setResumeVersion(patch.getResumeVersion());
        if (patch.getCoverLetterNotes() != null)      existing.setCoverLetterNotes(patch.getCoverLetterNotes());

        return applicationRepository.save(existing);
    }

    // ── DELETE ────────────────────────────────────────────────────────────────

    @Transactional
    public void delete(UUID applicationId, UUID userId) {
        Application existing = getByIdForUser(applicationId, userId);
        applicationRepository.delete(existing);
    }

    // ── HELPERS ───────────────────────────────────────────────────────────────

    /**
     * Checks the free-tier cap (10 active applications).
     * "Active" = anything that is not `rejected`.
     *
     * TODO: once Stripe is integrated, look up the user's subscription tier
     *       and skip this check for Pro subscribers.
     */
    private void enforceFreeTierCap(UUID userId) {
        long active = applicationRepository.countByUserIdAndStatusNot(
                userId, ApplicationStatus.rejected);
        if (active >= FREE_TIER_LIMIT) {
            throw new FreeTierLimitException(
                    "Free tier allows up to " + FREE_TIER_LIMIT +
                    " active applications. Upgrade to Pro for unlimited tracking.");
        }
    }

    // ── INNER EXCEPTION ───────────────────────────────────────────────────────

    public static class FreeTierLimitException extends RuntimeException {
        public FreeTierLimitException(String message) {
            super(message);
        }
    }
}
