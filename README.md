# Cricket Super Admin

Shared admin screens and custom product pages for [Cricket](https://github.com/Robdel12/cricket) apps.
Start with accounts, activity and operations, then add the tools your product needs.
Your app keeps its database, permissions, routes and business rules.

## Install

Requires Node.js 24+ and Cricket. React 18+ is needed for the UI only.
The package is installed from GitHub, not npm. Replace `<commit>` with a commit SHA:

```sh
pnpm add "github:Robdel12/cricket-super-admin#<commit>"
```

For local development, clone this repo beside your app and use
`pnpm add "file:../cricket-super-admin"`. When using local packages, configure your
bundler to use the app's copy of React.

## Add the server plugin

```js
import { createSuperAdminPlugin } from '@robdel12/cricket-super-admin';

let adminPlugin = createSuperAdminPlugin({ features: ['accounts', 'activity'] });
```

Add `adminPlugin` to your Cricket app's `plugins` array. Supply
`services.superAdmin` with `canAccess` and the methods for your chosen features:

| Feature | App methods |
| --- | --- |
| Always required | `canAccess` |
| `overview` | `getOverview` |
| `accounts` | `searchAccounts`, `getAccount` |
| `accountActions` | `performAccountAction` |
| `activity` | `listActivity` |
| `operations` | `getOperations` |
| `telemetry` | `searchTelemetry` |
| `impersonation` | `startImpersonation` |

The default features are overview, accounts, account actions, activity and operations.
Account actions and impersonation require accounts. Disabled features add no routes
or required methods. Use the same feature list for the server and UI.

### Pass app data

Your methods read product data and return the shapes in [src/schema.js](src/schema.js).
Cricket checks the methods at startup and validates their inputs and outputs.
The named Zod schemas and `createSuperAdminSchema(features)` are exported from
`@robdel12/cricket-super-admin`.

Map your app data to these shapes. Return `null` for a missing account and
`jobs: null` when job history is unavailable. Job errors should contain safe
display text. Account actions return a result such as `completed` or `rejected`;
your app decides which actions are allowed.

`canAccess({ actor })` must check current admin access. Product endpoints can
reuse the exported `requireSuperAdmin` rule. Mutations should check access
inside their transaction and save an audit record with the change.

Telemetry needs your app's log or trace provider. Impersonation needs your app's
support sessions, including expiry, audit records and a visible way to exit.
Enable these features when those integrations are ready.

## Add pages

The browser UI and styles have separate exports:

```jsx
import { createSuperAdminModules, SuperAdminShell } from '@robdel12/cricket-super-admin/react';
import { composeAdminModules, adminPages } from '@robdel12/cricket-super-admin/modules';
import '@robdel12/cricket-super-admin/styles.css';

let modules = composeAdminModules([
  ...createSuperAdminModules({ features, api }),
  {
    id: 'projects',
    label: 'Projects',
    group: 'Product',
    pages: [
      { id: 'list', path: '/projects', label: 'Projects', Component: ProjectsPage },
      { id: 'detail', path: '/projects/:projectId', label: 'Project',
        Component: ProjectPage, navigation: false }
    ]
  }
]);
```

Here, `features` is your feature list, `api` is your browser client, and the page
components belong to your app. The client returns response data and throws on
errors. Its methods follow the shared pages in [src/react/index.jsx](src/react/index.jsx).

Mount `adminPages(modules, permissions)` with your router. Render the matched page
inside `SuperAdminShell`, passing `product: { name, environment }`, `modules`,
`activePageId`, `permissions`, `basePath` and your router's `Link` component.
Page paths are relative to `basePath`; the shell does not create a router.

Shared pages receive `product`, `params`, `search`, `onSearch`, `href`, `navigate`
and `Link`. Keep `search` in the URL and update it through `onSearch(values)`.
`href` and `navigate` take admin-relative paths. Key detail pages by route identity
so form state resets between records.

Product pages can use their own components, clients and guarded endpoints with
any data shape. A page's optional `permission` filters it from navigation and the
route list. Every endpoint still needs its own authorization.

Module definitions are copied and frozen. Duplicate IDs and conflicting paths
fail when modules are composed. See [DESIGN.md](DESIGN.md) for styles and shared UI.

## Development

Run `pnpm install`, `pnpm run check` and `pnpm test`. Package tests cover real
Cricket HTTP behavior and module composition. Test product data and browser
workflows in the consuming app.

Read [VISION.md](VISION.md) for product direction and [AGENTS.md](AGENTS.md) for
contributor guidance.
