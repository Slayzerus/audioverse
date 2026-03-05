/**
 * SfwPauseScreen — "Boss Key" pause overlay that looks like a serious
 * business dashboard. Completely hides the game underneath with
 * professional-looking charts, KPIs, tables, and meeting schedules.
 *
 * Trigger: F9 or the "SFW Mode" button in PauseMenu.
 * Press F9 / Escape / click anywhere to return to the game.
 *
 * All text is i18n-ready (sfwPause.* namespace).
 * Data is randomly generated but looks realistic.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import styles from './SfwPauseScreen.module.css'

interface Props {
  onDismiss: () => void
}

/* ── Fake data generators ──────────────────────────────────────── */

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function fmtMoney(n: number) {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtPct(n: number) {
  return (n >= 0 ? '+' : '') + n.toFixed(1) + '%'
}

function generateKpis() {
  const revenue = rand(450000, 1200000)
  const lastRevenue = revenue * (1 + (Math.random() * 0.3 - 0.15))
  const revenueChange = ((revenue - lastRevenue) / lastRevenue) * 100

  const users = rand(12000, 85000)
  const lastUsers = users * (1 + (Math.random() * 0.2 - 0.08))
  const usersChange = ((users - lastUsers) / lastUsers) * 100

  const conversion = 2 + Math.random() * 6
  const lastConversion = conversion * (1 + (Math.random() * 0.3 - 0.15))
  const conversionChange = ((conversion - lastConversion) / lastConversion) * 100

  const churn = 1 + Math.random() * 4
  const lastChurn = churn * (1 + (Math.random() * 0.3 - 0.15))
  const churnChange = ((churn - lastChurn) / lastChurn) * 100

  return [
    { key: 'revenue', value: `$${fmtMoney(revenue)}`, change: revenueChange },
    { key: 'activeUsers', value: users.toLocaleString(), change: usersChange },
    { key: 'conversionRate', value: `${conversion.toFixed(1)}%`, change: conversionChange },
    { key: 'churnRate', value: `${churn.toFixed(1)}%`, change: churnChange },
  ]
}

function generateBarChart() {
  const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
  const now = new Date()
  const currentMonth = now.getMonth()
  const last6 = []
  for (let i = 5; i >= 0; i--) {
    const idx = (currentMonth - i + 12) % 12
    last6.push({ label: months[idx], value: rand(40, 100) })
  }
  return last6
}

function generateMeetings(t: (k: string, d: string) => string) {
  const base = new Date()
  base.setMinutes(0, 0, 0)
  const hour = base.getHours()

  const meetingKeys = [
    'standup', 'sprintReview', 'clientSync', 'budgetReview',
    'teamRetro', 'roadmapPlanning', 'onsiteTraining', 'weeklySync',
  ]

  const meetings = []
  for (let i = 0; i < 5; i++) {
    const h = hour + i + 1
    if (h > 18) break
    const key = meetingKeys[i % meetingKeys.length]
    meetings.push({
      time: `${String(h).padStart(2, '0')}:00`,
      title: t(`sfwPause.meetings.${key}`, key),
      room: `${String.fromCharCode(65 + rand(0, 5))}${rand(100, 400)}`,
    })
  }
  return meetings
}

function generateTickets() {
  const prefixes = ['PROJ', 'DEV', 'OPS', 'SEC', 'DATA']
  const statuses = ['inProgress', 'review', 'blocked', 'done'] as const
  const tickets = []
  for (let i = 0; i < 6; i++) {
    tickets.push({
      id: `${prefixes[rand(0, prefixes.length - 1)]}-${rand(1000, 9999)}`,
      status: statuses[rand(0, statuses.length - 1)],
      priority: rand(1, 5),
    })
  }
  return tickets
}

function generateStockRow() {
  const tickers = ['MSFT', 'AAPL', 'GOOGL', 'AMZN', 'META', 'NVDA', 'TSLA', 'CRM']
  return tickers.map(t => {
    const price = rand(80, 600) + Math.random()
    const change = (Math.random() * 6 - 3)
    return { ticker: t, price, change }
  })
}

/* ── Component ────────────────────────────────────────────── */

export default function SfwPauseScreen({ onDismiss }: Props) {
  const { t } = useTranslation()
  const [clock, setClock] = useState(new Date())

  // Generate stable fake data once on mount
  const kpis = useMemo(generateKpis, [])
  const bars = useMemo(generateBarChart, [])
  const meetings = useMemo(() => generateMeetings(t), [t])
  const tickets = useMemo(generateTickets, [])
  const stocks = useMemo(generateStockRow, [])

  // Live clock
  useEffect(() => {
    const id = setInterval(() => setClock(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  // Dismiss on Escape or F9
  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'F9') {
        e.preventDefault()
        e.stopPropagation()
        onDismiss()
      }
    },
    [onDismiss],
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKey, true)
    return () => window.removeEventListener('keydown', handleKey, true)
  }, [handleKey])

  const maxBar = Math.max(...bars.map(b => b.value))

  return (
    <div className={styles.screen} onClick={onDismiss} title={t('sfwPause.clickToDismiss', 'Click to return')}>
      {/* ── Header bar ─────────────────────────────── */}
      <header className={styles.header}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>📊</span>
          <span className={styles.logoText}>Enterprise Analytics</span>
        </div>
        <nav className={styles.nav}>
          <span className={styles.navActive}>{t('sfwPause.nav.dashboard', 'Dashboard')}</span>
          <span>{t('sfwPause.nav.reports', 'Reports')}</span>
          <span>{t('sfwPause.nav.pipeline', 'Pipeline')}</span>
          <span>{t('sfwPause.nav.team', 'Team')}</span>
          <span>{t('sfwPause.nav.settings', 'Settings')}</span>
        </nav>
        <div className={styles.headerRight}>
          <span className={styles.clock}>
            {clock.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
          <span className={styles.avatar}>👤</span>
        </div>
      </header>

      {/* ── Breadcrumb ─────────────────────────────── */}
      <div className={styles.breadcrumb}>
        {t('sfwPause.breadcrumb', 'Home / Analytics / Executive Dashboard')}
      </div>

      {/* ── KPI cards ──────────────────────────────── */}
      <section className={styles.kpis}>
        {kpis.map(k => (
          <div key={k.key} className={styles.kpiCard}>
            <div className={styles.kpiLabel}>{t(`sfwPause.kpi.${k.key}`, k.key)}</div>
            <div className={styles.kpiValue}>{k.value}</div>
            <div className={`${styles.kpiChange} ${k.change >= 0 ? styles.positive : styles.negative}`}>
              {fmtPct(k.change)} {t('sfwPause.kpi.vs', 'vs')} {t('sfwPause.kpi.lastPeriod', 'last period')}
            </div>
          </div>
        ))}
      </section>

      {/* ── Main grid ──────────────────────────────── */}
      <div className={styles.mainGrid}>
        {/* ── Bar chart ──────────────────────────── */}
        <section className={styles.card}>
          <h3 className={styles.cardTitle}>{t('sfwPause.chart.title', 'Monthly Revenue Trend')}</h3>
          <div className={styles.barChart}>
            {bars.map(b => (
              <div key={b.label} className={styles.barCol}>
                <div className={styles.barValue}>{b.value}K</div>
                <div
                  className={styles.bar}
                  style={{ height: `${(b.value / maxBar) * 100}%` }}
                />
                <div className={styles.barLabel}>{t(`sfwPause.months.${b.label}`, b.label)}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Tickets table ──────────────────────── */}
        <section className={styles.card}>
          <h3 className={styles.cardTitle}>{t('sfwPause.tickets.title', 'Active Tickets')}</h3>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{t('sfwPause.tickets.id', 'ID')}</th>
                <th>{t('sfwPause.tickets.status', 'Status')}</th>
                <th>{t('sfwPause.tickets.priority', 'Priority')}</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((tk, i) => (
                <tr key={i}>
                  <td className={styles.mono}>{tk.id}</td>
                  <td>
                    <span className={`${styles.badge} ${styles[`badge_${tk.status}`]}`}>
                      {t(`sfwPause.tickets.${tk.status}`, tk.status)}
                    </span>
                  </td>
                  <td>{'●'.repeat(tk.priority)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* ── Meetings ───────────────────────────── */}
        <section className={styles.card}>
          <h3 className={styles.cardTitle}>{t('sfwPause.meetings.title', 'Upcoming Meetings')}</h3>
          <div className={styles.meetingList}>
            {meetings.map((m, i) => (
              <div key={i} className={styles.meetingRow}>
                <span className={styles.meetingTime}>{m.time}</span>
                <span className={styles.meetingTitle}>{m.title}</span>
                <span className={styles.meetingRoom}>📍 {m.room}</span>
              </div>
            ))}
            {meetings.length === 0 && (
              <div className={styles.noData}>{t('sfwPause.meetings.noMeetings', 'No upcoming meetings')}</div>
            )}
          </div>
        </section>

        {/* ── Stock ticker ───────────────────────── */}
        <section className={styles.card}>
          <h3 className={styles.cardTitle}>{t('sfwPause.stocks.title', 'Market Watch')}</h3>
          <div className={styles.stockGrid}>
            {stocks.map(s => (
              <div key={s.ticker} className={styles.stockRow}>
                <span className={styles.stockTicker}>{s.ticker}</span>
                <span className={styles.stockPrice}>${s.price.toFixed(2)}</span>
                <span className={`${styles.stockChange} ${s.change >= 0 ? styles.positive : styles.negative}`}>
                  {fmtPct(s.change)}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* ── Footer ────────────────────────────────── */}
      <footer className={styles.footer}>
        <span>© {clock.getFullYear()} Enterprise Corp. — {t('sfwPause.footer', 'Internal Use Only — Confidential')}</span>
        <span className={styles.footerHint}>
          {t('sfwPause.dismissHint', 'Press ESC or F9 to return')}
        </span>
      </footer>
    </div>
  )
}
