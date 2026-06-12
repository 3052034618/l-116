import { useState, useMemo, useRef } from "react"
import { useStore } from "@/store/useStore"
import { cn } from "@/lib/utils"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"
import * as XLSX from "xlsx"
import {
  FileDown, FileText, AlertCircle, CheckSquare, Calendar, TrendingDown, TrendingUp,
  AlertTriangle, Clock, Database, Check, ChevronDown
} from "lucide-react"
import type { AnomalyItem, TodoItem, EmissionRecord } from "@/types"

const YEARS = [2024, 2025, 2026]
const QUARTERS = [1, 2, 3, 4]
const QUARTER_MONTHS: Record<number, number[]> = { 1: [1, 2, 3], 2: [4, 5, 6], 3: [7, 8, 9], 4: [10, 11, 12] }
const SEVERITY_DOT = { high: "bg-red-500", medium: "bg-amber-500", low: "bg-blue-500" }
const SEVERITY_TEXT = { high: "text-red-700 bg-red-50", medium: "text-amber-700 bg-amber-50", low: "text-blue-700 bg-blue-50" }
const SEVERITY_LABEL = { high: "高", medium: "中", low: "低" }
const TYPE_BADGE = { overdue_measure: "bg-red-100 text-red-700", expiring_project: "bg-amber-100 text-amber-700", missing_data: "bg-blue-100 text-blue-700" }
const TYPE_LABEL = { overdue_measure: "逾期措施", expiring_project: "即将到期", missing_data: "数据缺失" }

