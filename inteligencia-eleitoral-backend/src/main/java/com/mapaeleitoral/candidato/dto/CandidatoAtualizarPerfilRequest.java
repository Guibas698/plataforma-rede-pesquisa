package com.mapaeleitoral.candidato.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO usado para atualizar os dados de perfil do candidato logado.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CandidatoAtualizarPerfilRequest {

    @NotBlank(message = "O nome completo é obrigatório.")
    private String nomeCompleto;

    @NotBlank(message = "O nome público é obrigatório.")
    private String nomePublico;

    @NotBlank(message = "O telefone é obrigatório.")
    private String telefone;

    @NotBlank(message = "O município base é obrigatório.")
    private String municipioBase;

    private String partido;

    private String numeroUrna;

    @NotBlank(message = "O cargo pretendido é obrigatório.")
    private String cargoPretendido;

    private String observacaoInterna;
}