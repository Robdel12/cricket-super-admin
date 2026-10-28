function text(value, name) {
  if (typeof value !== 'string' || !value.trim())
    throw new Error(`Admin ${name} must be a non-empty string.`);
  return value.trim();
}

export function composeAdminModules(input) {
  if (!Array.isArray(input))
    throw new Error('Admin modules must be an array.');
  let moduleIds = new Set();
  let routes = new Set();
  let modules = input.map(module => {
    let id = text(module.id, 'module ID');
    if (!/^[a-z][a-z0-9-]*$/.test(id)) throw new Error(`Invalid admin module ID ${id}.`);
    if (moduleIds.has(id))
      throw new Error(`Duplicate admin module ${id}.`);
    moduleIds.add(id);
    if (!Array.isArray(module.pages) || !module.pages.length)
      throw new Error(`Admin module ${id} needs pages.`);
    let pageIds = new Set();
    let pages = module.pages.map(page => {
      let pageId = text(page.id, 'page ID');
      if (!/^[a-z][a-z0-9-]*$/.test(pageId)) throw new Error(`Invalid admin page ID ${pageId}.`);
      let path = text(page.path, 'page path');
      if (!/^\/(?:[a-zA-Z0-9_-]+|:[a-zA-Z][a-zA-Z0-9_]*)(?:\/(?:[a-zA-Z0-9_-]+|:[a-zA-Z][a-zA-Z0-9_]*))*$/.test(path) && path !== '/')
        throw new Error(`Invalid relative admin path ${path}.`);
      let parameters = path.split('/').filter(segment => segment.startsWith(':'));
      if (new Set(parameters).size !== parameters.length) throw new Error(`Duplicate route parameter in ${path}.`);
      let route = path.replace(/:[^/]+/g, ':param');
      for (let existing of routes) {
        let left = route.split('/');
        let right = existing.split('/');
        if (left.length !== right.length) continue;
        let overlap = left.every((segment, index) => segment === right[index] || segment === ':param' || right[index] === ':param');
        let leftMoreSpecific = left.some((segment, index) => segment !== ':param' && right[index] === ':param');
        let rightMoreSpecific = left.some((segment, index) => segment === ':param' && right[index] !== ':param');
        if (overlap && leftMoreSpecific && rightMoreSpecific)
          throw new Error(`Ambiguous admin route ${path}.`);
      }
      if (routes.has(route))
        throw new Error(`Conflicting admin route ${path}.`);
      if (pageIds.has(pageId))
        throw new Error(`Duplicate admin page ${id}.${pageId}.`);
      if (typeof page.Component !== 'function')
        throw new Error(`Admin page ${id}.${pageId} needs a component.`);
      let permission = page.permission === undefined ? undefined : text(page.permission, 'page permission');
      routes.add(route);
      pageIds.add(pageId);
      return Object.freeze({
        id: `${id}.${pageId}`, moduleId: id, path,
        label: text(page.label, 'page label'), Component: page.Component,
        navigation: page.navigation !== false,
        ...(permission ? { permission } : {})
      });
    });
    return Object.freeze({ id, label: text(module.label, 'module label'), group: text(module.group, 'navigation group'), pages: Object.freeze(pages) });
  });
  return Object.freeze(modules);
}

export function adminPages(modules, permissions = []) {
  let granted = new Set(permissions);
  return modules.flatMap(module => module.pages)
    .filter(page => !page.permission || granted.has(page.permission))
    .sort((a, b) => {
      let score = path => path.split('/').reduce((value, segment) => value + (segment.startsWith(':') ? 1 : 10), 0);
      return score(b.path) - score(a.path);
    });
}

export function adminHref(basePath, path, query = '') {
  if (!basePath.startsWith('/') || basePath.startsWith('//') || /[?#]/.test(basePath))
    throw new Error('Admin base path must be an app path.');
  return basePath.replace(/\/$/, '') + (path === '/' ? '' : path) + (query ? `?${String(query).replace(/^\?/, '')}` : '');
}
