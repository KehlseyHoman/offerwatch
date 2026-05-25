package com.offerwatch.io.config;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.Map;

/**
 * Loads a .env file from the project root into Spring's environment
 * before application.properties is processed.
 *
 * Rules:
 *  - Only active in local dev (file must exist; silently skipped otherwise)
 *  - Real environment variables always win — .env values are lowest priority
 *  - Lines starting with # are comments; blank lines are ignored
 *  - Format: KEY=value  (no quotes needed, but they're stripped if present)
 *
 * Registered via: src/main/resources/META-INF/spring.factories
 */
public class DotEnvLoader implements EnvironmentPostProcessor {

    private static final String DOT_ENV_FILE = ".env";
    private static final String PROPERTY_SOURCE_NAME = "dotEnvFile";

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment,
                                       SpringApplication application) {
        Path envFile = Path.of(DOT_ENV_FILE);
        if (!Files.exists(envFile)) {
            return; // not found — running in production with real env vars, skip silently
        }

        Map<String, Object> props = new HashMap<>();
        try {
            for (String line : Files.readAllLines(envFile)) {
                line = line.strip();
                if (line.isBlank() || line.startsWith("#") || !line.contains("=")) continue;

                int eq = line.indexOf('=');
                String key = line.substring(0, eq).strip();
                String value = line.substring(eq + 1).strip();

                // Strip surrounding quotes if present
                if ((value.startsWith("\"") && value.endsWith("\"")) ||
                    (value.startsWith("'")  && value.endsWith("'"))) {
                    value = value.substring(1, value.length() - 1);
                }

                // Only set if not already provided by a real environment variable
                if (!environment.containsProperty(key)) {
                    props.put(key, value);
                }
            }
        } catch (IOException e) {
            throw new RuntimeException("Failed to load " + DOT_ENV_FILE, e);
        }

        if (!props.isEmpty()) {
            // Lowest priority — added at the end of the property source chain
            environment.getPropertySources().addLast(
                    new MapPropertySource(PROPERTY_SOURCE_NAME, props));
        }
    }
}
