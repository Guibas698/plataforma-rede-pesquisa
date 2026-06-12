package com.mapaeleitoral.candidato.repository;

import com.mapaeleitoral.candidato.entity.LinkCandidato;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface LinkCandidatoRepository extends JpaRepository<LinkCandidato, UUID> {

    Optional<LinkCandidato> findByCodigo(String codigo);

    List<LinkCandidato> findByCandidatoId(UUID candidatoId);

    boolean existsByCodigo(String codigo);

    Optional<LinkCandidato> findFirstByResponsavelIdAndAtivoTrue(UUID responsavelId);
}