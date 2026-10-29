import { definePluginSchema } from '@robdel12/cricket';
import { z } from 'zod';

let safeWebUrl = z.url().refine(value => {
  let protocol = new URL(value).protocol;
  return protocol === 'http:' || protocol === 'https:';
});

export let SuperAdminActorSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  role: z.string().min(1)
});

export let SuperAdminProductSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  environment: z.string().min(1)
});

export let SuperAdminMetricSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  value: z.union([z.string(), z.number()]),
  detail: z.string().nullable(),
  href: z.string().nullable(),
  comparison: z.object({ previousValue: z.number(), label: z.string().min(1) }).optional()
});

export let SuperAdminRoleOptionSchema = z.object({
  value: z.string().min(1),
  label: z.string().min(1)
});

export let SuperAdminRoleCountSchema = z.object({
  value: z.string().min(1),
  label: z.string().min(1),
  count: z.number().int().min(0)
});

export let SuperAdminFactSchema = z.object({
  label: z.string().min(1),
  value: z.string()
});

export let SuperAdminAccountActionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  valueLabel: z.string().nullable(),
  values: z.array(SuperAdminRoleOptionSchema),
  destructive: z.boolean()
});

export let SuperAdminAccountSchema = z.object({
  id: z.string().min(1),
  displayName: z.string().min(1),
  email: z.email().nullable(),
  role: z.string().min(1),
  status: z.string().min(1),
  createdAt: z.string().datetime().nullable(),
  lastSeenAt: z.string().datetime().nullable(),
  facts: z.array(SuperAdminFactSchema),
  actions: z.array(SuperAdminAccountActionSchema)
});

export let SuperAdminActivitySchema = z.object({
  id: z.string().min(1),
  actorLabel: z.string().min(1),
  subjectLabel: z.string().min(1),
  action: z.string().min(1),
  reason: z.string().min(1),
  occurredAt: z.string().datetime(),
  details: z.array(SuperAdminFactSchema)
});

export let SuperAdminServiceStatusSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  status: z.enum(['healthy', 'degraded', 'down', 'unknown']),
  detail: z.string().nullable(),
  checkedAt: z.string().datetime().nullable()
});

export let SuperAdminJobFailureSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  queue: z.string().min(1),
  attempts: z.number().int().min(0),
  error: z.string().nullable(),
  requestId: z.string().nullable(),
  failedAt: z.string().datetime().nullable()
});

export let SuperAdminObservabilityTargetSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  kind: z.enum(['logs', 'traces', 'metrics', 'dashboard']),
  status: z.enum(['connected', 'not_configured', 'unavailable']),
  provider: z.string().nullable(),
  href: safeWebUrl.nullable(),
  detail: z.string().nullable()
});

export let SuperAdminOperationsSchema = z.object({
  components: z.array(SuperAdminServiceStatusSchema),
  jobs: z.object({
    queued: z.number().int().min(0),
    active: z.number().int().min(0),
    completed: z.number().int().min(0),
    failed: z.number().int().min(0),
    recentFailures: z.array(SuperAdminJobFailureSchema)
  }).nullable(),
  observability: z.array(SuperAdminObservabilityTargetSchema)
});

export let SuperAdminTelemetryEventSchema = z.object({
  id: z.string().min(1),
  occurredAt: z.string().datetime(),
  kind: z.enum(['log', 'trace']),
  level: z.enum(['debug', 'info', 'warn', 'error']).nullable(),
  service: z.string().nullable(),
  name: z.string().min(1),
  summary: z.string().nullable(),
  requestId: z.string().nullable(),
  durationMs: z.number().min(0).nullable(),
  status: z.string().nullable()
});

export let SuperAdminTelemetryPageSchema = z.object({
  status: z.enum(['connected', 'not_configured', 'unavailable']),
  provider: z.string().nullable(),
  href: safeWebUrl.nullable(),
  items: z.array(SuperAdminTelemetryEventSchema),
  page: z.number().int().min(1),
  limit: z.number().int().min(1),
  total: z.number().int().min(0)
});

export let SuperAdminOverviewQuerySchema = z.object({
  days: z.coerce.number().pipe(z.union([z.literal(7), z.literal(30), z.literal(90)])).default(30)
});

export let SuperAdminTrendSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  detail: z.string().nullable(),
  points: z.array(z.object({ date: z.iso.date(), value: z.number().min(0) }))
});

export let SuperAdminOverviewSchema = z.object({
  product: SuperAdminProductSchema,
  metrics: z.array(SuperAdminMetricSchema),
  metricGroups: z.array(z.object({
    id: z.string().min(1), title: z.string().min(1), detail: z.string().nullable(),
    metrics: z.array(SuperAdminMetricSchema)
  })).default([]),
  trends: z.array(SuperAdminTrendSchema).default([]),
  health: z.array(SuperAdminServiceStatusSchema).default([]),
  period: z.object({
    days: z.number(), from: z.iso.datetime(), to: z.iso.datetime()
  }).optional(),
  roles: z.array(SuperAdminRoleCountSchema),
  roleOptions: z.array(SuperAdminRoleOptionSchema),
  recentActivity: z.array(SuperAdminActivitySchema)
});

