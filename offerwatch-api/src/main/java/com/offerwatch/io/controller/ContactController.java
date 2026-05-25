package com.offerwatch.io.controller;

import com.offerwatch.io.entity.Application;
import com.offerwatch.io.entity.Contact;
import com.offerwatch.io.repository.ContactRepository;
import com.offerwatch.io.service.ApplicationService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * CRUD for contacts scoped to one application.
 * Base path: /api/applications/{appId}/contacts
 */
@RestController
@RequestMapping("/api/applications/{appId}/contacts")
@RequiredArgsConstructor
public class ContactController {

    private final ContactRepository  contactRepo;
    private final ApplicationService appService;

    @GetMapping
    public List<Contact> list(@PathVariable UUID appId, Authentication auth) {
        appService.getByIdForUser(appId, userId(auth));
        return contactRepo.findByApplicationId(appId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Contact create(@PathVariable UUID appId,
                          @RequestBody ContactRequest req,
                          Authentication auth) {
        Application app = appService.getByIdForUser(appId, userId(auth));
        Contact contact = Contact.builder()
                .application(app)
                .name(req.name())
                .title(req.title())
                .email(req.email())
                .phone(req.phone())
                .linkedinUrl(req.linkedinUrl())
                .build();
        return contactRepo.save(contact);
    }

    @PatchMapping("/{contactId}")
    public Contact update(@PathVariable UUID appId,
                          @PathVariable UUID contactId,
                          @RequestBody ContactRequest patch,
                          Authentication auth) {
        appService.getByIdForUser(appId, userId(auth));
        Contact c = contactRepo.findById(contactId)
                .filter(x -> x.getApplication().getId().equals(appId))
                .orElseThrow(() -> new EntityNotFoundException("Contact not found: " + contactId));

        if (patch.name()        != null) c.setName(patch.name());
        if (patch.title()       != null) c.setTitle(patch.title());
        if (patch.email()       != null) c.setEmail(patch.email());
        if (patch.phone()       != null) c.setPhone(patch.phone());
        if (patch.linkedinUrl() != null) c.setLinkedinUrl(patch.linkedinUrl());

        return contactRepo.save(c);
    }

    @DeleteMapping("/{contactId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID appId,
                       @PathVariable UUID contactId,
                       Authentication auth) {
        appService.getByIdForUser(appId, userId(auth));
        Contact c = contactRepo.findById(contactId)
                .filter(x -> x.getApplication().getId().equals(appId))
                .orElseThrow(() -> new EntityNotFoundException("Contact not found: " + contactId));
        contactRepo.delete(c);
    }

    private UUID userId(Authentication auth) { return UUID.fromString(auth.getName()); }

    record ContactRequest(String name, String title, String email, String phone, String linkedinUrl) {}
}
