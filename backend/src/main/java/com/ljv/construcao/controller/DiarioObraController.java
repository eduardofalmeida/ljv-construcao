package com.ljv.construcao.controller;

import com.ljv.construcao.model.DiarioObra;
import com.ljv.construcao.model.Obra;
import com.ljv.construcao.repository.DiarioObraRepository;
import com.ljv.construcao.repository.ObraRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/obras/{obraId}/diario")
@RequiredArgsConstructor
public class DiarioObraController {

    private final DiarioObraRepository diarioRepository;
    private final ObraRepository obraRepository;

    @GetMapping
    public ResponseEntity<List<DiarioObra>> listar(@PathVariable Long obraId) {
        return ResponseEntity.ok(diarioRepository.findByObraIdOrderByDataDesc(obraId));
    }

    @PostMapping
    public ResponseEntity<DiarioObra> criar(
        @PathVariable Long obraId,
        @Valid @RequestBody DiarioObra diario
    ) {
        Obra obra = obraRepository.findById(obraId)
            .orElse(null);
        if (obra == null) return ResponseEntity.notFound().build();

        diario.setId(null);
        diario.setObra(obra);
        return ResponseEntity.ok(diarioRepository.save(diario));
    }

    @PutMapping("/{id}")
    public ResponseEntity<DiarioObra> atualizar(
        @PathVariable Long obraId,
        @PathVariable Long id,
        @Valid @RequestBody DiarioObra dados
    ) {
        return diarioRepository.findById(id).map(d -> {
            d.setData(dados.getData());
            d.setDescricao(dados.getDescricao());
            d.setTrabalhadores(dados.getTrabalhadores());
            d.setClima(dados.getClima());
            d.setAtividades(dados.getAtividades());
            d.setObservacoes(dados.getObservacoes());
            return ResponseEntity.ok(diarioRepository.save(d));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> remover(@PathVariable Long obraId, @PathVariable Long id) {
        if (!diarioRepository.existsById(id)) return ResponseEntity.notFound().build();
        diarioRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
