package com.ljv.construcao.controller;

import com.ljv.construcao.model.Funcionario;
import com.ljv.construcao.repository.FuncionarioRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/funcionarios")
@RequiredArgsConstructor
public class FuncionarioController {

    private final FuncionarioRepository funcionarioRepository;

    @GetMapping
    public ResponseEntity<Page<Funcionario>> listar(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size,
        @RequestParam(required = false) String q,
        @RequestParam(required = false) Boolean ativo
    ) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("nome"));

        Page<Funcionario> resultado;
        if (q != null && !q.isBlank()) {
            // Com busca textual
            resultado = (ativo != null && ativo)
                ? funcionarioRepository.buscar(q, pageable)
                : funcionarioRepository.buscarTodos(q, pageable);
        } else {
            // Sem busca
            resultado = (ativo != null && ativo)
                ? funcionarioRepository.findByAtivoTrue(pageable)
                : funcionarioRepository.findAll(pageable);
        }

        return ResponseEntity.ok(resultado);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Funcionario> buscarPorId(@PathVariable Long id) {
        return funcionarioRepository.findById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Funcionario> criar(@Valid @RequestBody Funcionario funcionario) {
        funcionario.setId(null);
        // Garante valores padrão se não informados
        if (funcionario.getAtivo() == null) funcionario.setAtivo(true);
        if (funcionario.getFreelancer() == null) funcionario.setFreelancer(false);
        return ResponseEntity.ok(funcionarioRepository.save(funcionario));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Funcionario> atualizar(@PathVariable Long id, @Valid @RequestBody Funcionario dados) {
        return funcionarioRepository.findById(id).map(f -> {
            f.setNome(dados.getNome());
            f.setCpf(dados.getCpf());
            f.setRg(dados.getRg());
            f.setTelefone(dados.getTelefone());
            f.setCelular(dados.getCelular());
            f.setEmail(dados.getEmail());
            f.setCargo(dados.getCargo());
            f.setEspecialidade(dados.getEspecialidade());
            f.setSalario(dados.getSalario());
            f.setTipoRecebimento(dados.getTipoRecebimento());
            f.setValorDiaria(dados.getValorDiaria());
            f.setFoto(dados.getFoto());
            f.setFreelancer(dados.getFreelancer() != null ? dados.getFreelancer() : false);
            f.setAtivo(dados.getAtivo() != null ? dados.getAtivo() : true);
            f.setDataAdmissao(dados.getDataAdmissao());
            f.setDataDemissao(dados.getDataDemissao());
            f.setLogradouro(dados.getLogradouro());
            f.setNumero(dados.getNumero());
            f.setBairro(dados.getBairro());
            f.setCidade(dados.getCidade());
            f.setEstado(dados.getEstado());
            f.setCep(dados.getCep());
            f.setObservacoes(dados.getObservacoes());
            return ResponseEntity.ok(funcionarioRepository.save(f));
        }).orElse(ResponseEntity.notFound().build());
    }

    /** Inativa um funcionário (soft delete) */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> remover(@PathVariable Long id) {
        return funcionarioRepository.findById(id).map(f -> {
            f.setAtivo(false);
            funcionarioRepository.save(f);
            return ResponseEntity.noContent().<Void>build();
        }).orElse(ResponseEntity.notFound().build());
    }
}
