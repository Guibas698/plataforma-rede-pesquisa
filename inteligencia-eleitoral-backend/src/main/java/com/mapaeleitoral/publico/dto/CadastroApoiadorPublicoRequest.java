package com.mapaeleitoral.publico.dto;

import jakarta.validation.constraints.AssertTrue;
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
 * DTO usado no cadastro público de usuário via convite.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CadastroApoiadorPublicoRequest {

    @NotBlank(message = "O código do convite é obrigatório.")
    private String codigoLink;

    @NotBlank(message = "O nome é obrigatório.")
    private String nome;

    @NotBlank(message = "O e-mail é obrigatório.")
    @Email(message = "Informe um e-mail válido.")
    private String email;

    @NotBlank(message = "O telefone é obrigatório.")
    private String telefone;

    @NotBlank(message = "O título de eleitor é obrigatório.")
    private String tituloEleitor;

    @NotBlank(message = "O município é obrigatório.")
    private String municipio;

    @NotBlank(message = "O bairro é obrigatório.")
    private String bairro;

    @NotNull(message = "O segmento é obrigatório.")
    @Positive(message = "O segmento deve ser positivo.")
    private Integer zonaEleitoral;

    @NotNull(message = "O subsegmento é obrigatório.")
    @Positive(message = "O subsegmento deve ser positivo.")
    private Integer secaoEleitoral;

    private String observacao;

    @NotNull(message = "O consentimento é obrigatório.")
    @AssertTrue(message = "O consentimento é obrigatório.")
    private Boolean consentimentoAceito;

    @NotBlank(message = "A senha é obrigatória.")
    @Size(min = 6, message = "A senha deve ter no mínimo 6 caracteres.")
    private String senha;

    @NotBlank(message = "A confirmação de senha é obrigatória.")
    private String confirmacaoSenha;
}