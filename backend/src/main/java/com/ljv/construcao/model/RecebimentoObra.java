package com.ljv.construcao.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "recebimentos_obra")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class RecebimentoObra {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "obra_id", nullable = false)
    private Obra obra;

    @NotNull
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal valor;

    /** Data de referência do ciclo (semana, quinzena, mês) */
    @NotNull
    @Column(nullable = false)
    private LocalDate data;

    private LocalDate dataRecebimento;

    @Column(length = 150)
    private String referencia;

    /** ENTRADA, PARCELA, SALDO, ADITIVO, OUTRO */
    @Column(length = 40)
    private String tipo;

    @Column(length = 100)
    private String formaPagamento;

    @Column(columnDefinition = "TEXT")
    private String observacoes;

    @Column(nullable = false)
    private Boolean recebido = false;

    /** Transação financeira gerada automaticamente ao marcar como recebido */
    private Long transacaoId;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime criadoEm;

    @UpdateTimestamp
    private LocalDateTime atualizadoEm;
}
