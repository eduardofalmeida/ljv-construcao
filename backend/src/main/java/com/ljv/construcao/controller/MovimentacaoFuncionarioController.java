package com.ljv.construcao.controller;

import com.ljv.construcao.model.Funcionario;
import com.ljv.construcao.model.MovimentacaoFuncionario;
import com.ljv.construcao.model.enums.TipoMovimentacao;
import com.ljv.construcao.repository.FuncionarioRepository;
import com.ljv.construcao.repository.MovimentacaoFuncionarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import org.springframework.data.domain.PageRequest;

@RestController
@RequiredArgsConstructor
public class MovimentacaoFuncionarioController {

    private final MovimentacaoFuncionarioRepository movRepo;
    private final FuncionarioRepository funcRepo;

    // ─── Listagem ──────────────────────────────────────────────

    @GetMapping("/funcionarios/{id}/movimentacoes")
    public ResponseEntity<?> listar(
        @PathVariable Long id,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate inicio,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fim
    ) {
        List<MovimentacaoFuncionario> lista = (inicio != null && fim != null)
            ? movRepo.findByFuncionarioIdAndDataBetweenOrderByDataDesc(id, inicio, fim)
            : movRepo.findByFuncionarioIdOrderByDataDesc(id);
        return ResponseEntity.ok(lista.stream().map(this::toMap).toList());
    }

    // ─── Criação ───────────────────────────────────────────────

    @PostMapping("/funcionarios/{id}/movimentacoes")
    public ResponseEntity<?> criar(
        @PathVariable Long id,
        @RequestBody Map<String, Object> dados
    ) {
        Funcionario func = funcRepo.findById(id).orElse(null);
        if (func == null) return ResponseEntity.notFound().build();

        MovimentacaoFuncionario mov = new MovimentacaoFuncionario();
        mov.setFuncionario(func);
        mov.setTipo(TipoMovimentacao.valueOf(dados.get("tipo").toString()));
        mov.setValor(new BigDecimal(dados.get("valor").toString()));
        mov.setData(LocalDate.parse(dados.get("data").toString()));
        mov.setPago(Boolean.parseBoolean(dados.getOrDefault("pago", false).toString()));
        if (mov.getPago()) mov.setDataPagamento(LocalDate.now());
        if (dados.containsKey("referencia") && dados.get("referencia") != null)
            mov.setReferencia(dados.get("referencia").toString());
        if (dados.containsKey("observacoes") && dados.get("observacoes") != null)
            mov.setObservacoes(dados.get("observacoes").toString());

        // Vale = adiantamento já entregue; permanece "não pago" até abater no fechamento do ciclo
        if (mov.getTipo() == TipoMovimentacao.VALE) {
            mov.setPago(false);
            mov.setDataPagamento(null);
            if (mov.getReferencia() == null || mov.getReferencia().isBlank()) {
                mov.setReferencia("Adiantamento (vale) — a descontar no próximo pagamento");
            }
        }

        movRepo.save(mov);

        // Ao quitar um pagamento de folha, abate automaticamente os vales em aberto
        if (mov.getTipo() == TipoMovimentacao.PAGAMENTO && Boolean.TRUE.equals(mov.getPago())) {
            LocalDate ate = mov.getDataPagamento() != null ? mov.getDataPagamento() : mov.getData();
            abaterValesPendentes(func.getId(), ate);
        }

        return ResponseEntity.ok(toMap(mov));
    }

    // ─── Atualização ───────────────────────────────────────────

    @PutMapping("/funcionarios/{funcId}/movimentacoes/{movId}")
    public ResponseEntity<?> atualizar(
        @PathVariable Long funcId,
        @PathVariable Long movId,
        @RequestBody Map<String, Object> dados
    ) {
        MovimentacaoFuncionario mov = movRepo.findById(movId).orElse(null);
        if (mov == null || !mov.getFuncionario().getId().equals(funcId))
            return ResponseEntity.notFound().build();

        boolean eraPago = Boolean.TRUE.equals(mov.getPago());

        if (dados.containsKey("valor"))
            mov.setValor(new BigDecimal(dados.get("valor").toString()));
        if (dados.containsKey("data"))
            mov.setData(LocalDate.parse(dados.get("data").toString()));
        if (dados.containsKey("referencia"))
            mov.setReferencia(dados.get("referencia") != null ? dados.get("referencia").toString() : null);
        if (dados.containsKey("observacoes"))
            mov.setObservacoes(dados.get("observacoes") != null ? dados.get("observacoes").toString() : null);
        if (dados.containsKey("pago")) {
            boolean pago = Boolean.parseBoolean(dados.get("pago").toString());
            mov.setPago(pago);
            if (pago && mov.getDataPagamento() == null) mov.setDataPagamento(LocalDate.now());
            if (!pago) mov.setDataPagamento(null);
        }

        movRepo.save(mov);

        if (mov.getTipo() == TipoMovimentacao.PAGAMENTO && !eraPago && Boolean.TRUE.equals(mov.getPago())) {
            LocalDate ate = mov.getDataPagamento() != null ? mov.getDataPagamento() : mov.getData();
            abaterValesPendentes(funcId, ate);
        }

        return ResponseEntity.ok(toMap(mov));
    }

    // ─── Marcar como pago ──────────────────────────────────────

