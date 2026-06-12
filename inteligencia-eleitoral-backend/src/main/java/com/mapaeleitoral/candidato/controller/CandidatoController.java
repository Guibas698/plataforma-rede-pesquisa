package com.mapaeleitoral.candidato.controller;

import com.mapaeleitoral.candidato.dto.CandidatoAlterarSenhaRequest;
import com.mapaeleitoral.candidato.dto.CandidatoApoiadorResumoResponse;
import com.mapaeleitoral.candidato.dto.CandidatoAtualizarApoiadorRequest;
import com.mapaeleitoral.candidato.dto.CandidatoAtualizarPerfilRequest;
import com.mapaeleitoral.candidato.dto.CandidatoCriarApoiadorRequest;
import com.mapaeleitoral.candidato.dto.CandidatoDashboardResponse;
import com.mapaeleitoral.candidato.dto.CandidatoLinkResponse;
import com.mapaeleitoral.candidato.dto.CandidatoMapaMunicipioResponse;
import com.mapaeleitoral.candidato.dto.CandidatoPerfilResponse;
import com.mapaeleitoral.candidato.service.CandidatoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.mapaeleitoral.candidato.dto.LiderPromovidoResponse;
import org.springframework.data.domain.Page;
import com.mapaeleitoral.candidato.dto.RedeResumoResponse;

import java.util.List;
import java.util.UUID;

/**
 * Controller responsável pelos endpoints REST do candidato logado.
 *
 * As rotas /api/candidato/** são protegidas pela SecurityConfig
 * e exigem usuário autenticado com ROLE_CANDIDATO.
 */
@RestController
@RequestMapping("/api/candidato")
@RequiredArgsConstructor
public class CandidatoController {

    private final CandidatoService candidatoService;

    /**
     * Retorna os indicadores principais do dashboard do candidato logado.
     *
     * Endpoint:
     * GET /api/candidato/dashboard
     */
    @GetMapping("/dashboard")
    public ResponseEntity<CandidatoDashboardResponse> obterDashboard() {
        CandidatoDashboardResponse response = candidatoService.obterDashboard();
        return ResponseEntity.ok(response);
    }

    /**
     * Retorna os dados agrupados por município para a tela de mapa.
     *
     * Endpoint:
     * GET /api/candidato/mapa
     */
    @GetMapping("/mapa")
    public ResponseEntity<List<CandidatoMapaMunicipioResponse>> obterMapa() {
        List<CandidatoMapaMunicipioResponse> response = candidatoService.obterMapa();
        return ResponseEntity.ok(response);
    }

    /**
     * Lista os apoiadores vinculados ao candidato logado.
     *
     * Endpoint:
     * GET /api/candidato/apoiadores
     */
    @GetMapping("/apoiadores")
    public ResponseEntity<Page<CandidatoApoiadorResumoResponse>> listarApoiadores(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Page<CandidatoApoiadorResumoResponse> response = candidatoService.listarApoiadores(page, size);
        return ResponseEntity.ok(response);
    }

    /**
     * Cria manualmente um apoiador vinculado ao candidato logado.
     *
     * Endpoint:
     * POST /api/candidato/apoiadores
     */
    @PostMapping("/apoiadores")
    public ResponseEntity<CandidatoApoiadorResumoResponse> criarApoiador(
            @Valid @RequestBody CandidatoCriarApoiadorRequest request
    ) {
        CandidatoApoiadorResumoResponse response = candidatoService.criarApoiador(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Atualiza um apoiador vinculado ao candidato logado.
     *
     * Endpoint:
     * PUT /api/candidato/apoiadores/{id}
     */
    @PutMapping("/apoiadores/{id}")
    public ResponseEntity<CandidatoApoiadorResumoResponse> atualizarApoiador(
            @PathVariable UUID id,
            @Valid @RequestBody CandidatoAtualizarApoiadorRequest request
    ) {
        CandidatoApoiadorResumoResponse response = candidatoService.atualizarApoiador(id, request);
        return ResponseEntity.ok(response);
    }

    /**
     * Remove logicamente um apoiador vinculado ao candidato logado.
     *
     * Endpoint:
     * DELETE /api/candidato/apoiadores/{id}
     */
    @DeleteMapping("/apoiadores/{id}")
    public ResponseEntity<Void> removerApoiador(
            @PathVariable UUID id
    ) {
        candidatoService.removerApoiador(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Retorna o link público de cadastro do candidato logado.
     *
     * Endpoint:
     * GET /api/candidato/link
     */
    @GetMapping("/link")
    public ResponseEntity<CandidatoLinkResponse> obterLink() {
        CandidatoLinkResponse response = candidatoService.obterLink();
        return ResponseEntity.ok(response);
    }

    /**
     * Retorna os dados de perfil do candidato logado.
     *
     * Endpoint:
     * GET /api/candidato/perfil
     */
    @GetMapping("/perfil")
    public ResponseEntity<CandidatoPerfilResponse> obterPerfil() {
        CandidatoPerfilResponse response = candidatoService.obterPerfil();
        return ResponseEntity.ok(response);
    }

    /**
     * Atualiza os dados de perfil do candidato logado.
     *
     * Endpoint:
     * PATCH /api/candidato/perfil
     */
    @PatchMapping("/perfil")
    public ResponseEntity<CandidatoPerfilResponse> atualizarPerfil(
            @Valid @RequestBody CandidatoAtualizarPerfilRequest request
    ) {
        CandidatoPerfilResponse response = candidatoService.atualizarPerfil(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Altera a senha do candidato logado.
     *
     * Endpoint:
     * PATCH /api/candidato/senha
     */
    @PatchMapping("/senha")
    public ResponseEntity<Void> alterarSenha(
            @Valid @RequestBody CandidatoAlterarSenhaRequest request
    ) {
        candidatoService.alterarSenha(request);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/usuarios/{usuarioId}/promover-lider")
    public ResponseEntity<LiderPromovidoResponse> promoverUsuarioParaLider(
            @PathVariable UUID usuarioId
    ) {
        LiderPromovidoResponse response = candidatoService.promoverUsuarioParaLider(usuarioId);
        return ResponseEntity.ok(response);
    }
    @GetMapping("/rede")
    public ResponseEntity<RedeResumoResponse> obterRede() {
        RedeResumoResponse response = candidatoService.obterRede();
        return ResponseEntity.ok(response);
    }

}