package com.mapaeleitoral.apoiador.controller;

import com.mapaeleitoral.apoiador.dto.ApoiadorAlterarSenhaRequest;
import com.mapaeleitoral.apoiador.dto.ApoiadorAtualizarPerfilRequest;
import com.mapaeleitoral.apoiador.dto.ApoiadorMeResponse;
import com.mapaeleitoral.apoiador.service.ApoiadorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Controller responsável pelos endpoints REST do apoiador logado.
 *
 * As rotas /api/apoiador/** são protegidas pela SecurityConfig
 * e exigem usuário autenticado com ROLE_APOIADOR.
 */
@RestController
@RequestMapping("/api/apoiador")
@RequiredArgsConstructor
public class ApoiadorController {

    private final ApoiadorService apoiadorService;

    /**
     * Retorna os dados da home e do perfil do apoiador logado.
     *
     * Endpoint:
     * GET /api/apoiador/me
     */
    @GetMapping("/me")
    public ResponseEntity<ApoiadorMeResponse> obterMe() {
        ApoiadorMeResponse response = apoiadorService.obterMe();
        return ResponseEntity.ok(response);
    }

    /**
     * Atualiza os dados do perfil do apoiador logado.
     *
     * Endpoint:
     * PATCH /api/apoiador/me
     */
    @PatchMapping("/me")
    public ResponseEntity<ApoiadorMeResponse> atualizarPerfil(
            @Valid @RequestBody ApoiadorAtualizarPerfilRequest request
    ) {
        ApoiadorMeResponse response = apoiadorService.atualizarPerfil(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Altera a senha do apoiador logado.
     *
     * Endpoint:
     * PATCH /api/apoiador/senha
     */
    @PatchMapping("/senha")
    public ResponseEntity<Void> alterarSenha(
            @Valid @RequestBody ApoiadorAlterarSenhaRequest request
    ) {
        apoiadorService.alterarSenha(request);
        return ResponseEntity.noContent().build();
    }
}