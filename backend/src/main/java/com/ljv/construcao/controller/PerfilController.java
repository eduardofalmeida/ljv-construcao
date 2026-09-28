package com.ljv.construcao.controller;

import com.ljv.construcao.model.Usuario;
import com.ljv.construcao.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/perfil")
@RequiredArgsConstructor
public class PerfilController {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    /** Retorna os dados do usuário autenticado */
    @GetMapping
    public ResponseEntity<?> getDados() {
        Usuario u = getUsuarioAutenticado();
        if (u == null) return ResponseEntity.status(401).build();
        return ResponseEntity.ok(toResponse(u));
    }

    /** Atualiza nome, email e foto de perfil */
    @PutMapping
    public ResponseEntity<?> atualizar(@RequestBody Map<String, String> dados) {
        Usuario u = getUsuarioAutenticado();
        if (u == null) return ResponseEntity.status(401).build();

        if (dados.containsKey("nome") && !dados.get("nome").isBlank()) {
            u.setNome(dados.get("nome"));
        }
        if (dados.containsKey("email")) {
            u.setEmail(dados.get("email"));
        }
        if (dados.containsKey("fotoPerfil")) {
            u.setFotoPerfil(dados.get("fotoPerfil"));
        }

        usuarioRepository.save(u);
        return ResponseEntity.ok(toResponse(u));
    }

    /** Altera a senha */
    @PutMapping("/senha")
    public ResponseEntity<?> alterarSenha(@RequestBody Map<String, String> dados) {
        Usuario u = getUsuarioAutenticado();
        if (u == null) return ResponseEntity.status(401).build();

        String senhaAtual = dados.get("senhaAtual");
        String novaSenha = dados.get("novaSenha");

        if (!passwordEncoder.matches(senhaAtual, u.getPassword())) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Senha atual incorreta"
            ));
        }

        if (novaSenha == null || novaSenha.length() < 6) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "A nova senha deve ter pelo menos 6 caracteres"
            ));
        }

        u.setPassword(passwordEncoder.encode(novaSenha));
        usuarioRepository.save(u);
        return ResponseEntity.ok(Map.of("success", true, "message", "Senha alterada com sucesso"));
    }

    private Usuario getUsuarioAutenticado() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) return null;
        return usuarioRepository.findByUsername(auth.getName()).orElse(null);
    }

    private Map<String, Object> toResponse(Usuario u) {
        return Map.of(
            "id", u.getId(),
            "username", u.getUsername(),
            "nome", u.getNome(),
            "email", u.getEmail() != null ? u.getEmail() : "",
            "perfil", u.getPerfil().name(),
            "fotoPerfil", u.getFotoPerfil() != null ? u.getFotoPerfil() : ""
        );
    }
}
