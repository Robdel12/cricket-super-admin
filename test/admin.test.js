import assert from 'node:assert/strict';
import test from 'node:test';
import { defineCricketApp, defineCricketPlugin, defineEndpoint, ok, z } from '@robdel12/cricket';
import { createTestRuntime } from '@robdel12/cricket/test';
import { createSuperAdminPlugin, requireSuperAdmin } from '../src/index.js';
import { composeAdminModules, adminPages, adminHref } from '../src/modules.js';

let Component = () => null;
function moduleFor(path = '/radar/:runId') {
  return { id: 'radar', label: 'Radar', group: 'Product', pages: [{ id: 'detail', path, label: 'Run details', Component }] };
}

test('product module composition copies definitions and keeps custom route components', () => {
  let input = moduleFor();
  let modules = composeAdminModules([input]);
  input.pages[0].label = 'Changed by the caller';
  assert.equal(modules[0].pages[0].label, 'Run details');
  assert.equal(modules[0].pages[0].Component, Component);
  assert.ok(Object.isFrozen(modules[0].pages));
  assert.equal(adminHref('/admin', '/radar/123'), '/admin/radar/123');
  assert.equal(adminHref('/admin', '/', 'page=2'), '/admin?page=2');
});

test('conflicting routes and invalid page definitions fail before rendering', () => {
  assert.throws(() => composeAdminModules([moduleFor(), { ...moduleFor('/radar/:id'), id: 'other' }]), /Conflicting/);
  assert.throws(() => composeAdminModules([moduleFor('https://example.com')]), /Invalid/);
  assert.throws(() => composeAdminModules([moduleFor('/radar/:runId'), { ...moduleFor('/:type/new'), id: 'other' }]), /Ambiguous/);
  assert.throws(() => composeAdminModules([{ ...moduleFor(), pages: [{ id: 'x', path: '/', label: 'X' }] }]), /component/);
});

test('page permissions filter both navigation and the route catalogue', () => {
  let definition = moduleFor();
  definition.pages[0].permission = ' radar.read ';
  let modules = composeAdminModules([definition]);
  assert.equal(adminPages(modules).length, 0);
  assert.equal(adminPages(modules, ['radar.read'])[0].id, 'radar.detail');
});

function appFor(service) {
  return defineCricketApp({
    domains: [], plugins: [createSuperAdminPlugin({ features: ['operations'] }), defineCricketPlugin({
      name: 'product-admin', domains: [{ name: 'productAdmin', endpoints: [defineEndpoint({
        method: 'get', path: '/admin/station', beforeBodyRules: [requireSuperAdmin],
        response: z.object({ station: z.string(), frameTimes: z.array(z.number()) }),
        handler: () => ok({ station: 'KTLX', frameTimes: [1, 2] })
      })] }]
    })],
    services: () => ({ superAdmin: service }),
    context: ({ request }) => ({ user: request.headers['x-user'] ? { id: request.headers['x-user'], role: 'admin' } : undefined })
  });
}

let operations = { components: [], jobs: { queued: 0, active: 0, completed: 0, failed: 0, recentFailures: [] }, observability: [] };
test('an app can run one shared feature and custom data endpoints without unrelated adapter stubs', async () => {
  let harness = await createTestRuntime(appFor({
    canAccess: ({ actor }) => actor.id === 'owner', getOperations: () => operations
  }));
  try {
    assert.equal((await harness.api.get('/super-admin/operations')).status, 401);
    assert.equal((await harness.api.get('/super-admin/operations', { headers: { 'x-user': 'member' } })).status, 403);
    let headers = { 'x-user': 'owner' };
    assert.equal((await harness.api.get('/super-admin/operations', { headers })).status, 200);
    assert.equal((await harness.api.get('/super-admin/telemetry', { headers })).status, 404);
    assert.equal((await harness.api.get('/super-admin/accounts', { headers })).status, 404);
    assert.equal((await harness.api.get('/admin/station')).status, 401);
    let custom = await harness.api.get('/admin/station', { headers });
    assert.deepEqual(custom.body, { station: 'KTLX', frameTimes: [1, 2] });
  } finally { await harness.cleanup(); }
});

test('selected adapter methods are required and their results are schema checked', async () => {
  await assert.rejects(createTestRuntime(appFor({ canAccess: () => true })), /getOperations/);
  let harness = await createTestRuntime(appFor({ canAccess: () => true, getOperations: () => ({ secret: 'must not escape' }) }));
  try {
    let response = await harness.api.get('/super-admin/operations', { headers: { 'x-user': 'owner' } });
    assert.equal(response.status, 500);
    assert.ok(!JSON.stringify(response.body).includes('must not escape'));
  } finally { await harness.cleanup(); }
});
