package com.ljv.construcao.controller;

import com.ljv.construcao.model.Obra;
import com.ljv.construcao.model.RecebimentoObra;
import com.ljv.construcao.model.Transacao;
import com.ljv.construcao.model.enums.TipoTransacao;
import com.ljv.construcao.repository.AditivoObraRepository;
import com.ljv.construcao.repository.ItemObraRepository;
import com.ljv.construcao.repository.ObraRepository;
import com.ljv.construcao.repository.RecebimentoObraRepository;
import com.ljv.construcao.repository.TransacaoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/obras/{obraId}/recebimentos")
@RequiredArgsConstructor
public class RecebimentoObraController {

    private final RecebimentoObraRepository repo;
    private final ObraRepository obraRepo;
    private final TransacaoRepository transacaoRepo;
    private final AditivoObraRepository aditivoRepo;
    private final ItemObraRepository itemObraRepo;

    @GetMapping
    public ResponseEntity<?> listar(@PathVariable Long obraId) {
        if (!obraRepo.existsById(obraId)) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(repo.findByObraIdOrderByDataDesc(obraId).stream().map(this::toMap).toList());
    }

    @GetMapping("/resumo")
    public ResponseEntity<?> resumo(@PathVariable Long obraId) {
        Obra obra = obraRepo.findById(obraId).orElse(null);
        if (obra == null) return ResponseEntity.notFound().build();

        boolean temItens = itemObraRepo.existsByObraId(obraId);
        BigDecimal escopo = temItens ? nvl(itemObraRepo.somarAtivos(obraId)) : nvl(obra.getValorContrato());
        BigDecimal contrato = nvl(obra.getValorContrato());
        BigDecimal parcela = nvl(obra.getValorParcela());
        BigDecimal extras = nvl(aditivoRepo.somarCobravel(obraId));
        BigDecimal aReceber = escopo.add(extras);
        BigDecimal recebido = nvl(repo.somarRecebido(obraId));
        BigDecimal pendente = nvl(repo.somarPendente(obraId));
        BigDecimal saldo = aReceber.subtract(recebido);
        int pct = aReceber.compareTo(BigDecimal.ZERO) > 0
            ? recebido.multiply(BigDecimal.valueOf(100)).divide(aReceber, 0, java.math.RoundingMode.HALF_UP).intValue()
            : 0;

        Map<String, Object> m = new LinkedHashMap<>();
        m.put("obraId", obraId);
        m.put("valorContrato", contrato);
        m.put("totalEscopo", escopo);
        m.put("temItens", temItens);
        m.put("quantidadeItensAtivos", itemObraRepo.countByObraIdAndAtivoTrue(obraId));
        m.put("quantidadeItens", itemObraRepo.countByObraId(obraId));
        m.put("valorParcela", parcela);
        m.put("periodicidade", obra.getPeriodicidadePagamento() != null
            ? obra.getPeriodicidadePagamento().name() : "SEMANAL");
        m.put("totalAditivos", extras);
        m.put("totalAReceber", aReceber);
        m.put("totalRecebido", recebido);
        m.put("totalPendente", pendente);
        m.put("saldoContrato", saldo);
        m.put("percentualRecebido", Math.min(100, Math.max(0, pct)));
        m.put("quantidadeRecebido", repo.countByObraIdAndRecebidoTrue(obraId));
        m.put("quantidadeAditivos", aditivoRepo.countByObraId(obraId));
        return ResponseEntity.ok(m);
    }

