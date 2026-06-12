package com.mapaeleitoral.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO usado para retornar os indicadores principais do dashboard do Admin Master.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminDashboardResponse {

    private Long totalCandidatos;

    private Long candidatosAtivos;

    private Long totalApoiadores;

    private String tituloEleitorUltimos4;

    private Long municipiosAlcancados;

    private Long cadastrosHoje;
}