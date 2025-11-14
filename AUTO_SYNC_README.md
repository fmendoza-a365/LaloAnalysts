# 🔄 Sistema de Sincronización Automática de Datasets

## 📋 Descripción

El **Sistema de Sincronización Automática** permite que A365 Analytics detecte, descargue y procese automáticamente archivos de datasets desde **Google Drive** o **SharePoint**, sin intervención manual.

### ✨ Características Principales

- ✅ **Detección Automática de Tipo**: Identifica el tipo de dataset (Genesys, Asistencia, Nómina, etc.) analizando las cabeceras
- ✅ **Múltiples Fuentes**: Soporta Google Drive y SharePoint/OneDrive
- ✅ **Monitoreo Continuo**: Revisa carpetas cada 5-30 minutos
- ✅ **Procesamiento Inteligente**: Solo procesa archivos nuevos
- ✅ **Vinculación Automática**: Los datos se integran automáticamente con toda la app
- ✅ **Gestión de Archivos**: Puede mover o eliminar archivos después de procesarlos

---

## 🎯 Tipos de Datasets Detectables

El sistema puede detectar y procesar automáticamente:

| Tipo | Detectado por |
|------|---------------|
| **Genesys Rendimiento** | Headers: ag, nombre, ofrecidas, contestadas, manejo, tmo |
| **Genesys Estados** | Headers: ag, nombre, conectado, disponible, ocupado |
| **Provisión Agregada** | Headers: fecha, cola, ofrecidas, contestadas, abandonadas, ns |
| **Asistencia** | Headers: dni, fecha, hora entrada, hora salida, tardanza |
| **Nómina** | Headers: dni, nombres, apellidos, campaña, supervisor, salario |
| **Tarifas** | Headers: mesa, tarifa, vigencia |
| **Asesores** | Headers: dni, nombres, apellidos, nombre genesys, estado |

---

## 🚀 Configuración Inicial

### 1. Variables de Entorno

Añade al archivo `.env`:

```env
# Auto-Sync
ENABLE_AUTO_SYNC=true

# Google Drive (opcional)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback

# SharePoint (opcional)
SHAREPOINT_CLIENT_ID=your-sharepoint-client-id
SHAREPOINT_CLIENT_SECRET=your-sharepoint-secret
SHAREPOINT_TENANT_ID=your-tenant-id
```

### 2. Configurar Google Drive API

