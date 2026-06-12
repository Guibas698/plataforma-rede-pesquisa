package com.mapaeleitoral.admin.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO usado pelo Admin Master para criar um novo ADM.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminCriarCandidatoRequest {

    @NotBlank(message = "O nome completo é obrigatório.")
    private String nomeCompleto;

    @NotBlank(message = "O nome público é obrigatório.")
    private String nomePublico;

    @NotBlank(message = "O e-mail é obrigatório.")
    @Email(message = "Informe um e-mail válido.")
    private String email;

    @NotBlank(message = "O telefone é obrigatório.")
    private String telefone;

    @NotBlank(message = "O título de eleitor é obrigatório.")
    private String tituloEleitor;

    @NotBlank(message = "A cidade base é obrigatória.")
    private String municipioBase;

    private String partido;

    private String numeroUrna;

    @NotBlank(message = "A função/perfil é obrigatória.")
    private String cargoPretendido;

    private String observacaoInterna;

    @NotBlank(message = "A senha inicial é obrigatória.")
    @Size(min = 6, message = "A senha inicial deve ter pelo menos 6 caracteres.")
    private String senhaInicial;
}