export let SuperAdminAccountPageSchema = z.object({
  items: z.array(SuperAdminAccountSchema),
  page: z.number().int().min(1),
  limit: z.number().int().min(1),
  total: z.number().int().min(0),
  roleOptions: z.array(SuperAdminRoleOptionSchema)
});

export let SuperAdminActivityPageSchema = z.object({
  items: z.array(SuperAdminActivitySchema),
  page: z.number().int().min(1),
  limit: z.number().int().min(1),
  total: z.number().int().min(0)
});

export let SuperAdminAccountActionResultSchema = z.discriminatedUnion('outcome', [
  z.object({
    outcome: z.literal('completed'),
    account: SuperAdminAccountSchema,
    activity: SuperAdminActivitySchema
  }),
  z.object({ outcome: z.literal('not_allowed') }),
  z.object({ outcome: z.literal('not_found') }),
  z.object({ outcome: z.literal('unsupported') }),
  z.object({ outcome: z.literal('rejected'), kind: z.enum(['invalid', 'conflict']), code: z.string().min(1), message: z.string().min(1) })
]);

export let SuperAdminImpersonationResultSchema = z.discriminatedUnion('outcome', [
  z.object({
    outcome: z.literal('started'),
    previewUrl: safeWebUrl,
    expiresAt: z.string().datetime(),
    subjectLabel: z.string().min(1),
    activity: SuperAdminActivitySchema
  }),
  z.object({ outcome: z.literal('not_allowed') }),
  z.object({ outcome: z.literal('not_found') }),
  z.object({ outcome: z.literal('unsupported') })
]);

export let SuperAdminPaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});

export let SuperAdminAccountSearchSchema = z.object({
  query: z.string().trim().min(2).max(120),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});

export let SuperAdminAccountActionBodySchema = z.object({
  action: z.string().trim().min(1).max(80),
  value: z.string().trim().max(160).nullable().default(null),
  reason: z.string().trim().min(8).max(500)
});

export let SuperAdminImpersonationBodySchema = z.object({
  reason: z.string().trim().min(8).max(500)
});

export let SuperAdminTelemetryQuerySchema = z.object({
  query: z.string().trim().max(160).default(''),
  level: z.enum(['debug', 'info', 'warn', 'error']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50)
});

export let SuperAdminErrorSchema = z.object({
  error: z.object({ code: z.string(), message: z.string(), issues: z.array(z.unknown()).optional() })
});

let contracts = {
  services: {
    superAdmin: {
      canAccess: {
        input: z.object({ actor: SuperAdminActorSchema }),
        output: z.boolean()
      },
      getOverview: {
        input: SuperAdminOverviewQuerySchema.extend({ actor: SuperAdminActorSchema }),
        output: SuperAdminOverviewSchema
      },
      searchAccounts: {
        input: SuperAdminAccountSearchSchema.extend({ actor: SuperAdminActorSchema }),
        output: SuperAdminAccountPageSchema
      },
      getAccount: {
        input: z.object({ actor: SuperAdminActorSchema, accountId: z.string().min(1) }),
        output: SuperAdminAccountSchema.nullable()
      },
      performAccountAction: {
        input: z.object({
          actor: SuperAdminActorSchema,
          accountId: z.string().min(1),
          action: z.string().min(1).max(80),
          value: z.string().max(160).nullable(),
          reason: z.string().min(8).max(500),
          requestId: z.string().optional()
        }),
        output: SuperAdminAccountActionResultSchema
      },
      startImpersonation: {
        input: z.object({
          actor: SuperAdminActorSchema,
          accountId: z.string().min(1),
          reason: z.string().min(8).max(500),
          requestId: z.string().optional()
        }),
        output: SuperAdminImpersonationResultSchema
      },
      listActivity: {
        input: SuperAdminPaginationSchema.extend({ actor: SuperAdminActorSchema }),
        output: SuperAdminActivityPageSchema
      },
      getOperations: {
        input: z.object({ actor: SuperAdminActorSchema }),
        output: SuperAdminOperationsSchema
      },
      searchTelemetry: {
        input: SuperAdminTelemetryQuerySchema.extend({ actor: SuperAdminActorSchema }),
        output: SuperAdminTelemetryPageSchema
      }
    }
  }
};

let featureMethods = {
  overview: ['getOverview'],
  accounts: ['searchAccounts', 'getAccount'],
  accountActions: ['performAccountAction'],
  impersonation: ['startImpersonation'],
  activity: ['listActivity'],
  operations: ['getOperations'],
  telemetry: ['searchTelemetry']
};

export function createSuperAdminSchema(features) {
  let methods = ['canAccess', ...features.flatMap(feature => featureMethods[feature])];
  return definePluginSchema({ services: {
    superAdmin: Object.fromEntries(methods.map(name => [name, contracts.services.superAdmin[name]]))
  } });
}
