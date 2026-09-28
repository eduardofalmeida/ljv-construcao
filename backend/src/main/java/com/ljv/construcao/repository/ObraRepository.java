package com.ljv.construcao.repository;

import com.ljv.construcao.model.Obra;
import com.ljv.construcao.model.enums.StatusObra;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ObraRepository extends JpaRepository<Obra, Long> {

    Page<Obra> findAll(Pageable pageable);

    @Query(
        value = "SELECT o FROM Obra o LEFT JOIN FETCH o.cliente",
        countQuery = "SELECT COUNT(o) FROM Obra o"
    )
    Page<Obra> findAllComCliente(Pageable pageable);

    @Query(
        value = "SELECT o FROM Obra o LEFT JOIN FETCH o.cliente WHERE o.status = :status",
        countQuery = "SELECT COUNT(o) FROM Obra o WHERE o.status = :status"
    )
    Page<Obra> findByStatus(@Param("status") StatusObra status, Pageable pageable);

    @Query(
        value = "SELECT o FROM Obra o LEFT JOIN FETCH o.cliente WHERE LOWER(o.nome) LIKE LOWER(CONCAT('%', :q, '%'))",
        countQuery = "SELECT COUNT(o) FROM Obra o WHERE LOWER(o.nome) LIKE LOWER(CONCAT('%', :q, '%'))"
    )
    Page<Obra> buscar(@Param("q") String q, Pageable pageable);

    @Query("SELECT o FROM Obra o LEFT JOIN FETCH o.cliente WHERE o.id = :id")
    java.util.Optional<Obra> findDetalheById(@Param("id") Long id);

    long countByStatus(StatusObra status);

    @Query("SELECT COUNT(o) FROM Obra o WHERE o.status IN ('EM_ANDAMENTO', 'APROVADA')")
    long countAtivas();
}
