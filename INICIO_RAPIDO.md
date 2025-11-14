# 🚀 Inicio Rápido - A365 Analytics

## Ejecutar en tu computadora (5 minutos)

### Prerrequisitos
- Node.js 16+ instalado ([Descargar](https://nodejs.org/))
- Git instalado

### Paso 1: Clonar el repositorio

```bash
git clone https://github.com/fmendoza-a365/LaloAnalysts.git
cd LaloAnalysts
```

### Paso 2: Instalar dependencias

```bash
npm install
```

### Paso 3: Configurar variables de entorno

```bash
# Copiar el archivo de ejemplo
cp .env.example .env

# El archivo .env ya está configurado para usar MongoDB en memoria
# No necesitas modificar nada para desarrollo local
```

### Paso 4: Compilar CSS

```bash
npm run build:css
```

### Paso 5: Iniciar la aplicación

```bash
npm start
# O para desarrollo con auto-reload:
npm run dev
```

### Paso 6: Abrir en el navegador

```
http://localhost:3000
```

### 👤 Usuarios de prueba

Una vez que la aplicación inicie, se crearán automáticamente estos usuarios:

| Usuario | Contraseña | Rol |
|---------|------------|-----|
| `admin_demo` | `demo12345` | Administrador |
| `analista_demo` | `demo12345` | Analista |
| `supervisor_demo` | `demo12345` | Supervisor |
| `asesor_demo` | `demo12345` | Asesor |

## 🐳 Alternativa: Con Docker

Si tienes Docker instalado:

```bash
# Configurar environment
cp .env.docker.example .env.docker

# Iniciar con Docker Compose
docker-compose --env-file .env.docker up -d

# Ver logs
docker-compose logs -f app

# Acceder
http://localhost:3000
```

## 📖 Documentación

- **CLAUDE.md** - Guía completa para AI assistants
- **README.md** - Documentación principal
- **DOCKER.md** - Guía de Docker
- **DESIGN_STANDARDS.md** - Estándares de diseño

## ❓ Problemas comunes

### Error de MongoDB

Si ves error de MongoDB, puedes:

1. **Instalar MongoDB localmente**:
   ```bash
   # macOS
   brew install mongodb-community
   brew services start mongodb-community

   # Ubuntu/Debian
   sudo apt-get install mongodb
   sudo systemctl start mongodb
   ```

2. **Usar MongoDB Atlas (gratis)**:
   - Crear cuenta en https://www.mongodb.com/cloud/atlas/register
   - Crear cluster gratuito
   - Obtener connection string
   - Actualizar `.env`:
     ```
     MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/a365-analytics
     ```

### CSS no se ve bien

```bash
npm run build:css
```

### Puerto 3000 ocupado

Cambia el puerto en `.env`:
```
PORT=3001
```

## 🎯 Próximos pasos

1. **Login** con `admin_demo / demo12345`
2. **Crear una campaña** desde el panel de admin
3. **Seleccionar la campaña** desde la vista de campañas
4. **Explorar los dashboards** y funcionalidades

¡Disfruta explorando A365 Analytics! 🎉
