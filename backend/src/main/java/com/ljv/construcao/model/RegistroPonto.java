package com.ljv.construcao.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.ljv.construcao.model.enums.StatusDia;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "registros_ponto",
    uniqueConstraints = @UniqueConstraint(columnNames = {"funcionario_id", "data"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegistroPonto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "funcionario_id", nullable = false)
    private Funcionario funcionario;

    /** Data do registro */
    @Column(nullable = false)
    private LocalDate data;

    /**
     * Status do dia:
     * TRABALHADO     → presença explícita (útil para sábado/domingo)
     * FALTA          → falta injustificada
     * FALTA_JUSTIFICADA → falta com justificativa
     * FOLGA          → folga programada / feriado
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StatusDia status;

    /**
     * Para FALTA e FALTA_JUSTIFICADA: deve descontar do pagamento?
     * Para TRABALHADO em fim de semana: adicionar ao total?
     */
    @Column(nullable = false)
    private Boolean descontar = true;

    @Column(length = 200)
    private String motivo;

    @Column(columnDefinition = "TEXT")
    private String observacoes;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime criadoEm;

    @UpdateTimestamp
    private LocalDateTime atualizadoEm;
}
