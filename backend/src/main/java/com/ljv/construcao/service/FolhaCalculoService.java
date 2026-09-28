package com.ljv.construcao.service;

import com.ljv.construcao.model.Funcionario;
import com.ljv.construcao.model.RegistroPonto;
import com.ljv.construcao.model.enums.TipoRecebimento;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Cálculo único da folha: dias trabalhados até a data × valor do dia.
 */
@Service
public class FolhaCalculoService {

    public record Resultado(
        LocalDate inicio,
        LocalDate fim,
        boolean modoFreelancer,
        long diasUteisNoPeriodo,
        long diasTrabalhados,
        long diasExtras,
        long diasSemRegistro,
        long diasFuturosNaoContados,
        long faltasTotal,
        long faltasJustificadas,
        long faltasADescontar,
        BigDecimal valorDia,
        BigDecimal valorBruto,
        BigDecimal descontosFaltas,
        BigDecimal valorLiquido
    ) {}

    public Resultado calcular(Funcionario func, LocalDate inicio, LocalDate fim, List<RegistroPonto> registros) {
        LocalDate hoje = LocalDate.now();

        if (func.getDataAdmissao() != null && inicio.isBefore(func.getDataAdmissao())) {
            inicio = func.getDataAdmissao();
        }
        if (func.getDataDemissao() != null && fim.isAfter(func.getDataDemissao())) {
            fim = func.getDataDemissao();
        }

        if (inicio.isAfter(fim)) {
            return vazio(inicio, fim, func);
        }

        if (registros == null) registros = List.of();

        boolean modoFreelancer = Boolean.TRUE.equals(func.getFreelancer());
        BigDecimal valorDia = resolverValorDia(func);
        Map<LocalDate, RegistroPonto> registroMap = registros.stream()
            .collect(Collectors.toMap(RegistroPonto::getData, r -> r, (a, b) -> a));

        long diasUteisNoPeriodo = 0;
        long diasTrabalhados = 0;
        long diasExtras = 0;
        long diasSemRegistro = 0;
        long diasFuturosNaoContados = 0;
        long faltasTotal = 0;
        long faltasJustificadas = 0;
        long faltasADescontar = 0;

        for (LocalDate dia = inicio; !dia.isAfter(fim); dia = dia.plusDays(1)) {
            boolean weekend = isWeekend(dia);
            if (!weekend) diasUteisNoPeriodo++;

            RegistroPonto reg = registroMap.get(dia);

            if (reg != null) {
                switch (reg.getStatus()) {
                    case TRABALHADO -> {
                        diasTrabalhados++;
                        if (weekend) diasExtras++;
                    }
                    case FALTA -> {
                        faltasTotal++;
                        if (Boolean.TRUE.equals(reg.getDescontar())) faltasADescontar++;
                    }
                    case FALTA_JUSTIFICADA -> {
                        faltasTotal++;
                        faltasJustificadas++;
                        if (Boolean.TRUE.equals(reg.getDescontar())) faltasADescontar++;
                    }
                    case FOLGA -> { /* sem impacto */ }
                }
                continue;
            }

            if (weekend) continue;

            // Dia útil sem registro
            if (dia.isAfter(hoje)) {
                diasFuturosNaoContados++;
                continue;
            }

            if (modoFreelancer) {
                diasSemRegistro++;
            } else {
                // Assalariado / diarista fixo: dia útil até hoje = trabalhado
                diasTrabalhados++;
            }
        }

        BigDecimal valorBruto = valorDia.multiply(BigDecimal.valueOf(diasTrabalhados))
            .setScale(2, RoundingMode.HALF_UP);

        // Desconto de faltas só entra se o dia NÃO foi pago (já saiu da contagem).
        // Mantemos o campo zerado para não descontar duas vezes.
        BigDecimal descFaltas = BigDecimal.ZERO;
        BigDecimal valorLiquido = valorBruto;

        return new Resultado(
            inicio, fim, modoFreelancer,
            diasUteisNoPeriodo, diasTrabalhados, diasExtras, diasSemRegistro, diasFuturosNaoContados,
            faltasTotal, faltasJustificadas, faltasADescontar,
            valorDia, valorBruto, descFaltas, valorLiquido
        );
    }

    /**
     * Valor de 1 dia de trabalho, na seguinte ordem:
     * 1) valorDiaria cadastrado
     * 2) se tipo DIARIA, usa salario (cadastros antigos)
     * 3) converte salario semanal/quinzenal/mensal para dia
     */
    public BigDecimal resolverValorDia(Funcionario func) {
        if (func.getValorDiaria() != null && func.getValorDiaria().compareTo(BigDecimal.ZERO) > 0) {
            return func.getValorDiaria();
        }

        BigDecimal salario = func.getSalario() != null ? func.getSalario() : BigDecimal.ZERO;
        if (salario.compareTo(BigDecimal.ZERO) <= 0) return BigDecimal.ZERO;

        TipoRecebimento tipo = func.getTipoRecebimento() != null
            ? func.getTipoRecebimento() : TipoRecebimento.DIARIA;

        return switch (tipo) {
            case DIARIA -> salario;
            case SEMANAL -> salario.divide(BigDecimal.valueOf(5), 2, RoundingMode.HALF_UP);
            case QUINZENAL -> salario.divide(BigDecimal.valueOf(10), 2, RoundingMode.HALF_UP);
            case MENSAL -> salario.divide(BigDecimal.valueOf(22), 2, RoundingMode.HALF_UP);
        };
    }

    private Resultado vazio(LocalDate inicio, LocalDate fim, Funcionario func) {
        return new Resultado(
            inicio, fim, Boolean.TRUE.equals(func.getFreelancer()),
            0, 0, 0, 0, 0, 0, 0, 0,
            resolverValorDia(func), BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO
        );
    }

    private boolean isWeekend(LocalDate d) {
        return d.getDayOfWeek() == DayOfWeek.SATURDAY || d.getDayOfWeek() == DayOfWeek.SUNDAY;
    }
}
