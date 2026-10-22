package com.ljv.construcao.service;

import com.ljv.construcao.model.Obra;
import com.ljv.construcao.model.enums.StatusObra;
import com.ljv.construcao.model.enums.StatusOrcamento;
import com.ljv.construcao.model.enums.TipoTransacao;
import com.ljv.construcao.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.*;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final ClienteRepository clienteRepository;
    private final ObraRepository obraRepository;
    private final FuncionarioRepository funcionarioRepository;
    private final OrcamentoRepository orcamentoRepository;
    private final TransacaoRepository transacaoRepository;
    private final FolhaSaldoService folhaSaldoService;

    public Map<String, Object> getResumo() {
        Map<String, Object> resumo = new HashMap<>();

        // Contadores
        resumo.put("totalClientes", clienteRepository.countByAtivoTrue());
        resumo.put("obrasAtivas", obraRepository.countAtivas());
        resumo.put("totalFuncionarios", funcionarioRepository.countByAtivoTrue());
        resumo.put("obrasEmAndamento", obraRepository.countByStatus(StatusObra.EM_ANDAMENTO));

        // Obras em andamento (lista rápida para o dashboard)
        List<Obra> obrasAndamento = obraRepository.findByStatus(
            StatusObra.EM_ANDAMENTO,
            PageRequest.of(0, 5, Sort.by(Sort.Direction.DESC, "atualizadoEm"))
        ).getContent();
        resumo.put("obrasEmAndamentoLista", obrasAndamento.stream().map(o -> Map.of(
            "id", o.getId(),
            "nome", o.getNome(),
            "percentualConcluido", o.getPercentualConcluido() != null ? o.getPercentualConcluido() : 0,
            "cliente", o.getCliente() != null ? o.getCliente().getNome() : ""
        )).toList());

        // Financeiro do mês atual
        YearMonth mesAtual = YearMonth.now();
        LocalDate inicioMes = mesAtual.atDay(1);
        LocalDate fimMes = mesAtual.atEndOfMonth();

        BigDecimal receitaMes = transacaoRepository.sumByTipoAndPeriodo(
            TipoTransacao.RECEITA, inicioMes, fimMes
        );
        BigDecimal despesaMes = transacaoRepository.sumByTipoAndPeriodo(
            TipoTransacao.DESPESA, inicioMes, fimMes
        );

        resumo.put("receitaMes", receitaMes != null ? receitaMes : BigDecimal.ZERO);
        resumo.put("despesaMes", despesaMes != null ? despesaMes : BigDecimal.ZERO);
        resumo.put("saldoMes", (receitaMes != null ? receitaMes : BigDecimal.ZERO)
            .subtract(despesaMes != null ? despesaMes : BigDecimal.ZERO));

        // ─── Folha de funcionários ─────────────────────────────────────────
        // Mesmo cálculo da página de Folha (ponto do ciclo aberto − vales − descontos − pagamentos)
        Map<String, Object> saldos = folhaSaldoService.calcularSaldosAtuais();
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> saldosFuncionarios = (List<Map<String, Object>>) saldos.get("funcionarios");

        BigDecimal totalBrutoPendente = BigDecimal.ZERO;
        List<Map<String, Object>> funcionariosPendentes = new ArrayList<>();

        for (Map<String, Object> s : saldosFuncionarios) {
            BigDecimal bruto = ((BigDecimal) s.get("valorBruto"))
                .subtract((BigDecimal) s.get("pagamentosJaFeitos"))
                .max(BigDecimal.ZERO);
            BigDecimal valePendente = (BigDecimal) s.get("valesPendentes");
            BigDecimal saldoFinal = (BigDecimal) s.get("saldoFinal");

            totalBrutoPendente = totalBrutoPendente.add(bruto);

            if (saldoFinal.signum() > 0 || valePendente.signum() > 0) {
                Map<String, Object> fm = new LinkedHashMap<>();
                fm.put("id", s.get("funcionarioId"));
                fm.put("nome", s.get("nome"));
                fm.put("cargo", s.get("cargo"));
                fm.put("tipoRecebimento", s.get("tipoRecebimento"));
                fm.put("foto", s.get("foto"));
                fm.put("pagamentoPendente", bruto);
                fm.put("valePendente", valePendente);
                fm.put("descontoPendente", s.get("descontos"));
                fm.put("totalAPagar", saldoFinal);
                funcionariosPendentes.add(fm);
            }
        }

        funcionariosPendentes.sort((a, b) ->
            ((BigDecimal) b.get("totalAPagar")).compareTo((BigDecimal) a.get("totalAPagar")));

        resumo.put("folhaPendente", Map.of(
            "totalPagamentosPendentes", totalBrutoPendente,
            "totalValesPendentes", saldos.get("totalValesPendentes"),
            "totalLiquido", saldos.get("totalAPagar"),
            "quantidadeFuncionariosPendentes", funcionariosPendentes.size(),
            "funcionariosPendentes", funcionariosPendentes
        ));

        List<StatusOrcamento> aguardando = List.of(StatusOrcamento.ENVIADO, StatusOrcamento.EM_ANALISE);
        long aguardandoResposta = orcamentoRepository.countByStatusIn(aguardando);
        LocalDate hojeOrc = LocalDate.now();
        long followUpHoje = orcamentoRepository.findComClientePorStatus(aguardando).stream()
            .filter(o -> {
                if (o.getProximoFollowUp() != null) return !o.getProximoFollowUp().isAfter(hojeOrc);
                LocalDate base = o.getEnviadoEm() != null
                    ? o.getEnviadoEm().toLocalDate()
                    : (o.getCriadoEm() != null ? o.getCriadoEm().toLocalDate() : hojeOrc);
                return !base.plusDays(3).isAfter(hojeOrc);
            })
            .count();
        resumo.put("orcamentos", Map.of(
            "aguardandoResposta", aguardandoResposta,
            "followUpHoje", followUpHoje,
            "aprovadosMes", orcamentoRepository.countAprovadosDesde(inicioMes)
        ));

        return resumo;
    }
}