    @PostMapping
    public ResponseEntity<?> criar(@PathVariable Long obraId, @RequestBody Map<String, Object> dados) {
        Obra obra = obraRepo.findById(obraId).orElse(null);
        if (obra == null) return ResponseEntity.notFound().build();

        RecebimentoObra r = new RecebimentoObra();
        r.setObra(obra);
        aplicar(r, dados);
        if (r.getValor() == null && obra.getValorParcela() != null) r.setValor(obra.getValorParcela());
        if (r.getValor() == null) r.setValor(BigDecimal.ZERO);
        if (r.getData() == null) r.setData(LocalDate.now());
        if (r.getRecebido() == null) r.setRecebido(true);
        if (r.getTipo() == null || r.getTipo().isBlank()) r.setTipo("PARCELA");
        if (Boolean.TRUE.equals(r.getRecebido()) && r.getDataRecebimento() == null) {
            r.setDataRecebimento(r.getData());
        }
        sincronizarFinanceiro(r);
        return ResponseEntity.ok(toMap(repo.save(r)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> atualizar(
        @PathVariable Long obraId, @PathVariable Long id, @RequestBody Map<String, Object> dados
    ) {
        RecebimentoObra r = repo.findById(id).orElse(null);
        if (r == null || !r.getObra().getId().equals(obraId)) return ResponseEntity.notFound().build();
        aplicar(r, dados);
        if (Boolean.TRUE.equals(r.getRecebido()) && r.getDataRecebimento() == null) {
            r.setDataRecebimento(LocalDate.now());
        }
        sincronizarFinanceiro(r);
        return ResponseEntity.ok(toMap(repo.save(r)));
    }

    @PatchMapping("/{id}/receber")
    public ResponseEntity<?> marcarRecebido(
        @PathVariable Long obraId, @PathVariable Long id, @RequestBody(required = false) Map<String, Object> dados
    ) {
        RecebimentoObra r = repo.findById(id).orElse(null);
        if (r == null || !r.getObra().getId().equals(obraId)) return ResponseEntity.notFound().build();
        r.setRecebido(true);
        r.setDataRecebimento(
            dados != null && dados.get("dataRecebimento") != null
                ? LocalDate.parse(dados.get("dataRecebimento").toString())
                : LocalDate.now()
        );
        if (dados != null && dados.get("formaPagamento") != null)
            r.setFormaPagamento(dados.get("formaPagamento").toString());
        sincronizarFinanceiro(r);
        return ResponseEntity.ok(toMap(repo.save(r)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> remover(@PathVariable Long obraId, @PathVariable Long id) {
        RecebimentoObra r = repo.findById(id).orElse(null);
        if (r == null || !r.getObra().getId().equals(obraId)) return ResponseEntity.notFound().build();
        if (r.getTransacaoId() != null && transacaoRepo.existsById(r.getTransacaoId())) {
            transacaoRepo.deleteById(r.getTransacaoId());
        }
        repo.delete(r);
        return ResponseEntity.ok(Map.of("success", true));
    }

    private void aplicar(RecebimentoObra r, Map<String, Object> dados) {
        if (dados.get("valor") != null) r.setValor(new BigDecimal(dados.get("valor").toString()));
        if (dados.get("data") != null) r.setData(LocalDate.parse(dados.get("data").toString()));
        if (dados.containsKey("dataRecebimento")) {
            r.setDataRecebimento(dados.get("dataRecebimento") != null
                ? LocalDate.parse(dados.get("dataRecebimento").toString()) : null);
        }
        if (dados.containsKey("referencia"))
            r.setReferencia(dados.get("referencia") != null ? dados.get("referencia").toString() : null);
        if (dados.containsKey("tipo"))
            r.setTipo(dados.get("tipo") != null ? dados.get("tipo").toString() : null);
        if (dados.containsKey("formaPagamento"))
            r.setFormaPagamento(dados.get("formaPagamento") != null ? dados.get("formaPagamento").toString() : null);
        if (dados.containsKey("observacoes"))
            r.setObservacoes(dados.get("observacoes") != null ? dados.get("observacoes").toString() : null);
        if (dados.get("recebido") != null)
            r.setRecebido(Boolean.parseBoolean(dados.get("recebido").toString()));
    }

    private void sincronizarFinanceiro(RecebimentoObra r) {
        if (Boolean.TRUE.equals(r.getRecebido())) {
            Transacao t = r.getTransacaoId() != null
                ? transacaoRepo.findById(r.getTransacaoId()).orElse(new Transacao())
                : new Transacao();
            String ref = r.getReferencia() != null && !r.getReferencia().isBlank()
                ? " — " + r.getReferencia() : "";
            t.setTipo(TipoTransacao.RECEITA);
            t.setDescricao("Recebimento da obra " + r.getObra().getNome() + ref);
            t.setCategoria("Recebimento de cliente");
            t.setValor(r.getValor());
            t.setData(r.getData());
            t.setDataPagamento(r.getDataRecebimento() != null ? r.getDataRecebimento() : r.getData());
            t.setFormaPagamento(r.getFormaPagamento());
            t.setObra(r.getObra());
            t.setCliente(r.getObra().getCliente());
            t.setPago(true);
            t.setObservacoes(r.getObservacoes());
            transacaoRepo.save(t);
            r.setTransacaoId(t.getId());
        } else if (r.getTransacaoId() != null) {
            if (transacaoRepo.existsById(r.getTransacaoId())) {
                transacaoRepo.deleteById(r.getTransacaoId());
            }
            r.setTransacaoId(null);
        }
    }

    private Map<String, Object> toMap(RecebimentoObra r) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", r.getId());
        m.put("obraId", r.getObra().getId());
        m.put("valor", r.getValor());
        m.put("data", r.getData() != null ? r.getData().toString() : null);
        m.put("dataRecebimento", r.getDataRecebimento() != null ? r.getDataRecebimento().toString() : null);
        m.put("referencia", r.getReferencia() != null ? r.getReferencia() : "");
        m.put("tipo", r.getTipo() != null ? r.getTipo() : "PARCELA");
        m.put("formaPagamento", r.getFormaPagamento() != null ? r.getFormaPagamento() : "");
        m.put("observacoes", r.getObservacoes() != null ? r.getObservacoes() : "");
        m.put("recebido", r.getRecebido());
        return m;
    }

    private BigDecimal nvl(BigDecimal v) {
        return v != null ? v : BigDecimal.ZERO;
    }
}
