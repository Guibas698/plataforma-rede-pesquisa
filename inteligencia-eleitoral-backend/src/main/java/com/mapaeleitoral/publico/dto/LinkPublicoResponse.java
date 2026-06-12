package com.mapaeleitoral.publico.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

/**
 * DTO usado para retornar os dados públicos de um link de candidato.
 *
 * Esse DTO será usado no endpoint:
 * GET /api/publico/links/{codigo}
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LinkPublicoResponse {

    private String codigo;

    private Boolean ativo;

    private UUID candidatoId;

    private String nomePublico;

    private String partido;

    private String numeroUrna;

    private String cargoPretendido;

    private String municipioBase;
}