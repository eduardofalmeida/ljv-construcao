package com.ljv.construcao.config;

import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

/**
 * Converte a connection string {@code postgresql://} do Neon (ou de qualquer Postgres)
 * para a URL JDBC que o Spring Boot aceita.
 */
public final class NeonDatabaseUrl {

    public record JdbcConfig(String jdbcUrl, String username, String password) {
    }

    private NeonDatabaseUrl() {
    }

    public static Optional<JdbcConfig> toJdbc(String databaseUrl) {
        if (databaseUrl == null || databaseUrl.isBlank()) {
            return Optional.empty();
        }
        String trimmed = databaseUrl.trim();
        if (!trimmed.startsWith("postgres://") && !trimmed.startsWith("postgresql://")) {
            return Optional.empty();
        }

        URI uri;
        try {
            uri = URI.create(trimmed);
        } catch (IllegalArgumentException ex) {
            throw new IllegalStateException("DATABASE_URL do Postgres/Neon está inválida.", ex);
        }
        if (uri.getHost() == null || uri.getUserInfo() == null) {
            throw new IllegalStateException("DATABASE_URL do Postgres/Neon está inválida.");
        }

        String userInfo = uri.getUserInfo();
        int colon = userInfo.indexOf(':');
        String username = decode(colon < 0 ? userInfo : userInfo.substring(0, colon));
        String password = colon < 0 ? "" : decode(userInfo.substring(colon + 1));

        int port = uri.getPort() == -1 ? 5432 : uri.getPort();
        String path = uri.getPath() == null || uri.getPath().isBlank() || "/".equals(uri.getPath())
                ? "/neondb"
                : uri.getPath();

        List<String> params = new ArrayList<>();
        boolean ssl = false;
        boolean prepareThreshold = false;
        String query = uri.getRawQuery();
        if (query != null) {
            for (String pair : query.split("&")) {
                if (pair.isBlank()) {
                    continue;
                }
                String name = pair.split("=", 2)[0];
                if (isChannelBinding(name)) {
                    continue;
                }
                if ("sslmode".equalsIgnoreCase(name)) {
                    ssl = true;
                }
                if ("prepareThreshold".equalsIgnoreCase(name)) {
                    prepareThreshold = true;
                }
                params.add(pair);
            }
        }
        if (!ssl) {
            params.add("sslmode=require");
        }
        // O host -pooler é PgBouncer. O Hibernate usa prepared statements e precisa deste parâmetro.
        if (uri.getHost().contains("-pooler") && !prepareThreshold) {
            params.add("prepareThreshold=0");
        }

        String jdbcUrl = "jdbc:postgresql://" + uri.getHost() + ":" + port + path + "?" + String.join("&", params);
        return Optional.of(new JdbcConfig(jdbcUrl, username, password));
    }

    private static boolean isChannelBinding(String name) {
        String normalized = name.toLowerCase(Locale.ROOT);
        return "channel_binding".equals(normalized) || "channelbinding".equals(normalized);
    }

    private static String decode(String value) {
        try {
            return URLDecoder.decode(value, StandardCharsets.UTF_8);
        } catch (IllegalArgumentException ex) {
            return value;
        }
    }
}
