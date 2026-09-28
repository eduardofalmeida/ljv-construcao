package com.ljv.construcao.model.enums;

public enum StatusDia {
    /** Trabalhou neste dia (útil para registrar trabalho em fins de semana) */
    TRABALHADO,
    /** Falta injustificada (desconto padrão) */
    FALTA,
    /** Falta justificada (atestado etc.) – pode ou não descontar */
    FALTA_JUSTIFICADA,
    /** Folga programada / feriado (sem desconto) */
    FOLGA
}
