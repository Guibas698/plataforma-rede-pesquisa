package com.mapaeleitoral.config;

import com.mapaeleitoral.usuario.entity.Usuario;
import com.mapaeleitoral.usuario.enums.PapelUsuario;
import com.mapaeleitoral.usuario.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;

/**
 * Configuração responsável por criar dados iniciais do sistema.
 *
 * Neste primeiro momento, cria automaticamente o usuário MASTER inicial
 * caso ele ainda não exista no banco de dados.
 */
@Configuration
@RequiredArgsConstructor
public class SeedDataConfig {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    @Bean
    public CommandLineRunner seedMaster() {
        return args -> {
            String emailMaster = "admin@mapaeleitoral.com";

            if (usuarioRepository.existsByEmail(emailMaster)) {
                System.out.println("Usuário MASTER inicial já existe.");
                return;
            }

            LocalDateTime agora = LocalDateTime.now();

            Usuario usuarioMaster = Usuario.builder()
                    .nome("Administrador Master")
                    .email(emailMaster)
                    .telefone("(85) 99999-0000")
                    .senhaHash(passwordEncoder.encode("123456"))
                    .papel(PapelUsuario.MASTER)
                    .ativo(true)
                    .criadoEm(agora)
                    .atualizadoEm(agora)
                    .build();

            usuarioRepository.save(usuarioMaster);

            System.out.println("Usuário MASTER inicial criado com sucesso.");
        };
    }
}