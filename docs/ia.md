# Registro de uso de Inteligencia Artificial

**Archivo:** `docs/ia.md`  
**Objetivo:** documentar las herramientas de IA utilizadas, sus aportes, los prompts relevantes y la validación humana durante la prueba técnica.

## 1. Herramientas utilizadas

- **Google Gemini:** apoyo en contratos de API, DTOs, validaciones, Swagger, documentación y lineamientos de configuración.
- **GitHub Copilot / Copilot SDK en VS Code:** asistencia en backend, frontend, pruebas, resolución de errores y documentación.

## 2. Arquitectura y diseño definidos por el candidato

La arquitectura del backend y del frontend fue definida por el candidato y proporcionada a la IA como referencia. En el backend, las implementaciones debían respetar la separación existente entre módulos, DTOs, controladores, servicios, contratos de repositorio e infraestructura Prisma. En el frontend, se indicó seguir la arquitectura Feature-Based, separando componentes, hooks, servicios, interfaces y utilidades.

Para orientar el diseño visual, el candidato creó `design.md`, definiendo tokens y lineamientos de estilo. Con Gemini evaluó el sitio de Davivienda como referencia visual para mantener una apariencia coherente con sus estilos. El archivo se utilizó como guía para los cambios de UI, sin delegar a la IA las decisiones de arquitectura.

También se utilizó **SDD (Specification-Driven Development)** al preparar y refinar algunos prompts: se especificaron el alcance, los requisitos, las restricciones y los criterios esperados antes de solicitar cambios, reduciendo implementaciones fuera de alcance y facilitando su validación.

## 3. Casos de uso de IA

- **Backend y API:** DTOs y validaciones de carga; endpoints de documentos; búsqueda full-text con PostgreSQL; paginación, conteos, extracción e indexación asíncrona; estados y notificaciones SSE.
- **Frontend:** integración con REST y SSE; carga por lotes; filtros y búsqueda; paginación; visor PDF con resaltado; validación de formatos y corrección de estados vacíos y navegación.
- **Configuración y documentación:** revisión de variables de entorno, Docker, README y documentación de endpoints.
- **Pruebas y depuración:** apoyo para crear pruebas dirigidas, analizar errores de compilación y lint, y rastrear problemas entre frontend y backend.

## 4. Prompts clave y refinamiento

Los prompts se ajustaron de forma iterativa según el alcance y la arquitectura del proyecto. Ejemplos representativos:

- **API de documentos:** “Basado en el módulo de perfiles y los requisitos de la prueba, crea el módulo Documents con listado, carga, actualización y eliminación; deja la búsqueda fuera de este cambio”.
- **Búsqueda:** “Implementa HU-02 con PostgreSQL Full-Text Search, consultas parametrizadas, paginación y fragmentos resaltados”. Después se precisó que la búsqueda debía estar en un módulo independiente y seguir el patrón de repositorio.
- **Frontend:** “Separa los componentes y lleva la lógica reutilizable a hooks, respetando la arquitectura Feature-Based y conectando los endpoints existentes”.
- **UI y estilo:** se indicó utilizar `design.md` como referencia para tokens y estilos, tomando el sitio de Davivienda evaluado con Gemini como guía visual.
- **SDD:** en los cambios de mayor alcance se precisaron requisitos, límites, responsabilidades y comportamientos esperados antes de implementar; las observaciones posteriores se usaron para acotar o corregir la solución.

## 5. Validación humana

El candidato revisó las modificaciones contra los requisitos, la arquitectura definida y los patrones existentes. Se inspeccionaron controladores, DTOs, servicios, repositorios, consultas Prisma, hooks, componentes, contratos REST/SSE y documentación. También se verificaron los formatos de archivo, estados de procesamiento, paginación y manejo de resultados.

Según cada contribución, se ejecutaron pruebas dirigidas, builds, lint, validación del esquema Prisma y `git diff --check`. Entre las validaciones reportadas, las pruebas de búsqueda/indexación y SSE, las pruebas de documentos y realtime, y los builds/lint de frontend y backend finalizaron correctamente en sus respectivas ejecuciones. 

## 6. Resultado y responsabilidad

La IA se utilizó como herramienta de apoyo para implementar, revisar, refactorizar y documentar. La definición de la arquitectura del backend y frontend, los lineamientos visuales de `design.md`, la delimitación del alcance y la revisión de los resultados correspondieron al candidato. Las pruebas y limitaciones se reportan según lo efectivamente ejecutado.