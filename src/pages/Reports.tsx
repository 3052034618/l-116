import { useState, useMemo, useRef } from "react"
import { useStore } from "@/store/useStore"
import { quarterlyReports } from "@/data/mockData"
import { cn } from "@/lib/utils"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"
import * as XLSX from "xlsx"

const YEARS = [2025, 2026]
const QUARTERS = [1, 2, 3, 4]
const SEVERITY_DOT = { high: "bg-red-500", medium: "bg-amber-500", low: "bg-blue-500" }
const TYPE_BADGE = { overdue_measure: "bg-red-100 text-red-700", expiring_project: "bg-amber-100 text-amber-700", missing_data: "bg-blue-100 text-blue-700" }
const TYPE_LABEL = { overdue_measure: "逾期措施", expiring_project: "即将到期", missing_data: "数据缺失" }

export default function Reports() {
  const { buildings, emissionRecords, measures, annualTargets } = useStore()
  const [year, setYear] = useState(2025)
  const [quarter, setQuarter] = useState(1)
  const [todoStatus, setTodoStatus] = useState<Record<string, boolean>>({})
  const reportRef = useRef<HTMLDivElement>(null)

  const report = useMemo(
    () => quarterlyReports.find((r) => r.year === year && r.quarter === quarter),
    [year, quarter],
  )

  const quarterlyTotal = useMemo(() => {
    const startMonth = (quarter - 1) * 3 + 1
    const months = [startMonth, startMonth + 1, startMonth + 2].map((m) => `${year}-${String(m).padStart(2, "0")}`)
    return emissionRecords.filter((r) => months.includes(r.month)).reduce((s, r) => s + r.totalCO2, 0)
  }, [emissionRecords, year, quarter])

  const completedMeasures = measures.filter((m) => m.status === "completed").length
  const activeTargets = annualTargets.filter((t) => t.year === year).length

  const toggleTodo = (id: string) => setTodoStatus((prev) => ({ ...prev, [id]: !prev[id] }))

  const exportPDF = async () => {
    if (!reportRef.current) return
    const canvas = await html2canvas(reportRef.current, { scale: 2, useCORS: true })
    const imgData = canvas.toDataURL("image/png")
    const pdf = new jsPDF("p", "mm", "a4")
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight)
    pdf.save(`${year}Q${quarter}-碳排放报告.pdf`)
  }

  const exportExcel = () => {
    const wsData = [
      ["季度碳排放报告"],
      ["年份", year],
      ["季度", `Q${quarter}`],
      ["季度排放总量(吨CO₂)", +(quarterlyTotal.toFixed(2))],
      ["同比变化(%)", report?.yoyChange ?? "-"],
      ["措施进展", report?.measureProgress ?? "-"],
      [],
      ["异常说明"],
      ...(report?.anomalies.length
        ? report.anomalies.map((a) => [a.month, a.buildingName, a.description, a.severity])
        : [["本季度无异常"]]),
      [],
      ["待办清单"],
      ...(report?.todos.length
        ? report.todos.map((t) => [t.title, TYPE_LABEL[t.type], t.dueDate, todoStatus[t.id] ? "已完成" : "待处理"])
        : [["无待办事项"]]),
    ]
    const ws = XLSX.utils.aoa_to_sheet(wsData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "报告")
    XLSX.writeFile(wb, `${year}Q${quarter}-碳排放报告.xlsx`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="section-title mb-0">报告</h1>
        <div className="flex items-center gap-3">
          <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="select-field w-28">
            {YEARS.map((y) => <option key={y} value={y}>{y}年</option>)}
          </select>
          <select value={quarter} onChange={(e) => setQuarter(Number(e.target.value))} className="select-field w-28">
            {QUARTERS.map((q) => <option key={q} value={q}>Q{q}</option>)}
          </select>
          <button onClick={exportPDF} className="btn-secondary">导出PDF</button>
          <button onClick={exportExcel} className="btn-primary">导出Excel</button>
        </div>
      </div>

      <div ref={reportRef} className="space-y-6">
        <div className="card">
          <h2 className="section-title">季度概要</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-ink-secondary mb-1">季度排放总量</p>
              <p className="stat-value text-ink">{quarterlyTotal.toFixed(2)} <span className="text-base font-normal text-ink-secondary">吨 CO₂</span></p>
            </div>
            <div>
              <p className="text-sm text-ink-secondary mb-1">同比变化</p>
              <p className={cn("stat-value flex items-center gap-1", (report?.yoyChange ?? 0) <= 0 ? "text-emerald-600" : "text-red-500")}>
                {(report?.yoyChange ?? 0) <= 0 ? "↓" : "↑"} {Math.abs(report?.yoyChange ?? 0)}%
              </p>
            </div>
            <div>
              <p className="text-sm text-ink-secondary mb-1">措施进展</p>
              <p className="text-sm text-ink">{report?.measureProgress ?? "暂无数据"}</p>
              <p className="text-xs text-ink-muted mt-1">已完成 {completedMeasures} 项措施 · {activeTargets} 项目标</p>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="section-title">异常说明</h2>
          {report?.anomalies.length ? (
            <ul className="space-y-3">
              {report.anomalies.map((a) => (
                <li key={a.id} className="flex items-start gap-3 p-3 bg-surface rounded-lg">
                  <span className={cn("mt-1.5 w-2.5 h-2.5 rounded-full shrink-0", SEVERITY_DOT[a.severity])} />
                  <div>
                    <p className="text-sm font-medium text-ink">{a.buildingName}</p>
                    <p className="text-xs text-ink-secondary">{a.month} · {a.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-muted py-4 text-center">本季度无异常</p>
          )}
        </div>

        <div className="card">
          <h2 className="section-title">待办清单</h2>
          {report?.todos.length ? (
            <ul className="space-y-2">
              {report.todos.map((t) => (
                <li key={t.id} className="flex items-center gap-3 p-3 bg-surface rounded-lg">
                  <input
                    type="checkbox"
                    checked={!!todoStatus[t.id]}
                    onChange={() => toggleTodo(t.id)}
                    className="w-4 h-4 rounded border-gray-300 text-teal-500 focus:ring-teal-400"
                  />
                  <span className={cn("flex-1 text-sm", todoStatus[t.id] && "line-through text-ink-muted")}>
                    {t.title}
                  </span>
                  <span className={cn("badge", TYPE_BADGE[t.type])}>{TYPE_LABEL[t.type]}</span>
                  <span className="text-xs text-ink-muted">{t.dueDate}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-muted py-4 text-center">无待办事项</p>
          )}
        </div>
      </div>
    </div>
  )
}
