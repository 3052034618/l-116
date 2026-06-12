import { useMemo, useState } from "react"
import { useStore } from "@/store/useStore"
import { EMISSION_FACTORS, EMISSION_LABELS, EMISSION_UNITS } from "@/types"
import { cn } from "@/lib/utils"
import { Plus, Pencil, Trash2, X, Zap, Droplets, Flame, Car, CloudFog, Calculator, Check } from "lucide-react"

type FieldKey = "electricity" | "water" | "gas" | "vehicleMileage" | "purchasedSteam"
const FIELD_ICONS: Record<FieldKey, typeof Zap> = {
  electricity: Zap, water: Droplets, gas: Flame, vehicleMileage: Car, purchasedSteam: CloudFog
}
const FIELD_COLORS: Record<FieldKey, string> = {
  electricity: "text-teal-600 bg-teal-500/10",
  water: "text-emerald-600 bg-emerald-500/10",
  gas: "text-accent bg-accent/10",
  vehicleMileage: "text-purple-600 bg-purple-500/10",
  purchasedSteam: "text-pink-600 bg-pink-500/10",
}
const FIELD_KEYS: FieldKey[] = ["electricity", "water", "gas", "vehicleMileage", "purchasedSteam"]

interface FormState {
  buildingId: string
  month: string
  electricity: number
  water: number
  gas: number
  vehicleMileage: number
  purchasedSteam: number
}

const EMPTY_FORM: FormState = {
  buildingId: "",
  month: "",
  electricity: 0, water: 0, gas: 0, vehicleMileage: 0, purchasedSteam: 0,
}

function computeCO2(form: FormState) {
  const co2: Record<FieldKey, number> = {
    electricity: +(form.electricity * EMISSION_FACTORS.electricity).toFixed(2),
    water: +(form.water * EMISSION_FACTORS.water).toFixed(2),
    gas: +(form.gas * EMISSION_FACTORS.gas).toFixed(2),
    vehicleMileage: +(form.vehicleMileage * EMISSION_FACTORS.vehicleMileage).toFixed(2),
    purchasedSteam: +(form.purchasedSteam * EMISSION_FACTORS.purchasedSteam).toFixed(2),
  }
  const total = +Object.values(co2).reduce((a, b) => a + b, 0).toFixed(2)
  return { co2, total }
}

