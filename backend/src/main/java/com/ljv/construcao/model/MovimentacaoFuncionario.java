package com.ljv.construcao.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.ljv.construcao.model.enums.TipoMovimentacao;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "movimentacoes_funcionarios")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MovimentacaoFuncionario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "funcionario_id", nullable = false)
    private Funcionario funcionario;

    /**
     * PAGAMENTO  → pagamento do salário/diária do ciclo
     * VALE       → adiantamento (parte do pagamento recebida antes do fechamento)
     * DESCONTO   → desconto avulso (ex: equipamento danificado)
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TipoMovimentacao tipo;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal valor;

    /** Data de referência (solicitação / competência) */
    @Column(nullable = false)
    private LocalDate data;

    /**
     * Para PAGAMENTO: data em que o valor foi pago ao funcionário.
     * Para VALE: data em que o adiantamento foi abatido de um pagamento de folha.
     */
    private LocalDate dataPagamento;

    /**
     * PAGAMENTO: true = valor já quitado ao funcionário.
     * VALE: true = adiantamento já descontado de um pagamento; false = ainda a abater do próximo ciclo.
     * (O dinheiro do vale já saiu no momento do lançamento; este flag controla o abatimento.)
     */
    @Column(nullable = false)
    private Boolean pago = false;

    /** Rótulo do período: "Semana 01/09–07/09", "Quinzena 1", "Mês 09/2026" etc. */
    @Column(length = 100)
    private String referencia;

    @Column(columnDefinition = "TEXT")
    private String observacoes;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime criadoEm;

    @UpdateTimestamp
    private LocalDateTime atualizadoEm;
}
