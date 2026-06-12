package com.mapaeleitoral.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.ArrayList;
import java.util.List;

/**
 * Configuração global de CORS da API.
 *
 * localhost:3000 e localhost:3001 são usados para desenvolvimento local
 * com o frontend Next.js.
 *
 * No deploy, adicionar aqui o domínio real da Vercel.
 */
@Configuration
public class CorsConfig {

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        List<String> allowedOrigins = new ArrayList<>();

        // Frontend local Next.js
        allowedOrigins.add("http://localhost:3000");
        allowedOrigins.add("http://localhost:3001");

        // Produção:
        // Troque pelo domínio real da Vercel quando fizer deploy.
        // Exemplo:
        // allowedOrigins.add("https://mapa-eleitoral.vercel.app");
        // allowedOrigins.add("https://SEU-DOMINIO-VERCEL.vercel.app");

        configuration.setAllowedOrigins(allowedOrigins);

        configuration.setAllowedMethods(List.of(
                "GET",
                "POST",
                "PUT",
                "PATCH",
                "DELETE",
                "OPTIONS"
        ));

        configuration.setAllowedHeaders(List.of(
                "Authorization",
                "Content-Type"
        ));

        configuration.setExposedHeaders(List.of(
                "Authorization"
        ));

        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);

        return source;
    }
}