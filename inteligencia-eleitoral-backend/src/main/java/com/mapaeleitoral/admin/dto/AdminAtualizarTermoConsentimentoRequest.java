package com.mapaeleitoral.admin.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AdminAtualizarTermoConsentimentoRequest {

    private String titulo;

    private String versao;

    private String texto;
}