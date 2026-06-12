package com.mapaeleitoral.candidato.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RedeResumoResponse {

    private UUID usuarioLogadoId;

    private String usuarioLogadoNome;

    private String papelLogado;

    private Long totalUsuarios;

    private Long totalLideres;

    private Long totalDiretos;

    private List<RedeUsuarioNodeResponse> arvore;
}