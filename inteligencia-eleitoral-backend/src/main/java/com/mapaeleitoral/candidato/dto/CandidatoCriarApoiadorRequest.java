package com.mapaeleitoral.candidato.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO usado pelo candidato logado para cadastrar manualmente um apoiador.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CandidatoCriarApoiadorRequest {

    @NotBlank(message = "O nome é obrigatório.")
    private String nome;

    @Email(message = "Informe um e-mail válido.")
    private String email;

    @NotBlank(message = "A senha temporária é obrigatória.")
    @Size(min = 6, max = 100, message = "A senha temporária deve ter entre 6 e 100 caracteres.")
    private String senhaTemporaria;

    @NotBlank(message = "O telefone é obrigatório.")
    private String telefone;

    @NotBlank(message = "O município é obrigatório.")
    private String municipio;

    @NotBlank(message = "O bairro é obrigatório.")
    private String bairro;

    @NotBlank(message = "O título de eleitor é obrigatório.")
    private String tituloEleitor;

    @NotNull(message = "A zona eleitoral é obrigatória.")
    @Positive(message = "A zona eleitoral deve ser um número positivo.")
    private Integer zonaEleitoral;

    @NotNull(message = "A seção eleitoral é obrigatória.")
    @Positive(message = "A seção eleitoral deve ser um número positivo.")
    private Integer secaoEleitoral;

    private String observacao;
}