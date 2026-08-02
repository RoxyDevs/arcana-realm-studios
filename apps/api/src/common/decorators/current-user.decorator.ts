import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { AuthenticatedUserDto } from "@arcana/types";

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUserDto => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
