package com.ljv.construcao.repository;

import com.ljv.construcao.model.ItemObra;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;

public interface ItemObraRepository extends JpaRepository<ItemObra, Long> {

    @Query("SELECT i FROM ItemObra i WHERE i.obra.id = :obraId ORDER BY i.ativo DESC, i.ordem ASC, i.id ASC")
    List<ItemObra> findByObraIdOrdered(@Param("obraId") Long obraId);

    @Query("SELECT COALESCE(SUM(i.valorTotal), 0) FROM ItemObra i WHERE i.obra.id = :obraId AND i.ativo = true")
    BigDecimal somarAtivos(@Param("obraId") Long obraId);

    long countByObraId(Long obraId);

    long countByObraIdAndAtivoTrue(Long obraId);

    boolean existsByObraId(Long obraId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM ItemObra i WHERE i.obra.id = :obraId")
    void deleteByObraId(@Param("obraId") Long obraId);
}
