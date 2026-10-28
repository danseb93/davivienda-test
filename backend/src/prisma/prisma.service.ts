import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  [x: string]: any;
  constructor(private configService: ConfigService) {
    const pool = new PrismaPg({
      connectionString: configService.getOrThrow<string>("DATABASE_URL"),
      max: Number(configService.get("DATABASE_MAX_POOL_SIZE", 10)),
      connectionTimeoutMillis: Number(
        configService.get("DATABASE_CONNECTION_TIMEOUT_MS", 5000),
      ),
      idleTimeoutMillis: Number(
        configService.get("DATABASE_IDLE_TIMEOUT_MS", 30000),
      ),
    });
    super({ adapter: pool });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
