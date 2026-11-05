package com.ljv.construcao;

import com.ljv.construcao.config.NeonDatabaseUrl;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class LjvConstrucaoApplication {

    public static void main(String[] args) {
        NeonDatabaseUrl.aplicarNoProcesso();
        SpringApplication.run(LjvConstrucaoApplication.class, args);
    }
}
