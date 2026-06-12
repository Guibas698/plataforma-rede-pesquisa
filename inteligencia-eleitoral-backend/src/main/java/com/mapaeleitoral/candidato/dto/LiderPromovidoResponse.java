package com.mapaeleitoral.candidato.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LiderPromovidoResponse {

    private UUID usuarioId;

    private String nome;

    private String email;

    private String telefone;

    private String papel;

    private UUID superiorId;

    private String superiorNome;

    private UUID admRaizId;

    private String admRaizNome;

    private String codigoLink;

    private String mensagem;
}