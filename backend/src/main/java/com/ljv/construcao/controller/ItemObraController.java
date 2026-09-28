package com.ljv.construcao.controller;

import com.ljv.construcao.model.ItemObra;
import com.ljv.construcao.model.ItemOrcamento;
import com.ljv.construcao.model.Obra;
import com.ljv.construcao.model.Orcamento;
import com.ljv.construcao.repository.ItemObraRepository;
import com.ljv.construcao.repository.ObraRepository;
import com.ljv.construcao.repository.OrcamentoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/obras/{obraId}/itens")
@RequiredArgsConstructor
public class ItemObraController {

    private final ItemObraRepository repo;
    private final ObraRepository obraRepo;
    private final OrcamentoRepository orcamentoRepo;

    @GetMapping
    public ResponseEntity<?> listar(@PathVariable Long obraId) {
        if (!obraRepo.existsById(obraId)) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(repo.findByObraIdOrdered(obraId).stream().map(this::toMap).toList());
    }

    @PostMapping
    public ResponseEntity<?> criar(@PathVariable Long obraId, @RequestBody Map<String, Object> dados) {
        Obra obra = obraRepo.findById(obraId).orElse(null);
        if (obra == null) return ResponseEntity.notFound().build();

        ItemObra item = new ItemObra();
        item.setObra(obra);
        item.setOrigem("ADICIONADO");
        item.setAtivo(true);
        item.setDataInclusao(LocalDate.now());
        aplicar(item, dados);
        if (item.getDescricao() == null || item.getDescricao().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("erro", "Descrição é obrigatória"));
        }
        if (item.getOrdem() == null) {
            item.setOrdem((int) repo.countByObraId(obraId));
        }
        item.recalcularTotal();
        ItemObra salvo = repo.save(item);
        sincronizarContrato(obraId);
        return ResponseEntity.ok(toMap(salvo));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> atualizar(
        @PathVariable Long obraId, @PathVariable Long id, @RequestBody Map<String, Object> dados
    ) {
        ItemObra item = repo.findById(id).orElse(null);
        if (item == null || !item.getObra().getId().equals(obraId)) return ResponseEntity.notFound().build();
        if (!Boolean.TRUE.equals(item.getAtivo())) {
            return ResponseEntity.badRequest().body(Map.of("erro", "Item retirado não pode ser editado. Reative-o antes."));
        }
        aplicar(item, dados);
        if (item.getDescricao() == null || item.getDescricao().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("erro", "Descrição é obrigatória"));
        }
        item.recalcularTotal();
        ItemObra salvo = repo.save(item);
        sincronizarContrato(obraId);
        return ResponseEntity.ok(toMap(salvo));
    }

    @PatchMapping("/{id}/retirar")
    public ResponseEntity<?> retirar(
        @PathVariable Long obraId, @PathVariable Long id, @RequestBody(required = false) Map<String, Object> dados
    ) {
        ItemObra item = repo.findById(id).orElse(null);
        if (item == null || !item.getObra().getId().equals(obraId)) return ResponseEntity.notFound().build();
        item.setAtivo(false);
        item.setDataRemocao(LocalDate.now());
        if (dados != null && dados.get("motivoRemocao") != null) {
            String motivo = dados.get("motivoRemocao").toString().trim();
            item.setMotivoRemocao(motivo.isEmpty() ? null : motivo);
        }
        ItemObra salvo = repo.save(item);
        sincronizarContrato(obraId);
        return ResponseEntity.ok(toMap(salvo));
    }

    @PatchMapping("/{id}/reativar")
    public ResponseEntity<?> reativar(@PathVariable Long obraId, @PathVariable Long id) {
        ItemObra item = repo.findById(id).orElse(null);
        if (item == null || !item.getObra().getId().equals(obraId)) return ResponseEntity.notFound().build();
        item.setAtivo(true);
        item.setDataRemocao(null);
        item.setMotivoRemocao(null);
        ItemObra salvo = repo.save(item);
        sincronizarContrato(obraId);
        return ResponseEntity.ok(toMap(salvo));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> remover(@PathVariable Long obraId, @PathVariable Long id) {
        ItemObra item = repo.findById(id).orElse(null);
        if (item == null || !item.getObra().getId().equals(obraId)) return ResponseEntity.notFound().build();
        repo.delete(item);
        sincronizarContrato(obraId);
        return ResponseEntity.ok(Map.of("success", true));
    }

    /** Importa itens do orçamento ligado à obra (obras antigas sem escopo). */
    @PostMapping("/importar-orcamento")
    public ResponseEntity<?> importarOrcamento(@PathVariable Long obraId) {
        Obra obra = obraRepo.findById(obraId).orElse(null);
        if (obra == null) return ResponseEntity.notFound().build();
        if (repo.existsByObraId(obraId)) {
            return ResponseEntity.badRequest().body(Map.of("erro", "Esta obra já possui serviços cadastrados"));
        }
        Orcamento orc = orcamentoRepo.findByObraIdComItens(obraId).orElse(null);
        if (orc == null || orc.getItens() == null || orc.getItens().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("erro", "Nenhum orçamento com itens encontrado para esta obra"));
        }
        copiarItensDoOrcamento(obra, orc.getItens());
        sincronizarContrato(obraId);
        return ResponseEntity.ok(repo.findByObraIdOrdered(obraId).stream().map(this::toMap).toList());
    }

    public static void copiarItensDoOrcamento(Obra obra, List<ItemOrcamento> origem, ItemObraRepository itemRepo) {
        if (origem == null || origem.isEmpty()) return;
        int ordem = 0;
        for (ItemOrcamento src : origem) {
            if (src.getDescricao() == null || src.getDescricao().isBlank()) continue;
            ItemObra item = new ItemObra();
            item.setObra(obra);
            item.setDescricao(src.getDescricao().trim());
            item.setObservacao(src.getObservacao());
            item.setUnidade(src.getUnidade() != null ? src.getUnidade() : "vb");
            item.setQuantidade(src.getQuantidade() != null ? src.getQuantidade() : BigDecimal.ONE);
            item.setValorUnitario(src.getValorUnitario() != null ? src.getValorUnitario() : BigDecimal.ZERO);
            item.setValorTotal(src.getValorTotal() != null ? src.getValorTotal() : BigDecimal.ZERO);
            item.recalcularTotal();
            item.setOrdem(src.getOrdem() != null ? src.getOrdem() : ordem);
            item.setOrigem("ORCAMENTO");
            item.setItemOrcamentoId(src.getId());
            item.setAtivo(true);
            item.setDataInclusao(LocalDate.now());
            itemRepo.save(item);
            ordem++;
        }
    }

    private void copiarItensDoOrcamento(Obra obra, List<ItemOrcamento> origem) {
        copiarItensDoOrcamento(obra, origem, repo);
    }

    private void sincronizarContrato(Long obraId) {
        Obra obra = obraRepo.findById(obraId).orElse(null);
        if (obra == null) return;
        if (!repo.existsByObraId(obraId)) return;
        BigDecimal total = nvl(repo.somarAtivos(obraId));
        obra.setValorContrato(total);
        obraRepo.save(obra);
    }

    private void aplicar(ItemObra item, Map<String, Object> dados) {
        if (dados.containsKey("descricao")) item.setDescricao(str(dados.get("descricao")));
        if (dados.containsKey("observacao")) item.setObservacao(str(dados.get("observacao")));
        if (dados.containsKey("unidade")) {
            String u = str(dados.get("unidade"));
            item.setUnidade(u != null ? u : "vb");
        }
        if (dados.get("quantidade") != null)
            item.setQuantidade(new BigDecimal(dados.get("quantidade").toString()));
        if (dados.get("valorUnitario") != null)
            item.setValorUnitario(new BigDecimal(dados.get("valorUnitario").toString()));
        if (dados.get("ordem") != null)
            item.setOrdem(Integer.parseInt(dados.get("ordem").toString()));
        if (item.getQuantidade() == null) item.setQuantidade(BigDecimal.ONE);
        if (item.getValorUnitario() == null) item.setValorUnitario(BigDecimal.ZERO);
        if (item.getUnidade() == null || item.getUnidade().isBlank()) item.setUnidade("vb");
    }

    private Map<String, Object> toMap(ItemObra i) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", i.getId());
        m.put("obraId", i.getObra() != null ? i.getObra().getId() : null);
        m.put("descricao", i.getDescricao() != null ? i.getDescricao() : "");
        m.put("observacao", i.getObservacao() != null ? i.getObservacao() : "");
        m.put("unidade", i.getUnidade() != null ? i.getUnidade() : "vb");
        m.put("quantidade", i.getQuantidade());
        m.put("valorUnitario", i.getValorUnitario());
        m.put("valorTotal", i.getValorTotal());
        m.put("ordem", i.getOrdem());
        m.put("origem", i.getOrigem() != null ? i.getOrigem() : "ADICIONADO");
        m.put("itemOrcamentoId", i.getItemOrcamentoId());
        m.put("ativo", i.getAtivo() == null || i.getAtivo());
        m.put("dataInclusao", i.getDataInclusao() != null ? i.getDataInclusao().toString() : null);
        m.put("dataRemocao", i.getDataRemocao() != null ? i.getDataRemocao().toString() : null);
        m.put("motivoRemocao", i.getMotivoRemocao() != null ? i.getMotivoRemocao() : "");
        return m;
    }

    private String str(Object v) {
        if (v == null) return null;
        String s = v.toString().trim();
        return s.isEmpty() ? null : s;
    }

    private BigDecimal nvl(BigDecimal v) {
        return v != null ? v : BigDecimal.ZERO;
    }
}
