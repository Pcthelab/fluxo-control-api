package com.fluxo.fluxoapi.controller;

import com.fluxo.fluxoapi.dto.AuthResponse;
import com.fluxo.fluxoapi.dto.CadastroRequest;
import com.fluxo.fluxoapi.dto.LoginRequest;
import com.fluxo.fluxoapi.entity.Usuario;
import com.fluxo.fluxoapi.repository.UsuarioRepository;
import com.fluxo.fluxoapi.service.JwtService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final UsuarioRepository usuarioRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthController(UsuarioRepository usuarioRepository,
                          BCryptPasswordEncoder passwordEncoder,
                          JwtService jwtService) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @PostMapping("/cadastro")
    public ResponseEntity<?> cadastro(@RequestBody CadastroRequest req) {
        if (usuarioRepository.existsByEmail(req.email())) {
            return ResponseEntity.badRequest().body("Email já cadastrado");
        }

        Usuario u = Usuario.builder()
                .nome(req.nome())
                .email(req.email())
                .senha(passwordEncoder.encode(req.senha()))
                .build();

        usuarioRepository.save(u);
        return ResponseEntity.ok("Usuário criado");
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest req) {
        var userOpt = usuarioRepository.findByEmail(req.email());
        if (userOpt.isEmpty()) return ResponseEntity.status(401).body("Credenciais inválidas");

        Usuario u = userOpt.get();
        if (!passwordEncoder.matches(req.senha(), u.getSenha())) {
            return ResponseEntity.status(401).body("Credenciais inválidas");
        }

        String token = jwtService.generateToken(u.getEmail());
        return ResponseEntity.ok(new AuthResponse(token));
    }
}