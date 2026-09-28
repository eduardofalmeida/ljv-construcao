package com.ljv.construcao.config;

import com.ljv.construcao.model.ConfiguracaoSite;
import com.ljv.construcao.model.Usuario;
import com.ljv.construcao.model.enums.PerfilUsuario;
import com.ljv.construcao.repository.ConfiguracaoSiteRepository;
import com.ljv.construcao.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Map;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class DataSeeder {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final ConfiguracaoSiteRepository configuracaoSiteRepository;

    @Value("${app.dev.seed-data:true}")
    private boolean seedData;

    @Bean
    public CommandLineRunner seedDatabase() {
        return args -> {
            if (!seedData) return;

            // Usuário admin
            if (!usuarioRepository.existsByUsername("admin")) {
                Usuario admin = new Usuario();
                admin.setUsername("admin");
                admin.setPassword(passwordEncoder.encode("admin123"));
                admin.setNome("Administrador");
                admin.setEmail("admin@ljvconstrucao.com.br");
                admin.setPerfil(PerfilUsuario.ADMIN);
                admin.setAtivo(true);
                usuarioRepository.save(admin);
                log.info("=================================================");
                log.info("  Usuário de desenvolvimento criado:");
                log.info("  Username: admin | Senha: admin123");
                log.info("  ATENÇÃO: Não usar em produção!");
                log.info("=================================================");
            }

            // Configurações padrão da landing page
            Map<String, String> defaults = Map.ofEntries(
                Map.entry("hero_titulo_linha1", "Construímos"),
                Map.entry("hero_titulo_linha2", "o que você"),
                Map.entry("hero_titulo_linha3", "imaginou."),
                Map.entry("hero_subtitulo", "Qualidade, organização e compromisso em cada etapa — do projeto à entrega."),
                Map.entry("hero_tag", "LJV Construção — Desde 2014"),
                Map.entry("manifesto", "Não construímos apenas paredes e telhados. Construímos o espaço onde sua história acontece — com precisão, cuidado e o orgulho de quem assina cada metro quadrado."),
                Map.entry("stat_obras", "200"),
                Map.entry("stat_obras_label", "Obras entregues"),
                Map.entry("stat_anos", "10"),
                Map.entry("stat_anos_label", "Anos de experiência"),
                Map.entry("stat_satisfacao", "98"),
                Map.entry("stat_satisfacao_label", "Clientes satisfeitos"),
                Map.entry("stat_equipe", "50"),
                Map.entry("stat_equipe_label", "Profissionais qualificados"),
                Map.entry("contato_telefone", "(11) 9 9999-9999"),
                Map.entry("contato_email", "contato@ljvconstrucao.com.br"),
                Map.entry("contato_endereco", "São Paulo, SP — Brasil"),
                Map.entry("cta_titulo", "Pronto para começar?"),
                Map.entry("rodape_copy", "LJV Construção. Todos os direitos reservados."),
                Map.entry("empresa_nome", "LJV Construção"),
                Map.entry("empresa_slogan", "Construção"),
                Map.entry("empresa_cnpj", ""),
                Map.entry("empresa_ie", ""),
                Map.entry("empresa_crea", ""),
                Map.entry("empresa_responsavel", ""),
                Map.entry("empresa_logo", ""),
                Map.entry("relatorio_telefone", ""),
                Map.entry("relatorio_whatsapp", ""),
                Map.entry("relatorio_email", ""),
                Map.entry("relatorio_endereco", ""),
                Map.entry("relatorio_site", ""),
                Map.entry("relatorio_instagram", ""),
                Map.entry("relatorio_cabecalho_extra", ""),
                Map.entry("relatorio_titulo", "Orçamento"),
                Map.entry("relatorio_cargo_assinatura", "Responsável técnico"),
                Map.entry("relatorio_assinatura_cliente", "Assinatura do cliente"),
                Map.entry("relatorio_assinatura_empresa", ""),
                Map.entry("relatorio_rodape", "")
            );

            defaults.forEach((chave, valor) -> {
                if (!configuracaoSiteRepository.existsById(chave)) {
                    ConfiguracaoSite cfg = new ConfiguracaoSite();
                    cfg.setChave(chave);
                    cfg.setValor(valor);
                    configuracaoSiteRepository.save(cfg);
                }
            });
        };
    }
}
