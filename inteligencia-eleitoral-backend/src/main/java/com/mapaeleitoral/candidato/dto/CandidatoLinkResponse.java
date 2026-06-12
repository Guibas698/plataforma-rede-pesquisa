package com.mapaeleitoral.candidato.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO usado para retornar o link público de cadastro do candidato.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CandidatoLinkResponse {

    private String codigo;

    private String urlCompleta;

    private Boolean ativo;

    private Long totalApoiadores;

    private Long cadastrosHoje;

    private Long municipiosAlcancados;

    private Long cadastrosUltimosSeteDias;
}