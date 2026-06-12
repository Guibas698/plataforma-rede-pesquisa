package com.mapaeleitoral.usuario.entity;

import com.mapaeleitoral.candidato.entity.Candidato;
import com.mapaeleitoral.usuario.enums.PapelUsuario;
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
        name = "usuarios",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_usuarios_email", columnNames = "email")
        }
)
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "nome", nullable = false, length = 160)
    private String nome;

    @Column(name = "email", nullable = false, unique = true, length = 160)
    private String email;

    @Column(name = "telefone", length = 30)
    private String telefone;

    @Column(name = "senha_hash", nullable = false, length = 255)
    private String senhaHash;

    @Enumerated(EnumType.STRING)
    @Column(name = "papel", nullable = false, length = 30)
    private PapelUsuario papel;

    @Column(name = "titulo_eleitor_hash", unique = true)
    private String tituloEleitorHash;

    @Column(name = "titulo_eleitor_ultimos4", length = 4)
    private String tituloEleitorUltimos4;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "superior_id")
    private Usuario superior;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "adm_raiz_id")
    private Usuario admRaiz;

    @Column(name = "foto_url")
    private String fotoUrl;

    @Builder.Default
    @Column(name = "ativo", nullable = false)
    private Boolean ativo = true;

    @Column(name = "criado_em", nullable = false, updatable = false)
    private LocalDateTime criadoEm;

    @Column(name = "atualizado_em", nullable = false)
    private LocalDateTime atualizadoEm;

    @OneToOne(mappedBy = "usuario", fetch = FetchType.LAZY)
    private Candidato candidato;

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