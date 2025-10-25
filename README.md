# A365 Analytics

Aplicación web para gestión de accesos por roles (RBAC) e integración con Power BI. Backend en Node.js/Express con MongoDB y vistas EJS + TailwindCSS. Ideal para visualizar KPIs y administrar permisos de usuarios por módulo/acción.

## Requisitos

- Node.js 16+
- MongoDB 4.4+
- (Opcional) Cuenta de Power BI para embedding

## Instalación

```bash
npm install
cp .env.example .env
npm run build:css
npm run dev
```

Servidor: http://localhost:3000

## Variables de entorno

Consulta `.env.example` para la lista completa y valores de referencia.

## Scripts disponibles

- `npm start`: servidor en producción
- `npm run dev`: servidor en desarrollo con nodemon
- `npm run build:css`: compilar Tailwind
- `npm run watch:css`: vigilar y recompilar Tailwind

## Estructura del proyecto (resumen)

```
config/            # Configuración (entorno, Power BI, correo, CORS, rate limit)
middleware/        # Middlewares (auth)
models/            # Modelos Mongoose (User, Role, etc.)
public/            # Estáticos (CSS/JS)
routes/            # Rutas (auth, dashboard, admin, powerbi)
views/             # Vistas EJS (layouts, páginas)
app.js             # App Express
```

## Licencia

MIT. Ver [LICENSE](LICENSE).
