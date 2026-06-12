package com.mapaeleitoral.apoiador.entity;

import com.mapaeleitoral.apoiador.enums.OrigemCadastro;
import com.mapaeleitoral.apoiador.enums.StatusApoiador;
import com.mapaeleitoral.candidato.entity.Candidato;
import com.mapaeleitoral.consentimento.entity.ConsentimentoApoiador;
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
@Table(name = "apoiadores")
public class Apoiador {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", unique = true)
    private Usuario usuario;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "candidato_id", nullable = false)
    private Candidato candidato;

    @Column(name = "nome", nullable = false, length = 160)
    private String nome;

    @Column(name = "email", length = 160)
    private String email;

    @Column(name = "telefone", nullable = false, length = 30)
    private String telefone;

    @Column(name = "municipio", nullable = false, length = 120)
    private String municipio;

    @Column(name = "bairro", nullable = false, length = 120)
    private String bairro;

    @Column(name = "zona_eleitoral", nullable = false)
    private Integer zonaEleitoral;

    @Column(name = "secao_eleitoral", nullable = false)
    private Integer secaoEleitoral;

    @Column(name = "observacao")
    private String observacao;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private StatusApoiador status = StatusApoiador.ATIVO;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "origem_cadastro", nullable = false, length = 40)
    private OrigemCadastro origemCadastro = OrigemCadastro.LINK_CANDIDATO;

    @Builder.Default
    @Column(name = "consentimento_aceito", nullable = false)
    private Boolean consentimentoAceito = false;

    @Column(name = "consentimento_data")
    private LocalDateTime consentimentoData;

    @Builder.Default
    @Column(name = "ativo", nullable = false)
    private Boolean ativo = true;

    @Column(name = "criado_em", nullable = false, updatable = false)
    private LocalDateTime criadoEm;

    @Column(name = "atualizado_em", nullable = false)
    private LocalDateTime atualizadoEm;

    @Builder.Default
    @OneToMany(
            mappedBy = "apoiador",
            fetch = FetchType.LAZY,
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    private List<ConsentimentoApoiador> consentimentos = new ArrayList<>();

    @PrePersist
    public void prePersist() {
        LocalDateTime agora = LocalDateTime.now();

        this.criadoEm = agora;
        this.atualizadoEm = agora;

        if (this.status == null) {
            this.status = StatusApoiador.ATIVO;
        }

        if (this.origemCadastro == null) {
            this.origemCadastro = OrigemCadastro.LINK_CANDIDATO;
        }

        if (this.consentimentoAceito == null) {
            this.consentimentoAceito = false;
        }

        if (Boolean.TRUE.equals(this.consentimentoAceito) && this.consentimentoData == null) {
            this.consentimentoData = agora;
        }

        if (this.ativo == null) {
            this.ativo = true;
        }
    }

    @PreUpdate
    public void preUpdate() {
        this.atualizadoEm = LocalDateTime.now();
    }
}