package com.mapaeleitoral.municipio.repository;

import com.mapaeleitoral.municipio.entity.Municipio;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MunicipioRepository extends JpaRepository<Municipio, UUID> {

    Optional<Municipio> findByCodigoIbge(String codigoIbge);

    List<Municipio> findByEstado(String estado);
}