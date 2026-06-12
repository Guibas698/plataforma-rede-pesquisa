package com.mapaeleitoral.candidato.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO usado na tela de mapa do candidato para agrupar apoiadores por município.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CandidatoMapaMunicipioResponse {

    private String municipio;

    private Long totalApoiadores;

    private Long zonasEleitorais;

    private Long secoesEleitorais;
}