    @PatchMapping("/funcionarios/{funcId}/movimentacoes/{movId}/pagar")
    public ResponseEntity<?> pagar(
        @PathVariable Long funcId,
        @PathVariable Long movId,
        @RequestBody(required = false) Map<String, Object> dados
    ) {
        MovimentacaoFuncionario mov = movRepo.findById(movId).orElse(null);
        if (mov == null || !mov.getFuncionario().getId().equals(funcId))
            return ResponseEntity.notFound().build();

        LocalDate dataPagamento =
            dados != null && dados.containsKey("dataPagamento")
                ? LocalDate.parse(dados.get("dataPagamento").toString())
                : LocalDate.now();

        mov.setPago(true);
        mov.setDataPagamento(dataPagamento);
        if (dados != null && dados.containsKey("observacoes"))
            mov.setObservacoes(dados.get("observacoes") != null ? dados.get("observacoes").toString() : null);

        movRepo.save(mov);

        // Pagamento de folha quitado → desconta vales abertos (adiantamentos do ciclo)
        if (mov.getTipo() == TipoMovimentacao.PAGAMENTO) {
            abaterValesPendentes(funcId, dataPagamento);
        }

        return ResponseEntity.ok(toMap(mov));
    }

    /**
     * Marca como abatidos todos os vales (adiantamentos) em aberto até a data do pagamento.
     * O valor já saiu no momento do vale; aqui só registra que foi descontado do fechamento.
     */
    private void abaterValesPendentes(Long funcId, LocalDate ate) {
        List<MovimentacaoFuncionario> vales = movRepo.findValesPendentesAte(funcId, TipoMovimentacao.VALE, ate);
        for (MovimentacaoFuncionario vale : vales) {
            vale.setPago(true);
            vale.setDataPagamento(ate);
            String marca = "Abatido no pagamento de " + ate;
            String obs = vale.getObservacoes();
            if (obs == null || obs.isBlank()) {
                vale.setObservacoes(marca);
            } else if (!obs.contains("Abatido no pagamento")) {
                vale.setObservacoes(obs + " | " + marca);
            }
            movRepo.save(vale);
        }
    }

    // ─── Exclusão ──────────────────────────────────────────────

    @DeleteMapping("/funcionarios/{funcId}/movimentacoes/{movId}")
    public ResponseEntity<?> remover(@PathVariable Long funcId, @PathVariable Long movId) {
        MovimentacaoFuncionario mov = movRepo.findById(movId).orElse(null);
        if (mov == null || !mov.getFuncionario().getId().equals(funcId))
            return ResponseEntity.notFound().build();
        movRepo.delete(mov);
        return ResponseEntity.ok(Map.of("success", true));
    }

    // ─── Último pagamento (início do ciclo atual) ──────────────

    /**
     * Retorna o último pagamento quitado do funcionário.
     * O dia seguinte a esse pagamento é o início do ciclo atual.
     */
    @GetMapping("/funcionarios/{id}/movimentacoes/ultimo-pagamento")
    public ResponseEntity<?> ultimoPagamento(@PathVariable Long id) {
        if (!funcRepo.existsById(id)) return ResponseEntity.notFound().build();

        List<MovimentacaoFuncionario> lista =
            movRepo.findUltimosPagamentos(id, PageRequest.of(0, 1));

        if (lista.isEmpty()) {
            return ResponseEntity.ok(Map.of("encontrado", false));
        }

        MovimentacaoFuncionario ult = lista.get(0);
        LocalDate dataPgto = ult.getDataPagamento() != null ? ult.getDataPagamento() : ult.getData();
        LocalDate inicioCiclo = dataPgto.plusDays(1);

        return ResponseEntity.ok(Map.of(
            "encontrado", true,
            "id", ult.getId(),
            "dataPagamento", dataPgto.toString(),
            "inicioCiclo", inicioCiclo.toString(),
            "valor", ult.getValor(),
            "referencia", ult.getReferencia() != null ? ult.getReferencia() : ""
        ));
    }

    // ─── Resumo financeiro do funcionário ──────────────────────

    @GetMapping("/funcionarios/{id}/movimentacoes/resumo")
    public ResponseEntity<?> resumo(
        @PathVariable Long id,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate inicio,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fim
    ) {
        BigDecimal totalPagamentos = movRepo.somarPorTipo(id, TipoMovimentacao.PAGAMENTO, inicio, fim);
        BigDecimal totalVales      = movRepo.somarPorTipo(id, TipoMovimentacao.VALE, inicio, fim);
        BigDecimal totalDescontos  = movRepo.somarPorTipo(id, TipoMovimentacao.DESCONTO, inicio, fim);
        BigDecimal valesPendentes  = movRepo.somarValesPendentesAte(id, TipoMovimentacao.VALE, fim);

        return ResponseEntity.ok(Map.of(
            "totalPagamentos", totalPagamentos,
            "totalVales", totalVales,
            "totalDescontos", totalDescontos,
            "valesPendentes", valesPendentes
        ));
    }

    // ─── Helper ────────────────────────────────────────────────

    private Map<String, Object> toMap(MovimentacaoFuncionario m) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", m.getId());
        map.put("funcionarioId", m.getFuncionario().getId());
        map.put("funcionarioNome", m.getFuncionario().getNome());
        map.put("tipo", m.getTipo().name());
        map.put("valor", m.getValor());
        map.put("data", m.getData().toString());
        map.put("dataPagamento", m.getDataPagamento() != null ? m.getDataPagamento().toString() : null);
        map.put("pago", m.getPago());
        map.put("referencia", m.getReferencia() != null ? m.getReferencia() : "");
        map.put("observacoes", m.getObservacoes() != null ? m.getObservacoes() : "");
        map.put("criadoEm", m.getCriadoEm() != null ? m.getCriadoEm().toString() : "");
        return map;
    }
}
