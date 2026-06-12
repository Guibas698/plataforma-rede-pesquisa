package com.mapaeleitoral.candidato.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO usado para listar usuários vinculados à rede do ADM/Líder logado.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CandidatoApoiadorResumoResponse {

    private UUID id;

    private UUID usuarioId;

    private String nome;

    private String email;

    private String telefone;

    private String municipio;

    private String bairro;

    private Integer zonaEleitoral;

    private Integer secaoEleitoral;

    private String status;

    private String papelUsuario;

    private String superiorNome;

    private String admRaizNome;

    private LocalDateTime criadoEm;
}