package com.mapaeleitoral.usuario.service;

import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

@Service
public class TituloEleitorService {

    public String normalizar(String titulo) {
        if (titulo == null || titulo.isBlank()) {
            throw new IllegalArgumentException("Título de eleitor é obrigatório.");
        }

        String somenteNumeros = titulo.replaceAll("\\D", "");

        if (somenteNumeros.length() != 12) {
            throw new IllegalArgumentException("Título de eleitor inválido.");
        }

        return somenteNumeros;
    }

    public String gerarHash(String tituloNormalizado) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(tituloNormalizado.getBytes(StandardCharsets.UTF_8));

            StringBuilder hexadecimal = new StringBuilder();

            for (byte b : hashBytes) {
                hexadecimal.append(String.format("%02x", b));
            }

            /*
             * TODO: Em produção, considerar HMAC com chave secreta
             * para dificultar ataques por dicionário.
             */
            return hexadecimal.toString();
        } catch (NoSuchAlgorithmException exception) {
            throw new RuntimeException("Não foi possível processar o título de eleitor.");
        }
    }

    public String ultimos4(String tituloNormalizado) {
        return tituloNormalizado.substring(tituloNormalizado.length() - 4);
    }

    public TituloProcessado processar(String titulo) {
        String normalizado = normalizar(titulo);

        return new TituloProcessado(
                gerarHash(normalizado),
                ultimos4(normalizado)
        );
    }

    public record TituloProcessado(String hash, String ultimos4) {
    }
}