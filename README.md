# LJV Construção — Sistema de Gestão

Sistema de gestão completo para a **LJV Construção**, desenvolvido com React + Spring Boot + PostgreSQL.

---

## Stack tecnológica

| Camada    | Tecnologia                              |
|-----------|-----------------------------------------|
| Frontend  | React 18 + TypeScript + Vite + Tailwind |
| Backend   | Spring Boot 3.3 + Spring Security       |
| Banco     | PostgreSQL 16                           |
| Auth      | Sessão HTTP (Spring Security)           |

---

## Pré-requisitos

- **Java 21+** (para o backend)
- **Node.js 20+** (para o frontend)
- **Docker Desktop** (para o PostgreSQL)
- **Maven 3.9+** (ou usar o wrapper `mvnw`)

---

## Como iniciar o projeto

### 1. Subir o banco de dados (PostgreSQL)

```bash
docker-compose up -d postgres
```

Aguarde o container ficar saudável:

```bash
docker-compose ps
```

### 2. Iniciar o Backend

```bash
cd backend
./mvnw spring-boot:run
```

Ou no Windows:

```powershell
cd backend
mvnw.cmd spring-boot:run
```

O backend sobe em: **http://localhost:8080/api**

### 3. Iniciar o Frontend

```bash
cd frontend
npm install
npm run dev
```

O frontend sobe em: **http://localhost:5173**

---

## Acessos

### Sistema Administrativo

| Campo    | Valor                         |
|----------|-------------------------------|
| URL      | http://localhost:5173/login   |
| Usuário  | `admin`                       |
| Senha    | `admin123`                    |

> ⚠️ **ATENÇÃO**: Esse usuário existe apenas no ambiente de desenvolvimento. Nunca use em produção.

### Landing Page

Acesse: **http://localhost:5173**

---

## Estrutura do projeto

```
ljv-construcao/
├── backend/                    # Spring Boot
│   └── src/main/java/com/ljv/construcao/
│       ├── config/             # SecurityConfig, WebConfig, DataSeeder
│       ├── controller/         # AuthController, DashboardController, ...
│       ├── model/              # Entidades JPA
│       │   └── enums/          # StatusObra, TipoTransacao, ...
│       ├── repository/         # Repositórios Spring Data
│       └── service/            # Services
│
├── frontend/                   # React + Vite
│   └── src/
│       ├── components/
│       │   ├── layout/         # Sidebar, Header, FabMenu, Layout
│       │   └── ui/             # Modal, ConfirmDialog
│       ├── contexts/           # AuthContext
│       ├── pages/
│       │   ├── LandingPage     # Página pública
│       │   ├── LoginPage       # Tela de login
│       │   ├── DashboardPage   # Painel inicial
│       │   ├── clientes/       # CRUD de Clientes
│       │   ├── obras/          # CRUD de Obras
│       │   ├── funcionarios/   # CRUD de Funcionários
│       │   ├── orcamentos/     # CRUD de Orçamentos
│       │   └── financeiro/     # Módulo financeiro
│       ├── services/           # api.ts (Axios)
│       └── types/              # Tipos TypeScript
│
└── docker-compose.yml          # PostgreSQL
```

---

## Módulos do MVP

| Módulo         | Status    |
|----------------|-----------|
| Landing Page   | ✅ Pronto |
| Login/Sessão   | ✅ Pronto |
| Dashboard      | ✅ Pronto |
| Clientes       | ✅ Pronto |
| Obras          | ✅ Pronto |
| Funcionários   | ✅ Pronto |
| Orçamentos     | ✅ Pronto |
| Financeiro     | ✅ Pronto |
| Materiais      | 🔜 Em breve |
| Fornecedores   | 🔜 Em breve |
| Relatórios     | 🔜 Em breve |
| Diário de obra | 🔜 Em breve |
| Fotos          | 🔜 Em breve |

---

## Identidade Visual

A identidade visual da LJV Construção foi desenvolvida com:

- **Primário**: Grafite profundo (`#1a1c22`) — solidez e profissionalismo
- **Acento**: Ouro quente (`#d4891a`) — qualidade e premium
- **Fundo**: Branco/pedra (`#fafaf9`) — limpeza e organização

---

## Variáveis de ambiente (Railway)

O backend lê Postgres, porta, CORS e seed por variáveis de ambiente.
Exemplos prontos: `backend/railway.env.example` e `frontend/.env.example`.

### Serviço Backend

| Variável | Exemplo / referência |
|----------|----------------------|
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://${{Postgres.PGHOST}}:${{Postgres.PGPORT}}/${{Postgres.PGDATABASE}}` |
| `SPRING_DATASOURCE_USERNAME` | `${{Postgres.PGUSER}}` |
| `SPRING_DATASOURCE_PASSWORD` | `${{Postgres.PGPASSWORD}}` |
| `APP_CORS_ALLOWED_ORIGINS` | `https://seu-frontend.up.railway.app` |
| `SESSION_COOKIE_SAME_SITE` | `none` (frontend em outro domínio) |
| `SESSION_COOKIE_SECURE` | `true` |
| `APP_DEV_SEED_DATA` | `false` |
| `PORT` | injetado pelo Railway |

Use **Add Variable Reference** no Railway para ligar o Postgres ao backend (não copie senha na mão).

### Serviço Frontend

| Variável | Exemplo |
|----------|---------|
| `VITE_API_URL` | `https://seu-backend.up.railway.app/api` |

`VITE_API_URL` precisa estar definida **no build** do frontend.

---

## Próximos passos (pós-MVP)

1. Módulo de Materiais e Fornecedores
2. Diário de obra com fotos
3. Relatórios em PDF
4. JWT + Refresh Token (quando próximo de produção)
5. PWA com suporte offline
6. CRM básico

---

*LJV Construção — Construindo com qualidade, organização e compromisso.*
