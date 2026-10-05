package com.ljv.construcao.repository;

import com.ljv.construcao.model.Transacao;
import com.ljv.construcao.model.enums.TipoTransacao;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;

public interface TransacaoRepository extends JpaRepository<Transacao, Long> {

    Page<Transacao> findByTipo(TipoTransacao tipo, Pageable pageable);

    Page<Transacao> findByObraId(Long obraId, Pageable pageable);

    @Query("SELECT COALESCE(SUM(t.valor), 0) FROM Transacao t WHERE t.tipo = :tipo AND t.pago = true")
    BigDecimal sumByTipo(@Param("tipo") TipoTransacao tipo);

    @Query("SELECT COALESCE(SUM(t.valor), 0) FROM Transacao t WHERE t.tipo = :tipo " +
           "AND t.data >= :inicio AND t.data <= :fim")
    BigDecimal sumByTipoAndPeriodo(
        @Param("tipo") TipoTransacao tipo,
        @Param("inicio") LocalDate inicio,
        @Param("fim") LocalDate fim
    );

    @Query("SELECT t FROM Transacao t WHERE " +
           "LOWER(t.descricao) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "LOWER(t.categoria) LIKE LOWER(CONCAT('%', :q, '%'))")
    Page<Transacao> buscar(@Param("q") String q, Pageable pageable);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE Transacao t SET t.obra = null WHERE t.obra.id = :obraId")
    void desvincularObra(@Param("obraId") Long obraId);
}
