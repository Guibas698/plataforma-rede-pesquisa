package com.mapaeleitoral.candidato.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

/**
 * DTO usado para retornar os indicadores principais do dashboard do candidato.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CandidatoDashboardResponse {

    private Long totalApoiadores;

    private Long municipiosAlcancados;

    private Long zonasEleitorais;

    private Long secoesEleitorais;

    private Long cadastrosHoje;

    private Long cadastrosUltimosSeteDias;

    private Double crescimentoPercentual;

    private String linkCadastro;

    private List<CandidatoMunicipioResumoResponse> municipiosDestaque;
}