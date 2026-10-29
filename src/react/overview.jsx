import React, { useId } from 'react';

function number(value) {
  return typeof value === 'number' ? value.toLocaleString() : value;
}

function comparison(metric) {
  if (!metric.comparison || typeof metric.value !== 'number') return null;
  let previous = metric.comparison.previousValue;
  let change = metric.value - previous;
  if (!change) return 'No change';
  if (!previous) return 'New this period';
  let percent = Math.round(Math.abs(change / previous) * 100);
  return `${percent}% ${change > 0 ? 'higher' : 'lower'}`;
}

function Metrics({ items, className = 'sa-metrics' }) {
  return (
    <div className={className}>
      {items.map(metric => {
        let change = comparison(metric);
        let content = (
          <>
            <span className="sa-metric-label">{metric.label}</span>
            <strong>{number(metric.value)}</strong>
            {metric.detail && <span className="sa-metric-detail">{metric.detail}</span>}
            {change && (
              <span className="sa-metric-comparison">
                {change} · {metric.comparison.label}
              </span>
            )}
          </>
        );
        return metric.href ? (
          <a className="sa-metric" href={metric.href} key={metric.id}>
            {content}
          </a>
        ) : (
          <article className="sa-metric" key={metric.id}>
            {content}
          </article>
        );
      })}
    </div>
  );
}

function Trend({ trend }) {
  let titleId = useId();
  let maximum = Math.max(1, ...trend.points.map(point => point.value));
  let width = 600;
  let step = width / Math.max(1, trend.points.length);
  return (
    <section className="sa-trend" aria-labelledby={titleId}>
      <div className="sa-section-heading">
        <div>
          <h2 id={titleId}>{trend.title}</h2>
          {trend.detail && <p>{trend.detail}</p>}
        </div>
      </div>
      {trend.points.length ? (
        <>
          <div className="sa-chart-scale">
            <span>{number(maximum)}</span>
            <span>per day</span>
          </div>
          <svg
            className="sa-chart"
            viewBox="0 0 600 130"
            preserveAspectRatio="none"
            role="img"
            aria-label={`${trend.title}: ${number(trend.points.reduce((total, point) => total + point.value, 0))} total. Daily counts below.`}
          >
            {trend.points.map((point, index) => {
              let height = (point.value / maximum) * 120;
              return (
                <rect
                  key={point.date}
                  x={index * step + 1}
                  y={125 - height}
                  width={Math.max(1, step - 2)}
                  height={height}
                >
                  <title>
                    {point.date}: {number(point.value)}
                  </title>
                </rect>
              );
            })}
            <line x1="0" x2="600" y1="126" y2="126" />
          </svg>
          <div className="sa-chart-dates">
            <span>{trend.points[0].date}</span>
            <span>{trend.points.at(-1).date}</span>
          </div>
          <details className="sa-chart-data">
            <summary>Daily counts</summary>
            <div className="sa-table-wrap">
              <table>
                <caption>{trend.title} by UTC date</caption>
                <thead>
                  <tr>
                    <th scope="col">Date</th>
                    <th scope="col">Count</th>
                  </tr>
                </thead>
                <tbody>
                  {trend.points.map(point => (
                    <tr key={point.date}>
                      <th scope="row">{point.date}</th>
                      <td>{number(point.value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </>
      ) : (
        <p className="sa-empty">No daily data is available.</p>
      )}
    </section>
  );
}

export function OverviewSection({
  overview,
  days,
  onPeriodChange,
  onRefresh,
  onShowActivity,
  onShowOperations,
  ActivityList
}) {
  return (
    <div className="sa-section">
      {overview.period && (
        <div className="sa-overview-toolbar">
          <p>
            As of{' '}
            {new Date(overview.period.to).toLocaleString(undefined, {
              dateStyle: 'medium',
              timeStyle: 'short'
            })}
          </p>
          <div className="sa-report-controls">
            <label>
              Reporting period{' '}
              <select value={days} onChange={event => onPeriodChange(Number(event.target.value))}>
                <option value={7}>Last 7 days</option>
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 90 days</option>
              </select>
            </label>
            <button type="button" className="sa-button" onClick={onRefresh}>
              Refresh
            </button>
          </div>
        </div>
      )}
      <Metrics items={overview.metrics} />
      <div className="sa-dashboard-grid">
        {overview.trends?.length > 0 && (
          <div className="sa-growth-column">
            {overview.trends.map(trend => (
              <Trend key={trend.id} trend={trend} />
            ))}
          </div>
        )}
        {overview.health?.length > 0 && (
          <section className="sa-health-summary">
            <div className="sa-section-heading">
              <h2>Product health</h2>
              {onShowOperations && (
                <button className="sa-text-button" onClick={onShowOperations}>
                  View operations
                </button>
              )}
            </div>
            <ul className="sa-health-list">
              {overview.health.map(component => (
                <li key={component.id}>
                  <div>
                    <strong>{component.label}</strong>
                    <span className={'sa-health-state sa-health-' + component.status}>
                      {component.status}
                    </span>
                  </div>
                  {component.detail && <p>{component.detail}</p>}
                </li>
              ))}
            </ul>
          </section>
        )}
        {overview.metricGroups?.length > 0 && (
          <div className="sa-growth-column">
            {overview.metricGroups.map(group => (
              <section className="sa-metric-group" key={group.id}>
                <div className="sa-section-heading">
                  <div>
                    <h2>{group.title}</h2>
                    {group.detail && <p>{group.detail}</p>}
                  </div>
                </div>
                <Metrics items={group.metrics} className="sa-metric-rows" />
              </section>
            ))}
          </div>
        )}
        <div className="sa-summary-column">
          {overview.roles.length > 0 && (
            <section>
              <div className="sa-section-heading">
                <h2>Accounts by role</h2>
              </div>
              <ul className="sa-role-list">
                {overview.roles.map(role => (
                  <li key={role.value}>
                    <span>{role.label}</span>
                    <strong>{number(role.count)}</strong>
                  </li>
                ))}
              </ul>
            </section>
          )}
          <section>
            <div className="sa-section-heading">
              <h2>Recent admin activity</h2>
              {onShowActivity && (
                <button className="sa-text-button" onClick={onShowActivity}>
                  View activity
                </button>
              )}
            </div>
            <ActivityList items={overview.recentActivity} />
          </section>
        </div>
      </div>
    </div>
  );
}
