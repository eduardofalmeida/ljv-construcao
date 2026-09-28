package com.ljv.construcao.controller;

import com.ljv.construcao.model.ConfiguracaoSite;
import com.ljv.construcao.repository.ConfiguracaoSiteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/config/site")
@RequiredArgsConstructor
public class ConfiguracaoSiteController {

    private final ConfiguracaoSiteRepository repo;

    /** Retorna todas as configurações como mapa chave→valor (público) */
    @GetMapping
    public ResponseEntity<Map<String, String>> listar() {
        Map<String, String> mapa = new HashMap<>();
        repo.findAll().forEach(c -> mapa.put(c.getChave(), c.getValor()));
        return ResponseEntity.ok(mapa);
    }

    /** Salva ou atualiza múltiplas configurações */
    @PutMapping
    public ResponseEntity<Map<String, String>> salvar(@RequestBody Map<String, String> dados) {
        dados.forEach((chave, valor) -> {
            ConfiguracaoSite cfg = repo.findById(chave).orElse(new ConfiguracaoSite());
            cfg.setChave(chave);
            cfg.setValor(valor);
            repo.save(cfg);
        });
        return listar();
    }
}
