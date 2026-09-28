package com.ljv.construcao.controller;

import com.ljv.construcao.model.Transacao;
import com.ljv.construcao.model.enums.TipoTransacao;
import com.ljv.construcao.repository.TransacaoRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/financeiro")
@RequiredArgsConstructor
public class TransacaoController {

    private final TransacaoRepository transacaoRepository;

    @GetMapping
    public ResponseEntity<Page<Transacao>> listar(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size,
        @RequestParam(required = false) String q,
        @RequestParam(required = false) TipoTransacao tipo,
        @RequestParam(required = false) Long obraId
    ) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "data"));
        Page<Transacao> resultado;
        if (q != null && !q.isBlank()) {
            resultado = transacaoRepository.buscar(q, pageable);
        } else if (tipo != null) {
            resultado = transacaoRepository.findByTipo(tipo, pageable);
        } else if (obraId != null) {
            resultado = transacaoRepository.findByObraId(obraId, pageable);
        } else {
            resultado = transacaoRepository.findAll(pageable);
        }
        return ResponseEntity.ok(resultado);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Transacao> buscarPorId(@PathVariable Long id) {
        return transacaoRepository.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/resumo")
    public ResponseEntity<?> resumo(
        @RequestParam(required = false) String inicio,
        @RequestParam(required = false) String fim
    ) {
        BigDecimal receitas, despesas;
        if (inicio != null && fim != null) {
            java.time.LocalDate dataInicio = java.time.LocalDate.parse(inicio);
            java.time.LocalDate dataFim = java.time.LocalDate.parse(fim);
            receitas = transacaoRepository.sumByTipoAndPeriodo(TipoTransacao.RECEITA, dataInicio, dataFim);
            despesas = transacaoRepository.sumByTipoAndPeriodo(TipoTransacao.DESPESA, dataInicio, dataFim);
        } else {
            receitas = transacaoRepository.sumByTipo(TipoTransacao.RECEITA);
            despesas = transacaoRepository.sumByTipo(TipoTransacao.DESPESA);
        }
        BigDecimal saldo = (receitas != null ? receitas : BigDecimal.ZERO)
            .subtract(despesas != null ? despesas : BigDecimal.ZERO);
        return ResponseEntity.ok(Map.of(
            "receitas", receitas != null ? receitas : BigDecimal.ZERO,
            "despesas", despesas != null ? despesas : BigDecimal.ZERO,
            "saldo", saldo
        ));
    }

    @PostMapping
    public ResponseEntity<Transacao> criar(@Valid @RequestBody Transacao transacao) {
        transacao.setId(null);
        return ResponseEntity.ok(transacaoRepository.save(transacao));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Transacao> atualizar(@PathVariable Long id, @Valid @RequestBody Transacao dados) {
        return transacaoRepository.findById(id).map(t -> {
            t.setTipo(dados.getTipo());
            t.setDescricao(dados.getDescricao());
            t.setCategoria(dados.getCategoria());
            t.setValor(dados.getValor());
            t.setData(dados.getData());
            t.setDataPagamento(dados.getDataPagamento());
            t.setFormaPagamento(dados.getFormaPagamento());
            t.setObra(dados.getObra());
            t.setCliente(dados.getCliente());
            t.setPago(dados.getPago());
            t.setObservacoes(dados.getObservacoes());
            return ResponseEntity.ok(transacaoRepository.save(t));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> remover(@PathVariable Long id) {
        if (!transacaoRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        transacaoRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
