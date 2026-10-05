package com.ljv.construcao.config;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.lang.Nullable;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;

import java.net.URI;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Configuration
public class WebConfig {

    @Value("${app.cors.allowed-origins}")
    private String allowedOrigins;

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new LjvCorsConfiguration();
        config.setAllowedOriginPatterns(padroesDeOrigem());
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        // Vale para qualquer caminho. Com context-path /api, o filtro de segurança
        // às vezes não casa o padrão "/**" e responde 403 Invalid CORS request.
        return (HttpServletRequest request) -> config;
    }

    private List<String> padroesDeOrigem() {
        List<String> padroes = new ArrayList<>(List.of(
            "http://localhost:*",
            "http://127.0.0.1:*",
            "https://*.up.railway.app",
            "https://*.railway.app"
        ));
        Arrays.stream(allowedOrigins.split(","))
            .map(String::trim)
            .map(origem -> origem.replaceAll("^\"|\"$", ""))
            .map(origem -> origem.endsWith("/") ? origem.substring(0, origem.length() - 1) : origem)
            .filter(origem -> !origem.isEmpty() && !origem.equals("*"))
            .forEach(padroes::add);
        return padroes;
    }

    /**
     * Além dos padrões do Spring, aceita localhost e qualquer serviço público do Railway.
     * O navegador envia Origin no login, e o proxy do frontend repassa esse cabeçalho.
     */
    static final class LjvCorsConfiguration extends CorsConfiguration {

        @Override
        @Nullable
        public String checkOrigin(@Nullable String origin) {
            String permitido = super.checkOrigin(origin);
            if (permitido != null || origin == null || origin.isBlank()) {
                return permitido;
            }
            String limpa = origin.trim();
            if (limpa.endsWith("/")) {
                limpa = limpa.substring(0, limpa.length() - 1);
            }
            String host = hostDe(limpa);
            if (host == null) {
                return null;
            }
            host = host.toLowerCase();
            if (host.equals("localhost") || host.equals("127.0.0.1") || host.equals("::1")) {
                return origin;
            }
            if (host.endsWith(".up.railway.app") || host.endsWith(".railway.app")) {
                return "https".equals(esquemaDe(limpa)) ? origin : null;
            }
            return null;
        }

        @Nullable
        private static String hostDe(String origin) {
            try {
                return URI.create(origin).getHost();
            } catch (IllegalArgumentException ex) {
                return null;
            }
        }

        @Nullable
        private static String esquemaDe(String origin) {
            try {
                String scheme = URI.create(origin).getScheme();
                return scheme == null ? null : scheme.toLowerCase();
            } catch (IllegalArgumentException ex) {
                return null;
            }
        }
    }
}
