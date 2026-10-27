# Buscador y Visor de Documentos Técnicos

Solución Full Stack para la gestión y búsqueda de alta velocidad de documentación técnica. Permite cargar documentos, buscarlos rápidamente, visualizarlos y recibir notificaciones en tiempo real cuando termina su procesamiento.

---

## 📦 Estructura del Repositorio

```text
.
├── frontend/       # Interfaz de usuario (React + Vite + TypeScript)
├── backend/        # API y motor de búsqueda
└── README.md       # Este archivo
```

---

## 📚 Documentación por Módulo

| Módulo | Descripción | Documentación |
| --- | --- | --- |
| **Frontend** | Interfaz para cargar, buscar y visualizar documentos | [frontend/README.md](./frontend/README.md) |
| **Backend** | API, procesamiento e indexación de documentos | [backend/README.md](./backend/README.md) |

---

## 🚀 Inicio Rápido

Cada módulo se levanta de forma independiente. Consulta el README de cada uno para el detalle completo:

1. **Backend:** _pendiente de documentar_ → [ver instrucciones](./backend/README.md)
2. **Frontend:** instalación, variables de entorno y ejecución → [ver instrucciones](./frontend/README.md)

> Se recomienda levantar primero el backend, ya que el frontend depende de su API y de la conexión en tiempo real.

---

## 🛠️ Stack General

- **Frontend:** React 19, Vite, TypeScript
- **Backend:** _pendiente de documentar_
- **Comunicación en tiempo real:** WebSockets / SSE