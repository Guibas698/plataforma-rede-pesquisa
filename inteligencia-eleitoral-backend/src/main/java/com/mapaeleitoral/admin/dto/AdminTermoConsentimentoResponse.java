package com.mapaeleitoral.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminTermoConsentimentoResponse {

    private UUID id;

    private String titulo;

    private String versao;

    private String texto;

    private Boolean ativo;

    private LocalDateTime criadoEm;

    private LocalDateTime atualizadoEm;
}