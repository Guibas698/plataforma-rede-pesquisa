package com.mapaeleitoral.consentimento.repository;

import com.mapaeleitoral.consentimento.entity.ConsentimentoApoiador;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ConsentimentoApoiadorRepository extends JpaRepository<ConsentimentoApoiador, UUID> {
}