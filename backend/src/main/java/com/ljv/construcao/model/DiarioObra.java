package com.ljv.construcao.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "diario_obra")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DiarioObra {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "obra_id", nullable = false)
    private Obra obra;

    @NotNull
    @Column(nullable = false)
    private LocalDate data;

    @Column(columnDefinition = "TEXT")
    private String descricao;

    /** Quantidade de trabalhadores presentes no dia */
    private Integer trabalhadores;

    /** Clima do dia */
    @Column(length = 50)
    private String clima;

    /** Atividades executadas */
    @Column(columnDefinition = "TEXT")
    private String atividades;

    /** Observações / problemas */
    @Column(columnDefinition = "TEXT")
    private String observacoes;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime criadoEm;
}
