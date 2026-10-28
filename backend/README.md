# Backend - Buscador y Visor de Documentos Técnicos

API REST desarrollada con **NestJS** para la carga, procesamiento, indexación y búsqueda de documentos técnicos, con notificaciones en tiempo real (SSE) al terminar el procesamiento.

---

## 🚀 Características Principales

- **CRUD de documentos:** listado, carga multipart de archivos TXT/PDF/Markdown con metadatos, actualización de metadatos y eliminación del archivo.
- **Validación de carga:** revisión de formato, contenido y tamaño máximo configurable.
- **Persistencia:** metadatos en PostgreSQL mediante Prisma y archivos en `uploads/documents`.
- **Búsqueda full-text:** PostgreSQL `tsvector`/GIN sobre títulos, metadatos y contenido indexado; no utiliza `LIKE`.
- **Indexación en segundo plano:** el backend procesa cargas pendientes aunque el cliente se desconecte y recupera las pendientes al reiniciar.
- **Eventos SSE:** `GET /api/v1/realtime/documents/:id` envía el estado actual y sus cambios como eventos `document.status`.
- **API documentada con Swagger:** referencia interactiva de todos los endpoints.
- **Manejo estructurado de errores:** validación de datos y filtros de excepciones.

La carga persiste el archivo y sus metadatos con estado `PROCESSING` y responde sin esperar la extracción. Un worker del backend recupera los trabajos pendientes desde PostgreSQL, extrae el texto TXT/Markdown/PDF, actualiza el contenido y el índice de búsqueda, y cambia el estado a `INDEXED` o `ERROR`. El worker no depende de la conexión del cliente y vuelve a tomar trabajos pendientes después de un reinicio.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
| --- | --- |
| Framework | NestJS 12 (sobre Express) |
| Lenguaje | TypeScript, ESM |
| Base de datos | PostgreSQL |
| ORM | Prisma |
| Motor de búsqueda | PostgreSQL Full-Text Search (`tsvector` + índice GIN) |
| Tiempo real | Server-Sent Events (SSE) |
| Documentación de la API | Swagger (OpenAPI) |
| Pruebas | Vitest + Supertest |
| Calidad de código | oxlint (con tipos) y Prettier |
| Contenedores | Docker y Docker Compose |

---

## 🔎 Búsqueda Full-Text

La ruta `GET /api/v1/search` acepta `q`, `page` y `pageSize` (máximo 100). Admite términos y frases exactas con comillas dobles; la respuesta incluye relevancia, paginación y fragmentos con coincidencias dentro de `<mark>`.

- Un trigger mantiene `searchVector` con título, metadatos, etiquetas y contenido; un índice **GIN** acelera las consultas.
- Las consultas parametrizadas usan `prisma.$queryRaw`, `websearch_to_tsquery`, `ts_rank_cd` y `ts_headline`; no utilizan `LIKE`.
- Solo los documentos `INDEXED` aparecen en los resultados.
- El worker de indexación actualiza `content`; el trigger refresca `searchVector` en la misma transacción.

---

## 🔌 Endpoints Principales

La referencia completa e interactiva está en Swagger: <http://localhost:3000/docs>.

| Método | Ruta | Descripción |
| --- | --- | --- |
| `GET` | `/api/v1/documents` | Lista todos los documentos y sus metadatos |
| `GET` | `/api/v1/search?q=motor&page=1&pageSize=20` | Busca documentos por términos o frases con paginación y resaltado |
| `GET` | `/api/v1/realtime/documents/:id` | SSE con estado actual y cambios `document.status` del documento |
| `POST` | `/api/v1/documents` | Sube un archivo TXT, PDF o Markdown con metadatos vía multipart |
| `PATCH` | `/api/v1/documents/:id` | Actualiza metadatos del documento |
| `DELETE` | `/api/v1/documents/:id` | Elimina el documento y el archivo almacenado |

Los metadatos requeridos para la carga son `title`, `author`, `category` y `version`; `tags` es opcional. El tamaño máximo se configura con `MAX_FILE_SIZE_MB`. Los archivos se guardan en `backend/uploads/documents` (directorio ignorado por Git) y PostgreSQL conserva sus metadatos y el trabajo pendiente. La carga responde con `PROCESSING`; el backend extrae el texto en segundo plano y publica `INDEXED` o `ERROR` por SSE. La interfaz debe abrir el EventSource usando el `id` devuelto por la carga y cerrarlo al recibir un estado terminal. El reemplazo del archivo no hace parte de estos endpoints.

### Estados de un documento

| Estado | Significado |
| --- | --- |
| `PROCESANDO` | Recibido; en extracción e indexación |
| `INDEXADO` | Disponible para búsqueda y visualización |
| `ERROR` | Falló el procesamiento |

La carga inicial deja el documento en `PROCESSING`. El backend lo actualiza a `INDEXED` o `ERROR` al terminar el procesamiento y emite un evento SSE `document.status` con su `id`, `status` y `updatedAt`.

### Eventos en tiempo real (SSE)

Con la respuesta de `POST /api/v1/documents`, la interfaz puede suscribirse a `GET /api/v1/realtime/documents/{id}` usando `EventSource`. El endpoint envía inmediatamente el estado actual, y después `document.status` al completarse el procesamiento. La conexión del navegador no controla ni interrumpe el worker.

```text
event: document.status
data: {"id":"3f6c2a1e-0000-0000-0000-000000000000","status":"INDEXED","updatedAt":"2026-10-27T18:00:00.000Z"}
```

