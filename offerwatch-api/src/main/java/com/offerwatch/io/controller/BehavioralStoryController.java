package com.offerwatch.io.controller;

import com.offerwatch.io.entity.BehavioralStory;
import com.offerwatch.io.entity.User;
import com.offerwatch.io.repository.BehavioralStoryRepository;
import com.offerwatch.io.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/behavioral-stories")
@RequiredArgsConstructor
public class BehavioralStoryController {

    private final BehavioralStoryRepository repo;
    private final UserRepository            userRepo;

    @GetMapping
    public List<BehavioralStory> list(Authentication auth) {
        return repo.findByUserIdOrderByThemeAsc(userId(auth));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public BehavioralStory create(@RequestBody StoryRequest req, Authentication auth) {
        User user = userRepo.findById(userId(auth))
                .orElseThrow(() -> new EntityNotFoundException("User not found"));
        return repo.save(BehavioralStory.builder()
                .user(user)
                .theme(req.theme())
                .title(req.title())
                .situation(req.situation())
                .task(req.task())
                .action(req.action())
                .result(req.result())
                .applicableQuestions(req.applicableQuestions())
                .build());
    }

    @PatchMapping("/{id}")
    public BehavioralStory update(@PathVariable UUID id,
                                  @RequestBody StoryRequest patch,
                                  Authentication auth) {
        BehavioralStory story = repo.findById(id)
                .filter(s -> s.getUser().getId().equals(userId(auth)))
                .orElseThrow(() -> new EntityNotFoundException("Story not found: " + id));
        if (patch.theme()                != null) story.setTheme(patch.theme());
        if (patch.title()                != null) story.setTitle(patch.title());
        if (patch.situation()            != null) story.setSituation(patch.situation());
        if (patch.task()                 != null) story.setTask(patch.task());
        if (patch.action()               != null) story.setAction(patch.action());
        if (patch.result()               != null) story.setResult(patch.result());
        if (patch.applicableQuestions()  != null) story.setApplicableQuestions(patch.applicableQuestions());
        return repo.save(story);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id, Authentication auth) {
        BehavioralStory story = repo.findById(id)
                .filter(s -> s.getUser().getId().equals(userId(auth)))
                .orElseThrow(() -> new EntityNotFoundException("Story not found: " + id));
        repo.delete(story);
    }

    private UUID userId(Authentication auth) { return UUID.fromString(auth.getName()); }

    record StoryRequest(String theme, String title, String situation, String task,
                        String action, String result, String applicableQuestions) {}
}
