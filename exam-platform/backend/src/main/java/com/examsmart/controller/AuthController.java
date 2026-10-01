package com.examsmart.controller;

import com.examsmart.config.AuthenticatedUser;
import com.examsmart.dto.AuthResponse;
import com.examsmart.dto.LoginRequest;
import com.examsmart.dto.RegisterRequest;
import com.examsmart.dto.UserDTO;
import com.examsmart.model.User;
import com.examsmart.repository.UserRepository;
import com.examsmart.service.JwtService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthController(UserRepository userRepository,
                          PasswordEncoder passwordEncoder,
                          JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        String email = request.email().trim().toLowerCase();
        if (userRepository.findByEmail(email).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email is already registered");
        }

        String role = request.role();
        if (role == null || role.isBlank()) {
            role = "STUDENT";
        } else {
            role = role.trim().toUpperCase();
            if (!role.equals("STUDENT") && !role.equals("FACULTY") && !role.equals("ADMIN")) {
                role = "STUDENT";
            }
        }

        User user = new User();
        user.setName(request.name().trim());
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRole(role);
        User saved = userRepository.save(user);

        String token = jwtService.generateToken(saved.getId(), saved.getEmail(), saved.getRole());
        UserDTO userDTO = new UserDTO(saved.getId(), saved.getName(), saved.getEmail(), saved.getRole());

        return ResponseEntity.status(HttpStatus.CREATED).body(new AuthResponse(token, userDTO));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        String email = request.email().trim().toLowerCase();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password"));

        // Allow upgrading placeholder hashes if default password used
        boolean passwordMatches = passwordEncoder.matches(request.password(), user.getPasswordHash());
        if (!passwordMatches && "x".equals(user.getPasswordHash()) && "password123".equals(request.password())) {
            user.setPasswordHash(passwordEncoder.encode("password123"));
            userRepository.save(user);
            passwordMatches = true;
        }

        if (!passwordMatches) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }

        String token = jwtService.generateToken(user.getId(), user.getEmail(), user.getRole());
        UserDTO userDTO = new UserDTO(user.getId(), user.getName(), user.getEmail(), user.getRole());

        return ResponseEntity.ok(new AuthResponse(token, userDTO));
    }

    @GetMapping("/me")
    public ResponseEntity<UserDTO> getCurrentUser(@AuthenticationPrincipal AuthenticatedUser authUser) {
        if (authUser == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }
        User user = authUser.getUser();
        return ResponseEntity.ok(new UserDTO(user.getId(), user.getName(), user.getEmail(), user.getRole()));
    }
}
