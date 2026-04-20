import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { type Request } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

import { PrismaService } from '../../prisma/prisma.service';
import { AUDIT_RESOURCE_KEY, type AuditResourceMeta } from '../decorators/audit-resource.decorator';

const MUTATING_METHODS = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);

// Maps resource name → function that fetches the current state before mutation
type BeforeFetcher = (id: string) => Promise<unknown>;

function buildBeforeFetcher(prisma: PrismaService, resource: string): BeforeFetcher | null {
  const map: Record<string, BeforeFetcher> = {
    product: (id) => prisma.product.findUnique({ where: { id } }),
    order: (id) =>
      prisma.order.findUnique({
        where: { id },
        select: { id: true, status: true, trackingNumber: true, totalCents: true },
      }),
    user: (id) =>
      prisma.user.findUnique({
        where: { id },
        select: { id: true, email: true, role: true, blocked: true },
      }),
    review: (id) => prisma.review.findUnique({ where: { id } }),
  };
  return map[resource] ?? null;
}

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

    // Fetch before-state for PATCH/PUT/DELETE when we have an id
    const isUpdate = req.method === 'PATCH' || req.method === 'PUT' || req.method === 'DELETE';
    const beforePromise: Promise<unknown> =
      isUpdate && resourceId
        ? (buildBeforeFetcher(this.prisma, meta.resource)?.(resourceId) ?? Promise.resolve(null))
        : Promise.resolve(null);

    return new Observable((subscriber) => {
      void beforePromise.then((beforeState) => {
        next
          .handle()
          .pipe(
            tap((responseBody: unknown) => {
              void this.prisma.auditLog.create({
                data: {
                  userId: user.id,
                  action: meta.action,
                  resource: meta.resource,
                  resourceId: resourceId ?? null,
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  before: (beforeState as any) ?? undefined,
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  after: (responseBody as any) ?? undefined,
                  ip: ip ?? null,
                  userAgent: userAgent ?? null,
                },
              });
            }),
          )
          .subscribe(subscriber);
      });
    });
  }
}
