# Arquitectura del Backend

**Proyecto:** Buscador y Visor de Documentos Técnicos

**Alcance:** este documento describe la arquitectura tal como está implementada en el repositorio (módulos NestJS, esquema Prisma/PostgreSQL, migración SQL y `docker-compose.yml`). Cada afirmación se puede verificar en los archivos citados.

---

## 1. Diagramas de arquitectura y flujo

### 1.1 Componentes y dependencias

El diagrama se lee de izquierda a derecha: cliente, backend, almacenamiento. Todos los módulos acceden a los datos a través de `PrismaService`, y solo `Documents` y el worker tocan el disco.

```mermaid
flowchart LR
    FE["Frontend<br/>React 19 + Vite"]

    subgraph API["Backend NestJS · puerto 3000"]
        DOC["Documents"]
        SRCH["Search"]
        RT["Realtime<br/>SSE + Subject RxJS"]
        IDX["Worker de indexación"]
        PRISMA["PrismaService<br/>pool pg"]
    end

    DISK[("Disco<br/>uploads/documents")]

    subgraph PG["PostgreSQL 16"]
        TBL[("Tabla Document")]
        TS[("searchVector<br/>índice GIN")]
    end

    FE -->|POST /documents| DOC
    FE -->|GET /search| SRCH
    FE -->|SSE| RT

    DOC --> PRISMA
    SRCH --> PRISMA
    RT --> PRISMA
    IDX --> PRISMA
    IDX -->|publish| RT

    DOC --> DISK
    IDX --> DISK

    PRISMA --> TBL
    TBL -->|trigger| TS
```

### 1.2 Carga de un documento

La API responde de inmediato con el documento en estado `PROCESSING`. La extracción de texto la hace el worker después (diagrama 1.3).

```mermaid
sequenceDiagram
    autonumber
    participant U as Frontend
    participant C as Controller
    participant CS as Creator
    participant ST as Storage
    participant DB as PostgreSQL
    participant SS as SSE

    U->>C: POST /documents (archivo + metadatos)
    C->>CS: create(dto, file)
    CS->>ST: store(file)
    Note over ST: Valida extensión, MIME,<br/>magic bytes y tamaño
    ST->>ST: Escribe {uuid}.ext (flag wx)
    CS->>DB: INSERT con status PROCESSING
    Note over DB: El trigger calcula<br/>searchVector
    CS-->>U: 201 Created (id, PROCESSING)
    U->>SS: GET /realtime/documents/:id
    SS->>DB: Lee el estado actual
    SS-->>U: Evento PROCESSING
```

### 1.3 Indexación asíncrona y notificación

El worker consulta la cola cada segundo mientras haya documentos pendientes. El cliente cierra el `EventSource` al recibir un estado terminal.

```mermaid
sequenceDiagram
    autonumber
    participant W as Worker
    participant ST as Storage
    participant DB as PostgreSQL
    participant RS as Realtime
    participant U as Frontend

    loop Cada 1 s mientras haya pendientes
        W->>DB: Toma un PROCESSING (FOR UPDATE SKIP LOCKED)
        W->>ST: read(storageName)
        W->>W: Extrae texto (TXT/MD utf8, PDF con pdf-parse)
        alt Éxito
            W->>DB: UPDATE content + status INDEXED
            Note over DB: Misma transacción,<br/>el trigger refresca el vector
            W->>RS: publish(INDEXED)
            RS-->>U: document.status INDEXED
        else Fallo
            W->>DB: UPDATE status ERROR
            W->>RS: publish(ERROR)
            RS-->>U: document.status ERROR
        end
    end
    U->>U: Cierra el EventSource
```

### 1.4 Búsqueda

La página de resultados y el total se calculan en paralelo contra el mismo índice GIN.

```mermaid
sequenceDiagram
    autonumber
    participant U as Frontend
    participant SC as Controller
    participant DS as Service
    participant RP as Repository
    participant DB as PostgreSQL

    U->>SC: GET /search?q=...&page=1&pageSize=20
    SC->>DS: search(query)
    Note over SC: El DTO valida q (máx. 200),<br/>page ≥ 1, pageSize 1..100
    DS->>DS: Rechaza q vacío (400)
    DS->>RP: search(term, limit, offset)
    par Página de resultados
        RP->>DB: Consulta con ranking y ts_headline
    and Total
        RP->>DB: count(*) de documentos INDEXED
    end
    DB-->>RP: Filas y total
    RP-->>DS: items y total
    DS->>DS: Escapa HTML y convierte marcadores en mark
    DS-->>U: 200 (items, total, page, pageSize, totalPages)
```

