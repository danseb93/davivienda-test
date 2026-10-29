# Buscador y Visor de Documentos Técnicos

Aplicación web Full Stack para la carga, procesamiento, búsqueda de alto rendimiento y visualización de documentos técnicos (manuales, especificaciones, guías de arquitectura).

## ✨ Qué hace

- **Carga de documentos** (TXT, PDF, Markdown) con metadatos: título, autor, categoría, etiquetas y versión.
- **Búsqueda full-text** sobre título, metadatos y contenido, con prefijos de palabra (por ejemplo, `prue` encuentra `prueba`), frases exactas entre comillas, paginación y resaltado. Sin consultas `LIKE`; tiempos de respuesta objetivo entre **400 ms y 1 s**.
- **OCR para PDF escaneados:** crea una copia buscable sin alterar el original e indexa el texto reconocido.
- **Visor de documentos** que resalta las coincidencias sobre el PDF, incluso cuando el texto proviene de OCR.
- **Notificaciones en tiempo real** (SSE) cuando un documento pasa a `INDEXADO` o `ERROR`, sin polling.

---

## 📦 Estructura del Repositorio

```text
.
├── backend/              # API, procesamiento e indexación (NestJS + Prisma)
├── frontend/             # Interfaz web (React + Vite + TypeScript)
├── docs/
│   ├── architecture.md   # Arquitectura, decisiones y escalabilidad
│   └── ia.md             # Uso de IA durante el desarrollo
├── docker-compose.yml    # Levantamiento unificado del entorno
└── README.md             # Este archivo
```

---

## 📚 Documentación

| Módulo | Descripción | Enlace |
| --- | --- | --- |
| **Frontend** | Instalación, variables de entorno, concurrencia de carga (`VITE_UPLOAD_CONCURRENCY`, 5 por defecto) y ejecución de la interfaz | [frontend/README.md](./frontend/README.md) |
| **Backend** | Instalación, base de datos, scripts y pruebas de la API | [backend/README.md](./backend/README.md) |
| **Arquitectura** | Diagrama, justificación del stack y estrategia de tiempo real | [docs/architecture.md](./docs/architecture.md) |
| **Uso de IA** | Herramientas, casos de uso, prompts y validación humana | [docs/ia.md](./docs/ia.md) |

---

## 🚀 Inicio Rápido

### Opción A: Docker Compose (recomendada)

Requisitos: [Docker](https://www.docker.com/) con Docker Compose.

```bash
docker compose up -d
```

Una vez levantado el entorno:

| Servicio | URL |
| --- | --- |
| Frontend | <http://localhost:5173> |
| API (backend) | <http://localhost:3000> |
| Documentación Swagger | <http://localhost:3000/docs> |
| PostgreSQL | `localhost:5432` |

### Opción B: Ejecución local

Útil para desarrollar con recarga automática.

1. **Base de datos:** levanta solo PostgreSQL con `docker compose up -d db`.
2. **Backend:** sigue las instrucciones de [backend/README.md](./backend/README.md).
3. **Frontend:** sigue las instrucciones de [frontend/README.md](./frontend/README.md).

Levanta primero el backend: el frontend depende de su API y del canal de eventos en tiempo real.

---

## 🔐 Variables de Entorno

Cada módulo tiene su propio archivo `.env.example` que sirve de plantilla. Los archivos `.env` no se versionan.

| Módulo | Archivo | Detalle |
| --- | --- | --- |
| Backend | `backend/.env` y `backend/.env.test` | [backend/README.md](./backend/README.md#3-variables-de-entorno) |
| Frontend | `frontend/.env` | [frontend/README.md](./frontend/README.md#3-variables-de-entorno) |

---

## 🧭 Decisiones Clave

- **PostgreSQL Full-Text Search** (`tsvector` + índice GIN) como base de datos y motor de búsqueda a la vez: una sola pieza de infraestructura y sin consultas `LIKE`.
- **Prisma** como ORM. Las consultas de texto se ejecutan con `prisma.$queryRaw`, porque el cliente no expone las funciones de full-text search de Postgres.
- **Carga por REST (multipart)** con respuesta inmediata en estado `PROCESANDO`; el procesamiento e indexación ocurren en segundo plano.
- **SSE (Server-Sent Events)** para notificar cambios de estado: la comunicación es solo del servidor al cliente y se reconecta automáticamente.

El detalle y la justificación están en [docs/architecture.md](./docs/architecture.md).

---

## 🛠️ Stack General

| Capa | Tecnología |
| --- | --- |
| Frontend | React 19, Vite, TypeScript |
| Backend | NestJS, TypeScript |
| Base de datos | PostgreSQL |
| ORM | Prisma |
| Motor de búsqueda | PostgreSQL Full-Text Search (`tsvector` + GIN) |
| Tiempo real | Server-Sent Events (SSE) |
| Documentación de la API | Swagger (OpenAPI) |
| Contenedores | Docker y Docker Compose |
