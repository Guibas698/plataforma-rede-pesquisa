package com.mapaeleitoral.publico.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

/**
 * DTO usado para retornar a resposta após o cadastro público
 * de um apoiador.
 *
 * Esse DTO será usado no endpoint:
 * POST /api/publico/apoiadores
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CadastroApoiadorPublicoResponse {

    private UUID id;

    private String nome;

    private String candidatoNome;

    private String municipio;

    private Integer zonaEleitoral;

    private Integer secaoEleitoral;

    private String status;

    private String mensagem;
}