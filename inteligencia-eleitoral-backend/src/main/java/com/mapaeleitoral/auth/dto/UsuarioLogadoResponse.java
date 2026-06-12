package com.mapaeleitoral.auth.dto;

import com.mapaeleitoral.usuario.enums.PapelUsuario;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

/**
 * DTO usado para retornar os dados básicos do usuário autenticado.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UsuarioLogadoResponse {

    private UUID id;

    private String nome;

    private String email;

    private String telefone;

    private PapelUsuario papel;

    private String fotoUrl;

    private Boolean ativo;

    private UUID superiorId;

    private String superiorNome;

    private UUID admRaizId;

    private String admRaizNome;

    private String tituloEleitorUltimos4;
}