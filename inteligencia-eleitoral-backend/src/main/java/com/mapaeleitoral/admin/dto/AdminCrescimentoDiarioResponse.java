package com.mapaeleitoral.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

/**
 * DTO usado para representar a quantidade de cadastros por dia.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminCrescimentoDiarioResponse {

    private LocalDate dia;

    private Long total;
}