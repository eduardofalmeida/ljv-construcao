package com.ljv.construcao.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "faltas_funcionarios",
    uniqueConstraints = @UniqueConstraint(columnNames = {"funcionario_id", "data"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FaltaFuncionario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "funcionario_id", nullable = false)
    private Funcionario funcionario;

    @Column(nullable = false)
    private LocalDate data;

    /** Falta justificada (atestado, etc.) */
    @Column(nullable = false)
    private Boolean justificada = false;

    /** Mesmo justificada, descontar do pagamento? */
    @Column(nullable = false)
    private Boolean descontar = true;

    @Column(length = 200)
    private String motivo;

    @Column(columnDefinition = "TEXT")
    private String observacoes;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime criadoEm;
}
