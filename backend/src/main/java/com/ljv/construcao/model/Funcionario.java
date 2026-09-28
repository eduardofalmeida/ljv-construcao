package com.ljv.construcao.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.ljv.construcao.model.enums.CargoFuncionario;
import com.ljv.construcao.model.enums.TipoRecebimento;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "funcionarios")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Funcionario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(nullable = false, length = 150)
    private String nome;

    @Column(length = 14)
    private String cpf;

    @Column(length = 20)
    private String rg;

    @Column(length = 20)
    private String telefone;

    @Column(length = 20)
    private String celular;

    @Column(length = 150)
    private String email;

    @Enumerated(EnumType.STRING)
    private CargoFuncionario cargo;

    @Column(length = 100)
    private String especialidade;

    @Column(precision = 10, scale = 2)
    private BigDecimal salario;

    /** Como o funcionário é remunerado */
    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private TipoRecebimento tipoRecebimento = TipoRecebimento.DIARIA;

    /** Valor por dia (usado quando tipoRecebimento = DIARIA) */
    @Column(precision = 10, scale = 2)
    private BigDecimal valorDiaria;

    private LocalDate dataAdmissao;
    private LocalDate dataDemissao;

    // Endereço
    @Column(length = 200)
    private String logradouro;

    @Column(length = 10)
    private String numero;

    @Column(length = 100)
    private String bairro;

    @Column(length = 100)
    private String cidade;

    @Column(length = 2)
    private String estado;

    @Column(length = 9)
    private String cep;

    @Column(columnDefinition = "TEXT")
    private String observacoes;

    /** Foto do funcionário armazenada como Data URL (base64) */
    @Column(columnDefinition = "TEXT")
    private String foto;

    /** Indica que o funcionário é freelancer (diarista sem vínculo fixo) */
    @Column(nullable = false, columnDefinition = "boolean default false")
    private Boolean freelancer = false;

    @Column(nullable = false)
    private Boolean ativo = true;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime criadoEm;

    @UpdateTimestamp
    private LocalDateTime atualizadoEm;
}
