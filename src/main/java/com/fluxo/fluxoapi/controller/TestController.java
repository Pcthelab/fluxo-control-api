package com.fluxo.fluxoapi.controller;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class TestController {

    @GetMapping("/api/me")
    public String me(Authentication auth) {
        // auth.getName() vai ser o email que veio no token (subject)
        return auth != null ? auth.getName() : "sem auth";
    }
}