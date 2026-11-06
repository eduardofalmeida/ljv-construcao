package com.ljv.construcao.config;

import org.junit.jupiter.api.Test;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.context.properties.source.ConfigurationPropertySources;
import org.springframework.core.env.MapPropertySource;
import org.springframework.core.env.StandardEnvironment;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class NeonDatabaseUrlTest {

    @Test
    void converteConnectionStringDoNeonComPooler() {
        var config = NeonDatabaseUrl.toJdbc(
                "postgresql://neondb_owner:senha@ep-exemplo-pooler.c-9.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
        ).orElseThrow();

        assertEquals("neondb_owner", config.username());
        assertEquals("senha", config.password());
        assertEquals(
                "jdbc:postgresql://ep-exemplo-pooler.c-9.us-east-2.aws.neon.tech:5432/neondb?sslmode=require&prepareThreshold=0",
                config.jdbcUrl()
        );
        assertFalse(config.jdbcUrl().contains("channel_binding"));
    }

    @Test
    void hostDiretoNaoDesligaPreparedStatement() {
        var config = NeonDatabaseUrl.toJdbc(
                "postgresql://usuario:senha@ep-exemplo.c-9.us-east-2.aws.neon.tech/neondb?sslmode=require"
        ).orElseThrow();

        assertEquals(
                "jdbc:postgresql://ep-exemplo.c-9.us-east-2.aws.neon.tech:5432/neondb?sslmode=require",
                config.jdbcUrl()
        );
    }

    @Test
    void aceitaConnectionStringComAspasOuPrefixoJdbc() {
        assertEquals(
                "postgresql://usuario:senha@ep-exemplo.neon.tech/neondb?sslmode=require",
                NeonDatabaseUrl.normalizar("\"postgresql://usuario:senha@ep-exemplo.neon.tech/neondb?sslmode=require\"")
        );
        assertEquals(
                "postgresql://usuario:senha@ep-exemplo.neon.tech/neondb",
                NeonDatabaseUrl.normalizar("jdbc:postgresql://usuario:senha@ep-exemplo.neon.tech/neondb")
        );
    }

    @Test
    void encontraConnectionStringEmQualquerVariavel() {
        String url = NeonDatabaseUrl.encontrar(Map.of(
                "OUTRA_VARIAVEL", "postgresql://usuario:senha@ep-exemplo.neon.tech/neondb?sslmode=require"
        ));

        assertEquals("postgresql://usuario:senha@ep-exemplo.neon.tech/neondb?sslmode=require", url);
    }

    @Test
    void processadorDoNeonEstaNoSpringFactories() throws Exception {
        var recurso = NeonDatabaseUrlEnvironmentPostProcessor.class.getClassLoader()
                .getResource("META-INF/spring.factories");
        assertNotNull(recurso);
        String texto = Files.readString(Path.of(recurso.toURI()));
        assertTrue(texto.contains(NeonDatabaseUrlEnvironmentPostProcessor.class.getName()));
        assertTrue(texto.contains("org.springframework.boot.env.EnvironmentPostProcessor"));
    }

    @Test
    void databaseUrlGanhaDoLocalhostMesmoComBindingRelaxado() {
        StandardEnvironment environment = new StandardEnvironment();
        environment.getPropertySources().addLast(new MapPropertySource("applicationConfig", Map.of(
                "spring.datasource.url", "jdbc:postgresql://localhost:5432/ljv_construcao",
                "spring.datasource.username", "ljv_user",
                "spring.datasource.password", "ljv_pass"
        )));
        environment.getPropertySources().addFirst(new MapPropertySource("renderEnv", Map.of(
                "DATABASE_URL", "postgresql://neondb_owner:senha@ep-exemplo-pooler.c-9.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
        )));
        ConfigurationPropertySources.attach(environment);

        new NeonDatabaseUrlEnvironmentPostProcessor().postProcessEnvironment(environment, new SpringApplication());

        assertEquals(
                "jdbc:postgresql://ep-exemplo-pooler.c-9.us-east-2.aws.neon.tech:5432/neondb?sslmode=require&prepareThreshold=0",
                environment.getProperty("spring.datasource.url")
        );
        assertEquals("neondb_owner", environment.getProperty("spring.datasource.username"));
        assertEquals("senha", environment.getProperty("spring.datasource.password"));
    }
}
