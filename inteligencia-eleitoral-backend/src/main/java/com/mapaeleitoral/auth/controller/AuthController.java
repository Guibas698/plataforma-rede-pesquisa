package com.mapaeleitoral.auth.controller;

import com.mapaeleitoral.auth.dto.AlterarSenhaRequest;
import com.mapaeleitoral.auth.dto.LoginRequest;
import com.mapaeleitoral.auth.dto.LoginResponse;
import com.mapaeleitoral.auth.dto.UsuarioLogadoResponse;
import com.mapaeleitoral.auth.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Controller responsável pelos endpoints de autenticação do sistema.
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(
            @Valid @RequestBody LoginRequest request
    ) {
        LoginResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    public ResponseEntity<UsuarioLogadoResponse> obterUsuarioLogado() {
        UsuarioLogadoResponse response = authService.obterUsuarioLogado();
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/senha")
    public ResponseEntity<Void> alterarSenha(
            @RequestBody AlterarSenhaRequest request
    ) {
        authService.alterarSenha(request);
        return ResponseEntity.noContent().build();
    }
}