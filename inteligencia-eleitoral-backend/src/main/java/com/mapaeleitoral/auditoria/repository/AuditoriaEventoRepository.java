package com.mapaeleitoral.auditoria.repository;

import com.mapaeleitoral.auditoria.entity.AuditoriaEvento;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface AuditoriaEventoRepository extends JpaRepository<AuditoriaEvento, UUID> {

    Page<AuditoriaEvento> findByUsuarioId(UUID usuarioId, Pageable pageable);
}