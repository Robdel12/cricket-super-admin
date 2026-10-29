import { defineEndpoint, ok, respond } from '@robdel12/cricket';
import { z } from 'zod';
import { requireSuperAdmin } from './access.rules.js';
import {
  SuperAdminAccountActionBodySchema,
  SuperAdminAccountActionResultSchema,
  SuperAdminAccountPageSchema,
  SuperAdminAccountSchema,
  SuperAdminAccountSearchSchema,
  SuperAdminActivityPageSchema,
  SuperAdminErrorSchema,
  SuperAdminImpersonationBodySchema,
  SuperAdminImpersonationResultSchema,
  SuperAdminOverviewSchema,
  SuperAdminOverviewQuerySchema,
  SuperAdminOperationsSchema,
  SuperAdminPaginationSchema,
  SuperAdminTelemetryPageSchema,
  SuperAdminTelemetryQuerySchema
} from './schema.js';

function adminError(status, message) {
  let codes = { 400: 'BAD_REQUEST', 403: 'FORBIDDEN', 404: 'NOT_FOUND', 409: 'CONFLICT' };
  return respond(status, { error: { code: codes[status], message } });
}

let adminRules = [requireSuperAdmin];
let accessResponses = {
  401: SuperAdminErrorSchema,
  403: SuperAdminErrorSchema
};

let endpointGroups = {
overview: [
  defineEndpoint({
    method: 'get',
    path: '/super-admin/overview',
    summary: 'Get product growth, usage and health',
    query: SuperAdminOverviewQuerySchema,
    tags: ['Super Admin'],
    response: { schema: SuperAdminOverviewSchema },
    responses: accessResponses,
    beforeBodyRules: adminRules,
    async handler({ input, services, superAdminActor }) {
      return ok(await services.superAdmin.getOverview({ ...input.query, actor: superAdminActor }));
    }
  })
],
accounts: [
  defineEndpoint({
    method: 'get',
    path: '/super-admin/accounts',
    summary: 'Search app accounts',
    tags: ['Super Admin'],
    query: SuperAdminAccountSearchSchema,
    response: { schema: SuperAdminAccountPageSchema },
    responses: accessResponses,
    beforeBodyRules: adminRules,
    async handler({ input, services, superAdminActor }) {
      return ok(await services.superAdmin.searchAccounts({
        ...input.query,
        actor: superAdminActor
      }));
    }
  }),
  defineEndpoint({
    method: 'get',
    path: '/super-admin/accounts/:accountId',
    summary: 'Get an app account',
    tags: ['Super Admin'],
    params: z.object({ accountId: z.string().min(1) }),
    response: { schema: SuperAdminAccountSchema },
    responses: {
      ...accessResponses,
      404: SuperAdminErrorSchema
    },
    beforeBodyRules: adminRules,
    async handler({ input, services, superAdminActor }) {
      let account = await services.superAdmin.getAccount({
        actor: superAdminActor,
        accountId: input.params.accountId
      });

      return account ? ok(account) : adminError(404, 'Account not found.');
    }
  })
],
accountActions: [
  defineEndpoint({
    method: 'post',
    path: '/super-admin/accounts/:accountId/actions',
    summary: 'Perform an app-defined account action',
    tags: ['Super Admin'],
    params: z.object({ accountId: z.string().min(1) }),
    body: SuperAdminAccountActionBodySchema,
    responses: {
      ...accessResponses,
      200: SuperAdminAccountActionResultSchema,
      400: SuperAdminErrorSchema,
      404: SuperAdminErrorSchema,
      409: SuperAdminErrorSchema
    },
    beforeBodyRules: adminRules,
    async handler({ input, services, superAdminActor, request }) {
      let result = await services.superAdmin.performAccountAction({
        actor: superAdminActor,
        accountId: input.params.accountId,
        requestId: request.id,
        ...input.body
      });

      if (result.outcome === 'completed')
        return ok(result);

      if (result.outcome === 'not_allowed')
        return adminError(403, 'Super admin access is required.');

      if (result.outcome === 'not_found')
        return adminError(404, 'Account not found.');

      if (result.outcome === 'unsupported')
        return adminError(409, 'That action is not available for this account.');

      return respond(result.kind === 'conflict' ? 409 : 400, {
        error: { code: result.code, message: result.message }
      });
    }
  })
],
impersonation: [
  defineEndpoint({
    method: 'post',
    path: '/super-admin/accounts/:accountId/impersonation',
    summary: 'Start an app-managed support preview',
    tags: ['Super Admin'],
    params: z.object({ accountId: z.string().min(1) }),
    body: SuperAdminImpersonationBodySchema,
    responses: {
      ...accessResponses,
      200: SuperAdminImpersonationResultSchema,
      404: SuperAdminErrorSchema,
      409: SuperAdminErrorSchema
    },
    beforeBodyRules: adminRules,
    async handler({ input, services, superAdminActor }) {
      let result = await services.superAdmin.startImpersonation({
        actor: superAdminActor,
        accountId: input.params.accountId,
        reason: input.body.reason
      });

      if (result.outcome === 'started')
        return ok(result);

      if (result.outcome === 'not_allowed')
        return adminError(403, 'Super admin access is required.');

      if (result.outcome === 'not_found')
        return adminError(404, 'Account not found.');

      if (result.outcome === 'unsupported')
        return adminError(409, 'This app has not enabled support previews.');

      return adminError(409, 'A support preview could not be started.');
    }
  })
],
activity: [
  defineEndpoint({
    method: 'get',
    path: '/super-admin/activity',
    summary: 'List super admin activity',
    tags: ['Super Admin'],
    query: SuperAdminPaginationSchema,
    response: { schema: SuperAdminActivityPageSchema },
    responses: accessResponses,
    beforeBodyRules: adminRules,
    async handler({ input, services, superAdminActor }) {
      return ok(await services.superAdmin.listActivity({
        ...input.query,
        actor: superAdminActor
      }));
    }
  })
],
operations: [
  defineEndpoint({
    method: 'get',
    path: '/super-admin/operations',
    summary: 'Get app health, job history and observability links',
    tags: ['Super Admin'],
    response: { schema: SuperAdminOperationsSchema },
    responses: accessResponses,
    beforeBodyRules: adminRules,
    async handler({ services, superAdminActor }) {
      return ok(await services.superAdmin.getOperations({ actor: superAdminActor }));
    }
  })
],
telemetry: [
  defineEndpoint({
    method: 'get',
    path: '/super-admin/telemetry',
    summary: 'Search connected app logs and traces',
    tags: ['Super Admin'],
    query: SuperAdminTelemetryQuerySchema,
    response: { schema: SuperAdminTelemetryPageSchema },
    responses: accessResponses,
    beforeBodyRules: adminRules,
    async handler({ input, services, superAdminActor }) {
      return ok(await services.superAdmin.searchTelemetry({
        ...input.query,
        actor: superAdminActor
      }));
    }
  })
]
};

export function createSuperAdminEndpoints(features) {
  return features.flatMap(feature => endpointGroups[feature]);
}
