package com.mapaeleitoral.candidato.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO usado para retornar os dados de perfil do candidato logado.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CandidatoPerfilResponse {

    private UUID id;

    private UUID usuarioId;

    private String nomeCompleto;

    private String nomePublico;

    private String email;

    private String telefone;

    private String tituloEleitorUltimos4;

    private String fotoUrl;

    private String municipioBase;

    private String partido;

    private String numeroUrna;

    private String cargoPretendido;

    private String observacaoInterna;

    private Boolean ativo;

    private LocalDateTime criadoEm;
}