package com.ljv.construcao.controller;

import com.ljv.construcao.model.Funcionario;
import com.ljv.construcao.model.RegistroPonto;
import com.ljv.construcao.model.enums.StatusDia;
import com.ljv.construcao.model.enums.TipoMovimentacao;
import com.ljv.construcao.model.enums.TipoRecebimento;
import com.ljv.construcao.repository.FuncionarioRepository;
import com.ljv.construcao.repository.MovimentacaoFuncionarioRepository;
import com.ljv.construcao.repository.RegistroPontoRepository;
import com.ljv.construcao.service.FolhaCalculoService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequiredArgsConstructor
public class RegistroPontoController {

    private final RegistroPontoRepository pontoRepo;
    private final FuncionarioRepository funcRepo;
    private final MovimentacaoFuncionarioRepository movRepo;
    private final FolhaCalculoService folhaCalculo;

    // ─── CRUD de registros por funcionário ──────────────────

    /** Retorna todos os registros de um funcionário num intervalo */
    @GetMapping("/funcionarios/{id}/ponto")
    public ResponseEntity<?> listar(
        @PathVariable Long id,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate inicio,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fim
    ) {
        List<RegistroPonto> registros =
            pontoRepo.findByFuncionarioIdAndDataBetweenOrderByData(id, inicio, fim);
        return ResponseEntity.ok(registros.stream().map(this::toMap).toList());
    }

    /** Cria ou atualiza o registro de um dia específico */
    @PostMapping("/funcionarios/{id}/ponto")
    public ResponseEntity<?> salvar(
        @PathVariable Long id,
        @RequestBody Map<String, Object> dados
    ) {
        Funcionario f = funcRepo.findById(id).orElse(null);
        if (f == null) return ResponseEntity.notFound().build();

        LocalDate data = LocalDate.parse(dados.get("data").toString());
        StatusDia status = StatusDia.valueOf(dados.get("status").toString());

        // Bloquear registros antes da data de admissão
        if (f.getDataAdmissao() != null && data.isBefore(f.getDataAdmissao())) {
            return ResponseEntity.badRequest().body(Map.of(
                "erro", "Não é possível registrar ponto antes da data de admissão do funcionário (" + f.getDataAdmissao() + ")"
            ));
        }

        RegistroPonto registro = pontoRepo.findByFuncionarioIdAndData(id, data)
            .orElse(new RegistroPonto());

        registro.setFuncionario(f);
        registro.setData(data);
        registro.setStatus(status);
        registro.setDescontar(Boolean.parseBoolean(
            dados.getOrDefault("descontar", true).toString()));
        if (dados.containsKey("motivo"))
            registro.setMotivo(dados.get("motivo") != null ? dados.get("motivo").toString() : null);
        if (dados.containsKey("observacoes"))
            registro.setObservacoes(dados.get("observacoes") != null ? dados.get("observacoes").toString() : null);

        pontoRepo.save(registro);
        return ResponseEntity.ok(toMap(registro));
    }

    /** Remove o registro de um dia (volta ao estado padrão) */
    @DeleteMapping("/funcionarios/{funcId}/ponto/{registroId}")
    public ResponseEntity<?> remover(
        @PathVariable Long funcId, @PathVariable Long registroId
    ) {
        RegistroPonto r = pontoRepo.findById(registroId).orElse(null);
        if (r == null || !r.getFuncionario().getId().equals(funcId))
            return ResponseEntity.notFound().build();
        pontoRepo.delete(r);
        return ResponseEntity.ok(Map.of("success", true));
    }

    // ─── Resumo detalhado de um funcionário num período ─────

