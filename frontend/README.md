# Frontend - Buscador y Visor de Documentos Técnicos

Interfaz de usuario moderna, altamente reactiva y optimizada, desarrollada como parte de la solución Full Stack para la prueba técnica de gestión y búsqueda de alta velocidad de documentación técnica.

---

## 🚀 Características Principales

- **Biblioteca conectada al backend:** consulta documentos, filtra sus metadatos localmente y administra sus metadatos o eliminación mediante la API REST.
- **Búsqueda full-text:** al enviar la consulta, busca dentro de contenido indexado con ranking, paginación y fragmentos resaltados por el backend.
- **Carga por lotes:** admite hasta 20 archivos por selección. Cada uno se envía en su propia petición multipart; hasta tres cargas ocurren en paralelo y cada documento tiene su propio estado SSE.
- **Vista previa del original:** un panel lateral abre documentos desde la biblioteca o los resultados. PDF.js renderiza el PDF original y resalta las coincidencias sobre una capa de texto; TXT y Markdown también resaltan los términos de búsqueda.
- **Actualizaciones en tiempo real:** SSE actualiza estados y notifica cuando cada documento termina como `INDEXED` o `ERROR`; al abrir o recargar la biblioteca también se suscribe a los documentos que siguen en `PROCESSING`.

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
├── app/                               # Configuración global (Router, Providers, Store)
├── components/                        # Componentes UI globales o genéricos
├── features/
│   └── documents/
│       ├── components/                # Componentes de documentos
│       ├── data/                      # Categorías y datos estáticos
│       ├── hooks/                     # Estado y lógica del feature
│       ├── interfaces/                # Interfaces de documentos
│       ├── screens/                   # Pantallas del feature
│       ├── services/                  # Cliente REST y SSE
│       ├── types/                     # Tipos compartidos del feature
│       └── utils/                     # Utilidades del feature
├── hooks/                             # Hooks globales reutilizables
├── services/                          # Clientes HTTP globales (Axios, Fetch)
└── utils/                             # Utilidades y funciones de ayuda
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
```

| Variable | Descripción |
| --- | --- |
| `VITE_API_URL` | URL base de la API. El canal de eventos SSE se consume desde esta misma URL, por lo que no hace falta una variable aparte |

> Este valor es solo para desarrollo. Si cambias el puerto del backend, actualízalo aquí.

El backend debe permitir el origen del frontend en `CORS_ORIGIN` (por defecto `http://localhost:5173,http://127.0.0.1:5173`). La API recibe un solo archivo por `POST /api/v1/documents`; el frontend envía una petición por cada archivo del lote, con concurrencia máxima de tres.

Al ejecutar el frontend con Docker Compose, el contenedor sincroniza las dependencias con `package-lock.json` al arrancar. Esto permite que el volumen de `node_modules` incluya paquetes agregados después de haber creado el contenedor.

### Flujo de búsqueda y vista previa

- Al escribir en la búsqueda se filtran inmediatamente los metadatos que ya están cargados en la biblioteca. Si no hay documentos que coincidan, se inicia automáticamente una búsqueda indexada tras una breve pausa; **Buscar contenido** también permite ejecutarla explícitamente.
- Al pulsar **Buscar contenido** o presionar Enter se consulta `GET /api/v1/search`. Los documentos aún no indexados no aparecen en sus resultados.
- Mientras se consulta el índice se muestra **Búsqueda avanzada en curso**; el mensaje de que no hubo coincidencias solo aparece cuando la búsqueda termina y la API devuelve cero resultados.
- Los resultados full-text aparecen dentro de la tarjeta **Todos los documentos**, encima de la tabla de la biblioteca.
- Al abrir un documento de la biblioteca o un resultado, el panel lateral consulta sus metadatos y el archivo original con `GET /api/v1/documents/:id` y `GET /api/v1/documents/:id/file`. PDF.js renderiza el binario PDF original y dibuja una capa de texto que resalta cada término; los controles permiten navegar por las páginas del PDF y, por separado, por las páginas coincidentes. TXT y Markdown se resaltan directamente.
- La carga acepta un máximo de 20 archivos por lote y 25 MB por archivo. El formulario del lote usa un título derivado del nombre de cada archivo y aplica autor, categoría, versión y etiquetas comunes a los documentos seleccionados.

El endpoint del archivo original es una ruta añadida al backend para el visor; no incluye el texto extraído en la respuesta de metadatos.

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