Detalle de la consulta de la página: `websearch_to_tsquery('simple', q)` contra `searchVector`, orden por `ts_rank_cd DESC` y luego `createdAt DESC`, con `ts_headline` sobre `concat_ws(title, author, category, tags, content)`.

> Solo se devuelven documentos con `status = 'INDEXED'`. Uno en `PROCESSING` o `ERROR` nunca aparece en los resultados aunque su fila exista (`prisma-search.repository.ts`).

---

## 2. Justificación de las decisiones

### 2.1 Rendimiento (400 ms a 1 s)

El enunciado exige que toda búsqueda responda entre 400 ms y 1 s, y prohíbe `LIKE` y equivalentes sin índice. Cada decisión ataca una causa concreta de latencia, eligiendo siempre la opción más simple que cumple el rango sin añadir infraestructura.

- **Índice invertido en lugar de barrido de filas.** `LIKE '%t%'` recorre toda la tabla y no sirve con un `content TEXT` grande. Entre las opciones con índice (Elasticsearch/OpenSearch, Meilisearch/Typesense, RedisSearch, Mongo Text Index y PostgreSQL FTS con `tsvector` + GIN) se eligió la última (ver §2.3). La consulta se resuelve en el mismo motor que guarda los datos, sin salto de red ni serialización adicional. Además, el ranking (`ts_rank_cd`) y el resaltado (`ts_headline`) salen en la misma sentencia.
- **Trabajo pesado fuera de la petición.** Un `POST` síncrono que extrajera y tokenizara el texto heredaría el peor caso de un PDF grande. Por eso se responde `201` con `PROCESSING` y el worker hace la extracción (§1.3). La escritura se reduce a validar el archivo y hacer un `INSERT`, y el aviso de término llega por SSE (HU-04). Se descartó el polling porque multiplica las peticiones sin ser más inmediato.
- **Límites duros en el DTO.** Sin tope, un `pageSize` arbitrario obligaría a ordenar y materializar miles de filas con su snippet. Se fija `pageSize` en [1, 100], `q` en 200 caracteres como máximo y fragmentos acotados (`MaxFragments=2`, `MinWords=8`, `MaxWords=24`). Así el coste de cada consulta tiene techo, sin importar lo que pida el cliente.
- **Página y total en paralelo.** Calcular `count(*)` después de la página aumenta la latencia percibida aproximadamente al doble. Con `Promise.all` el tiempo total es el de la consulta más lenta. Se prefirió el conteo exacto a las estimaciones de catálogo porque el conjunto filtrado ya usa el mismo índice GIN.
- **Pool de conexiones reutilizado.** Abrir una conexión por petición sumaría decenas o cientos de milisegundos de handshake a cada búsqueda. `@prisma/adapter-pg` mantiene un pool (`DATABASE_MAX_POOL_SIZE=10`) con timeouts de conexión e inactividad, de modo que el coste de conectar se amortiza y el agotamiento se detecta rápido en lugar de dejar la petición colgada.
- **No transferir contenido innecesario.** Incluir `content` completo en `/documents` dominaría el tamaño de la respuesta y el tiempo de serialización. Los listados y detalles excluyen `content` y `storageName`, y el buscador devuelve solo el snippet de `ts_headline`.

### 2.2 Stack

