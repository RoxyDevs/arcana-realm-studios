import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { ConfigService } from "@nestjs/config";
import { ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import type { AppConfig } from "./config/configuration";

async function bootstrap(): Promise<void> {
  // rawBody:true keeps req.rawBody available (needed for Stripe signature
  // verification) while still parsing req.body as JSON everywhere else.
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { rawBody: true });
  const config = app.get(ConfigService<AppConfig, true>);

  // Railway (and Vercel) sit in front of this service behind a reverse
  // proxy — without trust proxy, req.ip resolves to the proxy's internal
  // address for every request, which would make every subscription-trial
  // anti-abuse check (keyed on IP) see the same "IP" for all users.
  app.set("trust proxy", 1);

  app.use(cookieParser());

  app.enableCors({
    origin: config.get("webUrl", { infer: true }),
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  const swaggerConfig = new DocumentBuilder()
    .setTitle("Arcana Realm Studios API")
    .setDescription("REST API for the Arcana Realm Studios platform (Music, Guardian, Billing, Intelligence)")
    .setVersion("0.1.0")
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  // Swagger UI's "Try it out" uses its own request client, which doesn't send
  // cookies by default even for same-origin calls — withCredentials makes it
  // actually carry the access_token cookie so cookie-authenticated endpoints
  // are testable from /docs without needing to paste a bearer token.
  SwaggerModule.setup("docs", app, document, { swaggerOptions: { withCredentials: true } });

  const port = config.get("port", { infer: true });
  await app.listen(port);
}

void bootstrap();
