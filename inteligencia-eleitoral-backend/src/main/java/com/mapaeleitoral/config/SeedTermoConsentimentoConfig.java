package com.mapaeleitoral.config;

import com.mapaeleitoral.consentimento.entity.TermoConsentimento;
import com.mapaeleitoral.consentimento.repository.TermoConsentimentoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.LocalDateTime;

/**
 * Configuração responsável por criar o termo de consentimento inicial
 * usado no cadastro público de apoiadores.
 */
@Configuration
@RequiredArgsConstructor
public class SeedTermoConsentimentoConfig {

    private final TermoConsentimentoRepository termoConsentimentoRepository;

    @Bean
    public CommandLineRunner seedTermoConsentimento() {
        return args -> {
            boolean existeTermoAtivo = termoConsentimentoRepository
                    .findFirstByAtivoTrueOrderByCriadoEmDesc()
                    .isPresent();

            if (existeTermoAtivo) {
                System.out.println("Termo de consentimento ativo já existe.");
                return;
            }

            TermoConsentimento termo = TermoConsentimento.builder()
                    .titulo("Termo de Consentimento para Cadastro de Apoiador")
                    .versao("1.0")
                    .texto("""
                            Ao prosseguir com o cadastro, declaro que autorizo o tratamento dos meus dados pessoais informados neste formulário para fins de organização, comunicação e gestão de apoiadores no sistema Mapa Eleitoral.

                            Estou ciente de que os dados fornecidos, como nome, telefone, município, bairro, zona eleitoral e seção eleitoral, serão vinculados ao candidato responsável pelo link de cadastro utilizado.

                            Declaro também estar ciente de que este cadastro representa uma manifestação voluntária de apoio ou interesse, não correspondendo a voto oficial, promessa de voto ou obrigação eleitoral.

                            O tratamento dos dados deverá observar princípios de finalidade, necessidade, transparência e segurança, conforme a Lei Geral de Proteção de Dados Pessoais.
                            """)
                    .ativo(true)
                    .criadoEm(LocalDateTime.now())
                    .build();

            termoConsentimentoRepository.save(termo);

            System.out.println("Termo de consentimento inicial criado com sucesso.");
        };
    }
}