**Paso 1**: Ve a [Google Cloud Console](https://console.cloud.google.com/)

**Paso 2**: Crea un proyecto nuevo o selecciona uno existente

**Paso 3**: Habilita Google Drive API:
- Ve a "APIs & Services" → "Library"
- Busca "Google Drive API"
- Clic en "Enable"

**Paso 4**: Crea credenciales OAuth 2.0:
- Ve a "APIs & Services" → "Credentials"
- Clic en "Create Credentials" → "OAuth client ID"
- Tipo: "Web application"
- Authorized redirect URIs: `http://localhost:3000/auth/google/callback`
- Copia Client ID y Client Secret al `.env`

**Paso 5**: Pantalla de consentimiento:
- Ve a "OAuth consent screen"
- Tipo: "External"
- Añade scopes: `https://www.googleapis.com/auth/drive.readonly`

### 3. Configurar SharePoint (Opcional)

**Paso 1**: Ve a [Azure Portal](https://portal.azure.com/)

**Paso 2**: Registra una aplicación:
- "Azure Active Directory" → "App registrations"
- "New registration"
- Nombre: "A365 Analytics Sync"
- Supported account types: "Single tenant"

**Paso 3**: Añade permisos:
- "API permissions" → "Add a permission"
- "Microsoft Graph" → "Application permissions"
- Añadir: `Sites.Read.All`, `Files.Read.All`
- Clic en "Grant admin consent"

**Paso 4**: Crea un secreto:
- "Certificates & secrets" → "New client secret"
- Copia el valor al `.env`

---

## 📁 Uso del Sistema

### Opción A: Configurar Carpeta de Google Drive

**1. Prepara la Carpeta en Drive:**
- Crea una carpeta en Google Drive
- Nombra la carpeta (ej: "A365 - Datasets Auto")
- Copia el ID de la carpeta desde la URL:
  ```
  https://drive.google.com/drive/folders/1ABC-defGHI_jklMNO
                                           ↑ Este es el ID
  ```

**2. Configura en la App:**
- Login como admin en A365 Analytics
- Ve a **Admin** → **Carpetas Sincronizadas**
- Clic en **Nueva Carpeta**
- Llena el formulario:
  - **Nombre**: "Drive - Datasets"
  - **Tipo**: Google Drive
  - **Folder ID**: `1ABC-defGHI_jklMNO`
  - **Auto-Sync**: ✅ Sí
  - **Frecuencia**: 30 minutos
  - **Auto-Detectar Tipo**: ✅ Sí
  - **Procesar Solo Nuevos**: ✅ Sí
- Guardar

**3. Sube Archivos:**
- Sube archivos Excel/CSV a la carpeta de Drive
- El sistema los detectará y procesará automáticamente cada 30 minutos

### Opción B: Sincronizar con SharePoint

**1. Prepara la Carpeta en SharePoint:**
- Crea una biblioteca de documentos
- Crea una carpeta (ej: "Datasets")
- Anota la ruta: `/sites/YourSite/Shared Documents/Datasets`

**2. Configura en la App:**
- Ve a **Admin** → **Carpetas Sincronizadas**
- Clic en **Nueva Carpeta**
- Llena el formulario:
  - **Nombre**: "SharePoint - Datasets"
  - **Tipo**: SharePoint
  - **Site URL**: `https://yourcompany.sharepoint.com/sites/YourSite`
  - **Library Name**: "Shared Documents"
  - **Folder Path**: "Datasets"
  - **Auto-Sync**: ✅ Sí
  - **Frecuencia**: 30 minutos
- Guardar

---

## 🎛️ Opciones de Configuración

### Sincronización

| Opción | Descripción | Recomendado |
|--------|-------------|-------------|
| **Auto-Sync** | Sincronizar automáticamente | ✅ Sí |
| **Frecuencia** | Minutos entre cada sync | 30 minutos |
| **Auto-Detectar Tipo** | Detectar tipo por headers | ✅ Sí |
| **Tipo Fijo** | Si no auto-detecta, usar este tipo | (vacío) |

### Procesamiento

| Opción | Descripción | Recomendado |
|--------|-------------|-------------|
| **Procesar Solo Nuevos** | No reprocesar archivos | ✅ Sí |
| **Eliminar Después** | Borrar archivo tras procesar | ❌ No |
| **Mover Después** | Mover a carpeta "Procesados" | ✅ Sí |
| **Carpeta Destino** | ID de carpeta de procesados | (opcional) |

### Filtros

| Filtro | Descripción | Ejemplo |
|--------|-------------|---------|
| **Extensiones** | Solo estos formatos | `xlsx, xls, csv` |
| **Patrón Nombre** | Regex para filtrar nombres | `^Dataset_.*\.xlsx$` |
| **Tamaño Máximo** | MB máximos permitidos | 25 MB |
| **Procesar Después** | Solo archivos más nuevos que fecha | 2025-01-01 |

---

## 🔍 Detección Automática de Tipo

### ¿Cómo Funciona?

1. **Extrae Headers**: Lee la primera fila del archivo
2. **Normaliza**: Quita tildes, convierte a minúsculas
3. **Compara Patrones**: Busca coincidencias con cada tipo de dataset
4. **Calcula Confianza**: % de headers que coinciden
5. **Selecciona Mejor Match**: El tipo con mayor confianza (mín. 60%)

### Ejemplo de Detección

**Archivo**: `rendimiento_enero.xlsx`

**Headers detectados**:
```
ag | nombre | ofrecidas | contestadas | manejo medio | acw medio
```

**Resultado**:
```json
{
  "type": "genesys-rendimiento",
  "confidence": "85.7%",
  "matches": [
    { "type": "genesys-rendimiento", "confidence": 0.857 },
    { "type": "genesys-provision-agregada", "confidence": 0.412 }
  ]
}
```

### Probar Detección

Puedes probar la detección sin procesar el archivo:

1. Ve a **Admin** → **Carpetas Sincronizadas**
2. Clic en **Probar Detección**
3. Sube un archivo de prueba
4. Verás el tipo detectado y la confianza

---

## 📊 Monitoreo y Estado

### Ver Estado de Sincronizaciones

En **Admin** → **Carpetas Sincronizadas** verás:

- 📁 **Carpetas Configuradas**: Lista de todas las carpetas
- ⏰ **Última Sync**: Cuándo se sincronizó por última vez
- 📈 **Estadísticas**:
  - Archivos encontrados
  - Archivos procesados exitosamente
  - Archivos con errores
- ⚡ **Acciones**:
  - Sincronizar ahora (manual)
  - Activar/Desactivar
  - Editar configuración
  - Ver historial

### Historial de Archivos

Cada carpeta mantiene un historial de los últimos 100 archivos procesados:

```
rendimiento_enero.xlsx → ✅ Procesado (120 registros importados)
estados_enero.xlsx → ✅ Procesado (95 registros importados)
datos_invalidos.xlsx → ❌ Error: No se pudieron extraer headers
```

---

## 🔧 Troubleshooting

### Problema: "Error de autenticación"

**Causa**: Token de Google/SharePoint expirado

**Solución**:
1. Re-autoriza la aplicación en Google/SharePoint
2. Actualiza el access token en la configuración de la carpeta

### Problema: "Tipo de dataset no detectado"

**Causa**: Headers no coinciden con ningún patrón

**Soluciones**:
1. Verifica que el archivo tenga headers en la primera fila
2. Usa "Probar Detección" para ver qué headers se detectaron
3. Si necesario, desactiva "Auto-Detectar" y selecciona tipo fijo

### Problema: "Archivo se procesa múltiples veces"

**Causa**: "Procesar Solo Nuevos" desactivado

**Solución**:
1. Activa la opción "Procesar Solo Nuevos"
2. O habilita "Mover Después" para mover archivos procesados

### Problema: "No se encuentra la carpeta"

**Causa**: ID de carpeta incorrecto o sin permisos

**Solución**:
1. Verifica que el ID de carpeta sea correcto
2. Asegúrate de que la app tenga permisos de lectura
3. Para Drive: Comparte la carpeta con el service account

---

## 🚦 Flujo Completo

```
1. Usuario sube archivo → Google Drive/SharePoint
           ↓
2. Scheduler detecta (cada 5 minutos)
           ↓
3. Lista archivos nuevos en carpeta
           ↓
4. Para cada archivo:
   ├─ Descarga archivo
   ├─ Detecta tipo (análisis de headers)
   ├─ Carga parser apropiado
   ├─ Parsea y valida datos
   ├─ Guarda en MongoDB (tenant correcto)
   └─ Mueve/elimina archivo
           ↓
5. Actualiza estadísticas
           ↓
6. Datos disponibles en dashboards
```

---

## 📝 Ejemplo de Uso Real

### Caso: Equipo de Analistas

**Situación**: El equipo recibe archivos de Genesys cada mañana

**Configuración**:
1. Crear carpeta en Drive: "Datasets Diarios"
2. Configurar sync automático cada 30 minutos
3. Activar "Auto-Detectar Tipo"
4. Activar "Mover Después" a carpeta "Procesados"

**Workflow**:
1. **08:00 AM**: Analista sube `rendimiento_20250114.xlsx` a Drive
2. **08:05 AM**: Sistema detecta nuevo archivo
3. **08:05 AM**: Detecta tipo "genesys-rendimiento" (92% confianza)
4. **08:06 AM**: Procesa 150 registros correctamente
5. **08:06 AM**: Mueve archivo a carpeta "Procesados"
6. **08:07 AM**: Datos disponibles en Dashboard de Genesys

**Resultado**: ✅ Cero intervención manual, datos listos en 7 minutos

---

## 🔐 Seguridad

- 🔒 **Tokens Encriptados**: Los access tokens se almacenan encriptados
- 🔐 **Por Tenant**: Cada carpeta está vinculada a una campaña específica
- 👥 **Solo Admins**: Solo administradores pueden configurar carpetas
- 📝 **Audit Log**: Todo proceso queda registrado en el historial
- ⏱️ **Tokens Temporales**: Los tokens tienen expiración y se renuevan automáticamente

---

## 🎓 Mejores Prácticas

1. **Nombra Archivos Consistentemente**: Usa `tipo_periodo.xlsx` (ej: `rendimiento_202501.xlsx`)
2. **Una Carpeta por Tipo**: Separa Genesys, Nómina, Asistencia en carpetas diferentes
3. **Revisa Historial**: Verifica que los archivos se procesen correctamente
4. **Configura Alertas**: Monitorea errores en la sincronización
5. **Limpia Archivos Viejos**: Mueve procesados a otra carpeta para mantener orden

---

## 📚 API de Integración

Si necesitas integrar programáticamente:

```javascript
// Sincronizar una carpeta manualmente
POST /admin/sync-folders/:id/sync

// Ver estado de carpeta
GET /admin/sync-folders/:id

// Probar detección de tipo
POST /admin/sync-folders/test-detection
{
  file: <archivo Excel/CSV>
}
```

---

## 🆘 Soporte

Para más ayuda:
- Ver logs del servidor para detalles de errores
- Revisar historial de archivos procesados en la UI
- Contactar al equipo de desarrollo

---

**Última actualización**: 2025-11-14
**Versión del Sistema**: 1.0.0
