# Deploy na VPS Locaweb (otimizado para 4GB)

- IP: `http://177.153.22.65`
- Domínio: `http://www.ljvconstrucao.com.br` / `http://ljvconstrucao.com.br`

## DNS na Registro.br

| Tipo | Nome | Dados |
|------|------|--------|
| A | `@` | `177.153.22.65` |
| A | `www` | `177.153.22.65` |

## 1. Entrar na VPS

```bash
ssh root@177.153.22.65
```

## 2. Docker (só na primeira vez)

```bash
apt update && apt upgrade -y
apt install -y ca-certificates curl git ufw
curl -fsSL https://get.docker.com | sh
systemctl enable --now docker
ufw allow OpenSSH && ufw allow 80/tcp && ufw --force enable
```

## 3. Projeto + `.env.prod`

```bash
cd /opt/ljv-construcao   # ou clone se ainda não tiver
git pull origin main
cp -n .env.prod.example .env.prod
nano .env.prod           # defina POSTGRES_PASSWORD
```

## 4. Subir tudo (recomendado)

Um comando só — swap, Postgres, JAR fora do Docker, builds sequenciais e `up`:

```bash
bash deploy/up-prod.sh
```

Isso evita o crash por falta de RAM (build paralelo + Maven no Docker).

## 5. Conferir

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod ps
curl -I http://127.0.0.1/
curl -s http://127.0.0.1/api/actuator/health
```

- Site: http://177.153.22.65 ou http://www.ljvconstrucao.com.br  
- Login: `admin` / `admin123`

## Atualizar depois de um `git push`

```bash
cd /opt/ljv-construcao
git pull origin main
bash deploy/up-prod.sh
```

## O que foi otimizado

| Peça | Ajuste |
|------|--------|
| JVM | G1, MaxRAMPercentage 65%, TieredStopAtLevel=1 (sobe mais rápido) |
| Spring | perfil `prod`, pool Hikari 3, Tomcat 40 threads, Actuator health |
| Postgres | shared_buffers 128MB, max_connections 40, limites de RAM |
| Compose | mem_limit por serviço; frontend só sobe com backend healthy |
| Nginx | gzip + keepalive para o backend |
| Build | JAR no host; imagens uma de cada vez |

## Comandos úteis

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod logs -f --tail=80
docker logs -f ljv-backend
docker compose -f docker-compose.prod.yml --env-file .env.prod restart backend
docker compose -f docker-compose.prod.yml --env-file .env.prod down
```
