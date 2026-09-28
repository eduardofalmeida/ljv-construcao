package com.ljv.construcao.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.ljv.construcao.model.enums.StatusOrcamento;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "orcamentos")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Orcamento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, length = 20)
    private String numero; // Ex: ORC-2024-001

    @NotBlank
    @Column(nullable = false, length = 200)
    private String titulo;

    @Column(columnDefinition = "TEXT")
    private String descricao;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatusOrcamento status = StatusOrcamento.RASCUNHO;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cliente_id")
    private Cliente cliente;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "obra_id")
    private Obra obra;

    @Column(precision = 12, scale = 2)
    private BigDecimal valorTotal = BigDecimal.ZERO;

    @Column(precision = 12, scale = 2)
    private BigDecimal desconto = BigDecimal.ZERO;

    @Column(precision = 12, scale = 2)
    private BigDecimal valorFinal = BigDecimal.ZERO;

    private LocalDate dataValidade;

    @Column(length = 120)
    private String localServico;

    @Column(length = 80)
    private String prazoExecucao;

    @Column(length = 80)
    private String garantia;

    @Column(length = 255)
    private String formaPagamento;

    @Column(precision = 5, scale = 2)
    private BigDecimal entradaPercentual;

    private Integer numeroParcelas;

    @Column(columnDefinition = "TEXT")
    private String condicoesPagamento;

    @Column(columnDefinition = "TEXT")
    private String incluso;

    @Column(columnDefinition = "TEXT")
    private String naoIncluso;

    @Column(columnDefinition = "TEXT")
    private String observacoes;

    private LocalDateTime enviadoEm;

    private LocalDateTime ultimoContatoEm;

    private LocalDate proximoFollowUp;

    private LocalDate dataResposta;

    @Column(columnDefinition = "TEXT")
    private String notaAcompanhamento;

    @OneToMany(mappedBy = "orcamento", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("ordem ASC")
    @Builder.Default
    private List<ItemOrcamento> itens = new ArrayList<>();

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime criadoEm;

    @UpdateTimestamp
    private LocalDateTime atualizadoEm;
}
