import type { BacklogStats } from '../lib/backlogStats';

interface BacklogSummaryProps {
  stats: BacklogStats;
}

export function BacklogSummary({ stats }: BacklogSummaryProps) {
  return (
    <dl className="backlog-summary">
      <div className="backlog-summary__stat">
        <dt>Open</dt>
        <dd>{stats.open}</dd>
      </div>
      <div className="backlog-summary__stat backlog-summary__stat--urgent">
        <dt>Urgent</dt>
        <dd>{stats.urgent}</dd>
      </div>
      <div className="backlog-summary__stat backlog-summary__stat--stale">
        <dt>Stale (7d+)</dt>
        <dd>{stats.stale}</dd>
      </div>
      <div className="backlog-summary__stat">
        <dt>Oldest open</dt>
        <dd>{stats.oldestOpenAgeDays === null ? '—' : `${stats.oldestOpenAgeDays}d`}</dd>
      </div>
    </dl>
  );
}
