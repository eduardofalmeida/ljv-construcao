package com.ljv.construcao.config;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.util.HashMap;
import java.util.Map;

/**
 * No Railway o frontend e o backend ficam em domínios diferentes.
 * O cookie de sessão precisa de SameSite=None e Secure para o login guardar a sessão.
 */
public class RailwaySessionEnvironmentPostProcessor implements EnvironmentPostProcessor {

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        if (!hasText(environment.getProperty("RAILWAY_ENVIRONMENT"))) {
            return;
        }

        Map<String, Object> props = new HashMap<>();
        if (!hasText(environment.getProperty("SESSION_COOKIE_SAME_SITE"))) {
            props.put("SESSION_COOKIE_SAME_SITE", "none");
        }
        if (!hasText(environment.getProperty("SESSION_COOKIE_SECURE"))) {
            props.put("SESSION_COOKIE_SECURE", "true");
        }
        if (!props.isEmpty()) {
            environment.getPropertySources().addFirst(new MapPropertySource("railwaySessionCookie", props));
        }
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
