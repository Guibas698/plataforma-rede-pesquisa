package com.mapaeleitoral.admin.controller;

import com.mapaeleitoral.admin.dto.AdminAtualizarTermoConsentimentoRequest;
import com.mapaeleitoral.admin.dto.AdminTermoConsentimentoResponse;
import com.mapaeleitoral.admin.service.AdminTermoConsentimentoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/termo-consentimento")
@RequiredArgsConstructor
public class AdminTermoConsentimentoController {

    private final AdminTermoConsentimentoService adminTermoConsentimentoService;

    @GetMapping("/ativo")
    public ResponseEntity<AdminTermoConsentimentoResponse> buscarTermoAtivo() {
        return ResponseEntity.ok(adminTermoConsentimentoService.buscarTermoAtivo());
    }

    @PutMapping("/ativo")
    public ResponseEntity<AdminTermoConsentimentoResponse> atualizarTermoAtivo(
            @RequestBody AdminAtualizarTermoConsentimentoRequest request
    ) {
        return ResponseEntity.ok(
                adminTermoConsentimentoService.atualizarTermoAtivo(request)
        );
    }
}