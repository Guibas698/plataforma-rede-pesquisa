package com.mapaeleitoral.config;

import com.mapaeleitoral.usuario.entity.Usuario;
import com.mapaeleitoral.usuario.enums.PapelUsuario;
import com.mapaeleitoral.usuario.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;

@Configuration
@RequiredArgsConstructor
public class SeedDataConfig {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.master.email:admin@mapaeleitoral.com}")
    private String masterEmail;

    @Value("${app.master.password:}")
    private String masterPassword;

    @Bean
    public CommandLineRunner seedMaster() {
        return args -> {
            String emailMaster = masterEmail.trim().toLowerCase();

            if (masterPassword == null || masterPassword.isBlank()) {
                System.out.println("Senha do MASTER não configurada. Defina MASTER_ADMIN_PASSWORD no ambiente.");
                return;
            }

            LocalDateTime agora = LocalDateTime.now();

            Usuario usuarioExistente = usuarioRepository.findByEmail(emailMaster)
                    .orElse(null);

            if (usuarioExistente != null) {
                usuarioExistente.setSenhaHash(passwordEncoder.encode(masterPassword));
                usuarioExistente.setPapel(PapelUsuario.MASTER);
                usuarioExistente.setAtivo(true);
                usuarioExistente.setAtualizadoEm(agora);

                usuarioRepository.save(usuarioExistente);

                System.out.println("Usuário MASTER inicial já existe. Senha e status atualizados.");
                return;
            }

            Usuario usuarioMaster = Usuario.builder()
                    .nome("Administrador Master")
                    .email(emailMaster)
                    .telefone("(85) 99999-0000")
                    .senhaHash(passwordEncoder.encode(masterPassword))
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