    /**
     * Retorna o resumo completo de um funcionário para um período:
     * dias trabalhados, valor calculado, vales, descontos e saldo final a pagar.
     * Usado no modal de pagamento para exibir o breakdown antes de registrar.
     */
    @GetMapping("/funcionarios/{id}/resumo-periodo")
    public ResponseEntity<?> resumoPeriodo(
        @PathVariable Long id,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate inicio,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fim
    ) {
        Funcionario func = funcRepo.findById(id).orElse(null);
        if (func == null) return ResponseEntity.notFound().build();

        List<RegistroPonto> registros =
            pontoRepo.findByFuncionarioIdAndDataBetweenOrderByData(id, inicio, fim);

        FolhaCalculoService.Resultado calc = folhaCalculo.calcular(func, inicio, fim, registros);
        inicio = calc.inicio();
        fim = calc.fim();

        BigDecimal valorBruto = calc.valorBruto();
        BigDecimal descFaltas = calc.descontosFaltas();
        BigDecimal valorLiquido = calc.valorLiquido();
        BigDecimal valorDia = calc.valorDia();
        TipoRecebimento tipo = func.getTipoRecebimento() != null
            ? func.getTipoRecebimento() : TipoRecebimento.DIARIA;

        // ── Movimentações financeiras do período ────────────
        BigDecimal pagamentosJaFeitos  = movRepo.somarPorTipo(id, TipoMovimentacao.PAGAMENTO, inicio, fim);
        BigDecimal pagamentosPendentes = movRepo.somarPorTipoNaoPago(id, TipoMovimentacao.PAGAMENTO, inicio, fim);
        BigDecimal valesNoPeriodo      = movRepo.somarPorTipo(id, TipoMovimentacao.VALE, inicio, fim);
        // Adiantamentos em aberto até o fim do período (podem vir de ciclo anterior sem abatimento)
        BigDecimal valesPendentes      = movRepo.somarValesPendentesAte(id, TipoMovimentacao.VALE, fim);
        BigDecimal descontosNoPeriodo  = movRepo.somarPorTipo(id, TipoMovimentacao.DESCONTO, inicio, fim);

        // Saldo = líquido do trabalho − adiantamentos (vales) a descontar − descontos − pagamentos já feitos
        BigDecimal saldoFinal = valorLiquido
            .subtract(valesPendentes)
            .subtract(descontosNoPeriodo)
            .subtract(pagamentosJaFeitos)
            .max(BigDecimal.ZERO);

        // Registros de ponto para visualização
        List<Map<String, Object>> regView = registros.stream()
            .map(this::toMap)
            .toList();

        // Mapa do funcionário
        Map<String, Object> funcMap = new LinkedHashMap<>();
        funcMap.put("id", func.getId());
        funcMap.put("nome", func.getNome());
        funcMap.put("cargo", func.getCargo() != null ? func.getCargo().name() : "");
        funcMap.put("tipoRecebimento", tipo.name());
        funcMap.put("salario", func.getSalario() != null ? func.getSalario() : BigDecimal.ZERO);
        funcMap.put("valorDiaria", valorDia);
        funcMap.put("foto", func.getFoto() != null ? func.getFoto() : "");
        funcMap.put("freelancer", calc.modoFreelancer());

        Map<String, Object> resultado = new LinkedHashMap<>();
        resultado.put("funcionario", funcMap);
        resultado.put("periodo", Map.of("inicio", inicio.toString(), "fim", fim.toString()));
        resultado.put("modoFreelancer", calc.modoFreelancer());
        resultado.put("diasUteisNoPeriodo", calc.diasUteisNoPeriodo());
        resultado.put("diasTrabalhados", calc.diasTrabalhados());
        resultado.put("diasExtras", calc.diasExtras());
        resultado.put("diasSemRegistro", calc.diasSemRegistro());
        resultado.put("diasFuturosNaoContados", calc.diasFuturosNaoContados());
        resultado.put("faltasTotal", calc.faltasTotal());
        resultado.put("faltasJustificadas", calc.faltasJustificadas());
        resultado.put("faltasADescontar", calc.faltasADescontar());
        resultado.put("valorDia", valorDia);
        resultado.put("valorBruto", valorBruto);
        resultado.put("descontosFaltas", descFaltas);
        resultado.put("valorLiquido", valorLiquido);
        resultado.put("pagamentosJaFeitos", pagamentosJaFeitos);
        resultado.put("pagamentosPendentes", pagamentosPendentes);
        resultado.put("valesNoPeriodo", valesNoPeriodo);
        resultado.put("valesPendentes", valesPendentes);
        resultado.put("descontosNoPeriodo", descontosNoPeriodo);
        resultado.put("saldoFinal", saldoFinal);
        resultado.put("registros", regView);

        return ResponseEntity.ok(resultado);
    }

    // ─── Relatório de Folha de Pagamento ────────────────────

