package com.mapaeleitoral.consentimento.entity;

import com.mapaeleitoral.apoiador.entity.Apoiador;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "consentimentos_apoiador")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConsentimentoApoiador {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "apoiador_id", nullable = false)
    private Apoiador apoiador;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "termo_id", nullable = false)
    private TermoConsentimento termo;

    @Column(name = "aceito_em", nullable = false)
    private LocalDateTime aceitoEm;

    @Column(name = "ip_origem")
    private String ipOrigem;

    @Column(name = "user_agent", columnDefinition = "TEXT")
    private String userAgent;

    @PrePersist
    public void prePersist() {
        if (aceitoEm == null) {
            aceitoEm = LocalDateTime.now();
        }
    }
}