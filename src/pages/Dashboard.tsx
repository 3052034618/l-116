import { useMemo, useState } from "react"
import { useStore } from "@/store/useStore"
import { cn } from "@/lib/utils"
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts"
import { TrendingUp, TrendingDown, Leaf, Activity, Target, Building2 } from "lucide-react"

const MONTHS = ["01","02","03","04","05","06","07","08","09","10","11","12"].map(m => `2025-${m}`)
const MONTH_LABELS = ["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"]

const ENERGY_COLORS = {
  electricity: "#0D7377",
  water: "#2ECC71",
  gas: "#E8863A",
  vehicleMileage: "#8B5CF6",
  purchasedSteam: "#EC4899",
}
const ENERGY_NAMES: Record<string, string> = {
  electricityCO2: "电力",
  waterCO2: "水",
  gasCO2: "燃气",
  vehicleCO2: "交通",
  steamCO2: "蒸汽",
}
const ENERGY_KEYS = ["electricityCO2","waterCO2","gasCO2","vehicleCO2","steamCO2"] as const

export default function Dashboard() {
  const { buildings, emissionRecords, measures, annualTargets, selectedBuildingId, setSelectedBuilding } = useStore()
  const [buildingId, setBuildingId] = useState<string | null>(selectedBuildingId)

  const handleBuildingChange = (id: string) => {
    const newId = id === "all" ? null : id
    setBuildingId(newId)
    setSelectedBuilding(newId)
  }

  const filteredRecords = useMemo(() => {
    if (!buildingId) return emissionRecords
    return emissionRecords.filter(r => r.buildingId === buildingId)
  }, [emissionRecords, buildingId])

  const trendData = useMemo(() => {
    return MONTHS.map((month, i) => {
      const monthRecords = filteredRecords.filter(r => r.month === month)
      const total = monthRecords.reduce((s, r) => s + r.totalCO2, 0) / 1000
      return {
        month: MONTH_LABELS[i],
        排放量: +total.toFixed(2),
      }
    })
  }, [filteredRecords])

  const energyData = useMemo(() => {
    const sums = { electricityCO2: 0, waterCO2: 0, gasCO2: 0, vehicleCO2: 0, steamCO2: 0 }
    filteredRecords.forEach(r => {
      sums.electricityCO2 += r.electricityCO2
      sums.waterCO2 += r.waterCO2
      sums.gasCO2 += r.gasCO2
      sums.vehicleCO2 += r.vehicleCO2
      sums.steamCO2 += r.steamCO2
    })
    const total = Object.values(sums).reduce((a, b) => a + b, 0)
    const colorKeys: Record<string, string> = {
      electricityCO2: ENERGY_COLORS.electricity,
      waterCO2: ENERGY_COLORS.water,
      gasCO2: ENERGY_COLORS.gas,
      vehicleCO2: ENERGY_COLORS.vehicleMileage,
      steamCO2: ENERGY_COLORS.purchasedSteam,
    }
    return ENERGY_KEYS.map(key => ({
      name: ENERGY_NAMES[key],
      value: +(sums[key] / 1000).toFixed(2),
      percent: total > 0 ? ((sums[key] / total) * 100).toFixed(1) : "0.0",
      fill: colorKeys[key],
    }))
  }, [filteredRecords])

  const totalEmission = useMemo(
    () => filteredRecords.filter(r => r.month.startsWith("2025")).reduce((s, r) => s + r.totalCO2, 0) / 1000,
    [filteredRecords]
  )

  const targetValue = useMemo(() => {
    const yearTargets = annualTargets.filter(t => t.year === 2025)
    if (buildingId) {
      return yearTargets.filter(t => t.buildingId === buildingId).reduce((s, t) => s + t.targetCO2, 0)
    }
    return yearTargets.reduce((s, t) => s + t.targetCO2, 0)
  }, [annualTargets, buildingId])

  const progressPercent = targetValue > 0 ? Math.min(100, (totalEmission / targetValue) * 100) : 0
  const gap = targetValue - totalEmission

  const lastMonth = filteredRecords.filter(r => r.month === "2025-12").reduce((s, r) => s + r.totalCO2, 0)
  const prevMonth = filteredRecords.filter(r => r.month === "2025-11").reduce((s, r) => s + r.totalCO2, 0)
  const momChange = prevMonth > 0 ? ((lastMonth - prevMonth) / prevMonth) * 100 : 0

  const buildingRank = useMemo(() => {
    const buildingTotals = buildings.map(b => {
      const bTotal = emissionRecords
        .filter(r => r.buildingId === b.id && r.month === "2025-12")
        .reduce((s, r) => s + r.totalCO2, 0) / 1000
      const prevTotal = emissionRecords
        .filter(r => r.buildingId === b.id && r.month === "2025-11")
        .reduce((s, r) => s + r.totalCO2, 0) / 1000
      const change = prevTotal > 0 ? ((bTotal - prevTotal) / prevTotal) * 100 : 0
      return { ...b, total: +bTotal.toFixed(2), change: +change.toFixed(1) }
    })
    return buildingTotals.sort((a, b) => b.total - a.total)
  }, [buildings, emissionRecords])

  const filteredMeasures = useMemo(() => {
    if (!buildingId) return measures
    return measures.filter(m => m.buildingId === buildingId)
  }, [measures, buildingId])

  const measureStats = useMemo(() => {
    const count = filteredMeasures.length
    const executing = filteredMeasures.filter(m => m.status === "executing").length
    const completed = filteredMeasures.filter(m => m.status === "completed").length
    const estimated = filteredMeasures.reduce((s, m) => s + m.estimatedReduction, 0)
    const actual = filteredMeasures.reduce((s, m) => s + m.actualReduction, 0)
    return { count, executing, completed, estimated, actual }
  }, [filteredMeasures])

  const circumference = 2 * Math.PI * 80
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-ink tracking-tight">总览</h1>
          <p className="text-sm text-ink-muted mt-1">实时监控园区碳排放态势 · {new Date().toLocaleDateString("zh-CN")}</p>
        </div>
        <div className="flex items-center gap-3">
          <Building2 size={18} className="text-ink-muted" />
          <select
            value={buildingId ?? "all"}
            onChange={(e) => handleBuildingChange(e.target.value)}
            className="select-field w-52"
          >
            <option value="all">全部楼宇</option>
            {buildings.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="card relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/5 rounded-full -mr-8 -mt-8" />
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-ink-secondary">2025年度总排放</p>
              <p className="stat-value text-teal-600 mt-2">{totalEmission.toFixed(1)}<span className="text-base font-normal text-ink-muted ml-1">吨</span></p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-teal-500/10 flex items-center justify-center">
              <Leaf size={22} className="text-teal-600" />
            </div>
          </div>
        </div>

        <div className="card relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -mr-8 -mt-8" />
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-ink-secondary">月度环比变化</p>
              <p className={cn("stat-value mt-2 flex items-center gap-1",
                momChange <= 0 ? "text-emerald-600" : "text-red-500")}>
                {momChange <= 0 ? <TrendingDown size={22} /> : <TrendingUp size={22} />}
                {Math.abs(momChange).toFixed(1)}<span className="text-base font-normal text-ink-muted ml-1">%</span>
              </p>
            </div>
            <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center",
              momChange <= 0 ? "bg-emerald-500/10" : "bg-red-500/10")}>
              <Activity size={22} className={momChange <= 0 ? "text-emerald-600" : "text-red-500"} />
            </div>
          </div>
        </div>

        <div className="card relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 rounded-full -mr-8 -mt-8" />
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-ink-secondary">节能措施</p>
              <p className="stat-value text-accent mt-2">{measureStats.count}<span className="text-base font-normal text-ink-muted ml-1">项</span></p>
              <p className="text-xs text-ink-muted mt-1">执行中 {measureStats.executing} · 已完成 {measureStats.completed}</p>
              <div className="flex gap-3 mt-2 text-xs">
                <span className="text-ink-secondary">预计: <span className="text-ink font-medium">{measureStats.estimated} 吨</span></span>
                <span className="text-ink-secondary">实际: <span className="text-teal-600 font-medium">{measureStats.actual} 吨</span></span>
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-accent/10 flex items-center justify-center">
              <Activity size={22} className="text-accent" />
            </div>
          </div>
        </div>

        <div className="card relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full -mr-8 -mt-8" />
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-ink-secondary">目标完成率</p>
              <p className="stat-value text-purple-600 mt-2">{progressPercent.toFixed(1)}<span className="text-base font-normal text-ink-muted ml-1">%</span></p>
              <p className="text-xs text-ink-muted mt-1">
                {gap > 0 ? `剩余额度 ${gap.toFixed(1)} 吨` : `已超 ${Math.abs(gap).toFixed(1)} 吨`}
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <Target size={22} className="text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-serif text-lg font-semibold text-ink">月度排放趋势</h2>
            <span className="text-xs text-ink-muted">单位：吨 CO₂</span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={trendData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorEmission" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0D7377" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#0D7377" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F7" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#8B95A5" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#8B95A5" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", fontSize: 13 }}
                formatter={(value: number) => [`${value} 吨`, "排放量"]}
              />
              <Area
                type="monotone"
                dataKey="排放量"
                stroke="#0D7377"
                strokeWidth={2.5}
                fill="url(#colorEmission)"
                dot={{ fill: "#0D7377", r: 3, strokeWidth: 2, stroke: "#fff" }}
                activeDot={{ r: 6, fill: "#0D7377", strokeWidth: 2, stroke: "#fff" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-serif text-lg font-semibold text-ink">能耗结构占比</h2>
          </div>
          <div className="relative">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={energyData}
                  cx="50%" cy="48%"
                  innerRadius={55} outerRadius={85}
                  paddingAngle={2}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {energyData.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", fontSize: 13 }}
                  formatter={(value: number, name: string) => [`${value} 吨`, name]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ paddingBottom: "12%" }}>
              <div className="text-center">
                <p className="text-xs text-ink-muted">总排放</p>
                <p className="text-xl font-serif font-bold text-ink">
                  {energyData.reduce((s, d) => s + d.value, 0).toFixed(1)}
                </p>
                <p className="text-xs text-ink-muted">吨 CO₂</p>
              </div>
            </div>
          </div>
          <div className="mt-2 space-y-2">
            {energyData.map(d => (
              <div key={d.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ background: d.fill }} />
                  <span className="text-ink-secondary">{d.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-ink font-medium">{d.value} 吨</span>
                  <span className="text-ink-muted w-12 text-right">{d.percent}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-lg font-semibold text-ink">年度目标差距</h2>
          </div>
          <div className="flex flex-col items-center py-2">
            <svg width="220" height="130" viewBox="0 0 220 130">
              <circle
                cx="110" cy="110" r="80"
                fill="none"
                stroke="#EEF2F7"
                strokeWidth="14"
                strokeDasharray={`${circumference / 2} ${circumference}`}
                strokeLinecap="round"
                transform="rotate(180 110 110)"
              />
              <circle
                cx="110" cy="110" r="80"
                fill="none"
                stroke="#0D7377"
                strokeWidth="14"
                strokeDasharray={`${circumference / 2} ${circumference}`}
                strokeDashoffset={-strokeDashoffset / 2}
                strokeLinecap="round"
                transform="rotate(180 110 110)"
                style={{ transition: "stroke-dashoffset 0.8s ease" }}
              />
              <text x="110" y="95" textAnchor="middle" className="fill-ink" style={{ fontSize: 32, fontWeight: 700, fontFamily: "'Noto Serif SC', serif" }}>
                {progressPercent.toFixed(0)}%
              </text>
              <text x="110" y="118" textAnchor="middle" className="fill-ink-muted" style={{ fontSize: 12 }}>
                排放 / 目标
              </text>
            </svg>
            <div className="w-full mt-4 grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-xs text-ink-muted">年度目标</p>
                <p className="text-lg font-semibold text-ink">{targetValue.toFixed(0)}<span className="text-xs text-ink-muted font-normal ml-1">吨</span></p>
              </div>
              <div>
                <p className="text-xs text-ink-muted">已排放</p>
                <p className={cn("text-lg font-semibold", gap < 0 ? "text-red-500" : "text-teal-600")}>
                  {totalEmission.toFixed(0)}<span className="text-xs font-normal ml-1 opacity-70">吨</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-lg font-semibold text-ink">楼宇月度排放排名</h2>
            <span className="text-xs text-ink-muted">2025年12月 · 单位：吨 CO₂</span>
          </div>
          <div className="space-y-3">
            {buildingRank.map((b, i) => {
              const maxTotal = buildingRank[0]?.total || 1
              const percent = (b.total / maxTotal) * 100
              return (
                <div key={b.id} className="group">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        "w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold",
                        i === 0 ? "bg-accent text-white" :
                        i === 1 ? "bg-teal-500/80 text-white" :
                        i === 2 ? "bg-purple-500/80 text-white" :
                        "bg-gray-100 text-ink-muted"
                      )}>{i + 1}</span>
                      <span className="text-sm font-medium text-ink">{b.name}</span>
                      <span className="text-xs text-ink-muted">{b.department}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-ink tabular-nums">{b.total.toFixed(2)}</span>
                      <span className={cn(
                        "text-xs font-medium flex items-center gap-0.5",
                        b.change <= 0 ? "text-emerald-600" : "text-red-500"
                      )}>
                        {b.change <= 0 ? "↓" : "↑"} {Math.abs(b.change)}%
                      </span>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-50 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-teal-500 to-teal-400 transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
