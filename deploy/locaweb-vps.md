# Deploy na VPS Locaweb

- IP: `http://177.153.22.65`
- Domínio: `http://www.ljvconstrucao.com.br` / `http://ljvconstrucao.com.br`

## DNS na Registro.br

Em [registro.br](https://registro.br) → domínio → **DNS** / editar zona:

| Tipo | Nome | Dados |
|------|------|--------|
| A | `@` (em branco / domínio) | `177.153.22.65` |
| A | `www` | `177.153.22.65` |

Salve e aguarde a propagação (minutos a algumas horas).

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

### Swap (recomendado em VPS com pouca RAM)

Evita a máquina travar no build do Java:

```bash
fallocate -l 2G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=2048
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
free -h
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

- Site: http://www.ljvconstrucao.com.br (ou http://177.153.22.65 enquanto o DNS propaga)
- Login: http://www.ljvconstrucao.com.br/login  
- Usuário inicial: `admin` / `admin123` (troque a senha depois)

Depois de apontar o DNS, na VPS atualize o CORS no `.env.prod` e reinicie o backend:

```bash
# APP_CORS_ALLOWED_ORIGINS=http://www.ljvconstrucao.com.br,http://ljvconstrucao.com.br,http://177.153.22.65
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d
```

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
