# Deploy na VPS Locaweb (4GB) — sem compilar na VPS

A VPS **não aguenta** Maven/Node no build. Compilar trava a máquina (SSH some).

## Caminho recomendado agora: build no Mac → envia imagens

### No Mac (com Docker Desktop instalado)

```bash
cd ~/caminho/do/ljv-construcao
git pull origin main
bash deploy/ship-from-mac.sh
```

Isso:
1. Compila backend + frontend **no Mac**
2. Envia as imagens por SSH para `177.153.22.65`
3. Sobe Postgres + app na VPS

Login: http://177.153.22.65/login → `admin` / `admin123`

### Na VPS (só se as imagens já estiverem lá)

```bash
cd /opt/ljv-construcao
git pull origin main
bash deploy/up-prod.sh
```

## DNS (Registro.br)

| Tipo | Nome | Dados |
|------|------|--------|
| A | `@` | `177.153.22.65` |
| A | `www` | `177.153.22.65` |

## Depois: imagens pelo GitHub Actions (GHCR)

A cada push na `main`, o workflow gera imagens em:

- `ghcr.io/eduardofalmeida/ljv-construcao-backend:latest`
- `ghcr.io/eduardofalmeida/ljv-construcao-frontend:latest`

No `.env.prod` da VPS:

```text
BACKEND_IMAGE=ghcr.io/eduardofalmeida/ljv-construcao-backend:latest
FRONTEND_IMAGE=ghcr.io/eduardofalmeida/ljv-construcao-frontend:latest
GHCR_USER=eduardofalmeida
GHCR_TOKEN=seu_pat_com_read_packages
```

Depois: `bash deploy/up-prod.sh`

## NÃO faça na VPS

- `docker compose ... build backend`
- `bash deploy/build-backend.sh`
- `mvn package`

Isso estoura a RAM de 4GB.

## Comandos úteis

```bash
ssh root@177.153.22.65
cd /opt/ljv-construcao
docker compose -f docker-compose.prod.yml --env-file .env.prod ps
docker logs -f ljv-backend
```
