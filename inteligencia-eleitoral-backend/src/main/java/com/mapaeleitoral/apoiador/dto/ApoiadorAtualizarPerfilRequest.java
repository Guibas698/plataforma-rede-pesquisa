package com.mapaeleitoral.apoiador.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO usado para atualização do perfil do apoiador logado.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApoiadorAtualizarPerfilRequest {

    @NotBlank(message = "O nome é obrigatório.")
    private String nome;

    @Email(message = "Informe um e-mail válido.")
    private String email;

    @NotBlank(message = "O telefone é obrigatório.")
    private String telefone;

    @NotBlank(message = "O município é obrigatório.")
    private String municipio;

    @NotBlank(message = "O bairro é obrigatório.")
    private String bairro;

    @NotNull(message = "A zona eleitoral é obrigatória.")
    @Positive(message = "A zona eleitoral deve ser um número positivo.")
    private Integer zonaEleitoral;

    @NotNull(message = "A seção eleitoral é obrigatória.")
    @Positive(message = "A seção eleitoral deve ser um número positivo.")
    private Integer secaoEleitoral;

    private String observacao;
}