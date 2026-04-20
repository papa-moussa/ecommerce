import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { type Request } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

import { PrismaService } from '../../prisma/prisma.service';
import { AUDIT_RESOURCE_KEY, type AuditResourceMeta } from '../decorators/audit-resource.decorator';

const MUTATING_METHODS = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const meta = this.reflector.get<AuditResourceMeta | undefined>(
      AUDIT_RESOURCE_KEY,
      context.getHandler(),
    );

    const req = context.switchToHttp().getRequest<Request>();

    if (!meta || !MUTATING_METHODS.has(req.method)) {
      return next.handle();
    }

    const user = req.user as { id: string } | undefined;
    if (!user?.id) return next.handle();

    const resourceId = meta.idParam ? (req.params[meta.idParam] as string | undefined) : undefined;
    const ip = (req.headers['x-forwarded-for'] as string | undefined) ?? req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    return next.handle().pipe(
      tap((responseBody: unknown) => {
        void this.prisma.auditLog.create({
          data: {
            userId: user.id,
            action: meta.action,
            resource: meta.resource,
            resourceId: resourceId ?? null,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            after: (responseBody as any) ?? undefined,
            ip: ip ?? null,
            userAgent: userAgent ?? null,
          },
        });
      }),
    );
  }
}
