package com.offerwatch.io.controller;

import com.offerwatch.io.entity.Application;
import com.offerwatch.io.entity.Note;
import com.offerwatch.io.repository.NoteRepository;
import com.offerwatch.io.service.ApplicationService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * CRUD for notes scoped to one application.
 * Base path: /api/applications/{appId}/notes
 *
 * Ownership is verified by delegating to ApplicationService, which checks
 * that the application belongs to the authenticated user.
 */
@RestController
@RequestMapping("/api/applications/{appId}/notes")
@RequiredArgsConstructor
public class NoteController {

    private final NoteRepository     noteRepo;
    private final ApplicationService appService;

    @GetMapping
    public List<Note> list(@PathVariable UUID appId, Authentication auth) {
        appService.getByIdForUser(appId, userId(auth)); // ownership check
        return noteRepo.findByApplicationIdOrderByCreatedAtDesc(appId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Note create(@PathVariable UUID appId,
                       @RequestBody NoteRequest req,
                       Authentication auth) {
        Application app = appService.getByIdForUser(appId, userId(auth));
        Note note = Note.builder()
                .application(app)
                .body(req.body())
                .build();
        return noteRepo.save(note);
    }

    @DeleteMapping("/{noteId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID appId,
                       @PathVariable UUID noteId,
                       Authentication auth) {
        appService.getByIdForUser(appId, userId(auth)); // ownership check
        Note note = noteRepo.findById(noteId)
                .filter(n -> n.getApplication().getId().equals(appId))
                .orElseThrow(() -> new EntityNotFoundException("Note not found: " + noteId));
        noteRepo.delete(note);
    }

    private UUID userId(Authentication auth) { return UUID.fromString(auth.getName()); }

    record NoteRequest(String body) {}
}
