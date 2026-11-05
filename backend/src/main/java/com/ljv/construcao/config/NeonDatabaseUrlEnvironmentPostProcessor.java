package com.ljv.construcao.config;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Aceita {@code DATABASE_URL} no formato {@code postgresql://} do Neon.
 * A senha fica na variável ou em {@code backend/.env}, que não entra no Git.
 */
public class NeonDatabaseUrlEnvironmentPostProcessor implements EnvironmentPostProcessor {

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        // Não usar environment.getProperty("SPRING_DATASOURCE_URL"): o Spring também
        // encontra spring.datasource.url do application.properties, que já traz o
        // Postgres local como padrão. Isso fazia o DATABASE_URL do Neon ser ignorado
        // e o backend subir apontando para localhost.
        String databaseUrl = System.getenv("DATABASE_URL");
        if (!hasText(databaseUrl)) {
            databaseUrl = readDotEnv("DATABASE_URL");
        }
        if (!deveUsarDatabaseUrl(System.getenv("SPRING_DATASOURCE_URL"), databaseUrl)) {
            return;
        }

        NeonDatabaseUrl.toJdbc(databaseUrl).ifPresent(config -> {
            Map<String, Object> props = new HashMap<>();
            props.put("spring.datasource.url", config.jdbcUrl());
            if (!hasText(System.getenv("SPRING_DATASOURCE_USERNAME"))) {
                props.put("spring.datasource.username", config.username());
            }
            if (!hasText(System.getenv("SPRING_DATASOURCE_PASSWORD"))) {
                props.put("spring.datasource.password", config.password());
            }
            environment.getPropertySources().addFirst(new MapPropertySource("neonDatabaseUrl", props));
        });
    }

    /**
     * DATABASE_URL só entra quando não há JDBC explícito. O padrão de
     * application.properties não conta como explícito.
     */
    static boolean deveUsarDatabaseUrl(String springDatasourceUrl, String databaseUrl) {
        return !hasText(springDatasourceUrl) && hasText(databaseUrl);
    }

    static String readDotEnv(String key) {
        for (Path file : List.of(Path.of(".env"), Path.of("backend", ".env"))) {
            if (!Files.isRegularFile(file)) {
                continue;
            }
            try {
                for (String line : Files.readAllLines(file)) {
                    String value = valueOf(line, key);
                    if (value != null) {
                        return value;
                    }
                }
            } catch (IOException ignored) {
                // Sem o arquivo, o backend segue no Postgres local.
            }
        }
        return null;
    }

    private static String valueOf(String line, String key) {
        String trimmed = line.trim();
        if (trimmed.isEmpty() || trimmed.startsWith("#")) {
            return null;
        }
        int eq = trimmed.indexOf('=');
        if (eq < 1 || !trimmed.substring(0, eq).trim().equals(key)) {
            return null;
        }
        String value = trimmed.substring(eq + 1).trim();
        if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.substring(1, value.length() - 1);
        }
        return value.isEmpty() ? null : value;
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
