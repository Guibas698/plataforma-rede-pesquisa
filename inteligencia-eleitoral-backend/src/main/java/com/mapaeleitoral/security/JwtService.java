package com.mapaeleitoral.security;

import com.mapaeleitoral.usuario.entity.Usuario;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

/**
 * Serviço responsável por centralizar a geração, leitura e validação
 * dos tokens JWT usados na autenticação do sistema Mapa Eleitoral.
 */
@Service
public class JwtService {

    @Value("${app.security.jwt.secret}")
    private String jwtSecret;

    @Value("${app.security.jwt.expiration-ms}")
    private Long jwtExpirationMs;

    /**
     * Gera um token JWT para o usuário autenticado.
     *
     * O subject do token será o e-mail do usuário.
     * Também serão adicionados claims úteis para o frontend/backend:
     * - email
     * - papel
     */
    public String gerarToken(Usuario usuario) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("email", usuario.getEmail());
        claims.put("papel", usuario.getPapel().name());

        Date agora = new Date();
        Date expiracao = new Date(agora.getTime() + jwtExpirationMs);

        return Jwts.builder()
                .claims(claims)
                .subject(usuario.getEmail())
                .issuedAt(agora)
                .expiration(expiracao)
                .signWith(obterChaveAssinatura(), Jwts.SIG.HS256)
                .compact();
    }

    /**
     * Extrai o e-mail do token JWT.
     */
    public String extrairEmail(String token) {
        return extrairClaim(token, Claims::getSubject);
    }

    /**
     * Verifica se o token pertence ao usuário informado e se ainda não expirou.
     */
    public boolean tokenValido(String token, UserDetails userDetails) {
        String email = extrairEmail(token);

        return email.equals(userDetails.getUsername()) && !tokenExpirado(token);
    }

    /**
     * Verifica se o token JWT já expirou.
     */
    public boolean tokenExpirado(String token) {
        return extrairDataExpiracao(token).before(new Date());
    }

    /**
     * Extrai a data de expiração do token JWT.
     */
    public Date extrairDataExpiracao(String token) {
        return extrairClaim(token, Claims::getExpiration);
    }

    /**
     * Método genérico para extrair qualquer claim do token JWT.
     */
    public <T> T extrairClaim(String token, Function<Claims, T> resolver) {
        Claims claims = extrairTodosClaims(token);
        return resolver.apply(claims);
    }

    private Claims extrairTodosClaims(String token) {
        return Jwts.parser()
                .verifyWith(obterChaveAssinatura())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private SecretKey obterChaveAssinatura() {
        byte[] chaveBytes = Decoders.BASE64.decode(jwtSecret);
        return Keys.hmacShaKeyFor(chaveBytes);
    }
}