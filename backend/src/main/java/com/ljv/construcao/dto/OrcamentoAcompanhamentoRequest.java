package com.ljv.construcao.dto;

import com.ljv.construcao.model.enums.StatusOrcamento;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class OrcamentoAcompanhamentoRequest {
    private StatusOrcamento status;
    private LocalDate proximoFollowUp;
    private String notaAcompanhamento;
    private Boolean marcarEnviado;
    private Integer adiarDias;
}
