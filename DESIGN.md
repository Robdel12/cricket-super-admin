# Admin UI

The admin should make support work easy to scan: which product and environment
are open, what needs attention, and what an action will do.

## Page layout

`SuperAdminShell` shows product identity, grouped navigation and the current page
title. The app's router renders the page inside it. Use clear page names such as
Accounts, Activity and Operations. Keep detail pages out of the sidebar with
`navigation: false` and link to them from their parent page.

Use headings, small groups of facts and tables that help people find answers.
Custom pages can use the app's design system. Keep the shell usable on narrow
screens and allow wide tables to scroll within their own container.

## Styles

Import `@robdel12/cricket-super-admin/styles.css` through the app's build.
Styles live in [src/react/styles.css](src/react/styles.css), scoped under
`.super-admin-root` with `sa-*` classes. Set these variables on the admin or a parent:

| Variables | Use |
| --- | --- |
| `--super-admin-bg`, `--super-admin-panel`, `--super-admin-raised` | Surfaces |
| `--super-admin-text`, `--super-admin-muted` | Text |
| `--super-admin-border` | Dividers and controls |
| `--super-admin-accent` | Links and primary actions |
| `--super-admin-danger`, `--super-admin-success` | Action feedback |

The defaults use dark surfaces, light text and a mint accent. Set `--font-body`
to use the app's body font; it falls back to system fonts. Keep text, focus rings
and status indicators readable with theme overrides.

## Components and feedback

Shared UI lives in [src/react/index.jsx](src/react/index.jsx). Exports include
`SectionHeading`, `EmptyState`, `ErrorNotice`, `AccountCard`, `ActivityList`,
`OperationsSection`, `ResourceState` and `useAdminResource`.

Show loading, empty, unavailable and error states separately. Give errors a
useful message and retry action. Label form controls, preserve visible keyboard
focus and describe status in words as well as color.

Use plain action names and explain their scope before confirmation. Require a
reason for support changes and show the result after the server responds.
“Run queued” and “Run completed” describe different outcomes; keep that clear.
