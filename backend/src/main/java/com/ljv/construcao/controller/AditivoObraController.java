package com.ljv.construcao.controller;

import com.ljv.construcao.model.AditivoObra;
import com.ljv.construcao.model.Obra;
import com.ljv.construcao.repository.AditivoObraRepository;
import com.ljv.construcao.repository.ObraRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/obras/{obraId}/aditivos")
@RequiredArgsConstructor
public class AditivoObraController {

    private final AditivoObraRepository repo;
    private final ObraRepository obraRepo;

    @GetMapping
    public ResponseEntity<?> listar(@PathVariable Long obraId) {
        if (!obraRepo.existsById(obraId)) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(repo.findByObraIdOrderByDataDescIdDesc(obraId).stream().map(this::toMap).toList());
    }

    @PostMapping
    public ResponseEntity<?> criar(@PathVariable Long obraId, @RequestBody Map<String, Object> dados) {
        Obra obra = obraRepo.findById(obraId).orElse(null);
        if (obra == null) return ResponseEntity.notFound().build();

        AditivoObra a = new AditivoObra();
        a.setObra(obra);
        aplicar(a, dados);
        if (a.getDescricao() == null || a.getDescricao().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("erro", "Descrição é obrigatória"));
        }
        if (a.getData() == null) a.setData(LocalDate.now());
        if (a.getCobravel() == null) a.setCobravel(true);
        if (a.getCategoria() == null || a.getCategoria().isBlank()) a.setCategoria("SERVICO_EXTRA");
        a.recalcularTotal();
        return ResponseEntity.ok(toMap(repo.save(a)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> atualizar(
        @PathVariable Long obraId, @PathVariable Long id, @RequestBody Map<String, Object> dados
    ) {
        AditivoObra a = repo.findById(id).orElse(null);
        if (a == null || !a.getObra().getId().equals(obraId)) return ResponseEntity.notFound().build();
        aplicar(a, dados);
        if (a.getDescricao() == null || a.getDescricao().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("erro", "Descrição é obrigatória"));
        }
        a.recalcularTotal();
        return ResponseEntity.ok(toMap(repo.save(a)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> remover(@PathVariable Long obraId, @PathVariable Long id) {
        AditivoObra a = repo.findById(id).orElse(null);
        if (a == null || !a.getObra().getId().equals(obraId)) return ResponseEntity.notFound().build();
        repo.delete(a);
        return ResponseEntity.ok(Map.of("success", true));
    }

    private void aplicar(AditivoObra a, Map<String, Object> dados) {
        if (dados.containsKey("descricao"))
            a.setDescricao(str(dados.get("descricao")));
        if (dados.containsKey("observacao"))
            a.setObservacao(str(dados.get("observacao")));
        if (dados.containsKey("unidade"))
            a.setUnidade(str(dados.get("unidade")));
        if (dados.get("quantidade") != null)
            a.setQuantidade(new BigDecimal(dados.get("quantidade").toString()));
        if (dados.get("valorUnitario") != null)
            a.setValorUnitario(new BigDecimal(dados.get("valorUnitario").toString()));
        if (dados.get("data") != null && !dados.get("data").toString().isBlank())
            a.setData(LocalDate.parse(dados.get("data").toString()));
        if (dados.containsKey("categoria"))
            a.setCategoria(str(dados.get("categoria")));
        if (dados.get("cobravel") != null)
            a.setCobravel(Boolean.parseBoolean(dados.get("cobravel").toString()));
        if (dados.containsKey("solicitadoPor"))
            a.setSolicitadoPor(str(dados.get("solicitadoPor")));
        if (dados.containsKey("observacoes"))
            a.setObservacoes(str(dados.get("observacoes")));
        if (a.getQuantidade() == null) a.setQuantidade(BigDecimal.ONE);
        if (a.getValorUnitario() == null) a.setValorUnitario(BigDecimal.ZERO);
        if (a.getUnidade() == null || a.getUnidade().isBlank()) a.setUnidade("vb");
    }

    private Map<String, Object> toMap(AditivoObra a) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", a.getId());
        m.put("obraId", a.getObra() != null ? a.getObra().getId() : null);
        m.put("descricao", a.getDescricao() != null ? a.getDescricao() : "");
        m.put("observacao", a.getObservacao() != null ? a.getObservacao() : "");
        m.put("unidade", a.getUnidade() != null ? a.getUnidade() : "vb");
        m.put("quantidade", a.getQuantidade());
        m.put("valorUnitario", a.getValorUnitario());
        m.put("valorTotal", a.getValorTotal());
        m.put("data", a.getData() != null ? a.getData().toString() : null);
        m.put("categoria", a.getCategoria() != null ? a.getCategoria() : "SERVICO_EXTRA");
        m.put("cobravel", a.getCobravel() == null || a.getCobravel());
        m.put("solicitadoPor", a.getSolicitadoPor() != null ? a.getSolicitadoPor() : "");
        m.put("observacoes", a.getObservacoes() != null ? a.getObservacoes() : "");
        return m;
    }

    private String str(Object v) {
        if (v == null) return null;
        String s = v.toString().trim();
        return s.isEmpty() ? null : s;
    }
}
