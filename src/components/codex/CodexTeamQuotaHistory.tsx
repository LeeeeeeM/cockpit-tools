import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { CodexAccount } from '../../types/codex';
import type { UnifiedQuotaMetric } from '../../presentation/platformAccountPresentation';
import { CodexQuotaMiniRows } from './CodexQuotaMiniRows';
import { Clock3 } from 'lucide-react';

export function CodexTeamQuotaHistory({ account }: { account: CodexAccount }) {
  const { t } = useTranslation();
  const [now, setNow] = useState(() => Date.now());
  const history = account.team_quota_history;
  const visible = account.plan_type === 'self_serve_business_usage_based';
  useEffect(() => {
    if (!visible) return;
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, [visible]);
  if (!visible) return null;
  const valid = history && history.user_id === account.user_id
    && history.account_id === account.account_id;
  const items: UnifiedQuotaMetric[] = valid ? ([
    ['5h', history.hourly_reset_time, history.hourly_percentage],
    ['Weekly', history.weekly_reset_time, history.weekly_percentage],
  ] as const).map(([label, reset, remaining]) => {
    const percentage = Math.max(0, Math.min(100, remaining ?? 0));
    const minutes = reset ? Math.max(0, Math.ceil((reset * 1000 - now) / 60_000)) : 0;
    const duration = minutes >= 1440 ? `${Math.floor(minutes / 1440)}d ${Math.floor(minutes % 1440 / 60)}h`
      : minutes >= 60 ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` : `${minutes}m`;
    return {
      key: label, label, percentage,
      resetAt: reset,
      quotaClass: percentage > 50 ? 'high' : percentage > 20 ? 'medium' : 'low',
      showProgress: remaining != null,
      valueText: remaining == null ? `${label}: ${t('codex.teamHistory.unknown', '暂无历史重置时间')}` : `${percentage}%`,
      hintText: t('codex.teamHistory.hint', '移除席位前的剩余额度，不代表当前可用额度'),
      resetText: !reset ? t('codex.teamHistory.unknown', '暂无历史重置时间')
        : reset * 1000 <= now ? t('codex.teamHistory.elapsed', '预计已重置，恢复席位后验证')
          : t('codex.teamHistory.resetIn', '预计 {{duration}} 后重置', {
            duration,
          }),
    };
  }) : [];
  return (
    <div className="codex-team-quota-history" style={{ overflowWrap: 'anywhere', minWidth: 0, maxWidth: '100%', whiteSpace: 'normal', gridColumn: '1 / -1' }}>
      <div className="codex-quota-mini-reset">{t('codex.teamHistory.title', '原 Team 席位额度（本地快照）')}</div>
      {!valid ? <div className="codex-quota-mini-reset">{t('codex.teamHistory.unknown', '暂无历史重置时间')}</div> : <>
        {items.map(item => <div key={item.key} className="codex-team-history-window">
          <CodexQuotaMiniRows items={[{ ...item, resetText: undefined }]} t={t} />
          <div className={`codex-subscription-footer codex-team-history-reset ${item.resetAt && Number(item.resetAt) * 1000 <= now ? 'active' : 'pending'}`}>
            <div className="codex-subscription-footer-main">
              <Clock3 size={14} aria-hidden="true" />
              <strong>{item.resetText}</strong>
            </div>
            {item.resetAt && <time className="codex-subscription-footer-date" dateTime={new Date(Number(item.resetAt) * 1000).toISOString()}>
              {new Date(Number(item.resetAt) * 1000).toLocaleString(undefined, { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })}
            </time>}
          </div>
        </div>)}
        <div className="codex-quota-mini-reset">{t('codex.teamHistory.observed', '快照时间：{{time}}', {
          time: new Date(history.observed_at * 1000).toLocaleString(),
        })}</div>
      </>}
    </div>
  );
}
