import { Module } from "@nestjs/common";
import { StreamingInternalController } from "./presentation/streaming-internal.controller";
import { StreamingInternalService } from "./application/streaming-internal.service";
import { InternalTokenGuard } from "./infrastructure/internal-token.guard";

@Module({
  controllers: [StreamingInternalController],
  providers: [StreamingInternalService, InternalTokenGuard],
})
export class StreamingInternalModule {}
