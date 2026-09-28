package com.ljv.construcao.repository;

import com.ljv.construcao.model.Cliente;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ClienteRepository extends JpaRepository<Cliente, Long> {

    Page<Cliente> findByAtivoTrue(Pageable pageable);

    @Query("SELECT c FROM Cliente c WHERE c.ativo = true AND " +
           "(LOWER(c.nome) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "c.cpfCnpj LIKE CONCAT('%', :q, '%') OR " +
           "LOWER(c.email) LIKE LOWER(CONCAT('%', :q, '%')))")
    Page<Cliente> buscar(@Param("q") String q, Pageable pageable);

    long countByAtivoTrue();
}
