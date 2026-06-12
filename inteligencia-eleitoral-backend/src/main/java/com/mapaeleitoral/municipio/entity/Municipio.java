package com.mapaeleitoral.municipio.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(
        name = "municipios",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_municipios_codigo_ibge", columnNames = "codigo_ibge")
        }
)
public class Municipio {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "nome", nullable = false, length = 120)
    private String nome;

    @Column(name = "codigo_ibge", unique = true, length = 20)
    private String codigoIbge;

    @Column(name = "estado", nullable = false, length = 2)
    private String estado;

    @Builder.Default
    @Column(name = "ativo", nullable = false)
    private Boolean ativo = true;

    @Column(name = "criado_em", nullable = false, updatable = false)
    private LocalDateTime criadoEm;

    @PrePersist
    public void prePersist() {
        this.criadoEm = LocalDateTime.now();

        if (this.ativo == null) {
            this.ativo = true;
        }

        if (this.estado == null || this.estado.isBlank()) {
            this.estado = "CE";
        }
    }
}