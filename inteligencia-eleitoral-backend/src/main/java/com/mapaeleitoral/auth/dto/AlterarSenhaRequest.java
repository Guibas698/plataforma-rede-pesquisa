package com.mapaeleitoral.auth.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AlterarSenhaRequest {

    private String senhaAtual;

    private String novaSenha;

    private String confirmacaoNovaSenha;
}