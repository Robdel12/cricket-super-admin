import { defineRule, forbidden, unauthenticated } from '@robdel12/cricket';

function actorFor(user) {
  let id = user?.userId ?? user?.id;

  if (!id)
    return null;

  return {
    id: String(id),
    label: String(user.label ?? user.username ?? user.email ?? id),
    role: String(user.role ?? 'unknown')
  };
}

export let requireSuperAdmin = defineRule('requireSuperAdmin', async ({ user, services }) => {
  let actor = actorFor(user);

  if (!actor)
    throw unauthenticated('Sign in to access the super admin.');

  if (!await services.superAdmin.canAccess({ actor }))
    throw forbidden('Super admin access is required.');

  return { superAdminActor: actor };
});