| Elección | Por qué |
| --- | --- |
| **NestJS 12 + TypeScript (ESM)** | Módulos con inyección de dependencias, que permiten separar dominio e infraestructura (§2.5). `@Sse()` nativo sobre RxJS, `ValidationPipe` global con `whitelist`, prefijo `api` con versionado URI `v1` y Swagger generado desde decoradores (`config/swagger.config.ts`) |
| **PostgreSQL 16** | Una sola base cubre metadatos, contenido, estados y búsqueda: `tsvector`/`tsquery`, GIN, arrays (`tags TEXT[]`), `ENUM` y `FOR UPDATE SKIP LOCKED`. Evita sincronizar un buscador externo |
| **Prisma 6 + `@prisma/adapter-pg`** | Modelo declarativo y migraciones SQL versionadas. El cliente tipado no expone full-text, así que se usa `prisma.$queryRaw` con `Prisma.sql` (parametrizado, sin interpolación insegura). `pg` aporta el pool |
| **PostgreSQL FTS** | Ver §2.3 |
| **pdf-parse (`PDFParse`)** | Es el único paso de binario a texto (PDF). TXT y MD se leen como UTF-8. El parser se libera con `finally { parser.destroy() }` |
| **Multer `memoryStorage()`** | El buffer ya hace falta para validar la cabecera `%PDF-` y la ausencia de bytes nulos antes de escribir en disco. Límite por `MAX_FILE_SIZE_MB` (25 MB por defecto) |
| **Vitest (+ Supertest en e2e)** | Un solo runner para pruebas unitarias e de integración con ESM/TS. Las e2e usan una base separada, `docs_db_test` |
| **Docker Compose** | `db` con healthcheck, `backend` con `depends_on: service_healthy` y `npx prisma migrate deploy` al arrancar (Dockerfile), y `frontend` dependiente de `backend` |

### 2.3 Motor de búsqueda: PostgreSQL FTS frente a Elasticsearch, Meilisearch o Typesense

1. **Latencia.** `searchVector @@ websearch_to_tsquery('simple', $q)` se resuelve por índice GIN, dentro del mismo proceso de base de datos, sin salto de red ni serialización adicional.
2. **Consistencia.** El trigger `BEFORE INSERT OR UPDATE OF "title","author","category","tags","content"` mantiene el vector, así que índice y fila no pueden divergir. Con un motor externo habría que construir un pipeline de ingestión, reintentos y backfill.
3. **Relevancia ponderada.** `setweight` asigna `'A'` al título, `'B'` a autor, categoría y etiquetas, y `'C'` al contenido. El orden es `ts_rank_cd` con desempate por `createdAt DESC`.
4. **Resaltado nativo.** `ts_headline` genera el fragmento en la misma consulta. El servicio solo traduce los marcadores a `<mark>` y escapa el HTML.
5. **Coste operativo.** Un contenedor menos, sin JVM, sin gestión de shards ni réplicas y sin doble mapeo de esquema.

**Configuración deliberada.** Se usa el diccionario `simple`, sin stemming ni stopwords. Los documentos técnicos contienen identificadores, versiones y términos en varios idiomas (`v2.1`, `k8s`, `ISO-9001`). `simple` conserva la exactitud de los tokens y evita que el stemming en inglés perjudique las consultas en español. A cambio no hay sinónimos ni stemming, y se compensa con frases exactas entre comillas (`websearch_to_tsquery` admite `"..."`, `OR`, `AND` y `NOT`).

**Cuándo valdría la pena un motor dedicado:** búsqueda difusa o BM25 avanzado, facetas pesadas, millones de documentos o rankings aprendidos. El punto de inserción ya existe: la interfaz `SearchRepository` (`modules/search/domain/search.repository.ts`) permite añadir otro adaptador sin tocar el controlador ni el servicio.

### 2.4 Base de datos y modelo

- `Document.id` es un UUID y es la clave primaria. `storageName VARCHAR(255) UNIQUE` identifica el archivo en disco. `content` es `TEXT`. `searchVector` se declara como `Unsupported("tsvector")` en Prisma y se gestiona por SQL.
- `status` es un `ENUM ('PROCESSING','INDEXED','ERROR')` con valor por defecto `PROCESSING`. El ciclo de vida vive en la base de datos y la aplicación no lo infiere.
- Índices físicos: `Document_storageName_key` (UNIQUE), `Document_createdAt_idx` (listado y desempate) y `Document_searchVector_idx` (GIN).
- La migración es idempotente (`IF NOT EXISTS`, `DROP TRIGGER IF EXISTS`) e incluye un backfill explícito del vector para las filas previas.

### 2.5 Arquitectura interna (hexagonal ligera)

| Módulo | Contrato (dominio) | Implementación (infraestructura) | Token DI |
| --- | --- | --- | --- |
| documents | `domain/document.repository.ts` | `infrastructure/prisma/prisma-document.repository.ts` | `DocumentRepository` |
| search | `domain/search.repository.ts` | `infrastructure/prisma/prisma-search.repository.ts` | `SearchRepository` |
| realtime | `domain/realtime.repository.ts` | `infrastructure/prisma/prisma-realtime.repository.ts` | `RealtimeRepository` |

