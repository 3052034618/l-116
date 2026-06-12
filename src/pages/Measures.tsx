import { useMemo, useState } from "react"
import { useStore } from "@/store/useStore"
import { MEASURE_STATUS_LABELS, MEASURE_STATUS_COLORS, type Measure } from "@/types"
import { cn } from "@/lib/utils"
import { Plus, Pencil, Trash2, X, User, Wallet, Leaf, Calendar, Building2, FileText, CheckCircle2 } from "lucide-react"

type MeasureStatus = Measure["status"] | "all"
const STATUS_TABS: { key: MeasureStatus; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "planning", label: "规划中" },
  { key: "executing", label: "执行中" },
  { key: "completed", label: "已完成" },
  { key: "paused", label: "已暂停" },
]

type FormState = Omit<Measure, "id">

const EMPTY_FORM: FormState = {
  name: "",
  buildingId: "",
  responsiblePerson: "",
  budget: 0,
  estimatedReduction: 0,
  actualReduction: 0,
  startDate: "",
  endDate: "",
  status: "planning",
  description: "",
}

export default function Measures() {
  const { buildings, measures, addMeasure, updateMeasure, deleteMeasure } = useStore()
  const [activeTab, setActiveTab] = useState<MeasureStatus>("all")
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)

  const buildingMap = useMemo(() => {
    const m = new Map<string, string>()
    buildings.forEach(b => m.set(b.id, b.name))
    return m
  }, [buildings])

  const filtered = useMemo(() => {
    if (activeTab === "all") return measures
    return measures.filter(m => m.status === activeTab)
  }, [measures, activeTab])

  const stats = useMemo(() => {
    const totalBudget = measures.reduce((s, m) => s + m.budget, 0)
    const totalEstimated = measures.reduce((s, m) => s + m.estimatedReduction, 0)
    const totalActual = measures.reduce((s, m) => s + m.actualReduction, 0)
    const completed = measures.filter(m => m.status === "completed").length
    return {
      total: measures.length,
      totalBudget,
      totalEstimated,
      totalActual,
      completed,
    }
  }, [measures])

  const openAdd = () => {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setShowModal(true)
  }

  const openEdit = (id: string) => {
    const m = measures.find(x => x.id === id)
    if (!m) return
    const { id: _id, ...rest } = m
    void _id
    setForm(rest)
    setEditingId(id)
    setShowModal(true)
  }

  const handleDelete = (id: string) => {
    const m = measures.find(x => x.id === id)
    if (!window.confirm(`确认删除措施「${m?.name}」？`)) return
    deleteMeasure(id)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.buildingId) {
      alert("请填写措施名称并选择楼宇")
      return
    }
    const payload: FormState = {
      ...form,
      budget: Number(form.budget) || 0,
      estimatedReduction: Number(form.estimatedReduction) || 0,
      actualReduction: Number(form.actualReduction) || 0,
    }
    if (editingId) {
      updateMeasure(editingId, payload)
    } else {
      addMeasure(payload)
    }
    setShowModal(false)
    setForm(EMPTY_FORM)
    setEditingId(null)
  }

  const getProgress = (m: Measure) => {
    if (m.estimatedReduction <= 0) return 0
    return Math.min(100, (m.actualReduction / m.estimatedReduction) * 100)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-ink tracking-tight">措施库</h1>
          <p className="text-sm text-ink-muted mt-1">管理园区节能减碳项目，追踪措施执行与减排成效</p>
        </div>
        <button onClick={openAdd} className="btn-primary inline-flex items-center gap-2">
          <Plus size={16} /> 新增措施
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="card py-4">
          <p className="text-xs text-ink-muted">措施总数</p>
          <p className="text-2xl font-serif font-bold text-ink mt-1">{stats.total}</p>
          <p className="text-xs text-emerald-600 mt-1">已完成 {stats.completed}</p>
        </div>
        <div className="card py-4">
          <p className="text-xs text-ink-muted">总预算</p>
          <p className="text-2xl font-serif font-bold text-accent mt-1">
            ¥{(stats.totalBudget / 10000).toFixed(1)}<span className="text-sm font-normal">万</span>
          </p>
        </div>
        <div className="card py-4">
          <p className="text-xs text-ink-muted">预计减排</p>
          <p className="text-2xl font-serif font-bold text-teal-600 mt-1">
            {stats.totalEstimated}<span className="text-sm font-normal text-ink-muted"> t</span>
          </p>
        </div>
        <div className="card py-4">
          <p className="text-xs text-ink-muted">实际减排</p>
          <p className="text-2xl font-serif font-bold text-emerald-600 mt-1">
            {stats.totalActual}<span className="text-sm font-normal text-ink-muted"> t</span>
          </p>
        </div>
        <div className="card py-4">
          <p className="text-xs text-ink-muted">减排达成率</p>
          <p className="text-2xl font-serif font-bold text-purple-600 mt-1">
            {stats.totalEstimated > 0 ? ((stats.totalActual / stats.totalEstimated) * 100).toFixed(1) : 0}
            <span className="text-sm font-normal text-ink-muted">%</span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1 bg-surface rounded-xl p-1 w-fit">
        {STATUS_TABS.map(tab => {
          const count = tab.key === "all" ? measures.length : measures.filter(m => m.status === tab.key).length
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                activeTab === tab.key
                  ? "bg-teal-500 text-white shadow-sm"
                  : "text-ink-secondary hover:bg-white hover:text-ink"
              )}
            >
              {tab.label}
              <span className={cn(
                "text-xs px-1.5 py-0.5 rounded-md",
                activeTab === tab.key ? "bg-white/20" : "bg-gray-200 text-ink-muted"
              )}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="card text-center py-16">
          <CheckCircle2 size={48} className="text-gray-300 mx-auto mb-3" />
          <p className="text-ink-muted">当前筛选下暂无措施项目</p>
          <button onClick={openAdd} className="btn-secondary mt-4">添加第一项措施</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filtered.map(m => {
            const progress = getProgress(m)
            const today = new Date().toISOString().slice(0, 10)
            const overdue = m.status !== "completed" && m.endDate < today
            return (
              <div key={m.id} className="card relative overflow-hidden">
                {overdue && (
                  <div className="absolute top-0 right-0 bg-red-500 text-white text-xs font-medium px-3 py-1 rounded-bl-lg">
                    已逾期
                  </div>
                )}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    <span className={cn("badge", MEASURE_STATUS_COLORS[m.status])}>
                      {MEASURE_STATUS_LABELS[m.status]}
                    </span>
                    <div>
                      <h3 className="font-serif font-semibold text-ink leading-snug">{m.name}</h3>
                      <div className="flex items-center gap-1.5 mt-1 text-xs text-ink-muted">
                        <Building2 size={12} />
                        {buildingMap.get(m.buildingId)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 -mr-2 -mt-2">
                    <select
                      value={m.status}
                      onChange={e => updateMeasure(m.id, { status: e.target.value as Measure["status"] })}
                      className="text-xs border border-gray-200 rounded-md px-2 py-1 bg-white focus:outline-none focus:border-teal-400 text-ink-secondary"
                    >
                      <option value="planning">规划中</option>
                      <option value="executing">执行中</option>
                      <option value="completed">已完成</option>
                      <option value="paused">已暂停</option>
                    </select>
                    <button
                      onClick={() => openEdit(m.id)}
                      className="w-8 h-8 rounded-lg hover:bg-teal-500/10 text-ink-muted hover:text-teal-600 flex items-center justify-center transition-colors"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(m.id)}
                      className="w-8 h-8 rounded-lg hover:bg-red-500/10 text-ink-muted hover:text-red-500 flex items-center justify-center transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-surface rounded-lg p-3">
                    <div className="flex items-center gap-1.5 text-ink-muted text-xs mb-1">
                      <User size={12} /> 责任人
                    </div>
                    <p className="text-sm font-medium text-ink">{m.responsiblePerson || "-"}</p>
                  </div>
                  <div className="bg-surface rounded-lg p-3">
                    <div className="flex items-center gap-1.5 text-ink-muted text-xs mb-1">
                      <Wallet size={12} /> 预算
                    </div>
                    <p className="text-sm font-medium text-ink">¥{m.budget.toLocaleString()}</p>
                  </div>
                  <div className="bg-surface rounded-lg p-3">
                    <div className="flex items-center gap-1.5 text-ink-muted text-xs mb-1">
                      <Calendar size={12} /> 周期
                    </div>
                    <p className="text-xs font-medium text-ink">
                      {m.startDate.slice(5)} ~ {m.endDate.slice(5)}
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <div className="flex items-center gap-1.5 text-ink-muted">
                      <Leaf size={12} /> 减排进度
                    </div>
                    <span className="text-ink font-medium">
                      {m.actualReduction} / {m.estimatedReduction} tCO₂
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        progress >= 100 ? "bg-emerald-500" :
                        progress >= 60 ? "bg-teal-500" :
                        progress >= 30 ? "bg-accent" : "bg-red-400"
                      )}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1.5">
                    <span className="text-[11px] text-ink-muted">预计减排量</span>
                    <span className={cn(
                      "text-[11px] font-semibold",
                      progress >= 100 ? "text-emerald-600" : "text-teal-600"
                    )}>
                      {progress.toFixed(0)}% 达成
                    </span>
                  </div>
                </div>

                {m.description && (
                  <div className="flex items-start gap-2 text-xs text-ink-secondary bg-surface/50 rounded-lg p-3">
                    <FileText size={13} className="mt-0.5 shrink-0 text-ink-muted" />
                    <p className="line-clamp-2">{m.description}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <form
            onSubmit={handleSubmit}
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
          >
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h2 className="font-serif text-lg font-semibold text-ink">
                  {editingId ? "编辑措施项目" : "新增措施项目"}
                </h2>
                <p className="text-xs text-ink-muted mt-0.5">填写项目信息以追踪节能减碳成效</p>
              </div>
              <button type="button" onClick={() => setShowModal(false)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-ink-muted">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-ink mb-1.5">措施名称 <span className="text-red-500">*</span></label>
                  <input
                    required
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="例如：LED照明改造项目"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">所属楼宇 <span className="text-red-500">*</span></label>
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
                  <label className="block text-sm font-medium text-ink mb-1.5">责任人</label>
                  <input
                    value={form.responsiblePerson}
                    onChange={e => setForm({ ...form, responsiblePerson: e.target.value })}
                    placeholder="姓名"
                    className="input-field"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">预算金额 (¥)</label>
                  <input
                    type="number" min="0"
                    value={form.budget === 0 ? "" : form.budget}
                    onChange={e => setForm({ ...form, budget: Number(e.target.value) || 0 })}
                    placeholder="0"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">预计减排 (tCO₂)</label>
                  <input
                    type="number" min="0" step="0.1"
                    value={form.estimatedReduction === 0 ? "" : form.estimatedReduction}
                    onChange={e => setForm({ ...form, estimatedReduction: Number(e.target.value) || 0 })}
                    placeholder="0"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">实际减排 (tCO₂)</label>
                  <input
                    type="number" min="0" step="0.1"
                    value={form.actualReduction === 0 ? "" : form.actualReduction}
                    onChange={e => setForm({ ...form, actualReduction: Number(e.target.value) || 0 })}
                    placeholder="0"
                    className="input-field"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">开始日期</label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={e => setForm({ ...form, startDate: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">截止日期</label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={e => setForm({ ...form, endDate: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">当前状态</label>
                  <select
                    value={form.status}
                    onChange={e => setForm({ ...form, status: e.target.value as Measure["status"] })}
                    className="select-field"
                  >
                    <option value="planning">规划中</option>
                    <option value="executing">执行中</option>
                    <option value="completed">已完成</option>
                    <option value="paused">已暂停</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">措施描述</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="详细描述措施内容、实施方案和预期效果..."
                  rows={3}
                  className="input-field resize-none"
                />
              </div>

              {form.estimatedReduction > 0 && (
                <div className="bg-teal-500/5 border border-teal-500/20 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-ink-secondary">预计减排完成率预览</p>
                    <p className="text-lg font-serif font-bold text-teal-600">
                      {((form.actualReduction / form.estimatedReduction) * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div className="h-1.5 bg-teal-500/10 rounded-full mt-2 overflow-hidden">
                    <div
                      className="h-full bg-teal-500 rounded-full"
                      style={{ width: `${Math.min(100, (form.actualReduction / form.estimatedReduction) * 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-100 px-6 py-4 flex items-center justify-end gap-3">
              <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">取消</button>
              <button type="submit" className="btn-primary">{editingId ? "保存修改" : "确认添加"}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
