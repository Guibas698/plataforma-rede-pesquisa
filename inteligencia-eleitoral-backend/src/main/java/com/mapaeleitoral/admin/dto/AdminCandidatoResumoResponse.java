package com.mapaeleitoral.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO usado para listar candidatos de forma resumida no painel Admin.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminCandidatoResumoResponse {

    private UUID id;

    private String nomePublico;

    private String nomeUsuario;

    private String email;

    private String telefone;

    private String municipioBase;

    private String tituloEleitorUltimos4;

    private String partido;

    private String numeroUrna;

    private String cargoPretendido;

    private Long totalApoiadores;

    private Boolean ativo;

    private LocalDateTime criadoEm;

    private String linkCadastro;
}