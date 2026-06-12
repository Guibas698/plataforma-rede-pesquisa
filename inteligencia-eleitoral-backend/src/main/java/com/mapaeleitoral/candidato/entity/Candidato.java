package com.mapaeleitoral.candidato.entity;

import com.mapaeleitoral.usuario.entity.Usuario;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "candidatos")
public class Candidato {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false, unique = true)
    private Usuario usuario;

    @Column(name = "nome_publico", nullable = false, length = 160)
    private String nomePublico;

    @Column(name = "partido", nullable = false, length = 80)
    private String partido;

    @Column(name = "numero_urna", nullable = false, length = 20)
    private String numeroUrna;

    @Column(name = "cargo_pretendido", nullable = false, length = 80)
    private String cargoPretendido;

    @Column(name = "municipio_base", nullable = false, length = 120)
    private String municipioBase;

    @Column(name = "observacao_interna")
    private String observacaoInterna;

    @Builder.Default
    @Column(name = "ativo", nullable = false)
    private Boolean ativo = true;

    @Column(name = "criado_em", nullable = false, updatable = false)
    private LocalDateTime criadoEm;

    @Column(name = "atualizado_em", nullable = false)
    private LocalDateTime atualizadoEm;

    @Builder.Default
    @OneToMany(
            mappedBy = "candidato",
            fetch = FetchType.LAZY,
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    private List<LinkCandidato> links = new ArrayList<>();

    @PrePersist
    public void prePersist() {
        LocalDateTime agora = LocalDateTime.now();

        this.criadoEm = agora;
        this.atualizadoEm = agora;

        if (this.ativo == null) {
            this.ativo = true;
        }
    }

    @PreUpdate
    public void preUpdate() {
        this.atualizadoEm = LocalDateTime.now();
    }
}