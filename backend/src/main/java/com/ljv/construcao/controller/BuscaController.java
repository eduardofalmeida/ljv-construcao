package com.ljv.construcao.controller;

import com.ljv.construcao.repository.ClienteRepository;
import com.ljv.construcao.repository.ObraRepository;
import com.ljv.construcao.repository.OrcamentoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/busca")
@RequiredArgsConstructor
public class BuscaController {

    private final ClienteRepository clienteRepository;
    private final ObraRepository obraRepository;
    private final OrcamentoRepository orcamentoRepository;

    @GetMapping
    public ResponseEntity<Map<String, Object>> buscar(@RequestParam String q) {
        if (q == null || q.trim().length() < 2) {
            return ResponseEntity.ok(Map.of("clientes", java.util.List.of(), "obras", java.util.List.of(), "orcamentos", java.util.List.of()));
        }

        PageRequest pageable = PageRequest.of(0, 5);
        Map<String, Object> resultado = new HashMap<>();
        resultado.put("clientes", clienteRepository.buscar(q.trim(), pageable).getContent());
        resultado.put("obras", obraRepository.buscar(q.trim(), pageable).getContent());
        resultado.put("orcamentos", orcamentoRepository.buscar(q.trim(), pageable).getContent());
        return ResponseEntity.ok(resultado);
    }
}
