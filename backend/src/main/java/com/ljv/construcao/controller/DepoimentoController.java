package com.ljv.construcao.controller;

import com.ljv.construcao.model.Depoimento;
import com.ljv.construcao.model.enums.StatusDepoimento;
import com.ljv.construcao.repository.DepoimentoRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/depoimentos")
@RequiredArgsConstructor
public class DepoimentoController {

    private final DepoimentoRepository repo;

    // ─── PÚBLICO ──────────────────────────────────────────────

    /** Lista apenas os depoimentos aprovados (para a landing page) */
    @GetMapping("/aprovados")
    public ResponseEntity<List<Depoimento>> listarAprovados() {
        return ResponseEntity.ok(repo.findByStatusOrderByCriadoEmDesc(StatusDepoimento.APROVADO));
    }

    /** Visitante envia um novo depoimento (sempre entra como PENDENTE) */
    @PostMapping
    public ResponseEntity<?> enviar(@Valid @RequestBody Depoimento depoimento) {
        depoimento.setId(null);
        depoimento.setStatus(StatusDepoimento.PENDENTE);
        depoimento.setNotaAdmin(null);
        repo.save(depoimento);
        return ResponseEntity.ok(Map.of(
            "success", true,
            "mensagem", "Depoimento enviado com sucesso! Será publicado após análise da equipe."
        ));
    }

    // ─── ADMIN ────────────────────────────────────────────────

    /** Lista todos os depoimentos (admin) */
    @GetMapping
    public ResponseEntity<List<Depoimento>> listarTodos(
        @RequestParam(required = false) StatusDepoimento status
    ) {
        if (status != null) return ResponseEntity.ok(repo.findByStatusOrderByCriadoEmDesc(status));
        return ResponseEntity.ok(repo.findAllByOrderByCriadoEmDesc());
    }

    /** Contadores por status */
    @GetMapping("/contadores")
    public ResponseEntity<?> contadores() {
        return ResponseEntity.ok(Map.of(
            "pendentes",  repo.countByStatus(StatusDepoimento.PENDENTE),
            "aprovados",  repo.countByStatus(StatusDepoimento.APROVADO),
            "reprovados", repo.countByStatus(StatusDepoimento.REPROVADO)
        ));
    }

    /** Aprovar um depoimento */
    @PatchMapping("/{id}/aprovar")
    public ResponseEntity<?> aprovar(
        @PathVariable Long id,
        @RequestBody(required = false) Map<String, String> body
    ) {
        return repo.findById(id).map(d -> {
            d.setStatus(StatusDepoimento.APROVADO);
            if (body != null && body.containsKey("notaAdmin")) d.setNotaAdmin(body.get("notaAdmin"));
            return ResponseEntity.ok(repo.save(d));
        }).orElse(ResponseEntity.notFound().build());
    }

    /** Reprovar um depoimento */
    @PatchMapping("/{id}/reprovar")
    public ResponseEntity<?> reprovar(
        @PathVariable Long id,
        @RequestBody(required = false) Map<String, String> body
    ) {
        return repo.findById(id).map(d -> {
            d.setStatus(StatusDepoimento.REPROVADO);
            if (body != null && body.containsKey("notaAdmin")) d.setNotaAdmin(body.get("notaAdmin"));
            return ResponseEntity.ok(repo.save(d));
        }).orElse(ResponseEntity.notFound().build());
    }

    /** Excluir depoimento */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable Long id) {
        if (!repo.existsById(id)) return ResponseEntity.notFound().build();
        repo.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
