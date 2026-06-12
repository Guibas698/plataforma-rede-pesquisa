package com.mapaeleitoral.usuario.repository;

import com.mapaeleitoral.usuario.entity.Usuario;
import com.mapaeleitoral.usuario.enums.PapelUsuario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UsuarioRepository extends JpaRepository<Usuario, UUID> {

    Optional<Usuario> findByEmail(String email);

    boolean existsByEmail(String email);

    boolean existsByTituloEleitorHash(String tituloEleitorHash);

    Optional<Usuario> findByTituloEleitorHash(String tituloEleitorHash);

    List<Usuario> findBySuperiorId(UUID superiorId);

    List<Usuario> findByAdmRaizId(UUID admRaizId);

    List<Usuario> findByAdmRaizIdAndPapel(UUID admRaizId, PapelUsuario papel);

    long countBySuperiorId(UUID superiorId);
}