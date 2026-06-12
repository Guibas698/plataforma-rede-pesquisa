package com.mapaeleitoral.admin.controller;

import com.mapaeleitoral.admin.dto.AdminApoiadorResumoResponse;
import com.mapaeleitoral.admin.dto.AdminAtualizarCandidatoRequest;
import com.mapaeleitoral.admin.dto.AdminCandidatoDetalheResponse;
import com.mapaeleitoral.admin.dto.AdminCandidatoResumoResponse;
import com.mapaeleitoral.admin.dto.AdminCriarCandidatoRequest;
import com.mapaeleitoral.admin.dto.AdminDashboardResponse;
import com.mapaeleitoral.admin.dto.AdminRelatorioResponse;
import com.mapaeleitoral.admin.service.AdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.data.domain.Page;

import java.util.UUID;

/**
 * Controller responsável pelos endpoints REST do Admin Master.
 *
 * As rotas /api/admin/** são protegidas pela SecurityConfig
 * e exigem usuário autenticado com ROLE_MASTER.
 */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    /**
     * Retorna os indicadores principais do painel Admin.
     *
     * Endpoint:
     * GET /api/admin/dashboard
     */
    @GetMapping("/dashboard")
    public ResponseEntity<AdminDashboardResponse> obterDashboard() {
        AdminDashboardResponse response = adminService.obterDashboard();
        return ResponseEntity.ok(response);
    }

    /**
     * Lista todos os candidatos cadastrados.
     *
     * Endpoint:
     * GET /api/admin/candidatos
     */
    @GetMapping("/candidatos")
    public ResponseEntity<Page<AdminCandidatoResumoResponse>> listarCandidatos(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Page<AdminCandidatoResumoResponse> response = adminService.listarCandidatos(page, size);
        return ResponseEntity.ok(response);
    }
    /**
     * Cria um novo candidato e seu usuário de acesso.
     *
     * Endpoint:
     * POST /api/admin/candidatos
     */
    @PostMapping("/candidatos")
    public ResponseEntity<AdminCandidatoDetalheResponse> criarCandidato(
            @Valid @RequestBody AdminCriarCandidatoRequest request
    ) {
        AdminCandidatoDetalheResponse response = adminService.criarCandidato(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Busca os detalhes completos de um candidato.
     *
     * Endpoint:
     * GET /api/admin/candidatos/{id}
     */
    @GetMapping("/candidatos/{id}")
    public ResponseEntity<AdminCandidatoDetalheResponse> buscarDetalhesCandidato(
            @PathVariable UUID id
    ) {
        AdminCandidatoDetalheResponse response = adminService.buscarDetalhesCandidato(id);
        return ResponseEntity.ok(response);
    }

    /**
     * Atualiza os dados de um candidato.
     *
     * Endpoint:
     * PUT /api/admin/candidatos/{id}
     */
    @PutMapping("/candidatos/{id}")
    public ResponseEntity<AdminCandidatoDetalheResponse> atualizarCandidato(
            @PathVariable UUID id,
            @Valid @RequestBody AdminAtualizarCandidatoRequest request
    ) {
        AdminCandidatoDetalheResponse response = adminService.atualizarCandidato(id, request);
        return ResponseEntity.ok(response);
    }

    /**
     * Ativa ou desativa um candidato.
     *
     * Endpoint:
     * PATCH /api/admin/candidatos/{id}/status
     */
    @PatchMapping("/candidatos/{id}/status")
    public ResponseEntity<AdminCandidatoDetalheResponse> alterarStatusCandidato(
            @PathVariable UUID id
    ) {
        AdminCandidatoDetalheResponse response = adminService.alterarStatusCandidato(id);
        return ResponseEntity.ok(response);
    }

    /**
     * Lista todos os apoiadores cadastrados no sistema.
     *
     * Endpoint:
     * GET /api/admin/apoiadores
     */
    @GetMapping("/apoiadores")
    public ResponseEntity<Page<AdminApoiadorResumoResponse>> listarApoiadores(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Page<AdminApoiadorResumoResponse> response = adminService.listarApoiadores(page, size);
        return ResponseEntity.ok(response);
    }

    /**
     * Retorna relatórios gerais do sistema.
     *
     * Endpoint:
     * GET /api/admin/relatorios
     */
    @GetMapping("/relatorios")
    public ResponseEntity<AdminRelatorioResponse> obterRelatorio() {
        AdminRelatorioResponse response = adminService.obterRelatorio();
        return ResponseEntity.ok(response);
    }
}