export default function Emission() {
  const { buildings, emissionRecords, addEmissionRecord, updateEmissionRecord, deleteEmissionRecord } = useStore()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [filterBuilding, setFilterBuilding] = useState<string>("all")
  const [filterMonth, setFilterMonth] = useState<string>("")
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 10

  const buildingMap = useMemo(() => {
    const m = new Map<string, string>()
    buildings.forEach(b => m.set(b.id, b.name))
    return m
  }, [buildings])

  const filtered = useMemo(() => {
    let result = [...emissionRecords]
    if (filterBuilding !== "all") result = result.filter(r => r.buildingId === filterBuilding)
    if (filterMonth) result = result.filter(r => r.month.startsWith(filterMonth))
    return result.sort((a, b) => (b.month + b.buildingId).localeCompare(a.month + a.buildingId))
  }, [emissionRecords, filterBuilding, filterMonth])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const openAdd = () => {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setShowForm(true)
  }

  const openEdit = (id: string) => {
    const r = emissionRecords.find(x => x.id === id)
    if (!r) return
    setForm({
      buildingId: r.buildingId,
      month: r.month,
      electricity: r.electricity,
      water: r.water,
      gas: r.gas,
      vehicleMileage: r.vehicleMileage,
      purchasedSteam: r.purchasedSteam,
    })
    setEditingId(id)
    setShowForm(true)
  }

  const handleDelete = (id: string) => {
    if (!window.confirm("确认删除此条排放记录？删除后统计数据将同步更新。")) return
    deleteEmissionRecord(id)
    if (filtered.length - 1 <= (page - 1) * PAGE_SIZE && page > 1) {
      setPage(page - 1)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.buildingId || !form.month) {
      alert("请选择楼宇和月份")
      return
    }
    const payload = {
      buildingId: form.buildingId,
      month: form.month,
      electricity: Number(form.electricity) || 0,
      water: Number(form.water) || 0,
      gas: Number(form.gas) || 0,
      vehicleMileage: Number(form.vehicleMileage) || 0,
      purchasedSteam: Number(form.purchasedSteam) || 0,
    }
    if (editingId) {
      updateEmissionRecord(editingId, payload)
    } else {
      addEmissionRecord(payload)
    }
    setShowForm(false)
    setForm(EMPTY_FORM)
    setEditingId(null)
  }

  const { co2: formCO2, total: formTotal } = computeCO2(form)

  const monthlySummary = useMemo(() => {
    const latest = filtered[0]
    const total = filtered.reduce((s, r) => s + r.totalCO2, 0)
    return {
      recordCount: filtered.length,
      total: +(total / 1000).toFixed(2),
      latestMonth: latest?.month ?? "-",
    }
  }, [filtered])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-ink tracking-tight">排放录入</h1>
          <p className="text-sm text-ink-muted mt-1">登记楼宇能耗数据，系统自动折算碳排放量</p>
        </div>
        <button onClick={openAdd} className="btn-primary inline-flex items-center gap-2">
          <Plus size={16} /> 新增录入
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="card">
          <p className="text-sm text-ink-secondary">记录总数</p>
          <p className="stat-value text-teal-600 mt-2">{monthlySummary.recordCount}<span className="text-base font-normal text-ink-muted ml-1">条</span></p>
        </div>
        <div className="card">
          <p className="text-sm text-ink-secondary">筛选累计排放</p>
          <p className="stat-value text-accent mt-2">{monthlySummary.total}<span className="text-base font-normal text-ink-muted ml-1">吨 CO₂</span></p>
        </div>
        <div className="card">
          <p className="text-sm text-ink-secondary">最新月份</p>
          <p className="stat-value text-ink mt-2">{monthlySummary.latestMonth}</p>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
          <form
            onSubmit={handleSubmit}
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
          >
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h2 className="font-serif text-lg font-semibold text-ink">
                  {editingId ? "编辑排放记录" : "新增排放录入"}
                </h2>
                <p className="text-xs text-ink-muted mt-0.5">系统将根据排放因子自动折算 CO₂ 当量</p>
              </div>
              <button type="button" onClick={() => setShowForm(false)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-ink-muted">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">选择楼宇 <span className="text-red-500">*</span></label>
                  <select
                    required
                    value={form.buildingId}
                    onChange={e => setForm({ ...form, buildingId: e.target.value })}
                    className="select-field"
                  >
                    <option value="">请选择楼宇</option>
                    {buildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">选择月份 <span className="text-red-500">*</span></label>
                  <input
                    required
                    type="month"
                    value={form.month}
                    onChange={e => setForm({ ...form, month: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-ink-secondary">
                  <Calculator size={16} />
                  <span className="text-sm font-medium">能耗数据录入（填写实际用量）</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {FIELD_KEYS.map(key => {
                    const Icon = FIELD_ICONS[key]
                    return (
                      <div key={key} className="p-4 rounded-xl bg-surface border border-gray-100">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2 flex-1">
                            <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", FIELD_COLORS[key])}>
                              <Icon size={18} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <label className="block text-sm font-medium text-ink">{EMISSION_LABELS[key]}</label>
                              <div className="flex items-center gap-2 mt-1">
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={form[key] === 0 ? "" : form[key]}
                                  onChange={e => setForm({ ...form, [key]: Number(e.target.value) || 0 })}
                                  placeholder="0"
                                  className="input-field text-sm py-1.5"
                                />
                                <span className="text-xs text-ink-muted whitespace-nowrap">{EMISSION_UNITS[key]}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-[10px] text-ink-muted">CO₂ 当量</p>
                            <p className={cn("text-sm font-semibold tabular-nums",
                              form[key] > 0 ? "text-ink" : "text-ink-muted")}>
                              {formCO2[key].toFixed(2)} kg
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="bg-gradient-to-r from-teal-500/10 to-accent/10 rounded-xl p-5 border border-teal-500/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-ink-secondary">折算排放总量</p>
                    <p className="stat-value text-teal-600 mt-1">
                      {(formTotal / 1000).toFixed(3)}<span className="text-base font-normal text-ink-muted ml-1">吨 CO₂</span>
                    </p>
                    <p className="text-xs text-ink-muted mt-1">= {formTotal.toLocaleString()} kg CO₂</p>
                  </div>
                  <div className="w-14 h-14 rounded-2xl bg-teal-500 flex items-center justify-center">
                    <Check size={28} className="text-white" />
                  </div>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-100 px-6 py-4 flex items-center justify-end gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
                取消
              </button>
              <button type="submit" className="btn-primary">
                {editingId ? "保存修改" : "确认录入"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="flex items-center gap-2 ml-auto">
            <select
              value={filterBuilding}
              onChange={e => { setFilterBuilding(e.target.value); setPage(1) }}
              className="select-field w-40"
            >
              <option value="all">全部楼宇</option>
              {buildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <input
              type="month"
              value={filterMonth}
              onChange={e => { setFilterMonth(e.target.value); setPage(1) }}
              className="input-field w-40"
            />
          </div>
        </div>

        <div className="overflow-x-auto -mx-6 -mb-6">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="table-header text-left px-6 py-3 font-medium">楼宇</th>
                <th className="table-header text-left px-6 py-3 font-medium">月份</th>
                <th className="table-header text-right px-6 py-3 font-medium">电力 kWh</th>
                <th className="table-header text-right px-6 py-3 font-medium">水 吨</th>
                <th className="table-header text-right px-6 py-3 font-medium">燃气 m³</th>
                <th className="table-header text-right px-6 py-3 font-medium">里程 km</th>
                <th className="table-header text-right px-6 py-3 font-medium">蒸汽 GJ</th>
                <th className="table-header text-right px-6 py-3 font-medium">CO₂ 吨</th>
                <th className="table-header text-right px-6 py-3 font-medium w-28">操作</th>
              </tr>
            </thead>
            <tbody>
              {pageData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-ink-muted text-sm">
                    暂无排放记录，点击右上角"新增录入"开始登记
                  </td>
                </tr>
              ) : (
                pageData.map(r => (
                  <tr key={r.id} className="table-row">
                    <td className="px-6 py-3 text-ink font-medium">{buildingMap.get(r.buildingId)}</td>
                    <td className="px-6 py-3 text-ink-secondary font-mono text-xs">{r.month}</td>
                    <td className="px-6 py-3 text-ink text-right tabular-nums">{r.electricity.toLocaleString()}</td>
                    <td className="px-6 py-3 text-ink text-right tabular-nums">{r.water.toLocaleString()}</td>
                    <td className="px-6 py-3 text-ink text-right tabular-nums">{r.gas.toLocaleString()}</td>
                    <td className="px-6 py-3 text-ink text-right tabular-nums">{r.vehicleMileage.toLocaleString()}</td>
                    <td className="px-6 py-3 text-ink text-right tabular-nums">{r.purchasedSteam.toLocaleString()}</td>
                    <td className="px-6 py-3 text-teal-600 font-semibold text-right tabular-nums">
                      {(r.totalCO2 / 1000).toFixed(3)}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => openEdit(r.id)}
                          className="w-7 h-7 rounded-md hover:bg-teal-500/10 text-ink-muted hover:text-teal-600 flex items-center justify-center transition-colors"
                          title="编辑"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(r.id)}
                          className="w-7 h-7 rounded-md hover:bg-red-500/10 text-ink-muted hover:text-red-500 flex items-center justify-center transition-colors"
                          title="删除"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filtered.length > 0 && (
          <div className="flex items-center justify-between pt-5 mt-1 border-t border-gray-50">
            <p className="text-sm text-ink-muted">
              共 <span className="font-semibold text-ink">{filtered.length}</span> 条记录 · 第 <span className="font-semibold text-ink">{page}</span> / {totalPages} 页
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg text-sm border border-gray-200 bg-white text-ink-secondary hover:border-teal-400 hover:text-teal-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                上一页
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 rounded-lg text-sm border border-gray-200 bg-white text-ink-secondary hover:border-teal-400 hover:text-teal-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
