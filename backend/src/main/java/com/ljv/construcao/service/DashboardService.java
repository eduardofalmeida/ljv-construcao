package com.ljv.construcao.service;

import com.ljv.construcao.model.Funcionario;
import com.ljv.construcao.model.MovimentacaoFuncionario;
import com.ljv.construcao.model.Obra;
import com.ljv.construcao.model.enums.StatusObra;
import com.ljv.construcao.model.enums.StatusOrcamento;
import com.ljv.construcao.model.enums.TipoMovimentacao;
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
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final ClienteRepository clienteRepository;
    private final ObraRepository obraRepository;
    private final FuncionarioRepository funcionarioRepository;
    private final OrcamentoRepository orcamentoRepository;
    private final TransacaoRepository transacaoRepository;
    private final MovimentacaoFuncionarioRepository movimentacaoRepository;

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
        // Todos os movimentos pendentes (não pagos) de todos os funcionários ativos
        List<MovimentacaoFuncionario> todasMovimentacoes =
            movimentacaoRepository.findAllPendentes();

        // Agrupados por funcionário
        Map<Long, List<MovimentacaoFuncionario>> porFunc = todasMovimentacoes.stream()
            .collect(Collectors.groupingBy(m -> m.getFuncionario().getId()));

        BigDecimal totalPagamentosPendentes = BigDecimal.ZERO;
        BigDecimal totalValesPendentes = BigDecimal.ZERO;
        List<Map<String, Object>> funcionariosPendentes = new ArrayList<>();

        for (Map.Entry<Long, List<MovimentacaoFuncionario>> entry : porFunc.entrySet()) {
            Funcionario func = entry.getValue().get(0).getFuncionario();
            List<MovimentacaoFuncionario> movs = entry.getValue();

            BigDecimal pagPendente = movs.stream()
                .filter(m -> m.getTipo() == TipoMovimentacao.PAGAMENTO)
                .map(MovimentacaoFuncionario::getValor)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal valePendente = movs.stream()
                .filter(m -> m.getTipo() == TipoMovimentacao.VALE)
                .map(MovimentacaoFuncionario::getValor)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal descPendente = movs.stream()
                .filter(m -> m.getTipo() == TipoMovimentacao.DESCONTO)
                .map(MovimentacaoFuncionario::getValor)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

            totalPagamentosPendentes = totalPagamentosPendentes.add(pagPendente);
            totalValesPendentes = totalValesPendentes.add(valePendente);

            if (pagPendente.compareTo(BigDecimal.ZERO) > 0 || valePendente.compareTo(BigDecimal.ZERO) > 0) {
                Map<String, Object> fm = new LinkedHashMap<>();
                fm.put("id", func.getId());
                fm.put("nome", func.getNome());
                fm.put("cargo", func.getCargo() != null ? func.getCargo().name() : "");
                fm.put("tipoRecebimento", func.getTipoRecebimento() != null ? func.getTipoRecebimento().name() : "MENSAL");
                fm.put("foto", func.getFoto() != null ? func.getFoto() : "");
                fm.put("pagamentoPendente", pagPendente);
                fm.put("valePendente", valePendente);
                fm.put("descontoPendente", descPendente);
                fm.put("totalAPagar", pagPendente.subtract(valePendente).subtract(descPendente).max(BigDecimal.ZERO));
                funcionariosPendentes.add(fm);
            }
        }

        // Ordenar por maior pagamento pendente
        funcionariosPendentes.sort((a, b) ->
            ((BigDecimal) b.get("pagamentoPendente")).compareTo((BigDecimal) a.get("pagamentoPendente")));

        resumo.put("folhaPendente", Map.of(
            "totalPagamentosPendentes", totalPagamentosPendentes,
            "totalValesPendentes", totalValesPendentes,
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
