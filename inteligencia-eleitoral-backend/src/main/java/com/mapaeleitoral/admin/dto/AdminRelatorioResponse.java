package com.mapaeleitoral.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

/**
 * DTO usado para retornar os relatórios gerais do Admin Master.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminRelatorioResponse {

    private Long totalApoiadores;

    private Long totalCandidatos;

    private Long municipiosAlcancados;

    private Long cadastrosHoje;

    private List<AdminRankingItemResponse> rankingCandidatos;

    private List<AdminRankingItemResponse> rankingMunicipios;

    private List<AdminRankingItemResponse> rankingZonas;

    private List<AdminRankingItemResponse> rankingSecoes;

    private List<AdminCrescimentoDiarioResponse> crescimentoDiario;
}