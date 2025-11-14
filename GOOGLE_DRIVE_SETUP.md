# 🔑 Configuración de Google Drive API Key

Para usar la funcionalidad de **Carpetas Sincronizadas** con Google Drive, necesitas configurar una API Key de Google.

## ¿Por qué necesito una API Key?

Aunque las carpetas sean **públicas** (con permisos "Cualquier persona con el enlace puede ver"), Google Drive API v3 requiere una **API Key** para acceder programáticamente a los archivos, incluso en carpetas públicas.

---

## 📋 Paso 1: Crear un Proyecto en Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Haz clic en **"Select a project"** → **"New Project"**
3. Nombre del proyecto: `A365 Analytics` (o el que prefieras)
4. Haz clic en **"Create"**

---

## 📋 Paso 2: Habilitar Google Drive API

1. En el menú lateral, ve a **"APIs & Services"** → **"Library"**
2. Busca **"Google Drive API"**
3. Haz clic en **"Google Drive API"**
4. Haz clic en **"Enable"**

---

## 🔑 Paso 3: Crear una API Key

1. Ve a **"APIs & Services"** → **"Credentials"**
2. Haz clic en **"+ CREATE CREDENTIALS"** → **"API key"**
3. Se generará una API Key automáticamente
4. **Copia la API Key** (algo como: `AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXX`)

### ⚙️ (Opcional pero recomendado) Restringir la API Key

Para mayor seguridad:

1. Haz clic en **"Edit API key"** (ícono de lápiz)
2. En **"Application restrictions"**:
   - Selecciona **"IP addresses"**
   - Agrega la IP de tu servidor (ej: `203.0.113.1`)
3. En **"API restrictions"**:
   - Selecciona **"Restrict key"**
   - Selecciona solo **"Google Drive API"**
4. Haz clic en **"Save"**

---

## 📝 Paso 4: Configurar la API Key en tu aplicación

### Opción A: Variable de Entorno (Recomendada para producción)

Agrega la API Key al archivo `.env`:

```bash
# Google Drive API Key (para carpetas sincronizadas)
GOOGLE_DRIVE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

### Opción B: Docker

Si usas Docker, agrega la variable al archivo `.env.docker`:

```bash
GOOGLE_DRIVE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

Y en `docker-compose.yml`:

```yaml
services:
  app:
    environment:
      - GOOGLE_DRIVE_API_KEY=${GOOGLE_DRIVE_API_KEY}
```

---

## 🔄 Paso 5: Reiniciar la Aplicación

```bash
# Si usas npm
npm run dev

# Si usas Docker
docker-compose restart app
```

---

## ✅ Paso 6: Verificar que Funciona

1. Ve a **Admin** → **Carpetas Sincronizadas**
2. Crea una nueva carpeta:
   - **Tipo**: Google Drive
   - **URL pública**: Tu URL de carpeta compartida
   - Ejemplo: `https://drive.google.com/drive/folders/1ABC-xyz123`
3. Haz clic en **"Sincronizar Manualmente"**
4. Si todo está bien configurado, verás los archivos sincronizándose

---

## ❌ Solución de Problemas

### Error: "GOOGLE_DRIVE_API_KEY no configurada"

**Causa**: No agregaste la API Key al archivo `.env`

**Solución**:
1. Verifica que el archivo `.env` existe en la raíz del proyecto
2. Verifica que la línea `GOOGLE_DRIVE_API_KEY=...` está presente
3. Reinicia la aplicación

---

### Error: "API key not valid"

**Causa**: La API Key es incorrecta o está restringida

**Solución**:
1. Ve a Google Cloud Console → Credentials
2. Verifica que copiaste la API Key correctamente
3. Verifica que la Google Drive API está habilitada
4. Si la API Key está restringida por IP, verifica que la IP del servidor está permitida

---

### Error: "The user has not granted the app access"

**Causa**: La carpeta no es pública o tiene permisos incorrectos

**Solución**:
1. En Google Drive, haz clic derecho en la carpeta → **"Compartir"**
2. Cambia a **"Cualquier persona con el enlace"**
3. Asegúrate que el permiso sea **"Lector"** (puede ver)
4. Copia la nueva URL pública

---

## 🔒 Seguridad

### ✅ Buenas Prácticas

1. **Nunca compartas tu API Key públicamente** (GitHub, foros, etc.)
2. **Restringe la API Key** por IP y API específica
3. **Usa carpetas públicas solo para archivos que no sean sensibles**
4. **Revisa periódicamente** los accesos en Google Cloud Console

### ⚠️ Límites de Cuota

Google Drive API tiene límites gratuitos:
- **1 billón de requests/día** (más que suficiente para uso normal)
- Si superas el límite, verás errores `403 Quota exceeded`

Para aumentar la cuota (si es necesario):
1. Ve a Google Cloud Console → **"IAM & Admin"** → **"Quotas"**
2. Busca **"Google Drive API"**
3. Solicita un aumento de cuota

---

## 📚 Recursos Adicionales

- [Google Drive API Documentation](https://developers.google.com/drive/api/guides/about-sdk)
- [API Key Best Practices](https://cloud.google.com/docs/authentication/api-keys)
- [Manage API Keys](https://console.cloud.google.com/apis/credentials)

---

**¿Necesitas ayuda?** Consulta la documentación completa en `/docs` o contacta al administrador del sistema.
