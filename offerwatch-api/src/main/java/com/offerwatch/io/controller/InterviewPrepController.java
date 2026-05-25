package com.offerwatch.io.controller;

import com.offerwatch.io.entity.InterviewPrep;
import com.offerwatch.io.entity.User;
import com.offerwatch.io.repository.InterviewPrepRepository;
import com.offerwatch.io.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/interview-prep")
@RequiredArgsConstructor
public class InterviewPrepController {

    private final InterviewPrepRepository repo;
    private final UserRepository          userRepo;

    @GetMapping
    public List<InterviewPrep> list(Authentication auth) {
        return repo.findByUserIdOrderByCategoryAscCreatedAtDesc(userId(auth));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public InterviewPrep create(@RequestBody PrepRequest req, Authentication auth) {
        User user = userRepo.findById(userId(auth))
                .orElseThrow(() -> new EntityNotFoundException("User not found"));
        return repo.save(InterviewPrep.builder()
                .user(user)
                .category(req.category() != null ? req.category() : "General")
                .question(req.question())
                .notes(req.notes())
                .build());
    }

    @PatchMapping("/{id}")
    public InterviewPrep update(@PathVariable UUID id,
                                @RequestBody PrepRequest patch,
                                Authentication auth) {
        InterviewPrep item = repo.findById(id)
                .filter(p -> p.getUser().getId().equals(userId(auth)))
                .orElseThrow(() -> new EntityNotFoundException("Item not found: " + id));
        if (patch.category() != null) item.setCategory(patch.category());
        if (patch.question()  != null) item.setQuestion(patch.question());
        if (patch.notes()     != null) item.setNotes(patch.notes());
        return repo.save(item);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id, Authentication auth) {
        InterviewPrep item = repo.findById(id)
                .filter(p -> p.getUser().getId().equals(userId(auth)))
                .orElseThrow(() -> new EntityNotFoundException("Item not found: " + id));
        repo.delete(item);
    }

    private UUID userId(Authentication auth) { return UUID.fromString(auth.getName()); }

    record PrepRequest(String category, String question, String notes) {}
}
