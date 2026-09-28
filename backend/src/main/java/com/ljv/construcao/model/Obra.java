package com.ljv.construcao.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.ljv.construcao.model.enums.PeriodicidadePagamentoObra;
import com.ljv.construcao.model.enums.StatusObra;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "obras")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Obra {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(nullable = false, length = 200)
    private String nome;

    @Column(columnDefinition = "TEXT")
    private String descricao;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatusObra status = StatusObra.ORCAMENTO;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cliente_id")
    private Cliente cliente;

    // Endereço da obra
    @Column(length = 200)
    private String logradouro;

    @Column(length = 10)
    private String numero;

    @Column(length = 100)
    private String complemento;

    @Column(length = 100)
    private String bairro;

    @Column(length = 100)
    private String cidade;

    @Column(length = 2)
    private String estado;

    @Column(length = 9)
    private String cep;

    @Column(precision = 12, scale = 2)
    private BigDecimal valorContrato;

    @Column(precision = 12, scale = 2)
    private BigDecimal valorOrcado;

    /** Como o cliente paga esta obra */
    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private PeriodicidadePagamentoObra periodicidadePagamento = PeriodicidadePagamentoObra.SEMANAL;

    /** Valor combinado de cada pagamento (semana, quinzena ou mês) */
    @Column(precision = 12, scale = 2)
    private BigDecimal valorParcela;

    @org.hibernate.annotations.Formula(
        "(SELECT COALESCE(SUM(r.valor), 0) FROM recebimentos_obra r WHERE r.obra_id = id AND r.recebido = true)"
    )
    private BigDecimal totalRecebido;

    @org.hibernate.annotations.Formula(
        "(SELECT COALESCE(SUM(a.valor_total), 0) FROM aditivos_obra a WHERE a.obra_id = id AND (a.cobravel IS NULL OR a.cobravel = true))"
    )
    private BigDecimal totalAditivos;

    @org.hibernate.annotations.Formula(
        "(SELECT COALESCE(SUM(i.valor_total), 0) FROM itens_obra i WHERE i.obra_id = id AND (i.ativo IS NULL OR i.ativo = true))"
    )
    private BigDecimal totalEscopo;

    private LocalDate dataInicio;
    private LocalDate dataPrevisaoFim;
    private LocalDate dataConclusao;

    @Column(precision = 5, scale = 2)
    private BigDecimal percentualConcluido = BigDecimal.ZERO;

    @Column(columnDefinition = "TEXT")
    private String observacoes;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "obra_funcionarios",
        joinColumns = @JoinColumn(name = "obra_id"),
        inverseJoinColumns = @JoinColumn(name = "funcionario_id")
    )
    private List<Funcionario> funcionarios;

    @JsonIgnore
    @OneToMany(mappedBy = "obra", fetch = FetchType.LAZY)
    private List<Transacao> transacoes;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime criadoEm;

    @UpdateTimestamp
    private LocalDateTime atualizadoEm;
}
