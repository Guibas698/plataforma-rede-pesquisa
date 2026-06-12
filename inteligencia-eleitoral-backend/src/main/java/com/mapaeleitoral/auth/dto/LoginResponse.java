package com.mapaeleitoral.auth.dto;

import com.mapaeleitoral.usuario.enums.PapelUsuario;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

/**
 * DTO retornado após login bem-sucedido.
 *
 * O frontend usará o campo "papel" para redirecionar:
 * MASTER -> /admin
 * ADM -> /candidato
 * LIDER -> /candidato
 * USUARIO -> /apoiador
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginResponse {

    private String token;

    @Builder.Default
    private String tipoToken = "Bearer";

    private UUID usuarioId;

    private String nome;

    private String email;

    private PapelUsuario papel;
}