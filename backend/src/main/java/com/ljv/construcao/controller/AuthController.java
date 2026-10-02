package com.ljv.construcao.controller;

import com.ljv.construcao.model.Usuario;
import com.ljv.construcao.repository.UsuarioRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UsuarioRepository usuarioRepository;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> request,
                                   HttpServletRequest httpRequest,
                                   HttpServletResponse httpResponse) {
        String username = request.get("username");
        String password = request.get("password");

        try {
            UsernamePasswordAuthenticationToken token =
                new UsernamePasswordAuthenticationToken(username, password);
            Authentication authentication = authenticationManager.authenticate(token);

            SecurityContext context = SecurityContextHolder.createEmptyContext();
            context.setAuthentication(authentication);
            SecurityContextHolder.setContext(context);
            new HttpSessionSecurityContextRepository().saveContext(context, httpRequest, httpResponse);

            Usuario usuario = usuarioRepository.findByUsername(username).orElseThrow();

            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Login realizado com sucesso",
                "usuario", usuarioToMap(usuario)
            ));
        } catch (BadCredentialsException e) {
            return ResponseEntity.status(401).body(Map.of(
                "success", false,
                "error", "Credenciais inválidas",
                "message", "Usuário ou senha incorretos"
            ));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }
        SecurityContextHolder.clearContext();
        return ResponseEntity.ok(Map.of("success", true, "message", "Logout realizado com sucesso"));
    }

    @GetMapping("/me")
    public ResponseEntity<?> me() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth.getPrincipal().equals("anonymousUser")) {
            return ResponseEntity.status(401).body(Map.of(
                "authenticated", false,
                "message", "Não autenticado"
            ));
        }

        String username = auth.getName();
        return usuarioRepository.findByUsername(username)
            .map(usuario -> ResponseEntity.ok(Map.of(
                "authenticated", true,
                "usuario", usuarioToMap(usuario)
            )))
            .orElse(ResponseEntity.status(401).body(Map.of("authenticated", false)));
    }

    private Map<String, Object> usuarioToMap(Usuario usuario) {
        return Map.of(
            "id", usuario.getId(),
            "username", usuario.getUsername(),
            "nome", usuario.getNome(),
            "email", usuario.getEmail() != null ? usuario.getEmail() : "",
            "perfil", usuario.getPerfil().name(),
            "fotoPerfil", usuario.getFotoPerfil() != null ? usuario.getFotoPerfil() : ""
        );
    }
}
