export let defaultFeatures = Object.freeze(['overview', 'accounts', 'accountActions', 'activity', 'operations']);
let supported = new Set([...defaultFeatures, 'impersonation', 'telemetry']);

export function resolveAdminFeatures(features = defaultFeatures) {
  if (!Array.isArray(features) || features.some(feature => !supported.has(feature)))
    throw new Error('Choose supported super admin features.');
  if (new Set(features).size !== features.length)
    throw new Error('Super admin features must be unique.');
  for (let feature of ['accountActions', 'impersonation']) {
    if (features.includes(feature) && !features.includes('accounts'))
      throw new Error(`${feature} requires the accounts feature.`);
  }
  return Object.freeze([...features]);
}
