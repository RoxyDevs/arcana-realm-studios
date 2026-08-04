import { Module } from "@nestjs/common";
import { StreamingInternalController } from "./presentation/streaming-internal.controller";
import { StreamingInternalService } from "./application/streaming-internal.service";
import { InternalTokenGuard } from "./infrastructure/internal-token.guard";
import { LiveModule } from "../live/live.module";

@Module({
  imports: [LiveModule],
  controllers: [StreamingInternalController],
  providers: [StreamingInternalService, InternalTokenGuard],
})
export class StreamingInternalModule {}
