package com.mapaeleitoral.apoiador.repository;

import com.mapaeleitoral.apoiador.entity.Apoiador;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ApoiadorRepository extends JpaRepository<Apoiador, UUID> {

    Page<Apoiador> findByCandidatoId(UUID candidatoId, Pageable pageable);

    Page<Apoiador> findByCandidatoIdAndAtivoTrue(UUID candidatoId, Pageable pageable);

    Optional<Apoiador> findByUsuarioId(UUID usuarioId);

    long countByCandidatoId(UUID candidatoId);
}