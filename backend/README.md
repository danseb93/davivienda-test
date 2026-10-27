# Backend - Buscador y Visor de Documentos Técnicos

API REST desarrollada con **NestJS** para la carga, procesamiento, indexación y búsqueda de documentos técnicos, con notificaciones en tiempo real (SSE) al terminar el procesamiento.

---

## 🚀 Características Principales

- **Carga de documentos con metadatos:** recepción multipart por REST de archivos TXT, PDF y Markdown, con validación de formato y tamaño máximo.
- **Procesamiento asíncrono:** la respuesta inicial es inmediata y devuelve un ID de seguimiento con estado `PROCESANDO`. La extracción e indexación del texto ocurren en segundo plano.
- **Búsqueda full-text de alto rendimiento:** búsqueda por título, metadatos y contenido con PostgreSQL Full-Text Search (sin `LIKE`), con paginación y resaltado de fragmentos. Objetivo: 400 ms a 1 s.
- **Eventos en tiempo real (SSE):** emisión de un evento al frontend cuando el documento pasa a `INDEXADO` o `ERROR`.
- **API documentada con Swagger:** referencia interactiva de todos los endpoints.
- **Manejo estructurado de errores:** validación de datos y filtros de excepciones.

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

La búsqueda no usa `LIKE`: se apoya en un índice invertido de PostgreSQL.

- Cada documento tiene una columna `tsvector` con un índice **GIN** que combina título, metadatos y contenido.
- Las consultas se ejecutan con `prisma.$queryRaw`, porque el cliente de Prisma no expone funciones como `ts_rank` (relevancia) ni `ts_headline` (resaltado de fragmentos).
- La columna `tsvector` y su índice GIN se crean en una migración SQL.

---

## 🔌 Endpoints Principales

<!-- TODO: ajustar rutas y payloads a los reales -->

La referencia completa e interactiva está en Swagger: <http://localhost:3000/docs>.

| Método | Ruta | Descripción |
| --- | --- | --- |
| `POST` | `/documents` | Sube un documento (multipart) con metadatos. Devuelve ID y estado `PROCESANDO` |
| `GET` | `/documents/search` | Búsqueda full-text con paginación y resaltado |
| `GET` | `/documents/:id` | Detalle del documento: contenido y metadatos |
| `GET` | `/events` | Canal SSE con los cambios de estado de los documentos |

### Estados de un documento

| Estado | Significado |
| --- | --- |
| `PROCESANDO` | Recibido; en extracción e indexación |
| `INDEXADO` | Disponible para búsqueda y visualización |
| `ERROR` | Falló el procesamiento |

### Eventos en tiempo real

<!-- TODO: ajustar nombre del evento y payload a los reales -->

El endpoint `GET /events` responde con `Content-Type: text/event-stream`. Ejemplo de evento:

```text
event: document.status
data: {"id":"3f6c2a1e-0000-0000-0000-000000000000","status":"INDEXADO"}
```

El frontend se conecta con `EventSource`, que reconecta automáticamente si se corta la conexión. Para que funcione desde el navegador, el origen del frontend debe estar permitido en `CORS_ORIGIN`.

---

## 📁 Estructura del Proyecto

<!-- TODO: reemplazar por la estructura real de src/ -->

```text
backend/
├── prisma/
│   ├── schema.prisma     # Modelo de datos
│   └── migrations/       # Migraciones (incluye tsvector e índice GIN)
├── src/
│   ├── main.ts           # Punto de entrada (configura Swagger y CORS)
│   ├── app.module.ts     # Módulo raíz
│   └── ...               # Módulos de documentos, búsqueda y eventos
├── test/                 # Pruebas e2e
├── .env.example          # Plantilla de variables de entorno
└── .env.test             # Variables para las pruebas e2e
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
NODE_ENV=development
PORT=3000
DATABASE_URL="postgresql://docs_user:docs_password@localhost:5432/docs_db?schema=public"
CORS_ORIGIN=http://localhost:5173
MAX_FILE_SIZE_MB=10
```

| Variable | Descripción |
| --- | --- |
| `NODE_ENV` | Entorno de ejecución (`development`, `test`, `production`) |
| `PORT` | Puerto de la API |
| `DATABASE_URL` | Cadena de conexión a PostgreSQL. Dentro de Docker Compose el host es `db` en lugar de `localhost` |
| `CORS_ORIGIN` | Origen del frontend permitido (necesario para la API y para SSE) |
| `MAX_FILE_SIZE_MB` | Tamaño máximo permitido por archivo cargado |

Variables para las pruebas e2e, en `.env.test` (usan una base de datos separada):

```env
NODE_ENV=test
PORT=3001
DATABASE_URL="postgresql://docs_user:docs_password@localhost:5432/docs_db_test?schema=public"
CORS_ORIGIN=http://localhost:5173
MAX_FILE_SIZE_MB=1
```

> Estos valores son solo para desarrollo y pruebas. No los uses en producción.

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