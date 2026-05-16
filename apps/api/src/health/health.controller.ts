import { Controller, Get, Headers, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HealthCheck, HealthCheckService, type HealthCheckResult } from '@nestjs/terminus';

import { Public } from '../common/decorators/public.decorator';
import type { AppConfig } from '../config/configuration';

import { PrismaHealthIndicator } from './prisma.health';
import { RedisHealthIndicator } from './redis.health';

@Public()
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly prisma: PrismaHealthIndicator,
    private readonly redis: RedisHealthIndicator,
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  // MED-09 (Audit-2): DB/Redis status requires x-health-token when HEALTH_TOKEN env is set
  @Get()
  @HealthCheck()
  check(@Headers('x-health-token') token?: string): Promise<HealthCheckResult> {
    const secret = this.config.get('HEALTH_TOKEN', { infer: true });
    if (secret && token !== secret) {
      throw new UnauthorizedException('x-health-token required');
    }
    return this.health.check([
      () => this.prisma.pingCheck('database'),
      () => this.redis.pingCheck('redis'),
    ]);
  }

  // /health/live stays fully public — safe for load balancer probes
  @Get('live')
  liveness(): { status: 'ok' } {
    return { status: 'ok' };
  }
}
