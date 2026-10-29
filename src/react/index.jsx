import React, {
  useEffect,
  useId,
  useState
} from 'react';
import { adminPages, adminHref } from '../modules.js';
import { resolveAdminFeatures } from '../features.js';
import { OverviewSection } from './overview.jsx';

function errorText(error, fallback) {
  return error instanceof Error && error.message
    ? error.message
    : fallback;
}

function formatDate(value) {
  if (!value)
    return '—';

  let date = new Date(value);

  if (Number.isNaN(date.getTime()))
    return '—';

  return date.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
}

export function ErrorNotice({ children, onRetry }) {
  return (
    <div className="sa-notice sa-notice-error" role="alert">
      <p>{children}</p>
      {onRetry && (
        <button className="sa-button sa-button-subtle" type="button" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, children }) {
  return (
    <div className="sa-empty-state">
      <strong>{title}</strong>
      <p>{children}</p>
    </div>
  );
}

export function SectionHeading({ title, detail, action }) {
  return (
    <div className="sa-section-heading">
      <div>
        <h2>{title}</h2>
        {detail && <p>{detail}</p>}
      </div>
      {action}
    </div>
  );
}

export function ActivityList({ items }) {
  if (!items.length)
    return <p className="sa-empty">No admin actions have been recorded.</p>;

  return (
    <ol className="sa-activity-list">
      {items.map(item => (
        <li key={item.id}>
          <div className="sa-activity-copy">
            <strong>{item.action}</strong>
            <p>
              <span>{item.actorLabel}</span>
              {' → '}
              <span>{item.subjectLabel}</span>
            </p>
            <p>{item.reason}</p>
            {item.details.map(fact => (
              <span className="sa-inline-fact" key={fact.label}>{fact.label}: {fact.value}</span>
            ))}
          </div>
          <time dateTime={item.occurredAt}>{formatDate(item.occurredAt)}</time>
        </li>
      ))}
    </ol>
  );
}

export function AccountCard({ account, onAction, onImpersonate, impersonationEnabled, accountHref, Link = DefaultLink }) {
  let [actionId, setActionId] = useState('');
  let [value, setValue] = useState('');
  let [reason, setReason] = useState('');
  let [previewReason, setPreviewReason] = useState('');
  let [saving, setSaving] = useState(false);
  let [message, setMessage] = useState('');
  let [preview, setPreview] = useState(null);
  let action = account.actions.find(item => item.id === actionId);

  async function submitAction(event) {
    event.preventDefault();
    if (!action)
      return;

    setSaving(true);
    setMessage('');

    try {
      await onAction({
        accountId: account.id,
        action: action.id,
        value: action.values.length ? value : null,
        reason
      });
      setMessage('Action completed and recorded.');
      setActionId('');
      setValue('');
      setReason('');
    } catch (error) {
      setMessage(errorText(error, 'The action could not be completed.'));
    } finally {
      setSaving(false);
    }
  }

  async function submitImpersonation(event) {
    event.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      let result = await onImpersonate({ accountId: account.id, reason: previewReason });
      setPreview(result);
      setPreviewReason('');
    } catch (error) {
      setMessage(errorText(error, 'A support preview could not be started.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <article className="sa-account">
      <div className="sa-account-top">
        <div>
          <h3>{accountHref ? <Link href={accountHref}>{account.displayName}</Link> : account.displayName}</h3>
          <p>{account.email || 'No email address'}</p>
        </div>
        <div className="sa-account-tags">
          <span className="sa-tag">{account.role}</span>
          <span className="sa-tag sa-tag-muted">{account.status}</span>
        </div>
      </div>

      <dl className="sa-account-facts">
        <div><dt>Joined</dt><dd>{formatDate(account.createdAt)}</dd></div>
        <div><dt>Last seen</dt><dd>{formatDate(account.lastSeenAt)}</dd></div>
        {account.facts.map(fact => (
          <div key={fact.label}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>
        ))}
      </dl>

      {onAction && account.actions.length > 0 && (
        <div className="sa-account-action-area">
          {!action ? (
            <label className="sa-action-picker">
              Manage account
              <select value={actionId} onChange={event => {
                setActionId(event.target.value);
                setMessage('');
                setValue('');
              }}>
                <option value="">Choose an action</option>
                {account.actions.map(item => (
                  <option value={item.id} key={item.id}>{item.label}</option>
                ))}
              </select>
            </label>
          ) : (
            <form className="sa-action-form" onSubmit={submitAction}>
              <strong>{action.label}</strong>
              {action.destructive && (
                <p className="sa-destructive-note">This action can limit or remove account access.</p>
              )}
              {action.values.length > 0 && (
                <label>
                  {action.valueLabel || 'Choose a value'}
                  <select value={value} onChange={event => setValue(event.target.value)} required>
                    <option value="">Choose…</option>
                    {action.values.map(option => (
                      <option value={option.value} key={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>
              )}
              <label>
                Reason
                <textarea
                  value={reason}
                  onChange={event => setReason(event.target.value)}
                  minLength={8}
                  maxLength={500}
                  rows={2}
                  required
                  placeholder="Why are you making this change?"
                />
              </label>
              <div className="sa-form-actions">
                <button className="sa-button sa-button-primary" type="submit" disabled={saving || (action.values.length > 0 && !value)}>
                  {saving ? 'Saving…' : 'Confirm action'}
                </button>
                <button className="sa-button sa-button-subtle" type="button" disabled={saving} onClick={() => setActionId('')}>
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {impersonationEnabled && (
        <form className="sa-preview-form" onSubmit={submitImpersonation}>
          <label>
            Support preview reason
            <textarea
              value={previewReason}
              onChange={event => setPreviewReason(event.target.value)}
              minLength={8}
              maxLength={500}
              rows={2}
              required
              placeholder="Why do you need to view this account?"
            />
          </label>
          <button className="sa-button sa-button-subtle" type="submit" disabled={saving}>
            {saving ? 'Starting…' : 'Start read-only preview'}
          </button>
        </form>
      )}

      {message && <p className="sa-inline-message" role="status">{message}</p>}
      {preview && (
        <div className="sa-preview-link" role="status">
          <a href={preview.previewUrl} target="_blank" rel="noopener noreferrer">
            Open support preview for {preview.subjectLabel}
          </a>
          <span>Expires {formatDate(preview.expiresAt)}</span>
        </div>
      )}
    </article>
  );
}

function AccountsSection({ api, product, features, search, onSearch, href, Link }) {
  let params = new URLSearchParams(search);
  let submittedQuery = params.get('query') || '';
  let [result, setResult] = useState(null);
  let [status, setStatus] = useState('idle');
  let [error, setError] = useState('');
  let [revision, setRevision] = useState(0);
  let page = pageNumber(params.get('page'));
  let setPage = value => onSearch({ query: submittedQuery, page: typeof value === 'function' ? value(page) : value });

  useEffect(() => {
    if (!submittedQuery)
      return undefined;

    let controller = new AbortController();

    async function loadAccounts() {
      setStatus('loading');
      setError('');

      try {
        let response = await api.searchAccounts({
          query: submittedQuery,
          page,
          limit: 20
        }, { signal: controller.signal });

        if (!controller.signal.aborted) {
          setResult(response);
          setStatus('ready');
        }
      } catch (loadError) {
        if (!controller.signal.aborted) {
          setError(errorText(loadError, 'Accounts could not be loaded.'));
          setStatus('error');
        }
      }
    }

    void loadAccounts();
    return () => controller.abort();
  }, [api, page, revision, submittedQuery]);

  async function performAction(input) {
    let response = await api.performAccountAction(input);
    if (response.outcome !== 'completed')
      throw new Error(response.message || actionError(response.outcome));

    setRevision(current => current + 1);
  }

  async function startImpersonation(input) {
    let response = await api.startImpersonation(input);
    if (response.outcome !== 'started')
      throw new Error(response.outcome === 'unsupported'
        ? 'This product has not enabled support previews.'
        : 'The support preview could not be started.');

    return response;
  }

  function handleSubmit(event) {
    event.preventDefault();
    let value = String(new FormData(event.currentTarget).get('query') || '').trim();

    if (value.length < 2) {
      onSearch({});
      setResult(null);
      return;
    }

    onSearch({ query: value, page: 1 });
  }

  let totalPages = result ? Math.max(1, Math.ceil(result.total / result.limit)) : 1;

  return (
    <section className="sa-panel">
      <SectionHeading
        title="Accounts"
        detail={`Search ${product.name} accounts and take app-approved actions.`}
      />
      <form className="sa-search-form" onSubmit={handleSubmit}>
        <label htmlFor="sa-account-search">Name or email</label>
        <div className="sa-search-row">
          <input
            id="sa-account-search"
            type="search"
            key={submittedQuery}
            name="query"
            defaultValue={submittedQuery}
            minLength={2}
            maxLength={120}
            autoComplete="off"
            placeholder="Search accounts"
          />
          <button className="sa-button sa-button-primary" type="submit" disabled={submittedQuery && status === 'loading'}>
            {submittedQuery && status === 'loading' ? 'Searching…' : 'Search'}
          </button>
        </div>
      </form>
      {submittedQuery && status === 'error' && <ErrorNotice>{error}</ErrorNotice>}
      {!submittedQuery && <EmptyState title="Find an account">Enter at least two characters to search.</EmptyState>}
      {submittedQuery && status === 'loading' && <p className="sa-loading" role="status">Searching accounts…</p>}
      {submittedQuery && status === 'ready' && result?.items.length === 0 && <EmptyState title="No matches">Try a different name or email.</EmptyState>}
      {submittedQuery && result?.items.length > 0 && (
        <>
          <p className="sa-results-count">{result.total} {result.total === 1 ? 'account' : 'accounts'} found</p>
          <div className="sa-account-list">
            {result.items.map(account => (
              <AccountCard
                key={account.id}
                account={account}
                onAction={features.includes('accountActions') ? performAction : undefined}
                onImpersonate={startImpersonation}
                impersonationEnabled={features.includes('impersonation')}
                accountHref={href('/accounts/' + encodeURIComponent(account.id))}
                Link={Link}
              />
            ))}
          </div>
          {totalPages > 1 && (
            <div className="sa-pagination">
              <span>Page {result.page} of {totalPages}</span>
              <div>
                <button className="sa-button sa-button-subtle" type="button" disabled={submittedQuery && status === 'loading' || page <= 1} onClick={() => setPage(value => value - 1)}>Previous</button>
                <button className="sa-button sa-button-subtle" type="button" disabled={submittedQuery && status === 'loading' || page >= totalPages} onClick={() => setPage(value => value + 1)}>Next</button>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function actionError(outcome) {
  let errors = {
    not_allowed: 'Your admin access has changed. Sign in again.',
    not_found: 'This account no longer exists.',
    unsupported: 'This product does not support that action.'
  };

  return errors[outcome] || 'The action could not be completed.';
}

function ActivitySection({ api, search, onSearch }) {
  let params = new URLSearchParams(search);
  let page = pageNumber(params.get('page'));
  let setPage = update => onSearch({ page: typeof update === 'function' ? update(page) : update });
  let [revision, setRevision] = useState(0);
  let [result, setResult] = useState(null);
  let [status, setStatus] = useState('loading');
  let [error, setError] = useState('');

  useEffect(() => {
    let controller = new AbortController();

    async function loadActivity() {
      setStatus('loading');
      setError('');

      try {
        let response = await api.listActivity({ page, limit: 20 }, { signal: controller.signal });
        if (!controller.signal.aborted) {
          setResult(response);
          setStatus('ready');
        }
      } catch (loadError) {
        if (!controller.signal.aborted) {
          setError(errorText(loadError, 'Admin activity could not be loaded.'));
          setStatus('error');
        }
      }
    }

    void loadActivity();
    return () => controller.abort();
  }, [api, page, revision]);

  let totalPages = result ? Math.max(1, Math.ceil(result.total / result.limit)) : 1;

  return (
    <section className="sa-panel">
      <SectionHeading
        title="Admin activity"
        detail="Account changes and support actions include an actor, reason and timestamp."
        action={<button className="sa-button sa-button-subtle" type="button" onClick={() => setRevision(value => value + 1)}>Refresh</button>}
      />
      {status === 'loading' && <p className="sa-loading" role="status">Loading activity…</p>}
      {status === 'error' && <ErrorNotice onRetry={() => setRevision(value => value + 1)}>{error}</ErrorNotice>}
      {result && <ActivityList items={result.items} />}
      {result && totalPages > 1 && (
        <div className="sa-pagination">
          <span>Page {result.page} of {totalPages}</span>
          <div>
            <button className="sa-button sa-button-subtle" type="button" disabled={status === 'loading' || page <= 1} onClick={() => setPage(value => value - 1)}>Previous</button>
            <button className="sa-button sa-button-subtle" type="button" disabled={status === 'loading' || page >= totalPages} onClick={() => setPage(value => value + 1)}>Next</button>
          </div>
        </div>
      )}
    </section>
  );
}

export function OperationsSection({ operations, status, error, onRetry }) {
  if (status === 'loading' && !operations)
    return <p className="sa-loading" role="status">Loading product operations…</p>;

  if (status === 'error' && !operations)
    return <ErrorNotice onRetry={onRetry}>{error}</ErrorNotice>;

  if (!operations)
    return null;

  let jobCounts = operations.jobs ? [
    ['Queued', operations.jobs.queued],
    ['Active', operations.jobs.active],
    ['Completed', operations.jobs.completed],
    ['Failed', operations.jobs.failed]
  ] : [];

  return (
    <div className="sa-section">
      <div className="sa-operations-grid">
        <section className="sa-panel">
          <SectionHeading title="Service health" detail="Status comes from this product's adapter." />
          {operations.components.length ? (
            <ul className="sa-service-list">
              {operations.components.map(component => (
                <li key={component.id}>
                  <span className={`sa-status sa-status-${component.status}`}>{component.status}</span>
                  <div><strong>{component.label}</strong><p>{component.detail || 'No extra details.'}</p></div>
                  <time>{formatDate(component.checkedAt)}</time>
                </li>
              ))}
            </ul>
          ) : <EmptyState title="No health checks">This product has not connected service health yet.</EmptyState>}
        </section>

        <section className="sa-panel">
          <SectionHeading title="Cricket jobs" detail="Recent work from the app's job ledger." />
          {operations.jobs ? <>
          <div className="sa-job-counts">
            {jobCounts.map(([label, count]) => (
              <div key={label}><span>{label}</span><strong>{count}</strong></div>
            ))}
          </div>
          <h3 className="sa-subheading">Recent failures</h3>
          {operations.jobs.recentFailures.length ? (
            <ul className="sa-failure-list">
              {operations.jobs.recentFailures.map(failure => (
                <li key={failure.id}>
                  <div><strong>{failure.name}</strong><span>{failure.queue} · {failure.attempts} attempts</span></div>
                  <p>{failure.error || 'No error detail recorded.'}</p>
                  <time>{formatDate(failure.failedAt)}</time>
                  {failure.requestId && <code>Request {failure.requestId}</code>}
                </li>
              ))}
            </ul>
          ) : <p className="sa-empty">No recent job failures.</p>}
          </> : <EmptyState title="Job history unavailable">The app could not read its job ledger. Counts and failures are unavailable.</EmptyState>}
        </section>
      </div>

      <section className="sa-panel">
        <SectionHeading title="Observability" detail="Cricket writes structured logs and traces. The app connects its log provider here." />
        {operations.observability.length ? (
          <ul className="sa-observability-list">
            {operations.observability.map(target => (
              <li key={target.id}>
                <div><span className={`sa-status sa-status-${target.status}`}>{target.status.replace('_', ' ')}</span><strong>{target.label}</strong></div>
                <p>{target.detail || target.provider || 'No provider details.'}</p>
                {target.href && <a href={target.href} target="_blank" rel="noopener noreferrer">Open {target.kind}</a>}
              </li>
            ))}
          </ul>
        ) : <EmptyState title="No log provider connected">Add links to the product's logs, traces or metrics in its adapter.</EmptyState>}
      </section>
    </div>
  );
}

function TelemetrySection({ api, search, onSearch }) {
  let params = new URLSearchParams(search);
  let submittedQuery = params.get('query') || '';
  let page = pageNumber(params.get('page'));
  let level = params.get('level') || undefined;
  let [result, setResult] = useState(null);
  let [status, setStatus] = useState('idle');
  let [error, setError] = useState('');
  let [revision, setRevision] = useState(0);

  useEffect(() => {
    let controller = new AbortController();

    async function loadTelemetry() {
      setStatus('loading');
      setError('');

      try {
        let response = await api.searchTelemetry({ query: submittedQuery, page, limit: 50, level }, { signal: controller.signal });
        if (!controller.signal.aborted) {
          setResult(response);
          setStatus('ready');
        }
      } catch (loadError) {
        if (!controller.signal.aborted) {
          setError(errorText(loadError, 'Telemetry could not be loaded.'));
          setStatus('error');
        }
      }
    }

    void loadTelemetry();
    return () => controller.abort();
  }, [api, revision, submittedQuery, page, level]);

  function submit(event) {
    event.preventDefault();
    onSearch({ query: String(new FormData(event.currentTarget).get('query') || '').trim(), page: 1, level });
  }

  return (
    <section className="sa-panel">
      <SectionHeading title="Logs and traces" detail="Search events from the app's configured telemetry provider." />
      <form className="sa-search-form" onSubmit={submit}>
        <label htmlFor="sa-telemetry-search">Event or request ID</label>
        <div className="sa-search-row">
          <input id="sa-telemetry-search" type="search" key={submittedQuery} name="query" defaultValue={submittedQuery} maxLength={160} placeholder="Search logs and traces" />
          <button className="sa-button sa-button-primary" type="submit" disabled={status === 'loading'}>Search</button>
        </div>
      </form>
      {status === 'error' && <ErrorNotice onRetry={() => setRevision(value => value + 1)}>{error}</ErrorNotice>}
      {status === 'loading' && <p className="sa-loading" role="status">Loading telemetry…</p>}
      {result?.status === 'not_configured' && (
        <EmptyState title="No telemetry provider connected">
          Cricket sends structured logs and traces to the app's configured logger. Connect a searchable provider in the app adapter to show events here.
          {result.href && (
            <>
              {' '}
              <a href={result.href} target="_blank" rel="noopener noreferrer">
                Open {result.provider || 'log provider'}.
              </a>
            </>
          )}
        </EmptyState>
      )}
      {result?.status === 'unavailable' && <ErrorNotice>Telemetry is temporarily unavailable.</ErrorNotice>}
      {result?.status === 'connected' && (
        <>
          <p className="sa-results-count">{result.total} events · {result.provider}</p>
          <div className="sa-pagination"><span>Page {page}</span><div>
            <button className="sa-button" disabled={page <= 1 || status === 'loading'} onClick={() => onSearch({ query: submittedQuery, level, page: page - 1 })}>Previous</button>
            <button className="sa-button" disabled={page * result.limit >= result.total || status === 'loading'} onClick={() => onSearch({ query: submittedQuery, level, page: page + 1 })}>Next</button>
          </div></div>
          {result.items.length ? (
            <div className="sa-telemetry-list">
              {result.items.map(item => (
                <article key={item.id}>
                  <div className="sa-telemetry-meta">
                    <span className={`sa-level sa-level-${item.level || 'info'}`}>{item.level || item.kind}</span>
                    <time>{formatDate(item.occurredAt)}</time>
                    <span>{item.service || 'app'}</span>
                  </div>
                  <strong>{item.name}</strong>
                  {item.summary && <p>{item.summary}</p>}
                  <div className="sa-telemetry-meta">
                    {item.requestId && <code>Request {item.requestId}</code>}
                    {item.durationMs !== null && <span>{item.durationMs} ms</span>}
                    {item.status && <span>{item.status}</span>}
                  </div>
                </article>
              ))}
            </div>
          ) : <EmptyState title="No matching events">Try another search term or request ID.</EmptyState>}
        </>
      )}
    </section>
  );
}


function DefaultLink({ href, children, ...props }) {
  return <a href={href} {...props}>{children}</a>;
}

function pageNumber(value) {
  let page = Number(value);
  return Number.isSafeInteger(page) && page > 0 ? page : 1;
}

export function useAdminResource(load, input) {
  let [revision, setRevision] = useState(0);
  let [state, setState] = useState({ input, load, status: 'loading', data: null, error: '' });
  useEffect(() => {
    let controller = new AbortController();
    setState({ input, load, status: 'loading', data: null, error: '' });
    Promise.resolve().then(() => load(input, { signal: controller.signal })).then(data => {
      if (!controller.signal.aborted)
        setState({ input, load, status: 'ready', data, error: '' });
    }).catch(error => {
      if (!controller.signal.aborted)
        setState({ input, load, status: 'error', data: null, error: errorText(error, 'This page could not be loaded.') });
    });
    return () => controller.abort();
  }, [load, input, revision]);
  let current = state.input === input && state.load === load ? state : { status: 'loading', data: null, error: '' };
  return { ...current, reload: () => setRevision(value => value + 1) };
}

export function ResourceState({ resource, children }) {
  if (resource.status === 'loading')
    return <p role="status">Loading…</p>;
  if (resource.status === 'error')
    return <ErrorNotice onRetry={resource.reload}>{resource.error}</ErrorNotice>;
  return children(resource.data);
}

export function SuperAdminShell({ product, modules, activePageId, permissions = [], basePath, Link = DefaultLink, children }) {
  let [navigationOpen, setNavigationOpen] = useState(false);
  let navigationId = useId();
  let pages = adminPages(modules, permissions);
  let active = pages.find(page => page.id === activePageId);
  let selected = active?.navigation ? active : pages.find(page => page.moduleId === active?.moduleId && page.navigation);
  let groups = [...new Set(modules.map(module => module.group))];
  return (
    <div className="super-admin-root sa-shell">
      <aside className="sa-sidebar">
        <div className="sa-sidebar-heading">
          <p className="sa-product">{product.name}<span>{product.environment}</span></p>
          <button className="sa-button sa-menu-toggle" type="button" aria-expanded={navigationOpen}
            aria-controls={navigationId} onClick={() => setNavigationOpen(open => !open)}>
            {navigationOpen ? 'Close menu' : 'Admin menu'}
          </button>
        </div>
        <nav id={navigationId} className={navigationOpen ? 'sa-navigation sa-navigation-open' : 'sa-navigation'} aria-label="Super admin sections">
          {groups.map(group => {
            let entries = modules.filter(module => module.group === group)
              .flatMap(module => pages.filter(page => page.moduleId === module.id && page.navigation));
            return entries.length > 0 && <section key={group}>
              {entries.length > 1 && <h2>{group}</h2>}
              {entries.map(page => <Link key={page.id} href={adminHref(basePath, page.path)}
                onClick={() => setNavigationOpen(false)}
                className={selected?.id === page.id ? 'sa-nav-link sa-nav-active' : 'sa-nav-link'}
                aria-current={selected?.id === page.id ? 'page' : undefined}>{page.label}</Link>)}
            </section>;
          })}
        </nav>
      </aside>
      <main className="sa-content">
        <header className="sa-page-heading"><h1>{active?.label || 'Page not found'}</h1></header>
        {children}
      </main>
    </div>
  );
}

export function createSuperAdminModules({ features, api }) {
  let enabled = resolveAdminFeatures(features);
  let modules = [];
  function add(id, label, group, Component, extraPages = []) {
    modules.push({ id, label, group, pages: [{ id: 'index', path: id === 'overview' ? '/' : '/' + id, label, Component }, ...extraPages] });
  }
  if (enabled.includes('overview')) {
    function OverviewPage({ search, onSearch, navigate }) {
      let requested = Number(new URLSearchParams(search).get('days'));
      let days = [7, 30, 90].includes(requested) ? requested : 30;
      let resource = useAdminResource(api.getOverview, days);
      return <ResourceState resource={resource}>{overview => <OverviewSection overview={overview}
        days={days} onPeriodChange={value => onSearch({ days: value })} onRefresh={resource.reload}
        onShowOperations={enabled.includes('operations') ? () => navigate('/operations') : undefined}
        onShowActivity={enabled.includes('activity') ? () => navigate('/activity') : undefined}
        ActivityList={ActivityList} />}</ResourceState>;
    }
    add('overview', 'Overview', 'Overview', OverviewPage);
  }
  if (enabled.includes('accounts')) {
    function AccountsPage(props) {
      return <AccountsSection {...props} api={api} features={enabled} />;
    }
    function AccountPage({ params }) {
      let resource = useAdminResource(api.getAccount, params.accountId);
      async function performAction(input) {
        let result = await api.performAccountAction(input);
        if (result.outcome !== 'completed') throw new Error(result.message || actionError(result.outcome));
        resource.reload();
      }
      return <ResourceState resource={resource}>{account => account
        ? <AccountCard key={account.id} account={account} onAction={enabled.includes('accountActions') ? performAction : undefined}
            impersonationEnabled={enabled.includes('impersonation')} onImpersonate={api.startImpersonation} />
        : <EmptyState title="Account not found">This account may have been removed.</EmptyState>}</ResourceState>;
    }
    add('accounts', 'Accounts', 'Support', AccountsPage, [{ id: 'detail', path: '/accounts/:accountId', label: 'Account details', Component: AccountPage, navigation: false }]);
  }
  if (enabled.includes('activity')) {
    function ActivityPage(props) { return <ActivitySection {...props} api={api} />; }
    add('activity', 'Activity', 'Support', ActivityPage);
  }
  if (enabled.includes('operations')) {
    function OperationsPage() {
      let resource = useAdminResource(api.getOperations);
      return <ResourceState resource={resource}>{operations => <OperationsSection operations={operations} status="ready" onRetry={resource.reload} />}</ResourceState>;
    }
    add('operations', 'Operations', 'System', OperationsPage);
  }
  if (enabled.includes('telemetry')) {
    function TelemetryPage(props) { return <TelemetrySection {...props} api={api} />; }
    add('telemetry', 'Logs & traces', 'System', TelemetryPage);
  }
  return modules;
}
