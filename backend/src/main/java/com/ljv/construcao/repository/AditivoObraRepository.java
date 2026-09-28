package com.ljv.construcao.repository;

import com.ljv.construcao.model.AditivoObra;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;

public interface AditivoObraRepository extends JpaRepository<AditivoObra, Long> {

    @Query("SELECT a FROM AditivoObra a WHERE a.obra.id = :obraId ORDER BY a.data DESC, a.id DESC")
    List<AditivoObra> findByObraIdOrderByDataDescIdDesc(@Param("obraId") Long obraId);

    @Query("SELECT COALESCE(SUM(a.valorTotal), 0) FROM AditivoObra a WHERE a.obra.id = :obraId AND a.cobravel = true")
    BigDecimal somarCobravel(@Param("obraId") Long obraId);

    @Query("SELECT COUNT(a) FROM AditivoObra a WHERE a.obra.id = :obraId")
    long countByObraId(@Param("obraId") Long obraId);
}
