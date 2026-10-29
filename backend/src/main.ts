import { NestFactory } from "@nestjs/core";
import { ValidationPipe, VersioningType } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AppModule } from "./app.module.js";
import { setupSwagger } from "./config/swagger/swagger.config.js";
import { setupCors } from "./config/cors.config.js";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ["error", "warn", "log", "debug", "verbose"],
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>("PORT") || 3000;

  // Establecer el prefijo global para todas las rutas
  app.setGlobalPrefix("api");

  // Versionar las rutas mediante el segmento /v1
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: "1",
  });

  // Habilitar la validación global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // Configuración CORS
  app.enableCors(setupCors(app));

  // Configuración SWAGGER
  setupSwagger(app);

  await app.listen(port);
  console.log(
    `
┌────────────────────────────────────────────────┐
│             Test Davivienda API                │
├────────────────────────────────────────────────┤
  🚀 Server:     http://localhost:${port}/api/v1
   📚 Docs:       http://localhost:${port}/docs
   🛠  Mode:       ${configService.get<string>("NODE_ENV")}
└────────────────────────────────────────────────┘
`,
  );
}

bootstrap().catch((error) => {
  console.error("Error starting application:", error);
  process.exit(1);
});