    @GetMapping("/relatorio/folha")
    public ResponseEntity<?> relatorio(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate inicio,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fim
    ) {
        List<Funcionario> funcionarios = funcRepo.findByAtivoTrue();

        // Todos os registros do período agrupados por funcionário
        List<RegistroPonto> todosRegistros = pontoRepo.findAllByPeriodo(inicio, fim);
        Map<Long, List<RegistroPonto>> regPorFunc = todosRegistros.stream()
            .collect(Collectors.groupingBy(r -> r.getFuncionario().getId()));

        // Todos os dias do período
        List<LocalDate> diasPeriodo = inicio.datesUntil(fim.plusDays(1)).toList();
        long diasUteisNoPeriodo = diasPeriodo.stream()
            .filter(d -> !isWeekend(d))
            .count();

        List<Map<String, Object>> linhas = new ArrayList<>();
        BigDecimal totalBruto    = BigDecimal.ZERO;
        BigDecimal totalDescontos= BigDecimal.ZERO;
        BigDecimal totalLiquido  = BigDecimal.ZERO;
        BigDecimal totalExtras   = BigDecimal.ZERO;
        BigDecimal totalVales    = BigDecimal.ZERO;
        BigDecimal totalValesPendentes = BigDecimal.ZERO;
        BigDecimal totalDescontosAvulsos = BigDecimal.ZERO;
        BigDecimal totalAPagar   = BigDecimal.ZERO;

        for (Funcionario func : funcionarios) {
            List<RegistroPonto> regsFunc = regPorFunc.getOrDefault(func.getId(), List.of());
            FolhaCalculoService.Resultado calc = folhaCalculo.calcular(func, inicio, fim, regsFunc);

            TipoRecebimento tipo = func.getTipoRecebimento() != null
                ? func.getTipoRecebimento() : TipoRecebimento.DIARIA;

            BigDecimal extra = calc.valorDia().multiply(BigDecimal.valueOf(calc.diasExtras()))
                .setScale(2, RoundingMode.HALF_UP);

            BigDecimal valesNoPeriodo = movRepo.somarPorTipo(func.getId(), TipoMovimentacao.VALE, inicio, fim);
            BigDecimal valesPendentes = movRepo.somarValesPendentesAte(func.getId(), TipoMovimentacao.VALE, fim);
            BigDecimal descontosAvulsos = movRepo.somarPorTipo(func.getId(), TipoMovimentacao.DESCONTO, inicio, fim);
            BigDecimal pagamentosJaFeitos = movRepo.somarPorTipo(func.getId(), TipoMovimentacao.PAGAMENTO, inicio, fim);
            if (valesNoPeriodo == null) valesNoPeriodo = BigDecimal.ZERO;
            if (valesPendentes == null) valesPendentes = BigDecimal.ZERO;
            if (descontosAvulsos == null) descontosAvulsos = BigDecimal.ZERO;
            if (pagamentosJaFeitos == null) pagamentosJaFeitos = BigDecimal.ZERO;

            // A receber = líquido do trabalho − vales (adiantamentos) a descontar − descontos avulsos − já pago
            BigDecimal aReceber = calc.valorLiquido()
                .subtract(valesPendentes)
                .subtract(descontosAvulsos)
                .subtract(pagamentosJaFeitos)
                .max(BigDecimal.ZERO);

            totalBruto     = totalBruto.add(calc.valorBruto());
            totalDescontos = totalDescontos.add(calc.descontosFaltas());
            totalLiquido   = totalLiquido.add(calc.valorLiquido());
            totalExtras    = totalExtras.add(extra);
            totalVales     = totalVales.add(valesNoPeriodo);
            totalValesPendentes = totalValesPendentes.add(valesPendentes);
            totalDescontosAvulsos = totalDescontosAvulsos.add(descontosAvulsos);
            totalAPagar    = totalAPagar.add(aReceber);

            List<Map<String, Object>> registrosView = regsFunc.stream()
                .sorted(Comparator.comparing(RegistroPonto::getData))
                .map(this::toMap)
                .toList();

            Map<String, Object> linha = new LinkedHashMap<>();
            Map<String, Object> funcMap = new LinkedHashMap<>();
            funcMap.put("id", func.getId());
            funcMap.put("nome", func.getNome());
            funcMap.put("cargo", func.getCargo() != null ? func.getCargo().name() : "");
            funcMap.put("tipoRecebimento", tipo.name());
            funcMap.put("salario", func.getSalario() != null ? func.getSalario() : 0);
            funcMap.put("valorDiaria", calc.valorDia());
            funcMap.put("foto", func.getFoto() != null ? func.getFoto() : "");
            funcMap.put("telefone", func.getTelefone() != null ? func.getTelefone() : "");
            funcMap.put("celular", func.getCelular() != null ? func.getCelular() : "");
            funcMap.put("freelancer", calc.modoFreelancer());
            funcMap.put("dataAdmissao", func.getDataAdmissao() != null ? func.getDataAdmissao().toString() : null);
            linha.put("funcionario", funcMap);
            linha.put("diasUteisNoPeriodo", calc.diasUteisNoPeriodo());
            linha.put("diasTrabalhados", calc.diasTrabalhados());
            linha.put("diasExtras", calc.diasExtras());
            linha.put("faltasTotal", calc.faltasTotal());
            linha.put("faltasJustificadas", calc.faltasJustificadas());
            linha.put("faltasNaoJustificadas", calc.faltasTotal() - calc.faltasJustificadas());
            linha.put("faltasADescontar", calc.faltasADescontar());
            linha.put("valorDia", calc.valorDia());
            linha.put("valorBruto", calc.valorBruto());
            linha.put("descontos", calc.descontosFaltas());
            linha.put("valorLiquido", calc.valorLiquido());
            linha.put("valesNoPeriodo", valesNoPeriodo);
            linha.put("valesPendentes", valesPendentes);
            linha.put("descontosAvulsos", descontosAvulsos);
            linha.put("pagamentosJaFeitos", pagamentosJaFeitos);
            linha.put("aReceber", aReceber);
            linha.put("registros", registrosView);

            linhas.add(linha);
        }

        Map<String, Object> resposta = new LinkedHashMap<>();
        resposta.put("periodo", Map.of("inicio", inicio.toString(), "fim", fim.toString()));
        resposta.put("diasUteisNoPeriodo", diasUteisNoPeriodo);
        resposta.put("totalFuncionarios", funcionarios.size());
        resposta.put("totalBruto", totalBruto);
        resposta.put("totalDescontos", totalDescontos);
        resposta.put("totalLiquido", totalLiquido);
        resposta.put("totalExtras", totalExtras);
        resposta.put("totalVales", totalVales);
        resposta.put("totalValesPendentes", totalValesPendentes);
        resposta.put("totalDescontosAvulsos", totalDescontosAvulsos);
        resposta.put("totalAPagar", totalAPagar);
        resposta.put("funcionarios", linhas);
        return ResponseEntity.ok(resposta);
    }

