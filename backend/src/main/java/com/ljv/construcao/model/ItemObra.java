package com.ljv.construcao.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "itens_obra")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class ItemObra {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "obra_id", nullable = false)
    private Obra obra;

    @NotBlank
    @Column(nullable = false, columnDefinition = "TEXT")
    private String descricao;

    @Column(columnDefinition = "TEXT")
    private String observacao;

    @Column(length = 50)
    private String unidade;

    @Column(precision = 10, scale = 2)
    private BigDecimal quantidade = BigDecimal.ONE;

    @Column(precision = 12, scale = 2)
    private BigDecimal valorUnitario = BigDecimal.ZERO;

    @Column(precision = 12, scale = 2)
    private BigDecimal valorTotal = BigDecimal.ZERO;

    private Integer ordem;

    /** ORCAMENTO = veio do orçamento aceito; ADICIONADO = incluído durante a obra */
    @Column(length = 20, nullable = false)
    private String origem = "ADICIONADO";

    private Long itemOrcamentoId;

    @Column(nullable = false)
    private Boolean ativo = true;

    private LocalDate dataInclusao;

    private LocalDate dataRemocao;

    @Column(columnDefinition = "TEXT")
    private String motivoRemocao;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime criadoEm;

    @UpdateTimestamp
    private LocalDateTime atualizadoEm;

    public void recalcularTotal() {
        BigDecimal qtd = quantidade != null ? quantidade : BigDecimal.ONE;
        BigDecimal unit = valorUnitario != null ? valorUnitario : BigDecimal.ZERO;
        valorTotal = qtd.multiply(unit).setScale(2, RoundingMode.HALF_UP);
    }
}
