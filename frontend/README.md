# Frontend - Buscador y Visor de Documentos Técnicos

Interfaz de usuario moderna, altamente reactiva y optimizada, desarrollada como parte de la solución Full Stack para la prueba técnica de gestión y búsqueda de alta velocidad de documentación técnica.

---

## 🚀 Características Principales

- **Carga de documentos:** formulario intuitivo para la subida de archivos (TXT, PDF, Markdown) junto con sus metadatos.
- **Búsqueda avanzada de alto rendimiento:** interfaz conectada al motor de búsqueda optimizado para ofrecer respuestas rápidas y fluidas, con paginación y resaltado de coincidencias.
- **Actualizaciones en tiempo real:** notificaciones visuales instantáneas mediante SSE (Server-Sent Events) cuando un documento finaliza su procesamiento o indexación.
- **Visor de documentos integrado:** vista limpia y estructurada para la lectura del contenido técnico y la consulta detallada de metadatos.

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
├── app/                  # Configuración global (Router, Providers, Store)
├── components/           # Componentes UI globales o genéricos (Botones, Modales)
├── features/             # Módulos de negocio independientes
│   ├── auth/             # Módulo de autenticación
│   │   ├── components/   # Componentes exclusivos de auth
│   │   ├── hooks/        # Hooks exclusivos de auth
|   |   ├── screens/      # Vistas del feature
│   │   ├── services/     # Llamadas API de auth
│   │   └── types/        # Tipos e interfaces de auth
│   └── documents/        # Módulo de documentos
│       ├── components/
│       ├── hooks/
|       ├── screens/      
│       └── services/
├── hooks/                # Hooks globales reutilizables
├── services/             # Clientes HTTP globales (Axios, Fetch)
└── utils/                # Utilidades y funciones de ayuda
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