    /**
     * Saldo atual de cada funcionário ativo: dias trabalhados no ciclo × diária,
     * menos vales e pagamentos já feitos. Usado na aba Pagamentos.
     */
    @GetMapping("/folha/saldos-atuais")
    public ResponseEntity<?> saldosAtuais() {
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

            List<com.ljv.construcao.model.MovimentacaoFuncionario> ultimos =
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

        return ResponseEntity.ok(Map.of(
            "hoje", hoje.toString(),
            "totalAPagar", totalAPagar,
            "totalValesPendentes", totalVales,
            "funcionarios", lista
        ));
    }

    // ─── Helper ─────────────────────────────────────────────

    private boolean isWeekend(LocalDate d) {
        return d.getDayOfWeek() == DayOfWeek.SATURDAY || d.getDayOfWeek() == DayOfWeek.SUNDAY;
    }

    private Map<String, Object> toMap(RegistroPonto r) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", r.getId());
        m.put("funcionarioId", r.getFuncionario().getId());
        m.put("funcionarioNome", r.getFuncionario().getNome());
        m.put("data", r.getData().toString());
        m.put("status", r.getStatus().name());
        m.put("descontar", r.getDescontar());
        m.put("motivo", r.getMotivo() != null ? r.getMotivo() : "");
        m.put("observacoes", r.getObservacoes() != null ? r.getObservacoes() : "");
        m.put("criadoEm", r.getCriadoEm() != null ? r.getCriadoEm().toString() : "");
        return m;
    }
}
