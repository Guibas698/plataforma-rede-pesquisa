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
public class RedeUsuarioNodeResponse {

    private UUID id;

    private String nome;

    private String email;

    private String telefone;

    private String papel;

    private String tituloEleitorUltimos4;

    private UUID superiorId;

    private String superiorNome;

    private UUID admRaizId;

    private String admRaizNome;

    private Long totalFilhos;

    private List<RedeUsuarioNodeResponse> filhos;
}