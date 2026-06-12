package com.mapaeleitoral.admin.service;

import com.mapaeleitoral.admin.dto.AdminAtualizarTermoConsentimentoRequest;
import com.mapaeleitoral.admin.dto.AdminTermoConsentimentoResponse;
import com.mapaeleitoral.consentimento.entity.TermoConsentimento;
import com.mapaeleitoral.consentimento.repository.TermoConsentimentoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AdminTermoConsentimentoService {

    private final TermoConsentimentoRepository termoConsentimentoRepository;

    @Transactional(readOnly = true)
    public AdminTermoConsentimentoResponse buscarTermoAtivo() {
        TermoConsentimento termo = termoConsentimentoRepository
                .findFirstByAtivoTrueOrderByCriadoEmDesc()
                .orElseThrow(() -> new RuntimeException("Nenhum termo de consentimento ativo encontrado."));

        return montarResponse(termo);
    }

    @Transactional
    public AdminTermoConsentimentoResponse atualizarTermoAtivo(
            AdminAtualizarTermoConsentimentoRequest request
    ) {
        validarRequest(request);

        TermoConsentimento termo = termoConsentimentoRepository
                .findFirstByAtivoTrueOrderByCriadoEmDesc()
                .orElseThrow(() -> new RuntimeException("Nenhum termo de consentimento ativo encontrado."));

        termo.setTitulo(request.getTitulo().trim());
        termo.setVersao(request.getVersao().trim());
        termo.setTexto(request.getTexto().trim());
        termo.setAtivo(true);
        termo.setAtualizadoEm(LocalDateTime.now());

        TermoConsentimento termoSalvo = termoConsentimentoRepository.save(termo);

        return montarResponse(termoSalvo);
    }

    private void validarRequest(AdminAtualizarTermoConsentimentoRequest request) {
        if (request == null) {
            throw new RuntimeException("Dados do termo são obrigatórios.");
        }

        if (request.getTitulo() == null || request.getTitulo().isBlank()) {
            throw new RuntimeException("Título do termo é obrigatório.");
        }

        if (request.getVersao() == null || request.getVersao().isBlank()) {
            throw new RuntimeException("Versão do termo é obrigatória.");
        }

        if (request.getTexto() == null || request.getTexto().isBlank()) {
            throw new RuntimeException("Texto do termo é obrigatório.");
        }
    }

    private AdminTermoConsentimentoResponse montarResponse(TermoConsentimento termo) {
        return AdminTermoConsentimentoResponse.builder()
                .id(termo.getId())
                .titulo(termo.getTitulo())
                .versao(termo.getVersao())
                .texto(termo.getTexto())
                .ativo(termo.getAtivo())
                .criadoEm(termo.getCriadoEm())
                .atualizadoEm(termo.getAtualizadoEm())
                .build();
    }
}