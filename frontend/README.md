# Frontend - Buscador y Visor de Documentos Técnicos

Interfaz de usuario moderna, altamente reactiva y optimizada, desarrollada como parte de la solución Full Stack para la prueba técnica de gestión y búsqueda de alta velocidad de documentación técnica.

---

## 🚀 Características Principales

- **Biblioteca conectada al backend:** consulta documentos, filtra sus metadatos localmente y administra sus metadatos o eliminación mediante la API REST.
- **Búsqueda full-text:** al enviar la consulta, busca dentro de contenido indexado con ranking, paginación y fragmentos resaltados por el backend.
- **Carga por lotes:** admite hasta el máximo configurado en `VITE_MAX_DOCUMENTS_PER_BATCH` por selección. Cada uno se envía en su propia petición multipart; el número máximo de cargas simultáneas se configura con `VITE_UPLOAD_CONCURRENCY` (5 por defecto). Cada cupo se libera cuando la API confirma la carga (`201`), sin esperar la indexación en segundo plano, que se sigue por SSE.
- **Vista previa del original:** un panel lateral abre documentos desde la biblioteca o los resultados. PDF.js renderiza el PDF original y resalta las coincidencias sobre una capa de texto; TXT y Markdown también resaltan los términos de búsqueda.
- **Actualizaciones en tiempo real:** una única conexión SSE compartida actualiza estados y notifica cuando cada documento termina como `INDEXED` o `ERROR`.

---

## 🛠️ Stack Tecnológico

- **Framework:** React 19 con **Vite** (empaquetado ultra rápido y desarrollo ágil).
- **Lenguaje:** **TypeScript** (tipado estricto de extremo a extremo).
- **Estilos / UI:** componentes modulares y adaptativos para una experiencia de usuario clara y funcional.
- **Comunicación con la API:** cliente HTTP para la carga y la búsqueda de documentos.
- **Tiempo real:** cliente SSE basado en `EventSource`, con reconexión automática.

---

## 📁 Estructura del Proyecto

```text
src/
├── App.css                            # Estilos de la aplicación
├── App.tsx                            # Componente raíz
├── features/
│   └── documents/
│       ├── components/                # Componentes de documentos y búsqueda
│       ├── config/                    # Configuración del feature
│       ├── data/                      # Categorías y datos estáticos
│       ├── hooks/                     # Estado y lógica del feature
│       ├── interfaces/                # Interfaces de la API y documentos
│       ├── screens/                   # Pantallas del feature
│       ├── services/                  # Cliente REST y SSE
│       ├── types/                     # Tipos compartidos del feature
│       └── utils/                     # Utilidades y búsqueda
└── main.tsx                           # Punto de entrada de React
```

---

## ⚙️ Configuración y Ejecución Local

Sigue estos pasos para levantar el entorno de desarrollo en tu máquina local. El frontend necesita el backend en ejecución: consulta [backend/README.md](../backend/README.md).

### 1. Prerrequisitos

Asegúrate de tener instalado:

- [Node.js](https://nodejs.org/) 22 o superior
- npm, pnpm o yarn

### 2. Instalación de dependencias

Clona el repositorio, navega a la carpeta del frontend e instala las dependencias:

```bash
cd frontend
npm install
```

### 3. Variables de entorno

Copia la plantilla:

```bash
cp .env.example .env
```

Contenido de `.env.example`:

```env
VITE_API_URL=http://localhost:3000
VITE_MAX_DOCUMENTS_PER_BATCH=20
VITE_UPLOAD_CONCURRENCY=5
```

| Variable | Descripción |
| --- | --- |
| `VITE_API_URL` | URL base de la API. El canal de eventos SSE se consume desde esta misma URL, por lo que no hace falta una variable aparte |
| `VITE_MAX_DOCUMENTS_PER_BATCH` | Máximo de archivos permitidos por carga por lotes. Debe ser un entero positivo |
| `VITE_UPLOAD_CONCURRENCY` | Máximo de archivos enviados simultáneamente. Debe ser un entero positivo; por defecto es `5` |

> Este valor es solo para desarrollo. Si cambias el puerto del backend, actualízalo aquí.

La API recibe un solo archivo por `POST /api/v1/documents`; el frontend envía una petición por cada archivo del lote, hasta el máximo definido por `VITE_UPLOAD_CONCURRENCY` (5 por defecto). Al recibir la respuesta `201`, el cupo se usa para iniciar el siguiente archivo; la indexación posterior no bloquea la cola.

El listado paginado `GET /api/v1/documents` entrega documentos y paginación. Los conteos globales por estado se consultan aparte con `GET /api/v1/documents/count`, en el wrapper estándar de respuesta.

La interfaz escucha cambios de indexación en una sola conexión a `GET /api/v1/realtime/documents`, evitando abrir una conexión SSE independiente por cada archivo cargado.

Al ejecutar el frontend con Docker Compose, el contenedor sincroniza las dependencias con `package-lock.json` al arrancar. Esto permite que el volumen de `node_modules` incluya paquetes agregados después de haber creado el contenedor.

### Flujo de búsqueda y vista previa

- Al escribir en la búsqueda se filtran inmediatamente los metadatos que ya están cargados en la biblioteca. Si no hay documentos que coincidan, se inicia automáticamente una búsqueda indexada tras una breve pausa; **Buscar contenido** también permite ejecutarla explícitamente.
- Al pulsar **Buscar contenido** o presionar Enter se consulta `GET /api/v1/search`. Los documentos aún no indexados no aparecen en sus resultados.
- Mientras se consulta el índice se muestra **Búsqueda avanzada en curso**; el mensaje de que no hubo coincidencias solo aparece cuando la búsqueda termina y la API devuelve cero resultados.
- Los resultados full-text aparecen dentro de la tarjeta **Todos los documentos**, encima de la tabla de la biblioteca.
- Al abrir un documento de la biblioteca o un resultado, el panel lateral consulta sus metadatos y el archivo original con `GET /api/v1/documents/:id` y `GET /api/v1/documents/:id/file`. El original se conserva para el botón **Descargar original** y para mostrar TXT/Markdown. Para PDF también consulta `GET /api/v1/documents/:id/preview`, que devuelve la copia OCR cuando está lista o el original mientras tanto; PDF.js renderiza ese PDF y resalta los términos, con controles para navegar por las páginas y coincidencias.
- La carga acepta el máximo indicado en `VITE_MAX_DOCUMENTS_PER_BATCH` por lote y 25 MB por archivo. Una carga confirmada aparece como **Cargado; indexando** mientras espera el SSE terminal; ese procesamiento no bloquea las siguientes cargas. El formulario del lote usa un título derivado del nombre de cada archivo y aplica autor, categoría, versión y etiquetas comunes a los documentos seleccionados.

El endpoint `/file` siempre entrega el original, mientras `/preview` prioriza la copia OCR para mostrar PDF. Aunque `/preview` también puede devolver el original, ambas rutas cumplen funciones distintas: conservar la descarga fuente y servir la vista previa buscable.

### 4. Ejecución en modo desarrollo

Inicia el servidor de desarrollo local con Vite:

```bash
npm run dev
```

La aplicación estará disponible por defecto en <http://localhost:5173>.

### 5. Compilación para producción

Para verificar que el proyecto compila correctamente con TypeScript y generar los archivos estáticos optimizados:

```bash
npm run build
```

Para previsualizar la compilación de producción localmente:

```bash
npm run preview
```

### Con Docker Compose

Para levantar todo el entorno (base de datos, backend y frontend), consulta el [README principal](../README.md#-inicio-rápido).