package com.mapaeleitoral.apoiador.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO usado para alteração de senha do apoiador logado.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApoiadorAlterarSenhaRequest {

    @NotBlank(message = "A senha atual é obrigatória.")
    private String senhaAtual;

    @NotBlank(message = "A nova senha é obrigatória.")
    @Size(min = 6, message = "A nova senha deve ter pelo menos 6 caracteres.")
    private String novaSenha;

    @NotBlank(message = "A confirmação da nova senha é obrigatória.")
    private String confirmacaoNovaSenha;
}