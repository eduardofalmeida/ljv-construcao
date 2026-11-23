# Deploy na VPS Locaweb (pelo IP)

IP atual: `http://177.153.22.65`

## 1. Entrar na VPS (no Mac)

```bash
ssh root@177.153.22.65
```

## 2. Instalar Docker (só na primeira vez)

```bash
apt update && apt upgrade -y
apt install -y ca-certificates curl git ufw
curl -fsSL https://get.docker.com | sh
systemctl enable --now docker

ufw allow OpenSSH
ufw allow 80/tcp
ufw --force enable
```

## 3. Clonar o projeto

```bash
mkdir -p /opt
cd /opt
git clone https://github.com/eduardofalmeida/ljv-construcao.git
cd ljv-construcao
```

Se o repositório for privado, use um Personal Access Token no clone ou uma deploy key.

## 4. Configurar variáveis

```bash
cp .env.prod.example .env.prod
nano .env.prod
```

Troque `POSTGRES_PASSWORD` por uma senha forte. Salve (`Ctrl+O`, Enter, `Ctrl+X`).

## 5. Subir a stack

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```

Aguarde o build (pode levar alguns minutos na primeira vez).

```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f --tail=80
```

## 6. Acessar

- Site: http://177.153.22.65  
- Login: http://177.153.22.65/login  
- Usuário inicial: `admin` / `admin123` (troque a senha depois)

## Atualizar depois de um push no GitHub

```bash
cd /opt/ljv-construcao
git pull
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```

## Comandos úteis

```bash
# Parar
docker compose -f docker-compose.prod.yml --env-file .env.prod down

# Logs do backend
docker logs -f ljv-backend

# Reiniciar só o backend
docker compose -f docker-compose.prod.yml --env-file .env.prod restart backend
```
