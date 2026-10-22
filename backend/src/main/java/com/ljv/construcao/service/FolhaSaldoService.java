package com.ljv.construcao.service;

import com.ljv.construcao.model.Funcionario;
import com.ljv.construcao.model.MovimentacaoFuncionario;
import com.ljv.construcao.model.RegistroPonto;
import com.ljv.construcao.model.enums.TipoMovimentacao;
import com.ljv.construcao.repository.FuncionarioRepository;
import com.ljv.construcao.repository.MovimentacaoFuncionarioRepository;
import com.ljv.construcao.repository.RegistroPontoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

/**
 * Saldo atual da folha de cada funcionário ativo: ciclo aberto desde o último
 * pagamento quitado, calculado pelo ponto, menos vales, descontos e pagamentos.
 */
@Service
@RequiredArgsConstructor
public class FolhaSaldoService {

    private final FuncionarioRepository funcRepo;
    private final MovimentacaoFuncionarioRepository movRepo;
    private final RegistroPontoRepository pontoRepo;
    private final FolhaCalculoService folhaCalculo;

    @Transactional(readOnly = true)
    public Map<String, Object> calcularSaldosAtuais() {
        LocalDate hoje = LocalDate.now();
        LocalDate inicioMes = hoje.withDayOfMonth(1);
        List<Funcionario> funcionarios = funcRepo.findByAtivoTrue();

        List<Map<String, Object>> lista = new ArrayList<>();
        BigDecimal totalAPagar = BigDecimal.ZERO;
        BigDecimal totalVales = BigDecimal.ZERO;

        for (Funcionario func : funcionarios) {
            LocalDate inicio = inicioMes;
            String dataUltimoPgto = null;
            BigDecimal valorUltimo = BigDecimal.ZERO;

            List<MovimentacaoFuncionario> ultimos =
                movRepo.findUltimosPagamentos(func.getId(), PageRequest.of(0, 1));
            if (!ultimos.isEmpty()) {
                var ult = ultimos.get(0);
                LocalDate dataPgto = ult.getDataPagamento() != null ? ult.getDataPagamento() : ult.getData();
                inicio = dataPgto.plusDays(1);
                dataUltimoPgto = dataPgto.toString();
                valorUltimo = ult.getValor() != null ? ult.getValor() : BigDecimal.ZERO;
            }

            List<RegistroPonto> regs =
                pontoRepo.findByFuncionarioIdAndDataBetweenOrderByData(func.getId(), inicio, hoje);
            FolhaCalculoService.Resultado calc = folhaCalculo.calcular(func, inicio, hoje, regs);
            inicio = calc.inicio();
            LocalDate fim = calc.fim();

            // Vales = adiantamento do pagamento; todos em aberto até hoje reduzem o saldo
            BigDecimal valesPendentes = movRepo.somarValesPendentesAte(func.getId(), TipoMovimentacao.VALE, fim);
            BigDecimal valesNoCiclo = movRepo.somarPorTipo(func.getId(), TipoMovimentacao.VALE, inicio, fim);
            BigDecimal descontos = movRepo.somarPorTipo(func.getId(), TipoMovimentacao.DESCONTO, inicio, fim);
            BigDecimal pagamentos = movRepo.somarPorTipo(func.getId(), TipoMovimentacao.PAGAMENTO, inicio, fim);
            if (valesPendentes == null) valesPendentes = BigDecimal.ZERO;
            if (valesNoCiclo == null) valesNoCiclo = BigDecimal.ZERO;
            if (descontos == null) descontos = BigDecimal.ZERO;
            if (pagamentos == null) pagamentos = BigDecimal.ZERO;

            BigDecimal saldo = calc.valorLiquido()
                .subtract(valesPendentes)
                .subtract(descontos)
                .subtract(pagamentos)
                .max(BigDecimal.ZERO);

            totalAPagar = totalAPagar.add(saldo);
            totalVales = totalVales.add(valesPendentes);

            Map<String, Object> item = new LinkedHashMap<>();
            item.put("funcionarioId", func.getId());
            item.put("nome", func.getNome());
            item.put("cargo", func.getCargo() != null ? func.getCargo().name() : "");
            item.put("foto", func.getFoto() != null ? func.getFoto() : "");
            item.put("freelancer", Boolean.TRUE.equals(func.getFreelancer()));
            item.put("tipoRecebimento", func.getTipoRecebimento() != null ? func.getTipoRecebimento().name() : "DIARIA");
            item.put("inicioCiclo", inicio.toString());
            item.put("fimCiclo", fim.toString());
            item.put("dataUltimoPagamento", dataUltimoPgto);
            item.put("valorUltimoPagamento", valorUltimo);
            item.put("diasTrabalhados", calc.diasTrabalhados());
            item.put("valorDia", calc.valorDia());
            item.put("valorBruto", calc.valorBruto());
            item.put("valesPendentes", valesPendentes);
            item.put("valesNoCiclo", valesNoCiclo);
            item.put("descontos", descontos);
            item.put("pagamentosJaFeitos", pagamentos);
            item.put("saldoFinal", saldo);
            lista.add(item);
        }

        Map<String, Object> resultado = new LinkedHashMap<>();
        resultado.put("hoje", hoje.toString());
        resultado.put("totalAPagar", totalAPagar);
        resultado.put("totalValesPendentes", totalVales);
        resultado.put("funcionarios", lista);
        return resultado;
    }
}
