package com.ljv.construcao.config;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;

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
}
