package com.mapaeleitoral.apoiador.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO usado para retornar os dados da home e do perfil do usuário logado.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApoiadorMeResponse {

    private UUID id;

    private UUID usuarioId;

    private String nome;

    private String email;

    private String telefone;

    private String fotoUrl;

    private String municipio;

    private String bairro;

    private Integer zonaEleitoral;

    private Integer secaoEleitoral;

    private String observacao;

    private String status;

    private String origemCadastro;

    private Boolean consentimentoAceito;

    private LocalDateTime consentimentoData;

    private Boolean ativo;

    private LocalDateTime criadoEm;

    private UUID candidatoId;

    private String candidatoNomePublico;

    private String candidatoPartido;

    private String candidatoNumeroUrna;

    private String candidatoCargoPretendido;

    private String candidatoMunicipioBase;

    private UUID superiorId;

    private String superiorNome;

    private String superiorPapel;

    private UUID admRaizId;

    private String admRaizNome;

    private String tituloEleitorUltimos4;
}