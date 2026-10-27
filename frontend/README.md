# Frontend - Buscador y Visor de Documentos Técnicos

Interfaz de usuario moderna, altamente reactiva y optimizada, desarrollada como parte de la solución Full Stack para la prueba técnica de gestión y búsqueda de alta velocidad de documentación técnica.

---

## 🚀 Características Principales

- **Carga de documentos:** formulario intuitivo para la subida de archivos (TXT, PDF, Markdown) junto con sus metadatos.
- **Búsqueda avanzada de alto rendimiento:** interfaz conectada al motor de búsqueda optimizado para ofrecer respuestas rápidas y fluidas.
- **Actualizaciones en tiempo real:** notificaciones visuales instantáneas mediante WebSockets / SSE cuando un documento finaliza su procesamiento o indexación.
- **Visor de documentos integrado:** vista limpia y estructurada para la lectura del contenido técnico y la consulta detallada de metadatos.

---

## 🛠️ Stack Tecnológico

- **Framework:** React 19 con **Vite** (empaquetado ultra rápido y desarrollo ágil).
- **Lenguaje:** **TypeScript** (tipado estricto de extremo a extremo).
- **Estilos / UI:** componentes modulares y adaptativos para una experiencia de usuario clara y funcional.
- **Comunicación asíncrona:** cliente WebSockets / SSE integrado para recibir estados en tiempo real.

---

## 📁 Estructura del Proyecto

```text
src/
├── assets/         # Recursos estáticos e imágenes
├── components/     # Componentes reutilizables (Visor, Tablas, Modales)
├── hooks/          # Hooks personalizados (gestión de sockets, llamadas API)
├── pages/          # Vistas principales (Carga, Búsqueda, Detalle)
├── services/       # Conexiones HTTP y clientes de comunicación en tiempo real
├── types/          # Interfaces y tipos de TypeScript compartidos
├── App.tsx         # Componente raíz y enrutamiento principal
└── main.tsx        # Punto de entrada de la aplicación
```

---

## ⚙️ Configuración y Ejecución Local

Sigue estos pasos para levantar el entorno de desarrollo en tu máquina local.

### 1. Prerrequisitos

Asegúrate de tener instalado:

- [Node.js](https://nodejs.org/) (versión 18 o superior recomendada)
- npm, pnpm o yarn

### 2. Instalación de dependencias

Clona el repositorio, navega a la carpeta del frontend e instala las dependencias:

```bash
cd frontend
npm install
```

### 3. Variables de entorno

Crea un archivo `.env` en la raíz de la carpeta `frontend`, por ejemplo:

```env
VITE_API_URL=http://localhost:3000
VITE_WS_URL=http://localhost:3000
```

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