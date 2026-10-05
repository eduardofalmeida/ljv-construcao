package com.ljv.construcao.repository;

import com.ljv.construcao.model.DiarioObra;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface DiarioObraRepository extends JpaRepository<DiarioObra, Long> {

    List<DiarioObra> findByObraIdOrderByDataDesc(Long obraId);

    Page<DiarioObra> findByObraIdOrderByDataDesc(Long obraId, Pageable pageable);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM DiarioObra d WHERE d.obra.id = :obraId")
    void deleteByObraId(@Param("obraId") Long obraId);
}
