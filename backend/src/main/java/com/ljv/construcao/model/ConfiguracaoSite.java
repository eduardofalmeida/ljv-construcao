package com.ljv.construcao.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "configuracoes_site")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConfiguracaoSite {

    @Id
    @Column(length = 100)
    private String chave;

    @Column(columnDefinition = "TEXT")
    private String valor;

    @Column(length = 200)
    private String descricao;

    @UpdateTimestamp
    private LocalDateTime atualizadoEm;
}
