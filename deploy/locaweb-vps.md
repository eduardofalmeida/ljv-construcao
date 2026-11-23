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

### Swap (obrigatório em VPS 4GB)

Sem swap o build do Java trava a máquina (SSH some).

```bash
swapoff /swapfile 2>/dev/null || true
fallocate -l 4G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=4096
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
free -h
```

Tem que aparecer ~4G em `Swap` no `free -h` **antes** de qualquer `docker compose build`.

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

## 5. Subir a stack (backend fora do Docker)

Na VPS 4GB, **não** compile o Java dentro do `docker build` — trava a máquina.
Compile o JAR no sistema e só depois monte a imagem leve.

```bash
# 1) banco
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d postgres

# 2) compilar JAR (fora do Docker; 5–15 min na 1ª vez)
bash deploy/build-backend.sh

# 3) imagem leve do backend (só copia o JAR — rápido)
docker compose -f docker-compose.prod.yml --env-file .env.prod build backend

# 4) frontend (sozinho)
docker compose -f docker-compose.prod.yml --env-file .env.prod build frontend

# 5) sobe tudo
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d
```

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod ps
docker compose -f docker-compose.prod.yml --env-file .env.prod logs -f --tail=80
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
