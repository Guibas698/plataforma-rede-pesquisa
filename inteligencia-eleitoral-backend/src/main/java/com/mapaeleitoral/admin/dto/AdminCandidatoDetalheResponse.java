package com.mapaeleitoral.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO usado para retornar os detalhes completos de um candidato no Admin Master.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminCandidatoDetalheResponse {

    private UUID id;

    private UUID usuarioId;

    private String nomeCompleto;

    private String nomePublico;

    private String email;

    private String telefone;

    private String municipioBase;

    private String tituloEleitorUltimos4;

    private String partido;

    private String numeroUrna;

    private String cargoPretendido;

    private String observacaoInterna;

    private Boolean ativo;

    private LocalDateTime criadoEm;

    private LocalDateTime atualizadoEm;

    private String linkCadastro;

    private Long totalApoiadores;

    private Long municipiosAlcancados;

    private Long zonasCadastradas;

    private Long secoesCadastradas;

    private Long cadastrosHoje;
}