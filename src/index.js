import { defineCricketPlugin } from '@robdel12/cricket';
import { createSuperAdminEndpoints } from './routes.js';
import { createSuperAdminSchema } from './schema.js';
import { resolveAdminFeatures } from './features.js';

export * from './schema.js';
export { requireSuperAdmin } from './access.rules.js';
export { resolveAdminFeatures } from './features.js';

export function createSuperAdminPlugin({ features } = {}) {
  let enabled = resolveAdminFeatures(features);
  return defineCricketPlugin({
    name: 'super-admin',
    schema: createSuperAdminSchema(enabled),
    domains: [{ name: 'superAdmin', endpoints: createSuperAdminEndpoints(enabled) }]
  });
}
