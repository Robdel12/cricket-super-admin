# Cricket Super Admin

Give Cricket apps a useful admin without rebuilding account support and app
operations every time. Shared screens handle common work. Product pages add
tools for the data and workflows that make each app different.

## Who it's for

Developers building admin tools for Cricket products, and the people using those
tools to help customers, review activity and investigate problems. The UI runs
inside each app and uses that app's authentication.

## What belongs here

Growth and usage summaries, account screens, admin activity, app-reported
operations, navigation and UI helpers belong in the package. Metrics need a
clear time window and source; missing analytics should stay unavailable. Add a shared feature when apps can agree
on its data and behavior. Keep specialized workflows in product pages.

The app owns table design, data access, permissions, audit storage, migrations,
job commands and external services. This package does not need direct database
access or a shared table layout across products.

## Principles

- **Keep composition explicit.** Use plain module definitions and functions.
  Copy and freeze definitions; build new ones when the configuration changes.
- **Keep product data flexible.** Validate shared shapes with Zod. Let custom
  pages use their own endpoints and data contracts.
- **Keep decisions in the app.** An available button or navigation item never
  grants permission. The server checks access and product rules.
- **Show what is known.** Missing job history is unavailable, not a count of zero.
  Describe an accepted command separately from completed work.
- **Fit the product.** Use the app's router, identity and theme. Shared screens
  should feel at home beside custom pages.

Keep the package focused on reusable admin work. Cricket remains the API
framework; product adapters supply the behavior behind the screens.