En la práctica, los `.spec.ts` sustituyen los adaptadores por dobles, y cambiar el motor de búsqueda o el canal de eventos es un cambio de proveedor, no de lógica de negocio.

### 2.6 Validación y seguridad implementadas

- `class-validator` y `class-transformer` en todos los DTO, con `whitelist: true` global (`main.ts`).
- Rutas protegidas con `ParseUUIDPipe`, bajo el prefijo `api/` y la versión `v1`.
- Whitelist real de tipos: mapa `ACCEPTED_TYPES` (extensión + MIME), más magic bytes `%PDF-`, más rechazo de binarios (byte `0x00`) en TXT/MD y rechazo de archivos vacíos.
- Protección contra path traversal: el nombre es `{randomUUID()}{ext}`, la escritura usa `flag: 'wx'` y `resolveStoredFile()` valida que `basename(storageName) === storageName`.
- El snippet se sanea con `escapeHtml()` antes de envolverlo en `<mark>`, lo que previene XSS en el visor.
- Swagger queda detrás de Basic Auth (`SWAGGER_USER`/`SWAGGER_PASSWORD`). Si falla el `INSERT`, el archivo ya escrito se elimina (`document-creator.service.ts`).
- La transacción de indexación usa `maxWait: 10 s` y `timeout: 300 s`, pensados para extracciones largas de PDF.

**Deuda detectada al revisar el código** (no se documenta como implementada): `backend/src/main.ts` no llama a `app.enableCors()` y no existe la variable `CORS_ORIGIN`, aunque `backend/README.md` la menciona. Con el frontend y el backend en orígenes distintos (`localhost:5173` hacia `localhost:3000`), el navegador rechazaría las peticiones cross-origin, incluido el `EventSource`. **Acción pendiente:** habilitar CORS con una lista blanca de orígenes definida por variable de entorno. El resto del documento describe solo lo que sí está implementado.

---

## 3. Estrategia de tiempo real

### 3.1 Elección: SSE (`text/event-stream`)

| Criterio | SSE (elegido) | WebSocket | Redis Pub/Sub |
| --- | --- | --- | --- |
| Dirección necesaria | Unidireccional, servidor a cliente (notificar un estado) | Bidireccional, innecesaria aquí | Broker interno |
| Implementación | `@Sse()` de Nest + `Observable<MessageEvent>` | Gateway/socket.io, con handshake y ping/pong propios | Infraestructura y librería adicionales |
| Reconexión | Automática, la hace `EventSource` | Manual (reintento y resincronización) | No aplica |
| Infraestructura | Petición HTTP normal, sin `Upgrade` | Requiere upgrade de protocolo | Requiere desplegar Redis |
| Complejidad de estado | Ninguna (canal informativo) | Manejo de salas y desconexiones | Suscripciones y acks |

El requisito de no usar polling se cumple. El frontend abre un `EventSource` con el `id` que devuelve la carga y lo cierra al recibir `INDEXED` o `ERROR`.

### 3.2 Implementación

**Endpoint** (`modules/realtime/realtime.controller.ts`):

```
GET /api/v1/realtime/documents/:id  →  text/event-stream
```

**Servicio** (`RealtimeEventService`):

- Un único `Subject<DocumentStatusEvent>` en memoria actúa como bus de eventos del proceso.
- El worker invoca `publish(event)` después de confirmar el cambio de estado en la base de datos (`document-indexing.service.ts`).
- `streamDocument(id)` combina tres fuentes con `merge()`:
  1. `currentStatus` (`defer(...)`): lee el estado actual y lo emite de inmediato. Si el documento no existe lanza `NotFoundException` (404) y no se abre la suscripción. Esto cierra la carrera entre el `POST /documents` y la apertura del `EventSource`.
  2. `updates`: `events.pipe(filter(e => e.id === id))`, que filtra por documento dentro del stream compartido.
  3. `heartbeat`: `interval(15_000)` con `type: 'heartbeat'`, para que proxies y balanceadores no cierren conexiones ociosas.

**Formato del evento** (`event:` es `document.status`):

```
event: document.status
data: {"id":"3f6c2a1e-...","status":"INDEXED","updatedAt":"2026-10-27T18:00:00.000Z"}
```

**Garantías y límites asumidos:**

