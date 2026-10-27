import { INestApplication } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import basicAuth from "express-basic-auth";
import { ConfigService } from "@nestjs/config";
import { RequestHandler, Request, Response } from "express";
import { Paths, SecurityRequirement } from "./swagger.interfaces.js";

// Definir el tipo de la función basicAuth
type BasicAuthFunction = (config: {
  challenge: boolean;
  users: Record<string, string>;
}) => RequestHandler;

export function setupSwagger(app: INestApplication) {
  const configService = app.get(ConfigService);
  const swaggerUser = configService.get<string>("SWAGGER_USER");
  const swaggerPassword = configService.get<string>("SWAGGER_PASSWORD");

  // Validar que las credenciales existan
  if (!swaggerUser || !swaggerPassword) {
    throw new Error("Swagger credentials not configured");
  }

  // Agregar autenticación básica para Swagger con tipo explícito
  app.use(
    ["/docs", "/docs-json"],
    (basicAuth as BasicAuthFunction)({
      challenge: true,
      users: {
        [swaggerUser]: swaggerPassword,
      },
    }),
  );

  const config = new DocumentBuilder()
    .setTitle("Buscador y Visor de Documentos Técnicos API")
    .setDescription(
      `
        🔍 Advanced Technical Document Search and Viewer Engine

        API REST supporting asynchronous document uploading (TXT, PDF, Markdown),
        high-performance full-text search, metadata management, and real-time notifications.

        Developed for Full Stack Senior Technical Test 🚀
      `,
    )
    .setVersion("1.0.0")
    .setContact(
      "Soporte Técnico",
      "https://github.com/danseb93",
      "daniel.seb93@gmail.com",
    )
    .setLicense("MIT", "https://opensource.org/licenses/MIT")

    .addBearerAuth(
      {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        name: "Authorization",
        description: "Please enter token",
        in: "header",
      },
      "bearer",
    )

    // Etiquetas actualizadas según los módulos de la prueba técnica
    .addTag("App", "General application endpoints and health checks")
    .addTag("Documents", "Document upload, metadata management, and file processing")
    .addTag("Search", "High-performance full-text search engine endpoints")
    .addTag("Realtime", "Real-time notifications and event stream management (SSE/WebSockets)")

    .build();

  const document = SwaggerModule.createDocument(app, config);

  const paths = document.paths as Paths;

  for (const path of Object.values(paths)) {
    for (const method of Object.values(path)) {
      if (method) {
        if (
          !method.security ||
          !method.security.some((s: SecurityRequirement) => "Public" in s)
        ) {
          method.security = [{ bearer: [] }];
        }
      }
    }
  }

  app.getHttpAdapter().get("/docs-json", (req: Request, res: Response) => {
    res.setHeader("Content-Type", "application/json");
    res.send(document);
  });

  SwaggerModule.setup("docs", app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      defaultModelsExpandDepth: 2,
      defaultModelExpandDepth: 3,
      displayRequestDuration: true,
      docExpansion: "list",
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
      tryItOutEnabled: true,
      supportedSubmitMethods: ["get", "post", "put", "delete", "patch"],
      displayOperationId: true,
      showMutatedRequest: true,
      urls: [
        {
          url: "/docs-json",
          name: "OpenAPI JSON",
        },
      ],
    },
    customSiteTitle: "Technical Documents API Documentation",
  });
}