export default function Reports() {
  const { buildings, emissionRecords, measures, annualTargets, todoStatuses, setTodoStatus } = useStore()
  const [year, setYear] = useState(2025)
  const [quarter, setQuarter] = useState(4)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const reportRef = useRef<HTMLDivElement>(null)

  const buildingMap = useMemo(() => {
    const m = new Map<string, string>()
    buildings.forEach(b => m.set(b.id, b.name))
    return m
  }, [buildings])

  const quarterRecords = useMemo(() => {
    const months = QUARTER_MONTHS[quarter].map(m => `${year}-${String(m).padStart(2, "0")}`)
    return emissionRecords.filter(r => months.includes(r.month))
  }, [emissionRecords, year, quarter])

  const quarterlyTotal = useMemo(
    () => +(quarterRecords.reduce((s, r) => s + r.totalCO2, 0) / 1000).toFixed(2),
    [quarterRecords]
  )

  const prevQuarterTotal = useMemo(() => {
    const [prevQ, prevY] = quarter === 1 ? [4, year - 1] : [quarter - 1, year]
    const months = QUARTER_MONTHS[prevQ].map(m => `${prevY}-${String(m).padStart(2, "0")}`)
    return emissionRecords.filter(r => months.includes(r.month)).reduce((s, r) => s + r.totalCO2, 0) / 1000
  }, [emissionRecords, year, quarter])

  const qoqChange = prevQuarterTotal > 0
    ? +(((quarterlyTotal - prevQuarterTotal) / prevQuarterTotal) * 100).toFixed(1)
    : 0

  const yoyTotal = useMemo(() => {
    const months = QUARTER_MONTHS[quarter].map(m => `${year - 1}-${String(m).padStart(2, "0")}`)
    return emissionRecords.filter(r => months.includes(r.month)).reduce((s, r) => s + r.totalCO2, 0) / 1000
  }, [emissionRecords, year, quarter])

  const yoyChange = yoyTotal > 0
    ? +(((quarterlyTotal - yoyTotal) / yoyTotal) * 100).toFixed(1)
    : 0

  const quarterMeasures = useMemo(() => {
    const startMonth = `${year}-${String(QUARTER_MONTHS[quarter][0]).padStart(2, "0")}`
    const endMonth = `${year}-${String(QUARTER_MONTHS[quarter][2]).padStart(2, "0")}-31`
    return measures.filter(m => {
      return m.startDate <= endMonth && m.endDate >= `${startMonth}-01`
    })
  }, [measures, year, quarter])

  const completedQ = quarterMeasures.filter(m => m.status === "completed").length
  const totalActualQ = quarterMeasures.reduce((s, m) => s + m.actualReduction, 0)
  const totalBudgetQ = quarterMeasures.reduce((s, m) => s + m.budget, 0)

  const anomalies = useMemo<AnomalyItem[]>(() => {
    const list: AnomalyItem[] = []
    const months = QUARTER_MONTHS[quarter].map(m => `${year}-${String(m).padStart(2, "0")}`)
    buildings.forEach(b => {
      const bRecords = months
        .map(month => quarterRecords.find(r => r.month === month && r.buildingId === b.id))
        .filter(Boolean) as EmissionRecord[]
      if (bRecords.length < 2) return
      for (let i = 1; i < bRecords.length; i++) {
        const prev = bRecords[i - 1].totalCO2
        const curr = bRecords[i].totalCO2
        const diff = prev > 0 ? ((curr - prev) / prev) * 100 : 0
        if (diff > 10) {
          list.push({
            id: `anom-${b.id}-${bRecords[i].month}`,
            month: bRecords[i].month,
            buildingName: b.name,
            description: `${bRecords[i].month}月${b.name.slice(3)}排放较上月上涨${diff.toFixed(1)}%，超出正常波动范围`,
            severity: diff > 18 ? "high" : diff > 14 ? "medium" : "low",
          })
        }
      }
    })
    return list.sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 }
      return order[a.severity] - order[b.severity]
    })
  }, [buildings, quarterRecords, year, quarter])

  const todos = useMemo<TodoItem[]>(() => {
    const list: TodoItem[] = []
    const today = `${year}-${String(quarter * 3).padStart(2, "0")}-28`
    const todayDate = new Date(today)
    const quarterEnd = new Date(year, quarter * 3, 0)

    measures.forEach(m => {
      if (m.status !== "completed" && new Date(m.endDate) < todayDate) {
        list.push({
          id: `todo-overdue-${m.id}`,
          title: `措施到期未完成：${m.name}（责任人：${m.responsiblePerson || "未指定"}）`,
          type: "overdue_measure",
          dueDate: m.endDate,
          status: todoStatuses[`todo-overdue-${m.id}`] === "done" ? "done" : "pending",
        })
      }
    })

    measures.forEach(m => {
      const endD = new Date(m.endDate)
      const diffDays = Math.ceil((endD.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24))
      if (m.status !== "completed" && diffDays > 0 && diffDays <= 45) {
        list.push({
          id: `todo-expiring-${m.id}`,
          title: `措施即将到期：${m.name}（预计减排 ${m.estimatedReduction} 吨，剩余 ${diffDays} 天）`,
          type: "expiring_project",
          dueDate: m.endDate,
          status: todoStatuses[`todo-expiring-${m.id}`] === "done" ? "done" : "pending",
        })
      }
    })

    const months = QUARTER_MONTHS[quarter].map(m => `${year}-${String(m).padStart(2, "0")}`)
    buildings.forEach(b => {
      months.forEach(month => {
        const has = emissionRecords.some(r => r.month === month && r.buildingId === b.id)
        const monthDate = new Date(`${month}-01`)
        if (!has && monthDate <= quarterEnd) {
          list.push({
            id: `todo-missing-${b.id}-${month}`,
            title: `数据缺失：${b.name} ${month} 月排放数据尚未录入`,
            type: "missing_data",
            dueDate: `${month}-05`,
            status: todoStatuses[`todo-missing-${b.id}-${month}`] === "done" ? "done" : "pending",
          })
        }
      })
    })

    const typeOrder = { overdue_measure: 0, missing_data: 1, expiring_project: 2 }
    return list.sort((a, b) => typeOrder[a.type] - typeOrder[b.type])
  }, [measures, emissionRecords, buildings, year, quarter, todoStatuses])

  const toggleTodo = (id: string) => {
    const current = todoStatuses[id] ?? "pending"
    setTodoStatus(id, current === "done" ? "pending" : "done")
  }

  const buildingBreakdown = useMemo(() => {
    return buildings.map(b => {
      const total = quarterRecords
        .filter(r => r.buildingId === b.id)
        .reduce((s, r) => s + r.totalCO2, 0) / 1000
      const target = annualTargets
        .filter(t => t.year === year && t.buildingId === b.id)
        .reduce((s, t) => s + t.targetCO2, 0) / 4
      return {
        name: b.name,
        total: +total.toFixed(2),
        target: +target.toFixed(2),
        ratio: target > 0 ? ((total / target) * 100).toFixed(1) : "-",
      }
    }).sort((a, b) => b.total - a.total)
  }, [buildings, quarterRecords, annualTargets, year])

  const exportPDF = async () => {
    if (!reportRef.current) return
    setShowExportMenu(false)
    const canvas = await html2canvas(reportRef.current, { scale: 2, useCORS: true, backgroundColor: "#ffffff" })
    const imgData = canvas.toDataURL("image/png")
    const pdf = new jsPDF("p", "mm", "a4")
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width
    let heightLeft = pdfHeight
    let position = 0
    pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight)
    heightLeft -= 297
    while (heightLeft >= 0) {
      position = heightLeft - pdfHeight
      pdf.addPage()
      pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight)
      heightLeft -= 297
    }
    pdf.save(`${year}年Q${quarter}-碳排放季度报告.pdf`)
  }

  const exportExcel = () => {
    setShowExportMenu(false)
    const summary: (string | number)[][] = [
      [`${year}年Q${quarter} 碳排放季度报告`],
      ["生成时间", new Date().toLocaleString("zh-CN")],
      [],
      ["季度概要"],
      ["季度排放总量(吨CO₂)", quarterlyTotal],
      ["环比变化(%)", qoqChange],
      ["同比变化(%)", yoyChange],
      [`本季度措施(共${quarterMeasures.length}项)`],
      ["已完成措施", completedQ],
      ["措施实际减排(吨CO₂)", totalActualQ],
      ["措施投入预算(元)", totalBudgetQ.toLocaleString()],
      [],
      ["各楼宇季度排放明细"],
      ["楼宇", "排放(吨CO₂)", "季度目标(吨CO₂)", "目标占比(%)"],
      ...buildingBreakdown.map(b => [b.name, b.total, b.target, b.ratio]),
      [],
      ["异常说明"],
      anomalies.length ? ["严重度", "月份", "楼宇", "描述"] : ["本季度无异常"],
      ...anomalies.map(a => [SEVERITY_LABEL[a.severity], a.month, a.buildingName, a.description]),
      [],
      ["待办清单"],
      todos.length ? ["状态", "类型", "事项", "截止日期"] : ["本季度无待办"],
      ...todos.map(t => [
        todoStatuses[t.id] === "done" ? "已完成" : "待处理",
        TYPE_LABEL[t.type],
        t.title,
        t.dueDate,
      ]),
    ]
    const ws = XLSX.utils.aoa_to_sheet(summary)
    ws["!cols"] = [{ wch: 40 }, { wch: 20 }, { wch: 20 }, { wch: 18 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "季度报告")
    XLSX.writeFile(wb, `${year}年Q${quarter}-碳排放季度报告.xlsx`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-ink tracking-tight">报告</h1>
          <p className="text-sm text-ink-muted mt-1">季度碳排放综合报告，支持导出给管理层审阅</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white rounded-xl border border-gray-100 p-1">
            <select value={year} onChange={e => setYear(Number(e.target.value))} className="select-field border-0 shadow-none w-28 py-1.5">
              {YEARS.map(y => <option key={y} value={y}>{y}年</option>)}
            </select>
            <select value={quarter} onChange={e => setQuarter(Number(e.target.value))} className="select-field border-0 shadow-none w-24 py-1.5">
              {QUARTERS.map(q => <option key={q} value={q}>Q{q}</option>)}
            </select>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="btn-primary inline-flex items-center gap-2"
            >
              <FileDown size={16} /> 导出报告 <ChevronDown size={14} />
            </button>
            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-20 animate-in fade-in slide-in-from-top-2">
                <button onClick={exportPDF} className="w-full px-4 py-2.5 text-sm text-ink hover:bg-gray-50 flex items-center gap-2 text-left">
                  <FileText size={16} className="text-red-500" /> 导出 PDF 文档
                </button>
                <button onClick={exportExcel} className="w-full px-4 py-2.5 text-sm text-ink hover:bg-gray-50 flex items-center gap-2 text-left border-t border-gray-50">
                  <FileDown size={16} className="text-emerald-600" /> 导出 Excel 表格
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div ref={reportRef} className="space-y-5 bg-white/60">
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-serif text-lg font-semibold text-ink flex items-center gap-2">
                <Calendar size={18} className="text-teal-600" />
                {year}年 第{quarter}季度 概要
              </h2>
              <p className="text-xs text-ink-muted mt-0.5">园区整体碳排放与措施进展汇总</p>
            </div>
            <span className="badge bg-teal-500/10 text-teal-600">
              {quarterlyTotal > 0 ? "已生成" : "待录入"}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-teal-50 to-white rounded-xl p-4 border border-teal-100">
              <p className="text-xs text-ink-secondary mb-1.5">季度排放总量</p>
              <p className="text-2xl font-serif font-bold text-teal-600 leading-tight">{quarterlyTotal.toFixed(2)}</p>
              <p className="text-[11px] text-ink-muted mt-0.5">吨 CO₂</p>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-white rounded-xl p-4 border border-emerald-100">
              <p className="text-xs text-ink-secondary mb-1.5">同比变化</p>
              <p className={cn("text-2xl font-serif font-bold leading-tight flex items-center gap-1",
                yoyChange <= 0 ? "text-emerald-600" : "text-red-500")}>
                {yoyChange <= 0 ? <TrendingDown size={20} /> : <TrendingUp size={20} />}
                {Math.abs(yoyChange)}%
              </p>
              <p className="text-[11px] text-ink-muted mt-0.5">
                去年同期 {yoyTotal.toFixed(1)} 吨
              </p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-white rounded-xl p-4 border border-purple-100">
              <p className="text-xs text-ink-secondary mb-1.5">环比变化</p>
              <p className={cn("text-2xl font-serif font-bold leading-tight flex items-center gap-1",
                qoqChange <= 0 ? "text-emerald-600" : "text-red-500")}>
                {qoqChange <= 0 ? <TrendingDown size={20} /> : <TrendingUp size={20} />}
                {Math.abs(qoqChange)}%
              </p>
              <p className="text-[11px] text-ink-muted mt-0.5">
                上季度 {prevQuarterTotal.toFixed(1)} 吨
              </p>
            </div>
            <div className="bg-gradient-to-br from-accent/5 to-white rounded-xl p-4 border border-accent/20">
              <p className="text-xs text-ink-secondary mb-1.5">本季度措施</p>
              <p className="text-2xl font-serif font-bold text-accent leading-tight">
                {completedQ} / {quarterMeasures.length}
              </p>
              <p className="text-[11px] text-ink-muted mt-0.5">
                实际减排 {totalActualQ} 吨 · ¥{(totalBudgetQ / 10000).toFixed(1)}万
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-ink mb-3">各楼宇季度排放</h3>
            <div className="overflow-hidden rounded-xl border border-gray-100">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50/80">
                    <th className="text-left px-4 py-2.5 font-medium text-ink-secondary text-xs">楼宇</th>
                    <th className="text-right px-4 py-2.5 font-medium text-ink-secondary text-xs">排放(吨)</th>
                    <th className="text-right px-4 py-2.5 font-medium text-ink-secondary text-xs">季度目标</th>
                    <th className="text-right px-4 py-2.5 font-medium text-ink-secondary text-xs">进度</th>
                    <th className="px-4 py-2.5 w-1/3 text-xs text-ink-secondary font-medium">状态</th>
                  </tr>
                </thead>
                <tbody>
                  {buildingBreakdown.map((b, i) => {
                    const ratioNum = Number(b.ratio) || 0
                    return (
                      <tr key={b.name} className={cn(i < buildingBreakdown.length - 1 && "border-b border-gray-50")}>
                        <td className="px-4 py-2.5 font-medium text-ink">{b.name}</td>
                        <td className="px-4 py-2.5 text-ink text-right tabular-nums font-semibold">{b.total}</td>
                        <td className="px-4 py-2.5 text-ink-secondary text-right tabular-nums">{b.target}</td>
                        <td className="px-4 py-2.5 text-right">
                          <span className={cn("text-xs font-semibold tabular-nums",
                            ratioNum <= 85 ? "text-emerald-600" : ratioNum <= 100 ? "text-amber-600" : "text-red-500")}>
                            {b.ratio}%
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={cn("h-full rounded-full transition-all",
                                ratioNum <= 85 ? "bg-emerald-500" : ratioNum <= 100 ? "bg-amber-500" : "bg-red-500")}
                              style={{ width: `${Math.min(100, ratioNum)}%` }}
                            />
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} className={cn(anomalies.length ? "text-amber-500" : "text-emerald-500")} />
              <h2 className="font-serif text-lg font-semibold text-ink">异常说明</h2>
              <span className="text-xs text-ink-muted">
                自动识别 {anomalies.filter(a => a.severity === "high").length} 项高危
              </span>
            </div>
            <span className="badge bg-gray-100 text-ink-secondary">
              共 {anomalies.length} 项
            </span>
          </div>
          {anomalies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-ink-muted">
              <Check size={40} className="text-emerald-500 mb-2" />
              <p className="text-sm">本季度未发现显著排放异常</p>
              <p className="text-xs mt-1">各项指标均在正常波动范围内</p>
            </div>
          ) : (
            <div className="space-y-3">
              {anomalies.map(a => (
                <div key={a.id} className="flex items-start gap-3 p-4 rounded-xl bg-gray-50/60 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col items-center gap-1 pt-0.5">
                    <span className={cn("w-3 h-3 rounded-full shrink-0", SEVERITY_DOT[a.severity])} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-2 mb-1">
                      <span className="text-sm font-semibold text-ink">{a.buildingName}</span>
                      <span className="text-xs text-ink-muted font-mono">{a.month}</span>
                      <span className={cn("badge text-[11px]", SEVERITY_TEXT[a.severity])}>
                        {SEVERITY_LABEL[a.severity]}风险
                      </span>
                    </div>
                    <p className="text-sm text-ink-secondary leading-relaxed">{a.description}</p>
                  </div>
                  <AlertCircle size={16} className="text-ink-muted mt-1 shrink-0" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <CheckSquare size={18} className="text-teal-600" />
              <h2 className="font-serif text-lg font-semibold text-ink">待办清单</h2>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="text-ink-muted">
                <span className="text-ink font-semibold">{todos.filter((t) => todoStatuses[t.id] === "done").length}</span>
                <span className="mx-1">/</span>
                <span>{todos.length}</span> 已完成
              </span>
              <span className="h-3.5 w-px bg-gray-200" />
              <div className="flex items-center gap-2">
                <Clock size={12} className="text-red-500" />
                <span className="text-red-600 font-medium">
                  {todos.filter(t => t.type === "overdue_measure" && todoStatuses[t.id] !== "done").length} 逾期
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Database size={12} className="text-blue-500" />
                <span className="text-blue-600 font-medium">
                  {todos.filter(t => t.type === "missing_data" && todoStatuses[t.id] !== "done").length} 缺数据
                </span>
              </div>
            </div>
          </div>

          {todos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-ink-muted">
              <Check size={40} className="text-emerald-500 mb-2" />
              <p className="text-sm">本季度无待办事项</p>
            </div>
          ) : (
            <div className="space-y-2">
              {todos.map(t => (
                <label
                  key={t.id}
                  className={cn(
                    "flex items-start gap-3 p-4 rounded-xl border transition-all cursor-pointer",
                    todoStatuses[t.id] === "done"
                      ? "bg-gray-50/50 border-gray-100"
                      : t.type === "overdue_measure"
                      ? "bg-red-50/60 border-red-100 hover:bg-red-50"
                      : t.type === "missing_data"
                      ? "bg-blue-50/60 border-blue-100 hover:bg-blue-50"
                      : "bg-amber-50/60 border-amber-100 hover:bg-amber-50"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={todoStatuses[t.id] === "done"}
                    onChange={() => toggleTodo(t.id)}
                    className="mt-0.5 w-4.5 h-4.5 rounded-md border-gray-300 text-teal-500 focus:ring-teal-400 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-sm leading-relaxed",
                      todoStatuses[t.id] === "done" ? "line-through text-ink-muted" : "text-ink"
                    )}>
                      {t.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className={cn("badge text-[11px]", TYPE_BADGE[t.type])}>
                        {TYPE_LABEL[t.type]}
                      </span>
                      <span className="text-[11px] text-ink-muted flex items-center gap-1">
                        <Clock size={11} />
                        截止 {t.dueDate}
                      </span>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
