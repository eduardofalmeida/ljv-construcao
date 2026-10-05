package com.ljv.construcao.repository;

import com.ljv.construcao.model.RecebimentoObra;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;

public interface RecebimentoObraRepository extends JpaRepository<RecebimentoObra, Long> {

    List<RecebimentoObra> findByObraIdOrderByDataDesc(Long obraId);

    @Query("SELECT COALESCE(SUM(r.valor), 0) FROM RecebimentoObra r WHERE r.obra.id = :obraId AND r.recebido = true")
    BigDecimal somarRecebido(@Param("obraId") Long obraId);

    @Query("SELECT COALESCE(SUM(r.valor), 0) FROM RecebimentoObra r WHERE r.obra.id = :obraId AND r.recebido = false")
    BigDecimal somarPendente(@Param("obraId") Long obraId);

    long countByObraIdAndRecebidoTrue(Long obraId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM RecebimentoObra r WHERE r.obra.id = :obraId")
    void deleteByObraId(@Param("obraId") Long obraId);
}
