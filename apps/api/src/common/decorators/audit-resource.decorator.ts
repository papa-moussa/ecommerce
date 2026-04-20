import { SetMetadata } from '@nestjs/common';

export const AUDIT_RESOURCE_KEY = 'audit_resource';

export interface AuditResourceMeta {
  resource: string;
  action: string;
  idParam?: string;
}

export const AuditResource = (meta: AuditResourceMeta) => SetMetadata(AUDIT_RESOURCE_KEY, meta);
