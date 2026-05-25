package com.offerwatch.io.controller;

import com.offerwatch.io.entity.Application;
import com.offerwatch.io.entity.Followup;
import com.offerwatch.io.repository.FollowupRepository;
import com.offerwatch.io.service.ApplicationService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * CRUD for follow-ups scoped to one application.
 * Base path: /api/applications/{appId}/followups
 */
@RestController
@RequestMapping("/api/applications/{appId}/followups")
@RequiredArgsConstructor
public class FollowupController {

    private final FollowupRepository followupRepo;
    private final ApplicationService appService;

    @GetMapping
    public List<Followup> list(@PathVariable UUID appId, Authentication auth) {
        appService.getByIdForUser(appId, userId(auth));
        return followupRepo.findByApplicationIdOrderByDueDateAsc(appId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Followup create(@PathVariable UUID appId,
                           @RequestBody FollowupRequest req,
                           Authentication auth) {
        Application app = appService.getByIdForUser(appId, userId(auth));
        Followup fu = Followup.builder()
                .application(app)
                .reason(req.reason())
                .dueDate(req.dueDate())
                .completed(false)
                .build();
        return followupRepo.save(fu);
    }

    @PatchMapping("/{followupId}")
    public Followup update(@PathVariable UUID appId,
                           @PathVariable UUID followupId,
                           @RequestBody FollowupRequest patch,
                           Authentication auth) {
        appService.getByIdForUser(appId, userId(auth));
        Followup fu = followupRepo.findById(followupId)
                .filter(f -> f.getApplication().getId().equals(appId))
                .orElseThrow(() -> new EntityNotFoundException("Follow-up not found: " + followupId));

        if (patch.reason()    != null) fu.setReason(patch.reason());
        if (patch.dueDate()   != null) fu.setDueDate(patch.dueDate());
        if (patch.completed() != null) fu.setCompleted(patch.completed());

        return followupRepo.save(fu);
    }

    @DeleteMapping("/{followupId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID appId,
                       @PathVariable UUID followupId,
                       Authentication auth) {
        appService.getByIdForUser(appId, userId(auth));
        Followup fu = followupRepo.findById(followupId)
                .filter(f -> f.getApplication().getId().equals(appId))
                .orElseThrow(() -> new EntityNotFoundException("Follow-up not found: " + followupId));
        followupRepo.delete(fu);
    }

    private UUID userId(Authentication auth) { return UUID.fromString(auth.getName()); }

    record FollowupRequest(String reason, LocalDate dueDate, Boolean completed) {}
}
