# 🐳 Guía de Docker - A365 Contact Center

Esta guía explica cómo ejecutar la aplicación A365 Contact Center usando Docker, permitiendo que funcione en **cualquier servidor o dispositivo** con Docker instalado.

---

## 📋 Tabla de Contenidos

- [¿Por qué Docker?](#-por-qué-docker)
- [Requisitos](#-requisitos)
- [Instalación de Docker](#-instalación-de-docker)
- [Inicio Rápido](#-inicio-rápido)
- [Configuración](#-configuración)
- [Comandos Docker](#-comandos-docker)
- [Desarrollo con Docker](#-desarrollo-con-docker)
- [Producción](#-producción)
- [Troubleshooting](#-troubleshooting)
- [Arquitectura](#-arquitectura)

---

## 🎯 ¿Por qué Docker?

Docker permite ejecutar la aplicación en cualquier lugar sin problemas de compatibilidad:

✅ **Portabilidad**: Funciona igual en Windows, Mac, Linux  
✅ **Aislamiento**: Entorno independiente del sistema operativo  
✅ **Consistencia**: Mismo ambiente en desarrollo y producción  
✅ **Fácil deploy**: Un solo comando para levantar todo  
✅ **Incluye MongoDB**: No necesitas instalar nada más  
✅ **Escalabilidad**: Fácil de escalar horizontalmente  

---

## 💻 Requisitos

### Software Necesario

- **Docker**: 20.10 o superior
- **Docker Compose**: 2.0 o superior (incluido en Docker Desktop)
- **4GB RAM mínimo** (8GB recomendado)
- **10GB de espacio en disco**

---

## 📦 Instalación de Docker

### Windows

1. Descargar [Docker Desktop para Windows](https://www.docker.com/products/docker-desktop/)
2. Ejecutar el instalador
3. Reiniciar el sistema
4. Verificar instalación:
```bash
docker --version
docker-compose --version
```

### macOS

1. Descargar [Docker Desktop para Mac](https://www.docker.com/products/docker-desktop/)
2. Arrastrar a Aplicaciones
3. Abrir Docker Desktop
4. Verificar instalación:
```bash
docker --version
docker-compose --version
```

### Linux (Ubuntu/Debian)

```bash
# Actualizar repositorios
sudo apt update

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Agregar usuario al grupo docker
sudo usermod -aG docker $USER

# Instalar Docker Compose
sudo apt install docker-compose-plugin

# Verificar
docker --version
docker compose version
```

---

## 🚀 Inicio Rápido

### 1. Clonar el Repositorio

```bash
git clone https://github.com/fmendoza-a365/LaloAnalysts.git
cd LaloAnalysts
```

### 2. Configurar Variables de Entorno

```bash
# Copiar archivo de ejemplo
cp .env.docker.example .env.docker

# Editar con tus valores (IMPORTANTE: cambiar contraseñas)
nano .env.docker
```

### 3. Levantar la Aplicación

```bash
# Construir y levantar todos los servicios
docker-compose --env-file .env.docker up -d

# Ver logs en tiempo real
docker-compose logs -f app
```

### 4. Acceder a la Aplicación

```
🌐 Aplicación: http://localhost:3000
📊 MongoDB UI: http://localhost:8081 (si activaste Mongo Express)
```

### 5. Usuarios Demo

Si `SEED_DEMO=true`:

```
Admin:    admin_demo    / demo12345
Manager:  manager_demo  / demo12345
Analyst:  analyst_demo  / demo12345
User:     user_demo     / demo12345
```

---

## ⚙️ Configuración

### Archivo .env.docker

Las variables principales que **DEBES cambiar en producción**:

```env
# Cambiar estas contraseñas
MONGO_ROOT_PASSWORD=tu-password-super-seguro
SESSION_SECRET=string-aleatorio-muy-largo-y-seguro

# Desactivar datos demo en producción
SEED_DEMO=false

# URL base de tu dominio
BASE_URL=https://tu-dominio.com
```

### Variables Disponibles

| Variable | Descripción | Valor por Defecto |
|----------|-------------|-------------------|
| `NODE_ENV` | Ambiente de ejecución | `production` |
| `PORT` | Puerto interno del contenedor | `3000` |
| `MONGO_ROOT_USER` | Usuario admin de MongoDB | `admin` |
| `MONGO_ROOT_PASSWORD` | Contraseña de MongoDB | `changeme` |
| `MONGO_DB` | Nombre de la base de datos | `a365-db` |
| `SESSION_SECRET` | Secreto para sesiones | ⚠️ **CAMBIAR** |
| `SEED_DEMO` | Crear datos de demo | `true` |

---

## 🔧 Comandos Docker

### Gestión de Contenedores

```bash
# Levantar servicios (modo detached)
docker-compose --env-file .env.docker up -d

# Ver logs de todos los servicios
docker-compose logs -f

# Ver logs solo de la app
docker-compose logs -f app

# Ver logs solo de MongoDB
docker-compose logs -f mongodb

# Detener servicios
docker-compose down

# Detener y eliminar volúmenes (⚠️ BORRA DATOS)
docker-compose down -v

# Reiniciar un servicio específico
docker-compose restart app

# Ver estado de servicios
docker-compose ps

# Ver uso de recursos
docker stats
```

### Reconstruir Imagen

Si modificas el código:

```bash
# Reconstruir imagen
docker-compose build app

# Reconstruir sin caché
docker-compose build --no-cache app

# Reconstruir y levantar
docker-compose up -d --build
```

### Ejecutar Comandos Dentro del Contenedor

```bash
# Abrir shell en el contenedor
docker-compose exec app sh

# Ejecutar comando npm
docker-compose exec app npm run build:css

# Ver logs de Node.js
docker-compose exec app cat logs/app.log
```

### Backup de Base de Datos

```bash
# Backup de MongoDB
docker-compose exec mongodb mongodump \
  --username=admin \
  --password=changeme \
  --authenticationDatabase=admin \
  --db=a365-db \
  --out=/data/backup

# Copiar backup al host
docker cp a365-mongodb:/data/backup ./backup
```

### Restaurar Base de Datos

```bash
# Copiar backup al contenedor
docker cp ./backup a365-mongodb:/data/backup

# Restaurar
docker-compose exec mongodb mongorestore \
  --username=admin \
  --password=changeme \
  --authenticationDatabase=admin \
  --db=a365-db \
  /data/backup/a365-db
```

---

## 🛠️ Desarrollo con Docker

### Modo Desarrollo con Hot Reload

Edita `docker-compose.yml` y descomenta:

```yaml
services:
  app:
    volumes:
      # Descomentar estas líneas:
      - ./:/app
      - /app/node_modules
    command: npm run dev  # Usar nodemon
```

Luego:

```bash
docker-compose up -d --build
```

### Con Mongo Express (UI para MongoDB)

```bash
# Levantar con perfil dev
docker-compose --profile dev --env-file .env.docker up -d

# Acceder a Mongo Express
http://localhost:8081
```

### Ver MongoDB desde el Host

```bash
# Conectar con mongosh
mongosh "mongodb://admin:changeme@localhost:27017/a365-db?authSource=admin"

# O usar cualquier cliente MongoDB GUI
# (MongoDB Compass, Studio 3T, etc.)
# URI: mongodb://admin:changeme@localhost:27017/a365-db?authSource=admin
```

---

## 🏭 Producción

### Preparación para Producción

#### 1. Configurar .env.docker

```env
NODE_ENV=production
SEED_DEMO=false
MONGO_ROOT_PASSWORD=password-muy-seguro-aleatorio
SESSION_SECRET=secreto-largo-aleatorio-para-sesiones
BASE_URL=https://tu-dominio.com
```

#### 2. Usar Docker Secrets (Recomendado)

Para mayor seguridad en producción:

```bash
# Crear secrets
echo "mi-password-seguro" | docker secret create mongo_password -
echo "mi-session-secret" | docker secret create session_secret -

# Modificar docker-compose.yml para usar secrets
```

#### 3. Reverse Proxy con Nginx

`docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    networks:
      - a365-network
```

#### 4. SSL/HTTPS con Let's Encrypt

```bash
# Instalar certbot
docker run -it --rm \
  -v /etc/letsencrypt:/etc/letsencrypt \
  -v /var/lib/letsencrypt:/var/lib/letsencrypt \
  certbot/certbot certonly --standalone \
  -d tu-dominio.com
```

### Deploy en Servidor

```bash
# En tu servidor (VPS, Cloud, etc.)

# 1. Clonar repositorio
git clone https://github.com/fmendoza-a365/LaloAnalysts.git
cd LaloAnalysts

# 2. Configurar variables
cp .env.docker.example .env.docker
nano .env.docker

# 3. Levantar en producción
docker-compose --env-file .env.docker up -d

# 4. Ver logs
docker-compose logs -f

# 5. Configurar auto-restart
docker update --restart unless-stopped a365-app a365-mongodb
```

### Monitoring y Logs

```bash
# Ver logs en tiempo real
docker-compose logs -f --tail=100

# Logs solo de errores
docker-compose logs app 2>&1 | grep ERROR

# Health check manual
curl http://localhost:3000/health
```

---

## 🐛 Troubleshooting

### Problemas Comunes

#### 1. Puerto 3000 ya en uso

```bash
# Cambiar puerto en .env.docker
PORT=3001

# O matar proceso que usa el puerto
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

#### 2. MongoDB no inicia

```bash
# Ver logs de MongoDB
docker-compose logs mongodb

# Verificar permisos
docker-compose down -v
docker-compose up -d
```

#### 3. Aplicación no se conecta a MongoDB

```bash
# Verificar que MongoDB esté saludable
docker-compose ps

# Verificar variables de entorno
docker-compose exec app env | grep MONGO

# Reiniciar servicios
docker-compose restart
```

#### 4. Error "Cannot find module"

```bash
# Reconstruir sin caché
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

#### 5. Espacio en disco lleno

```bash
# Limpiar imágenes no usadas
docker system prune -a

# Limpiar volúmenes no usados
docker volume prune

# Ver uso de espacio
docker system df
```

### Ver Logs Detallados

```bash
# Logs completos de la app
docker-compose logs --no-log-prefix app > app.log

# Logs de MongoDB
docker-compose logs --no-log-prefix mongodb > mongo.log

# Health check
curl -i http://localhost:3000/health
```

---

## 🏗️ Arquitectura Docker

### Servicios

```
┌─────────────────────────────────────────────┐
│           Docker Compose                    │
│                                             │
│  ┌──────────────────────────────────────┐  │
│  │   App Container (Node.js)            │  │
│  │   - Puerto: 3000                     │  │
│  │   - Health Check ✓                   │  │
│  │   - Auto Restart ✓                   │  │
│  └────────────┬─────────────────────────┘  │
│               │                             │
│               │ Conecta a                   │
│               │                             │
│  ┌────────────▼─────────────────────────┐  │
│  │   MongoDB Container                  │  │
│  │   - Puerto: 27017                    │  │
│  │   - Volumen Persistente ✓            │  │
│  │   - Health Check ✓                   │  │
│  └──────────────────────────────────────┘  │
│                                             │
│  ┌──────────────────────────────────────┐  │
│  │   Mongo Express (opcional)           │  │
│  │   - Puerto: 8081                     │  │
│  │   - Perfil: dev                      │  │
│  └──────────────────────────────────────┘  │
└─────────────────────────────────────────────┘

Volúmenes:
- mongodb_data: Datos de MongoDB
- uploads_data: Archivos subidos por usuarios
```

### Multi-Stage Build

El Dockerfile usa **multi-stage build** para optimizar el tamaño:

1. **Stage 1 (Builder)**: Instala dependencias
2. **Stage 2 (Production)**: Copia solo lo necesario

**Resultado**: Imagen final ~200MB (vs ~800MB sin optimizar)

### Seguridad

- ✅ Usuario no-root (nodejs:nodejs)
- ✅ Secrets para passwords
- ✅ Health checks
- ✅ Resource limits
- ✅ Network isolation

---

## 📊 Comparación: Docker vs Instalación Manual

| Característica | Docker | Manual |
|---------------|--------|--------|
| **Instalación** | 1 comando | ~15 pasos |
| **Tiempo setup** | 5 minutos | 30-60 minutos |
| **Portabilidad** | ✅ Total | ❌ Dependiente del SO |
| **MongoDB** | ✅ Incluido | ❌ Instalar aparte |
| **Aislamiento** | ✅ Completo | ❌ Usa sistema host |
| **Actualizaciones** | ✅ `git pull && docker-compose up -d --build` | ❌ Múltiples pasos |
| **Múltiples ambientes** | ✅ Fácil | ❌ Complejo |

---

## 🎓 Recursos Adicionales

- [Documentación oficial de Docker](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
- [Mejores prácticas de Docker](https://docs.docker.com/develop/dev-best-practices/)
- [MongoDB en Docker](https://hub.docker.com/_/mongo)

---

## 📞 Soporte

Si encuentras problemas:

1. Revisa la sección [Troubleshooting](#-troubleshooting)
2. Verifica logs: `docker-compose logs -f`
3. Crea un issue en GitHub con los logs

---

## 🎉 Resumen de Comandos

```bash
# Setup inicial
cp .env.docker.example .env.docker
nano .env.docker  # Editar configuración
docker-compose --env-file .env.docker up -d

# Día a día
docker-compose ps              # Ver estado
docker-compose logs -f app     # Ver logs
docker-compose restart app     # Reiniciar
docker-compose down            # Detener

# Mantenimiento
docker-compose exec mongodb mongodump  # Backup
docker system prune -a                 # Limpiar
docker-compose up -d --build          # Actualizar

# Acceso
http://localhost:3000          # Aplicación
http://localhost:8081          # MongoDB UI (dev)
```

---

**¡Tu aplicación A365 ahora puede funcionar en cualquier lugar con Docker! 🐳✨**
