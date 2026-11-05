package com.ljv.construcao.config;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.EnumerablePropertySource;
import org.springframework.core.env.MapPropertySource;
import org.springframework.core.env.PropertySource;

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
        // Não usar environment.getProperty("SPRING_DATASOURCE_URL"): o binding relaxado
        // devolve spring.datasource.url, cujo padrão é localhost, e a DATABASE_URL era ignorada.
        if (hasText(readRaw(environment, "SPRING_DATASOURCE_URL"))) {
            return;
        }

        String databaseUrl = readRaw(environment, "DATABASE_URL");
        if (!hasText(databaseUrl)) {
            databaseUrl = readDotEnv("DATABASE_URL");
        }
        if (!hasText(databaseUrl)) {
            return;
        }

        NeonDatabaseUrl.toJdbc(databaseUrl).ifPresent(config -> {
            Map<String, Object> props = new HashMap<>();
            props.put("spring.datasource.url", config.jdbcUrl());
            if (!hasText(readRaw(environment, "SPRING_DATASOURCE_USERNAME"))) {
                props.put("spring.datasource.username", config.username());
            }
            if (!hasText(readRaw(environment, "SPRING_DATASOURCE_PASSWORD"))) {
                props.put("spring.datasource.password", config.password());
            }
            environment.getPropertySources().addFirst(new MapPropertySource("neonDatabaseUrl", props));
            System.out.println("Banco configurado pela DATABASE_URL: " + config.jdbcUrl());
        });
    }

    /**
     * Lê a chave exata, sem o binding que confunde {@code SPRING_DATASOURCE_URL}
     * com {@code spring.datasource.url}.
     */
    static String readRaw(ConfigurableEnvironment environment, String key) {
        for (PropertySource<?> source : environment.getPropertySources()) {
            if ("configurationProperties".equals(source.getName())) {
                continue;
            }
            Object value = null;
            if (source instanceof EnumerablePropertySource<?> enumerable) {
                for (String name : enumerable.getPropertyNames()) {
                    if (key.equals(name)) {
                        value = source.getProperty(name);
                        break;
                    }
                }
            }
            if (value != null && !value.toString().isBlank()) {
                return value.toString().trim();
            }
        }
        return null;
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
