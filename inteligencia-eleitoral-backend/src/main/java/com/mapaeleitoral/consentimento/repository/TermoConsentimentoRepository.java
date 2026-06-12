package com.mapaeleitoral.consentimento.repository;

import com.mapaeleitoral.consentimento.entity.TermoConsentimento;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface TermoConsentimentoRepository extends JpaRepository<TermoConsentimento, UUID> {

    Optional<TermoConsentimento> findFirstByAtivoTrueOrderByCriadoEmDesc();
}