package com.ljv.construcao.repository;

import com.ljv.construcao.model.Funcionario;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface FuncionarioRepository extends JpaRepository<Funcionario, Long> {

    Page<Funcionario> findByAtivoTrue(Pageable pageable);

    Page<Funcionario> findAll(Pageable pageable);

    List<Funcionario> findByAtivoTrue();

    @Query("SELECT f FROM Funcionario f WHERE f.ativo = true AND " +
           "(LOWER(f.nome) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "f.cpf LIKE CONCAT('%', :q, '%'))")
    Page<Funcionario> buscar(@Param("q") String q, Pageable pageable);

    @Query("SELECT f FROM Funcionario f WHERE " +
           "(LOWER(f.nome) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "f.cpf LIKE CONCAT('%', :q, '%'))")
    Page<Funcionario> buscarTodos(@Param("q") String q, Pageable pageable);

    long countByAtivoTrue();
}