- **Fuente de verdad:** la columna `status`. El stream arranca con el estado actual y luego entrega los cambios.
- **Eventos no persistidos:** si nadie está suscrito durante la transición, el evento no se vuelve a emitir. El cliente recupera el estado final con `GET /api/v1/documents/:id` o abriendo el stream.
- **Sin ack ni replay:** el canal es solo informativo.
- **Alcance limitado al proceso:** el `Subject` es local a cada instancia (ver §4.3).
- **El worker no depende del cliente:** procesa aunque el navegador se cierre y retoma los pendientes tras un reinicio (`onModuleInit` llama a `schedule(0)`).

### 3.3 Alternativa descartada: LISTEN/NOTIFY

`LISTEN`/`NOTIFY` permitiría difundir eventos entre instancias sin un broker, pero exige conexiones dedicadas que compiten con el pool de `pg`, escala mal con muchas conexiones SSE abiertas y obliga a manejar la reconexión. Queda registrada como evolución posible (§4.3), no como estado actual.

---

## 4. Escalabilidad

### 4.1 Lo que la arquitectura ya soporta

| Dimensión | Mecanismo implementado |
| --- | --- |
| Crecimiento masivo de documentos en lectura | GIN + `tsvector` precalculado. El coste depende de los lexemas del término y de las filas coincidentes, no del tamaño total del corpus. Sin `LIKE` no hay escaneo `O(n)` de `content` |
| Escrituras sin degradar las lecturas | La carga cuesta O(tamaño del archivo) en disco más un `INSERT`. La extracción y el análisis quedan fuera de la petición |
| Concurrencia del worker | `FOR UPDATE SKIP LOCKED`: dos procesos de indexación nunca toman el mismo pendiente y los lectores no esperan locks |
| Backpressure natural | Cola persistente en `Document`, filtrada por `status='PROCESSING' ORDER BY createdAt ASC` (FIFO) |
| Paginación acotada | `pageSize ≤ 100` y `MaxFragments=2` |
| Consumo de conexiones | Pool `pg` con `max`, `connectionTimeoutMillis` e `idleTimeoutMillis` configurables por variable de entorno |
| Recuperación ante fallos | Los estados son persistentes: las filas huérfanas en `PROCESSING` se retoman al arrancar el servicio |

### 4.2 Cuellos de botella y cómo crecer

| Cuello de botella | Señal de agotamiento | Palanca (sin reescribir el dominio) |
| --- | --- | --- |
| CPU en la extracción de PDF | Crece la latencia `PROCESSING → INDEXED` | Más réplicas del worker (`SKIP LOCKED` reparte la cola), o mover `extract()` a una cola externa (BullMQ + Redis) conservando la firma `processNextPending(extractContent)` |
| Worker en el mismo proceso que la API | Los picos de CPU afectan el p95 de `/search` | Desplegar un segundo servicio que importe `DocumentsModule` y `PrismaModule` sin exponer el controlador |
| Tamaño de `content` en la tabla | Vacuum lento, tabla grande | Particionar `Document` por rango de `createdAt`, o mover el texto a un almacén de objetos (S3/MinIO) dejando en la base metadatos, `searchVector` y el mismo trigger |
| `count(*)` en cada consulta | Conteos lentos con millones de filas | Estimación por catálogo/`EXPLAIN` o contadores incrementales. La página no depende del total exacto |
| Memoria de Postgres para el GIN | El índice no cabe en `shared_buffers` | Ajustar `fastupdate` y autovacuum, particionar y servir `/search` desde réplicas de lectura |
| Conexiones SSE concurrentes | Límite de sockets por instancia | Balanceo sticky y difusión distribuida (§4.3) |

### 4.3 Escala horizontal: estado actual y ruta de evolución

La capa HTTP es **stateless**. Varias réplicas detrás de un balanceador funcionan hoy para `GET /documents`, `GET /search` y `POST/PATCH/DELETE`, porque toda la coordinación vive en PostgreSQL. Dos componentes guardan estado local y requieren acción explícita al pasar de una réplica a varias:

