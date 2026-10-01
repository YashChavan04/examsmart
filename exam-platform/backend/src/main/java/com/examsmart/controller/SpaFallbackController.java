package com.examsmart.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SpaFallbackController {

    @GetMapping({
        "/login",
        "/register",
        "/student",
        "/student/**",
        "/faculty",
        "/faculty/**"
    })
    public String forwardToIndex() {
        return "forward:/index.html";
    }
}
