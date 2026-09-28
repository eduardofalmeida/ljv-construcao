package com.ljv.construcao.controller;

import com.ljv.construcao.model.Obra;
import com.ljv.construcao.model.enums.StatusObra;
import com.ljv.construcao.repository.ObraRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/obras")
@RequiredArgsConstructor
public class ObraController {

    private final ObraRepository obraRepository;

    @GetMapping
    public ResponseEntity<Page<Obra>> listar(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size,
        @RequestParam(required = false) String q,
        @RequestParam(required = false) StatusObra status
    ) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "criadoEm"));
        Page<Obra> resultado;
        if (q != null && !q.isBlank()) {
            resultado = obraRepository.buscar(q, pageable);
        } else if (status != null) {
            resultado = obraRepository.findByStatus(status, pageable);
        } else {
            resultado = obraRepository.findAllComCliente(pageable);
        }
        return ResponseEntity.ok(resultado);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Obra> buscarPorId(@PathVariable Long id) {
        return obraRepository.findDetalheById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Obra> criar(@Valid @RequestBody Obra obra) {
        obra.setId(null);
        return ResponseEntity.ok(obraRepository.save(obra));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Obra> atualizar(@PathVariable Long id, @Valid @RequestBody Obra dados) {
        return obraRepository.findById(id).map(obra -> {
            obra.setNome(dados.getNome());
            obra.setDescricao(dados.getDescricao());
            obra.setStatus(dados.getStatus());
            obra.setCliente(dados.getCliente());
            obra.setLogradouro(dados.getLogradouro());
            obra.setNumero(dados.getNumero());
            obra.setComplemento(dados.getComplemento());
            obra.setBairro(dados.getBairro());
            obra.setCidade(dados.getCidade());
            obra.setEstado(dados.getEstado());
            obra.setCep(dados.getCep());
            obra.setValorContrato(dados.getValorContrato());
            obra.setValorOrcado(dados.getValorOrcado());
            obra.setPeriodicidadePagamento(dados.getPeriodicidadePagamento() != null
                ? dados.getPeriodicidadePagamento()
                : com.ljv.construcao.model.enums.PeriodicidadePagamentoObra.SEMANAL);
            obra.setValorParcela(dados.getValorParcela());
            obra.setDataInicio(dados.getDataInicio());
            obra.setDataPrevisaoFim(dados.getDataPrevisaoFim());
            obra.setDataConclusao(dados.getDataConclusao());
            obra.setPercentualConcluido(dados.getPercentualConcluido());
            obra.setObservacoes(dados.getObservacoes());
            return ResponseEntity.ok(obraRepository.save(obra));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> remover(@PathVariable Long id) {
        if (!obraRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        obraRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
