package com.mapaeleitoral.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                .cors(Customizer.withDefaults())
                .csrf(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                .authorizeHttpRequests(auth -> auth

                        // Rotas públicas de autenticação
                        .requestMatchers(HttpMethod.POST, "/api/auth/login").permitAll()

                        // Rotas públicas de cadastro via convite
                        .requestMatchers(HttpMethod.GET, "/api/publico/links/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/publico/apoiadores").permitAll()

                        // Rotas administrativas
                        .requestMatchers("/api/admin/**").hasRole("MASTER")

                        // Rotas da área ADM/Líder
                        .requestMatchers("/api/candidato/**").hasAnyRole("ADM", "LIDER")

                        // Rotas da área do usuário final
                        .requestMatchers("/api/apoiador/**").hasRole("USUARIO")

                        // Rotas futuras de upload da área ADM/Líder
                        .requestMatchers("/api/upload/candidato/**").hasAnyRole("ADM", "LIDER")

                        // Rotas futuras de upload da área do usuário final
                        .requestMatchers("/api/upload/apoiador/**").hasRole("USUARIO")

                        // Qualquer outra rota exige autenticação
                        .anyRequest().authenticated()
                )
                .addFilterBefore(
                        jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class
                )
                .build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration authenticationConfiguration
    ) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }
}