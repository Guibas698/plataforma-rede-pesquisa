package com.mapaeleitoral.candidato.repository;

import com.mapaeleitoral.candidato.entity.Candidato;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface CandidatoRepository extends JpaRepository<Candidato, UUID> {

    Optional<Candidato> findByUsuarioId(UUID usuarioId);

    boolean existsByNumeroUrna(String numeroUrna);
}