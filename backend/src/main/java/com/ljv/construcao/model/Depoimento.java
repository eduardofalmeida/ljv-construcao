package com.ljv.construcao.model;

import com.ljv.construcao.model.enums.StatusDepoimento;
import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "depoimentos")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Depoimento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(nullable = false, length = 150)
    private String nome;

    @Column(length = 100)
    private String cidade;

    /** Cargo ou contexto — ex: "Proprietário de residência", "Sócio da empresa" */
    @Column(length = 100)
    private String cargo;

    @NotBlank
    @Column(nullable = false, columnDefinition = "TEXT")
    private String texto;

    @Min(1) @Max(5)
    @Column(nullable = false)
    private Integer estrelas = 5;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StatusDepoimento status = StatusDepoimento.PENDENTE;

    /** Nota interna do admin (motivo de aprovação ou reprovação) */
    @Column(columnDefinition = "TEXT")
    private String notaAdmin;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime criadoEm;
}
