import { useMemo, useState } from "react"
import { useStore } from "@/store/useStore"
import { cn } from "@/lib/utils"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  LineChart, Line
} from "recharts"
import { Building2, Users, TrendingUp, CheckCircle2, AlertTriangle, Calendar } from "lucide-react"

const YEARS = [2024, 2025, 2026]
const MONTH_LABELS = ["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"]

export default function Targets() {
  const { buildings, emissionRecords, annualTargets } = useStore()
  const [selectedYear, setSelectedYear] = useState(2025)

  const yearTargets = useMemo(() => {
    return annualTargets.filter(t => t.year === selectedYear)
  }, [annualTargets, selectedYear])

  const buildingComparison = useMemo(() => {
    return buildings.map(b => {
      const target = yearTargets.find(t => t.buildingId === b.id)?.targetCO2 ?? 0
      const actual = emissionRecords
        .filter(r => r.buildingId === b.id && r.month.startsWith(String(selectedYear)))
        .reduce((s, r) => s + r.totalCO2, 0) / 1000
      const rate = target > 0 ? (actual / target) * 100 : 0
      const status = rate <= 85 ? "good" : rate <= 100 ? "warning" : "danger"
      return {
        id: b.id,
        name: b.name.slice(3),
        目标值: +target.toFixed(1),
        实际排放: +actual.toFixed(1),
        进度: +rate.toFixed(1),
        status,
        department: b.department,
      }
    })
  }, [buildings, yearTargets, emissionRecords, selectedYear])

  const departmentProgress = useMemo(() => {
    const deptMap = new Map<string, { target: number; actual: number }>()
    buildings.forEach(b => {
      const target = yearTargets.find(t => t.buildingId === b.id)?.targetCO2 ?? 0
      const actual = emissionRecords
        .filter(r => r.buildingId === b.id && r.month.startsWith(String(selectedYear)))
        .reduce((s, r) => s + r.totalCO2, 0) / 1000
      const existing = deptMap.get(b.department) ?? { target: 0, actual: 0 }
      deptMap.set(b.department, { target: existing.target + target, actual: existing.actual + actual })
    })
    return Array.from(deptMap.entries()).map(([name, d]) => {
      const percent = d.target > 0 ? Math.min(100, (1 - d.actual / d.target) * 100) : 0
      return {
        name,
        target: +d.target.toFixed(1),
        actual: +d.actual.toFixed(1),
        percent: +percent.toFixed(1),
      }
    }).sort((a, b) => b.percent - a.percent)
  }, [buildings, yearTargets, emissionRecords, selectedYear])

  const trendData = useMemo(() => {
    return MONTH_LABELS.map((m, i) => {
      const month = String(i + 1).padStart(2, "0")
      const actual2025 = emissionRecords
        .filter(r => r.month === `2025-${month}`)
        .reduce((s, r) => s + r.totalCO2, 0) / 1000
      const actual2026 = emissionRecords
        .filter(r => r.month === `2026-${month}`)
        .reduce((s, r) => s + r.totalCO2, 0) / 1000
      const actual2024 = actual2025 * 1.08
      const result: Record<string, string | number> = { month: m }
      if (selectedYear >= 2024) result["2024年"] = +actual2024.toFixed(1)
      if (selectedYear >= 2025) result["2025年"] = +actual2025.toFixed(1)
      if (selectedYear >= 2026) result["2026年"] = +actual2026.toFixed(1)
      return result
    })
  }, [emissionRecords, selectedYear])

  const yearSummary = useMemo(() => {
    const totalTarget = buildingComparison.reduce((s, b) => s + b.目标值, 0)
    const totalActual = buildingComparison.reduce((s, b) => s + b.实际排放, 0)
    const progress = totalTarget > 0 ? (totalActual / totalTarget) * 100 : 0
    const onTrack = buildingComparison.filter(b => b.进度 <= 100).length
    return {
      totalTarget: +totalTarget.toFixed(1),
      totalActual: +totalActual.toFixed(1),
      progress: +progress.toFixed(1),
      onTrack,
      total: buildings.length,
      gap: +(totalTarget - totalActual).toFixed(1),
    }
  }, [buildingComparison, buildings])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-ink tracking-tight">目标看板</h1>
          <p className="text-sm text-ink-muted mt-1">多维度对比各楼宇、部门年度目标完成进度</p>
        </div>
        <div className="flex items-center gap-3">
          <Calendar size={18} className="text-ink-muted" />
          <select
            value={selectedYear}
            onChange={e => setSelectedYear(Number(e.target.value))}
            className="select-field w-36"
          >
            {YEARS.map(y => <option key={y} value={y}>{y}年度</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-transparent pointer-events-none" />
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-ink-secondary">年度总目标</p>
              <p className="stat-value text-teal-600 mt-2">{yearSummary.totalTarget}<span className="text-base font-normal text-ink-muted ml-1">吨</span></p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-teal-500/10 flex items-center justify-center">
              <TargetSvg />
            </div>
          </div>
        </div>
        <div className="card relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent pointer-events-none" />
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-ink-secondary">累计排放</p>
              <p className={cn("stat-value mt-2",
                yearSummary.progress > 100 ? "text-red-500" : "text-accent")}>
                {yearSummary.totalActual}<span className="text-base font-normal text-ink-muted ml-1">吨</span>
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-accent/10 flex items-center justify-center">
              <Building2 size={22} className="text-accent" />
            </div>
          </div>
        </div>
        <div className="card relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent pointer-events-none" />
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-ink-secondary">目标进度</p>
              <p className={cn("stat-value mt-2",
                yearSummary.progress > 100 ? "text-red-500" : "text-purple-600")}>
                {yearSummary.progress}<span className="text-base font-normal text-ink-muted ml-1">%</span>
              </p>
              <p className="text-xs text-ink-muted mt-1">
                {yearSummary.gap > 0 ? `剩余额度 ${yearSummary.gap} 吨` : `已超 ${Math.abs(yearSummary.gap)} 吨`}
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <TrendingUp size={22} className="text-purple-600" />
            </div>
          </div>
        </div>
        <div className="card relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-ink-secondary">达标楼宇</p>
              <p className="stat-value text-emerald-600 mt-2">{yearSummary.onTrack}<span className="text-base font-normal text-ink-muted ml-1">/ {yearSummary.total}</span></p>
              <p className="text-xs text-ink-muted mt-1">
                {yearSummary.onTrack === yearSummary.total ? "全部按计划推进" : `${yearSummary.total - yearSummary.onTrack} 栋需关注`}
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 size={22} className="text-emerald-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-serif text-lg font-semibold text-ink">楼宇目标 vs 实际排放</h2>
              <p className="text-xs text-ink-muted mt-0.5">各楼宇 {selectedYear} 年度排放目标与实际对比</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-teal-500" />
                <span className="text-ink-secondary">目标值</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-accent" />
                <span className="text-ink-secondary">实际排放</span>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={buildingComparison} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F7" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#8B95A5" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#8B95A5" }} axisLine={false} tickLine={false} label={{ value: "吨CO₂", angle: -90, position: "insideLeft", fill: "#8B95A5", fontSize: 12 }} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", fontSize: 13 }}
                formatter={(value: number, name: string) => [`${value} 吨`, name]}
              />
              <Bar dataKey="目标值" fill="#0D7377" radius={[6, 6, 0, 0]} barSize={28} />
              <Bar dataKey="实际排放" fill="#E8863A" radius={[6, 6, 0, 0]} barSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-serif text-lg font-semibold text-ink">楼宇达标情况</h2>
            </div>
            <Users size={18} className="text-ink-muted" />
          </div>
          <div className="space-y-4">
            {buildingComparison.map(b => (
              <div key={b.id} className="pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "w-2 h-2 rounded-full",
                      b.status === "good" ? "bg-emerald-500" :
                      b.status === "warning" ? "bg-amber-500" : "bg-red-500"
                    )} />
                    <span className="text-sm font-medium text-ink">{b.name}</span>
                    <span className="text-[11px] text-ink-muted">{b.department}</span>
                  </div>
                  <span className={cn(
                    "text-xs font-semibold",
                    b.status === "good" ? "text-emerald-600" :
                    b.status === "warning" ? "text-amber-600" : "text-red-500"
                  )}>
                    {b.进度}%
                  </span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden relative">
                  <div
                    className="h-full absolute top-0 left-0 bg-gray-200/50 rounded-full"
                    style={{ width: "100%" }}
                  />
                  <div
                    className={cn(
                      "h-full rounded-full absolute top-0 left-0 transition-all",
                      b.status === "good" ? "bg-emerald-500" :
                      b.status === "warning" ? "bg-amber-500" : "bg-red-500"
                    )}
                    style={{ width: `${Math.min(110, b.进度)}%` }}
                  />
                  <div className="absolute top-0 h-full w-px bg-ink-muted/50" style={{ left: "100%" }} />
                </div>
                <div className="flex justify-between mt-1 text-[11px] text-ink-muted">
                  <span>排放 {b.实际排放} 吨</span>
                  <span>目标 {b.目标值} 吨</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-serif text-lg font-semibold text-ink">排放趋势对比</h2>
              <p className="text-xs text-ink-muted mt-0.5">多年份月度排放对比（含2024年模拟数据）</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={trendData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F7" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#8B95A5" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#8B95A5" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", fontSize: 13 }}
                formatter={(value: number, name: string) => [`${value} 吨`, name]}
              />
              <Legend iconType="circle" wrapperStyle={{ paddingTop: 10, fontSize: 12 }} />
              {selectedYear >= 2024 && (
                <Line type="monotone" dataKey="2024年" stroke="#8B95A5" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3, fill: "#fff", strokeWidth: 2 }} />
              )}
              {selectedYear >= 2025 && (
                <Line type="monotone" dataKey="2025年" stroke="#0D7377" strokeWidth={2.5} dot={{ r: 4, fill: "#0D7377", strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 6 }} />
              )}
              {selectedYear >= 2026 && (
                <Line type="monotone" dataKey="2026年" stroke="#E8863A" strokeWidth={2.5} dot={{ r: 4, fill: "#E8863A", strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 6 }} />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-serif text-lg font-semibold text-ink">部门减排进度</h2>
              <p className="text-xs text-ink-muted mt-0.5">按部门汇总完成率</p>
            </div>
            <AlertTriangle size={18} className={cn(
              departmentProgress.some(d => d.percent < 0) ? "text-red-500" : "text-emerald-500"
            )} />
          </div>
          <div className="space-y-4">
            {departmentProgress.map((d, i) => (
              <div key={d.name}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-ink">{d.name}</span>
                  <span className={cn(
                    "text-sm font-semibold tabular-nums",
                    d.percent >= 20 ? "text-emerald-600" :
                    d.percent >= 10 ? "text-amber-600" : "text-red-500"
                  )}>
                    {d.percent >= 0 ? `${d.percent}%` : `超标 ${Math.abs(d.percent)}%`}
                  </span>
                </div>
                <div className="h-7 bg-gray-50 rounded-lg relative overflow-hidden flex items-center px-3">
                  <div
                    className={cn(
                      "h-5 rounded-md absolute top-1 left-1 transition-all",
                      d.percent >= 20 ? "bg-emerald-500/80" :
                      d.percent >= 10 ? "bg-amber-500/80" : "bg-red-500/80"
                    )}
                    style={{ width: `${Math.max(5, Math.min(97, d.percent + 15))}%` }}
                  />
                  <span className="relative z-10 text-[11px] font-medium text-ink-secondary mix-blend-multiply">
                    排放 {d.actual.toFixed(0)} / 目标 {d.target.toFixed(0)} 吨
                  </span>
                </div>
                <div className="text-[11px] text-ink-muted mt-1 flex justify-between">
                  <span>排名 #{i + 1}</span>
                  <span>
                    {d.percent >= 15 ? "进展良好" : d.percent >= 5 ? "需加快推进" : "需重点关注"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function TargetSvg() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-teal-600">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  )
}
