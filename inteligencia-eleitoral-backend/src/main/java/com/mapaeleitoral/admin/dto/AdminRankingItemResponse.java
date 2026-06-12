package com.mapaeleitoral.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO simples usado em relatórios para representar itens agregados.
 *
 * Exemplos:
 * - candidato e total de apoiadores;
 * - município e total de apoiadores;
 * - zona eleitoral e total de apoiadores;
 * - seção eleitoral e total de apoiadores.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminRankingItemResponse {

    private String nome;

    private Long total;
}