1. **Bus de eventos en memoria (`Subject`).** Un evento publicado en la réplica A no llega a un cliente conectado a la réplica B. La solución es añadir un adaptador del contrato de eventos sobre Redis Pub/Sub o `LISTEN/NOTIFY`, de modo que el worker publique y todas las réplicas reemitan a sus suscriptores SSE. Ni los controladores ni el frontend cambian.
2. **Archivos en disco (`backend/uploads/documents`).** Es la restricción más dura: una réplica distinta de la que recibió la carga no encontrará el archivo al indexar. Opciones, en orden de preferencia: un volumen compartido (NFS) en despliegues pequeños, o sustituir `DocumentStorageService` por un adaptador de almacenamiento de objetos (S3/MinIO/GCS) que conserve `store()`, `read()`, `remove()` y la columna `storageName`.

**Reparto del trabajo.** Gracias a `FOR UPDATE SKIP LOCKED`, activar el worker en varias réplicas distribuye la cola automáticamente, sin coordinador ni sharding de documentos.

**Capacidad del corpus.** Con GIN, crecer en documentos afecta sobre todo al espacio y al mantenimiento del índice, no de forma lineal a la latencia de búsqueda. El dimensionamiento se calcula sobre el volumen total de `content` y la selectividad de los términos frecuentes.

### 4.4 Observabilidad y pruebas

- `Logger` en el worker y en el creador, con el stack del fallo de indexación, para auditar por qué un documento quedó en `ERROR`.
- Pruebas que fijan el comportamiento crítico: `document-indexing.service.spec.ts`, `prisma-document.repository.spec.ts` (transacción y `SKIP LOCKED`), `realtime-event.service.spec.ts` y `realtime.controller.spec.ts` (evento inicial y `document.status`), además de `test/app.e2e-spec.ts` sobre `docs_db_test`.
- Métricas recomendadas para operar el SLA de 400 ms a 1 s: p95 de `/search`, edad de la cola (`now() - min(createdAt) WHERE status='PROCESSING'`), tasa de `ERROR` y conexiones SSE activas.

---

## 5. Mapa de endpoints y módulos

| Método y ruta | Controlador | Servicio | Descripción |
| --- | --- | --- | --- |
| `POST /api/v1/documents` | `DocumentsController.create` | `DocumentCreatorService` + `DocumentStorageService` | Multipart TXT/PDF/MD con metadatos. Responde `201` en `PROCESSING` |
| `GET /api/v1/documents` | `findAll` | `DocumentFinderService` | Listado de metadatos (sin `content` ni `storageName`) |
| `GET /api/v1/documents/:id` | `findById` | `DocumentFinderService` | Detalle de un documento |
| `PATCH /api/v1/documents/:id` | `update` | `DocumentUpdaterService` | Actualiza metadatos. El trigger refresca `searchVector` |
| `DELETE /api/v1/documents/:id` | `remove` | `DocumentRemoverService` | Elimina la fila y el archivo almacenado |
| `GET /api/v1/search` | `SearchController.search` | `DocumentSearchService` + `PrismaSearchRepository` | Full-text con ranking, paginación y `<mark>` |
| `GET /api/v1/realtime/documents/:id` | `RealtimeController.streamDocument` | `RealtimeEventService` | SSE: estado inicial, `document.status` y heartbeat cada 15 s |
| `/docs` y `/docs-json` | `config/swagger.config.ts` | — | OpenAPI con Basic Auth |

**Estados:**

- `PROCESSING`: recibido, pendiente de extracción e indexación.
- `INDEXED`: visible en la búsqueda y en el visor.
- `ERROR`: falló la extracción. Solo se reprocesa si se vuelve a marcar como `PROCESSING`.

---

## 6. Variables de entorno relevantes

| Variable | Uso |
| --- | --- |
| `PORT` | Puerto HTTP de la API (3000) |
| `NODE_ENV` | Entorno (`development`, `test` o `production`) |
| `MAX_FILE_SIZE_MB` | Límite de Multer por archivo (25 por defecto) |
| `DATABASE_URL` | Cadena de conexión de Prisma |
| `DATABASE_MAX_POOL_SIZE` | Conexiones máximas del pool `pg` (10 por defecto) |
| `DATABASE_CONNECTION_TIMEOUT_MS` | Timeout de establecimiento de conexión (5000 por defecto) |
| `DATABASE_IDLE_TIMEOUT_MS` | Cierre de conexiones ociosas (30000 por defecto) |
| `SWAGGER_USER` / `SWAGGER_PASSWORD` | Basic Auth de `/docs` |
| `VITE_API_URL` (frontend) | Origen de la API para REST y `EventSource` |