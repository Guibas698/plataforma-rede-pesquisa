package com.mapaeleitoral.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO usado para listar apoiadores no painel Admin Master.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminApoiadorResumoResponse {

    private UUID id;

    private String nome;

    private String email;

    private String telefone;

    private String candidatoNome;

    private String municipio;

    private String bairro;

    private Integer zonaEleitoral;

    private Integer secaoEleitoral;

    private String status;

    private LocalDateTime criadoEm;
}