El frontend se conecta con `EventSource`, que reconecta automáticamente si se corta la conexión. Para que funcione desde el navegador, el origen del frontend debe estar permitido en `CORS_ORIGIN`.

---

## 📁 Estructura del Proyecto

```text
backend/
├── prisma/
│   ├── schema.prisma     # Modelos de datos y configuración de Prisma
│   └── migrations/       # Migraciones SQL (incluye índices GIN y funciones tsvector)
├── src/
│   ├── main.ts           # Inicialización, CORS y documentación Swagger
│   ├── app.module.ts     # Módulo raíz de la aplicación
│   └── modules/
|       ├── documents/    # Lógica de carga, procesamiento y almacenamiento
|       ├── realtime/     # Canal de eventos en tiempo real (SSE)
|       └── search/       # Módulo de búsqueda optimizada (Full-Text Search)
├── test/                 # Pruebas e2e y unitarias
├── .env.example          # Plantilla de variables de entorno
└── .env.test             # Variables de entorno para pruebas
```

---

## ⚙️ Configuración y Ejecución Local

### 1. Prerrequisitos

- [Node.js](https://nodejs.org/) 22 o superior
- npm, pnpm o yarn
- [Docker](https://www.docker.com/) con Docker Compose, para levantar PostgreSQL

### 2. Instalación de dependencias

```bash
cd backend
npm install
```

### 3. Variables de entorno

Copia la plantilla y ajusta los valores si hace falta:

```bash
cp .env.example .env
```

Contenido de `.env.example`:

```env
# ==============================================
# 🌐 APPLICATION CONFIGURATION
# ==============================================
PORT=3000
NODE_ENV=development
MAX_FILE_SIZE_MB=25
# ==============================================
# 🗄️ DATABASE CONFIGURATION
# ==============================================
DATABASE_URL=postgresql://docs_user:docs_password@localhost:5432/docs_db_test?schema=public
DATABASE_MAX_POOL_SIZE=10
DATABASE_CONNECTION_TIMEOUT_MS=5000
DATABASE_IDLE_TIMEOUT_MS=30000
# ==============================================
# 📚 SWAGGER DOCUMENTATION CONFIGURATION
# ==============================================
SWAGGER_USER=admin
SWAGGER_PASSWORD=Test1234@
```

| Variable | Descripción |
| --- | --- |
| `NODE_ENV` | Entorno de ejecución (`development`, `test`, `production`) |
| `PORT` | Puerto de la API |
| `MAX_FILE_SIZE_MB` | Tamaño máximo permitido por archivo cargado |
| `DATABASE_URL` | Cadena de conexión a PostgreSQL. Usado por Prisma. |
| `DATABASE_MAX_POOL_SIZE` | Tamaño máximo del pool de conexiones de la DB. |
| `DATABASE_CONNECTION_TIMEOUT_MS` | Tiempo máximo de espera para establecer conexión con la DB. |
| `DATABASE_IDLE_TIMEOUT_MS` | Tiempo de inactividad antes de cerrar una conexión de la DB. |
| `SWAGGER_USER` | Usuario para acceder a la documentación de Swagger |
| `SWAGGER_PASSWORD` | Contraseña para acceder a la documentación de Swagger |

Variables para las pruebas e2e, en `.env.test` (usan una base de datos separada):

### 4. Base de datos

Desde la raíz del repositorio, levanta PostgreSQL:

```bash
docker compose up -d db
```

Luego, desde `backend/`, genera el cliente de Prisma y aplica las migraciones:

```bash
npx prisma generate
npx prisma migrate dev
```

### 5. Ejecución

```bash
# Desarrollo con recarga automática
npm run start:dev

# Producción (requiere compilar antes)
npm run build
npm run start:prod
```

La API estará disponible por defecto en <http://localhost:3000> y la documentación Swagger en <http://localhost:3000/docs>.

### Con Docker Compose

Para levantar todo el entorno (base de datos, backend y frontend), consulta el [README principal](../README.md#-inicio-rápido).

---

## 📜 Scripts Disponibles

| Script | Descripción |
| --- | --- |
| `npm run start` | Inicia la aplicación |
| `npm run start:dev` | Inicia en modo watch |
| `npm run start:debug` | Inicia en modo debug con watch |
| `npm run start:prod` | Ejecuta la compilación de `dist/` |
| `npm run build` | Compila el proyecto |
| `npm run lint` | Análisis estático con oxlint |
| `npm run format` | Formatea el código con Prettier |
| `npm run test` | Ejecuta las pruebas unitarias |
| `npm run test:watch` | Pruebas en modo watch |
| `npm run test:cov` | Pruebas con reporte de cobertura |
| `npm run test:e2e` | Pruebas end-to-end |

---

## 🧪 Pruebas

Las pruebas unitarias no necesitan base de datos:

```bash
npm run test       # unitarias e integración
npm run test:cov   # cobertura
```

Las pruebas e2e usan una base de datos propia (`docs_db_test`), definida en `.env.test`. Créala una vez y aplica las migraciones:

```bash
# Crear la base de datos de pruebas (desde la raíz del repositorio)
docker compose exec db createdb -U docs_user docs_db_test

# Aplicar las migraciones sobre la base de pruebas (desde backend/)
DATABASE_URL="postgresql://docs_user:docs_password@localhost:5432/docs_db_test?schema=public" npx prisma migrate deploy

# Ejecutar las pruebas e2e
npm run test:e2e
```
