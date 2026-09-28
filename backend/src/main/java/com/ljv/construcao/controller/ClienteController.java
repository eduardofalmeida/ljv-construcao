package com.ljv.construcao.controller;

import com.ljv.construcao.model.Cliente;
import com.ljv.construcao.repository.ClienteRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/clientes")
@RequiredArgsConstructor
public class ClienteController {

    private final ClienteRepository clienteRepository;

    @GetMapping
    public ResponseEntity<Page<Cliente>> listar(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size,
        @RequestParam(required = false) String q
    ) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("nome"));
        Page<Cliente> resultado = (q != null && !q.isBlank())
            ? clienteRepository.buscar(q, pageable)
            : clienteRepository.findByAtivoTrue(pageable);
        return ResponseEntity.ok(resultado);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Cliente> buscarPorId(@PathVariable Long id) {
        return clienteRepository.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Cliente> criar(@Valid @RequestBody Cliente cliente) {
        cliente.setId(null);
        cliente.setAtivo(true);
        return ResponseEntity.ok(clienteRepository.save(cliente));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Cliente> atualizar(@PathVariable Long id, @Valid @RequestBody Cliente dados) {
        return clienteRepository.findById(id).map(cliente -> {
            cliente.setNome(dados.getNome());
            cliente.setCpfCnpj(dados.getCpfCnpj());
            cliente.setTelefone(dados.getTelefone());
            cliente.setCelular(dados.getCelular());
            cliente.setEmail(dados.getEmail());
            cliente.setLogradouro(dados.getLogradouro());
            cliente.setNumero(dados.getNumero());
            cliente.setComplemento(dados.getComplemento());
            cliente.setBairro(dados.getBairro());
            cliente.setCidade(dados.getCidade());
            cliente.setEstado(dados.getEstado());
            cliente.setCep(dados.getCep());
            cliente.setObservacoes(dados.getObservacoes());
            return ResponseEntity.ok(clienteRepository.save(cliente));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> remover(@PathVariable Long id) {
        return clienteRepository.findById(id).map(cliente -> {
            cliente.setAtivo(false);
            clienteRepository.save(cliente);
            return ResponseEntity.noContent().<Void>build();
        }).orElse(ResponseEntity.notFound().build());
    }
}
