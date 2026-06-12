import { useMemo, useState } from "react"
import { useStore } from "@/store/useStore"
import { MEASURE_STATUS_LABELS, MEASURE_STATUS_COLORS, type Measure, type BudgetUsage, type Milestone, type EmissionImpact } from "@/types"
import { cn } from "@/lib/utils"
import { Plus, Pencil, Trash2, X, User, Wallet, Leaf, Calendar, Building2, FileText, CheckCircle2, Eye, DollarSign, Target, TrendingDown, ChevronRight } from "lucide-react"

type MeasureStatus = Measure["status"] | "all"
const STATUS_TABS: { key: MeasureStatus; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "planning", label: "规划中" },
  { key: "executing", label: "执行中" },
  { key: "completed", label: "已完成" },
  { key: "paused", label: "已暂停" },
]

const MILESTONE_STATUS_LABELS: Record<string, string> = {
  pending: "待开始",
  in_progress: "进行中",
  completed: "已完成",
  delayed: "已延期",
}

const MILESTONE_STATUS_COLORS: Record<string, string> = {
  pending: "bg-gray-100 text-gray-600",
  in_progress: "bg-blue-100 text-blue-700",
  completed: "bg-emerald-100 text-emerald-700",
  delayed: "bg-red-100 text-red-700",
}

const BUDGET_CATEGORIES = ["设备采购", "施工服务", "软件采购", "检测服务", "咨询服务", "其他"]

type FormState = Omit<Measure, "id" | "budgetUsage" | "milestones" | "emissionImpacts">

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

type DetailTab = "budget" | "milestone" | "impact" | "info"

export default function Measures() {
  const {
    buildings, measures, addMeasure, updateMeasure, deleteMeasure,
    addBudgetUsage, updateBudgetUsage, deleteBudgetUsage,
    addMilestone, updateMilestone, deleteMilestone,
    addEmissionImpact, updateEmissionImpact, deleteEmissionImpact,
  } = useStore()
  const [activeTab, setActiveTab] = useState<MeasureStatus>("all")
  const [showModal, setShowModal] = useState(false)
  const [showDetail, setShowDetail] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [detailTab, setDetailTab] = useState<DetailTab>("budget")

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

  const detailMeasure = useMemo(() => {
    if (!detailId) return null
    return measures.find(m => m.id === detailId) || null
  }, [measures, detailId])

  const budgetSummary = useMemo(() => {
    if (!detailMeasure) return { used: 0, remaining: 0, percent: 0 }
    const used = detailMeasure.budgetUsage.reduce((s, b) => s + b.amount, 0)
    const remaining = detailMeasure.budget - used
    const percent = detailMeasure.budget > 0 ? (used / detailMeasure.budget) * 100 : 0
    return { used, remaining, percent: Math.min(100, percent) }
  }, [detailMeasure])

  const openAdd = () => {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setShowModal(true)
  }

  const openEdit = (id: string) => {
    const m = measures.find(x => x.id === id)
    if (!m) return
    const { id: _id, budgetUsage, milestones, emissionImpacts, ...rest } = m
    void _id; void budgetUsage; void milestones; void emissionImpacts
    setForm(rest)
    setEditingId(id)
    setShowModal(true)
  }

  const openDetail = (id: string) => {
    setDetailId(id)
    setDetailTab("budget")
    setShowDetail(true)
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

  const [budgetForm, setBudgetForm] = useState<Partial<BudgetUsage>>({
    date: new Date().toISOString().slice(0, 10),
    item: "",
    amount: 0,
    category: "设备采购",
    note: "",
  })
  const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null)

  const saveBudgetItem = () => {
    if (!detailId || !budgetForm.item || !budgetForm.date) {
      alert("请填写完整的预算信息")
      return
    }
    const payload: Omit<BudgetUsage, "id"> = {
      date: budgetForm.date!,
      item: budgetForm.item!,
      amount: Number(budgetForm.amount) || 0,
      category: budgetForm.category!,
      note: budgetForm.note,
    }
    if (editingBudgetId) {
      updateBudgetUsage(detailId, editingBudgetId, payload)
    } else {
      addBudgetUsage(detailId, payload)
    }
    setBudgetForm({
      date: new Date().toISOString().slice(0, 10),
      item: "",
      amount: 0,
      category: "设备采购",
      note: "",
    })
    setEditingBudgetId(null)
  }

  const editBudgetItem = (item: BudgetUsage) => {
    setBudgetForm({ ...item })
    setEditingBudgetId(item.id)
  }

  const [milestoneForm, setMilestoneForm] = useState<Partial<Milestone>>({
    name: "",
    targetDate: "",
    actualDate: "",
    status: "pending",
    description: "",
  })
  const [editingMilestoneId, setEditingMilestoneId] = useState<string | null>(null)

  const saveMilestone = () => {
    if (!detailId || !milestoneForm.name || !milestoneForm.targetDate) {
      alert("请填写完整的里程碑信息")
      return
    }
    const payload: Omit<Milestone, "id"> = {
      name: milestoneForm.name!,
      targetDate: milestoneForm.targetDate!,
      actualDate: milestoneForm.actualDate,
      status: milestoneForm.status!,
      description: milestoneForm.description,
    }
    if (editingMilestoneId) {
      updateMilestone(detailId, editingMilestoneId, payload)
    } else {
      addMilestone(detailId, payload)
    }
    setMilestoneForm({
      name: "",
      targetDate: "",
      actualDate: "",
      status: "pending",
      description: "",
    })
    setEditingMilestoneId(null)
  }

  const editMilestone = (ms: Milestone) => {
    setMilestoneForm({ ...ms })
    setEditingMilestoneId(ms.id)
  }

  const [impactForm, setImpactForm] = useState<Partial<EmissionImpact>>({
    month: "",
    baseline: 0,
    actual: 0,
    reduction: 0,
    note: "",
  })
  const [editingImpactId, setEditingImpactId] = useState<string | null>(null)

  const saveImpact = () => {
    if (!detailId || !impactForm.month) {
      alert("请填写月份")
      return
    }
    const baseline = Number(impactForm.baseline) || 0
    const actual = Number(impactForm.actual) || 0
    const payload: Omit<EmissionImpact, "id"> = {
      month: impactForm.month!,
      baseline,
      actual,
      reduction: baseline - actual,
      note: impactForm.note,
    }
    if (editingImpactId) {
      updateEmissionImpact(detailId, editingImpactId, payload)
    } else {
      addEmissionImpact(detailId, payload)
    }
    setImpactForm({
      month: "",
      baseline: 0,
      actual: 0,
      reduction: 0,
      note: "",
    })
    setEditingImpactId(null)
  }

  const editImpact = (ei: EmissionImpact) => {
    setImpactForm({ ...ei })
    setEditingImpactId(ei.id)
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
                    <button
                      onClick={() => openDetail(m.id)}
                      className="w-8 h-8 rounded-lg hover:bg-teal-500/10 text-ink-muted hover:text-teal-600 flex items-center justify-center transition-colors"
                      title="查看台账"
                    >
                      <Eye size={15} />
                    </button>
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

                <button
                  onClick={() => openDetail(m.id)}
                  className="w-full mt-3 py-2 text-sm text-teal-600 hover:bg-teal-500/5 rounded-lg flex items-center justify-center gap-1.5 transition-colors border border-teal-500/20"
                >
                  查看执行台账 <ChevronRight size={14} />
                </button>
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

      {showDetail && detailMeasure && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowDetail(false)}>
          <div
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl"
          >
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-5 flex items-start justify-between z-10">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className={cn("badge", MEASURE_STATUS_COLORS[detailMeasure.status])}>
                    {MEASURE_STATUS_LABELS[detailMeasure.status]}
                  </span>
                  <h2 className="font-serif text-xl font-bold text-ink">{detailMeasure.name}</h2>
                </div>
                <div className="flex items-center gap-4 text-sm text-ink-muted">
                  <span className="flex items-center gap-1">
                    <Building2 size={14} /> {buildingMap.get(detailMeasure.buildingId)}
                  </span>
                  <span className="flex items-center gap-1">
                    <User size={14} /> {detailMeasure.responsiblePerson || "-"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar size={14} /> {detailMeasure.startDate.slice(5)} ~ {detailMeasure.endDate.slice(5)}
                  </span>
                </div>
              </div>
              <button onClick={() => setShowDetail(false)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-ink-muted shrink-0">
                <X size={20} />
              </button>
            </div>

            <div className="border-b border-gray-100 bg-gray-50 px-6">
              <div className="flex gap-1">
                {[
                  { key: "budget", label: "预算使用", icon: Wallet },
                  { key: "milestone", label: "关键节点", icon: Target },
                  { key: "impact", label: "减排进展", icon: TrendingDown },
                  { key: "info", label: "项目信息", icon: FileText },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setDetailTab(tab.key as DetailTab)}
                    className={cn(
                      "px-4 py-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-all",
                      detailTab === tab.key
                        ? "text-teal-600 border-teal-500"
                        : "text-ink-secondary border-transparent hover:text-ink"
                    )}
                  >
                    <tab.icon size={15} />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {detailTab === "budget" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-surface rounded-xl p-4">
                      <p className="text-xs text-ink-muted mb-1">总预算</p>
                      <p className="text-2xl font-serif font-bold text-ink">¥{detailMeasure.budget.toLocaleString()}</p>
                    </div>
                    <div className="bg-surface rounded-xl p-4">
                      <p className="text-xs text-ink-muted mb-1">已使用</p>
                      <p className="text-2xl font-serif font-bold text-accent">¥{budgetSummary.used.toLocaleString()}</p>
                      <p className="text-xs text-ink-muted mt-1">{budgetSummary.percent.toFixed(1)}%</p>
                    </div>
                    <div className="bg-surface rounded-xl p-4">
                      <p className="text-xs text-ink-muted mb-1">剩余预算</p>
                      <p className={cn(
                        "text-2xl font-serif font-bold",
                        budgetSummary.remaining >= 0 ? "text-emerald-600" : "text-red-500"
                      )}>
                        ¥{budgetSummary.remaining.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-100 rounded-xl p-5">
                    <h3 className="font-serif text-lg font-semibold text-ink mb-4">
                      {editingBudgetId ? "编辑预算支出" : "新增预算支出"}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <label className="block text-xs font-medium text-ink-secondary mb-1.5">日期</label>
                        <input
                          type="date"
                          value={budgetForm.date}
                          onChange={e => setBudgetForm({ ...budgetForm, date: e.target.value })}
                          className="input-field text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-ink-secondary mb-1.5">支出类别</label>
                        <select
                          value={budgetForm.category}
                          onChange={e => setBudgetForm({ ...budgetForm, category: e.target.value })}
                          className="select-field text-sm"
                        >
                          {BUDGET_CATEGORIES.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-ink-secondary mb-1.5">支出项目</label>
                        <input
                          value={budgetForm.item}
                          onChange={e => setBudgetForm({ ...budgetForm, item: e.target.value })}
                          placeholder="例如：LED灯具采购"
                          className="input-field text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-ink-secondary mb-1.5">金额 (¥)</label>
                        <input
                          type="number" min="0"
                          value={budgetForm.amount || ""}
                          onChange={e => setBudgetForm({ ...budgetForm, amount: Number(e.target.value) })}
                          placeholder="0"
                          className="input-field text-sm"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      <div className="md:col-span-4">
                        <label className="block text-xs font-medium text-ink-secondary mb-1.5">备注</label>
                        <input
                          value={budgetForm.note}
                          onChange={e => setBudgetForm({ ...budgetForm, note: e.target.value })}
                          placeholder="可选"
                          className="input-field text-sm"
                        />
                      </div>
                      <div className="flex items-end gap-2">
                        <button onClick={saveBudgetItem} className="btn-primary flex-1 flex items-center justify-center gap-1.5">
                          <DollarSign size={14} />
                          {editingBudgetId ? "保存修改" : "添加"}
                        </button>
                        {editingBudgetId && (
                          <button
                            onClick={() => {
                              setBudgetForm({
                                date: new Date().toISOString().slice(0, 10),
                                item: "",
                                amount: 0,
                                category: "设备采购",
                                note: "",
                              })
                              setEditingBudgetId(null)
                            }}
                            className="btn-secondary"
                          >
                            取消
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                          <th className="text-left px-5 py-3 font-medium text-ink-secondary">日期</th>
                          <th className="text-left px-5 py-3 font-medium text-ink-secondary">类别</th>
                          <th className="text-left px-5 py-3 font-medium text-ink-secondary">项目</th>
                          <th className="text-right px-5 py-3 font-medium text-ink-secondary">金额</th>
                          <th className="text-left px-5 py-3 font-medium text-ink-secondary">备注</th>
                          <th className="text-right px-5 py-3 font-medium text-ink-secondary">操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detailMeasure.budgetUsage.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="text-center py-8 text-ink-muted">暂无预算支出记录</td>
                          </tr>
                        ) : (
                          detailMeasure.budgetUsage.slice().sort((a, b) => b.date.localeCompare(a.date)).map(item => (
                            <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                              <td className="px-5 py-3 text-ink">{item.date}</td>
                              <td className="px-5 py-3">
                                <span className="text-xs px-2 py-0.5 rounded-md bg-gray-100 text-ink-secondary">
                                  {item.category}
                                </span>
                              </td>
                              <td className="px-5 py-3 font-medium text-ink">{item.item}</td>
                              <td className="px-5 py-3 text-right text-ink font-medium tabular-nums">
                                ¥{item.amount.toLocaleString()}
                              </td>
                              <td className="px-5 py-3 text-ink-secondary">{item.note || "-"}</td>
                              <td className="px-5 py-3">
                                <div className="flex items-center gap-1 justify-end">
                                  <button
                                    onClick={() => editBudgetItem(item)}
                                    className="p-1.5 rounded-md hover:bg-gray-100 text-ink-muted hover:text-teal-600"
                                  >
                                    <Pencil size={13} />
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (window.confirm(`确认删除「${item.item}」？`)) {
                                        deleteBudgetUsage(detailMeasure.id, item.id)
                                      }
                                    }}
                                    className="p-1.5 rounded-md hover:bg-red-500/10 text-ink-muted hover:text-red-500"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {detailTab === "milestone" && (
                <div className="space-y-6">
                  <div className="bg-white border border-gray-100 rounded-xl p-5">
                    <h3 className="font-serif text-lg font-semibold text-ink mb-4">
                      {editingMilestoneId ? "编辑里程碑" : "新增里程碑"}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <label className="block text-xs font-medium text-ink-secondary mb-1.5">节点名称</label>
                        <input
                          value={milestoneForm.name}
                          onChange={e => setMilestoneForm({ ...milestoneForm, name: e.target.value })}
                          placeholder="例如：设备采购到货"
                          className="input-field text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-ink-secondary mb-1.5">计划完成</label>
                        <input
                          type="date"
                          value={milestoneForm.targetDate}
                          onChange={e => setMilestoneForm({ ...milestoneForm, targetDate: e.target.value })}
                          className="input-field text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-ink-secondary mb-1.5">实际完成</label>
                        <input
                          type="date"
                          value={milestoneForm.actualDate || ""}
                          onChange={e => setMilestoneForm({ ...milestoneForm, actualDate: e.target.value })}
                          className="input-field text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-ink-secondary mb-1.5">状态</label>
                        <select
                          value={milestoneForm.status}
                          onChange={e => setMilestoneForm({ ...milestoneForm, status: e.target.value as Milestone["status"] })}
                          className="select-field text-sm"
                        >
                          <option value="pending">待开始</option>
                          <option value="in_progress">进行中</option>
                          <option value="completed">已完成</option>
                          <option value="delayed">已延期</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      <div className="md:col-span-4">
                        <label className="block text-xs font-medium text-ink-secondary mb-1.5">描述</label>
                        <input
                          value={milestoneForm.description}
                          onChange={e => setMilestoneForm({ ...milestoneForm, description: e.target.value })}
                          placeholder="可选，描述本节点工作内容"
                          className="input-field text-sm"
                        />
                      </div>
                      <div className="flex items-end gap-2">
                        <button onClick={saveMilestone} className="btn-primary flex-1 flex items-center justify-center gap-1.5">
                          <Target size={14} />
                          {editingMilestoneId ? "保存修改" : "添加"}
                        </button>
                        {editingMilestoneId && (
                          <button
                            onClick={() => {
                              setMilestoneForm({
                                name: "",
                                targetDate: "",
                                actualDate: "",
                                status: "pending",
                                description: "",
                              })
                              setEditingMilestoneId(null)
                            }}
                            className="btn-secondary"
                          >
                            取消
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-100 rounded-xl p-5">
                    <h3 className="font-serif text-lg font-semibold text-ink mb-4">里程碑时间线</h3>
                    {detailMeasure.milestones.length === 0 ? (
                      <div className="text-center py-8 text-ink-muted">暂无里程碑节点</div>
                    ) : (
                      <div className="relative">
                        <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-200" />
                        <div className="space-y-5">
                          {detailMeasure.milestones.slice().sort((a, b) => a.targetDate.localeCompare(b.targetDate)).map(ms => (
                            <div key={ms.id} className="relative pl-10">
                              <div className={cn(
                                "absolute left-2 top-1.5 w-5 h-5 rounded-full border-4 flex items-center justify-center",
                                ms.status === "completed" ? "bg-white border-emerald-500" :
                                ms.status === "in_progress" ? "bg-white border-blue-500" :
                                ms.status === "delayed" ? "bg-white border-red-500" :
                                "bg-white border-gray-300"
                              )}>
                                {ms.status === "completed" && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                                {ms.status === "in_progress" && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />}
                                {ms.status === "delayed" && <div className="w-1.5 h-1.5 rounded-full bg-red-500" />}
                              </div>
                              <div className="bg-surface rounded-xl p-4">
                                <div className="flex items-start justify-between mb-2">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <h4 className="font-medium text-ink">{ms.name}</h4>
                                      <span className={cn("badge text-xs", MILESTONE_STATUS_COLORS[ms.status])}>
                                        {MILESTONE_STATUS_LABELS[ms.status]}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-ink-muted mt-1">
                                      <span>计划: {ms.targetDate}</span>
                                      {ms.actualDate && <span>实际: {ms.actualDate}</span>}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => editMilestone(ms)}
                                      className="p-1.5 rounded-md hover:bg-gray-100 text-ink-muted hover:text-teal-600"
                                    >
                                      <Pencil size={13} />
                                    </button>
                                    <button
                                      onClick={() => {
                                        if (window.confirm(`确认删除「${ms.name}」？`)) {
                                          deleteMilestone(detailMeasure.id, ms.id)
                                        }
                                      }}
                                      className="p-1.5 rounded-md hover:bg-red-500/10 text-ink-muted hover:text-red-500"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  </div>
                                </div>
                                {ms.description && (
                                  <p className="text-sm text-ink-secondary">{ms.description}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {detailTab === "impact" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-surface rounded-xl p-4">
                      <p className="text-xs text-ink-muted mb-1">预计减排</p>
                      <p className="text-2xl font-serif font-bold text-teal-600">{detailMeasure.estimatedReduction} t</p>
                    </div>
                    <div className="bg-surface rounded-xl p-4">
                      <p className="text-xs text-ink-muted mb-1">实际减排</p>
                      <p className="text-2xl font-serif font-bold text-emerald-600">{detailMeasure.actualReduction} t</p>
                    </div>
                    <div className="bg-surface rounded-xl p-4">
                      <p className="text-xs text-ink-muted mb-1">累计验证减排</p>
                      <p className="text-2xl font-serif font-bold text-accent">
                        {(detailMeasure.emissionImpacts.reduce((s, e) => s + e.reduction, 0) / 1000).toFixed(1)} t
                      </p>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-100 rounded-xl p-5">
                    <h3 className="font-serif text-lg font-semibold text-ink mb-4">
                      {editingImpactId ? "编辑减排记录" : "新增减排验证记录"}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <label className="block text-xs font-medium text-ink-secondary mb-1.5">月份</label>
                        <input
                          type="month"
                          value={impactForm.month}
                          onChange={e => setImpactForm({ ...impactForm, month: e.target.value })}
                          className="input-field text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-ink-secondary mb-1.5">基准排放 (kWh)</label>
                        <input
                          type="number"
                          value={impactForm.baseline || ""}
                          onChange={e => setImpactForm({ ...impactForm, baseline: Number(e.target.value) })}
                          placeholder="措施实施前用量"
                          className="input-field text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-ink-secondary mb-1.5">实际排放 (kWh)</label>
                        <input
                          type="number"
                          value={impactForm.actual || ""}
                          onChange={e => setImpactForm({ ...impactForm, actual: Number(e.target.value) })}
                          placeholder="措施实施后用量"
                          className="input-field text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-ink-secondary mb-1.5">减排量 (kWh)</label>
                        <div className="input-field bg-gray-50 text-emerald-600 font-medium flex items-center">
                          {((Number(impactForm.baseline) || 0) - (Number(impactForm.actual) || 0)).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      <div className="md:col-span-4">
                        <label className="block text-xs font-medium text-ink-secondary mb-1.5">备注</label>
                        <input
                          value={impactForm.note}
                          onChange={e => setImpactForm({ ...impactForm, note: e.target.value })}
                          placeholder="可选，如季节性因素、天气影响等"
                          className="input-field text-sm"
                        />
                      </div>
                      <div className="flex items-end gap-2">
                        <button onClick={saveImpact} className="btn-primary flex-1 flex items-center justify-center gap-1.5">
                          <TrendingDown size={14} />
                          {editingImpactId ? "保存修改" : "添加"}
                        </button>
                        {editingImpactId && (
                          <button
                            onClick={() => {
                              setImpactForm({
                                month: "",
                                baseline: 0,
                                actual: 0,
                                reduction: 0,
                                note: "",
                              })
                              setEditingImpactId(null)
                            }}
                            className="btn-secondary"
                          >
                            取消
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                          <th className="text-left px-5 py-3 font-medium text-ink-secondary">月份</th>
                          <th className="text-right px-5 py-3 font-medium text-ink-secondary">基准排放</th>
                          <th className="text-right px-5 py-3 font-medium text-ink-secondary">实际排放</th>
                          <th className="text-right px-5 py-3 font-medium text-ink-secondary">减排量</th>
                          <th className="text-left px-5 py-3 font-medium text-ink-secondary">备注</th>
                          <th className="text-right px-5 py-3 font-medium text-ink-secondary">操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detailMeasure.emissionImpacts.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="text-center py-8 text-ink-muted">暂无减排验证记录</td>
                          </tr>
                        ) : (
                          detailMeasure.emissionImpacts.slice().sort((a, b) => b.month.localeCompare(a.month)).map(ei => (
                            <tr key={ei.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                              <td className="px-5 py-3 font-medium text-ink">{ei.month}</td>
                              <td className="px-5 py-3 text-right tabular-nums text-ink-secondary">{ei.baseline.toLocaleString()} kWh</td>
                              <td className="px-5 py-3 text-right tabular-nums text-ink-secondary">{ei.actual.toLocaleString()} kWh</td>
                              <td className="px-5 py-3 text-right tabular-nums font-medium text-emerald-600">
                                -{ei.reduction.toLocaleString()} kWh
                              </td>
                              <td className="px-5 py-3 text-ink-secondary">{ei.note || "-"}</td>
                              <td className="px-5 py-3">
                                <div className="flex items-center gap-1 justify-end">
                                  <button
                                    onClick={() => editImpact(ei)}
                                    className="p-1.5 rounded-md hover:bg-gray-100 text-ink-muted hover:text-teal-600"
                                  >
                                    <Pencil size={13} />
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (window.confirm("确认删除此减排记录？")) {
                                        deleteEmissionImpact(detailMeasure.id, ei.id)
                                      }
                                    }}
                                    className="p-1.5 rounded-md hover:bg-red-500/10 text-ink-muted hover:text-red-500"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {detailTab === "info" && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="bg-surface rounded-xl p-5">
                      <h3 className="font-serif text-lg font-semibold text-ink mb-4">项目概览</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-ink-secondary">所属楼宇</span>
                          <span className="text-ink font-medium">{buildingMap.get(detailMeasure.buildingId)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-ink-secondary">责任人</span>
                          <span className="text-ink font-medium">{detailMeasure.responsiblePerson || "-"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-ink-secondary">项目周期</span>
                          <span className="text-ink font-medium">{detailMeasure.startDate} ~ {detailMeasure.endDate}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-ink-secondary">项目状态</span>
                          <span className={cn("badge", MEASURE_STATUS_COLORS[detailMeasure.status])}>
                            {MEASURE_STATUS_LABELS[detailMeasure.status]}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-ink-secondary">总预算</span>
                          <span className="text-ink font-medium">¥{detailMeasure.budget.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-ink-secondary">已使用预算</span>
                          <span className="text-accent font-medium">¥{budgetSummary.used.toLocaleString()} ({budgetSummary.percent.toFixed(1)}%)</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-surface rounded-xl p-5">
                      <h3 className="font-serif text-lg font-semibold text-ink mb-4">减排目标</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-ink-secondary">预计减排</span>
                          <span className="text-teal-600 font-medium">{detailMeasure.estimatedReduction} tCO₂</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-ink-secondary">实际减排</span>
                          <span className="text-emerald-600 font-medium">{detailMeasure.actualReduction} tCO₂</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-ink-secondary">完成率</span>
                          <span className={cn(
                            "font-medium",
                            getProgress(detailMeasure) >= 100 ? "text-emerald-600" :
                            getProgress(detailMeasure) >= 60 ? "text-teal-600" :
                            getProgress(detailMeasure) >= 30 ? "text-accent" : "text-red-500"
                          )}>
                            {getProgress(detailMeasure).toFixed(1)}%
                          </span>
                        </div>
                        <div className="mt-3">
                          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all",
                                getProgress(detailMeasure) >= 100 ? "bg-emerald-500" :
                                getProgress(detailMeasure) >= 60 ? "bg-teal-500" :
                                getProgress(detailMeasure) >= 30 ? "bg-accent" : "bg-red-500"
                              )}
                              style={{ width: `${getProgress(detailMeasure)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {detailMeasure.description && (
                    <div className="bg-surface rounded-xl p-5">
                      <h3 className="font-serif text-lg font-semibold text-ink mb-3">措施描述</h3>
                      <p className="text-ink-secondary leading-relaxed">{detailMeasure.description}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-100 px-6 py-4 flex items-center justify-end gap-3">
              <button onClick={() => setShowDetail(false)} className="btn-secondary">关闭</button>
              <button onClick={() => { setShowDetail(false); openEdit(detailMeasure.id) }} className="btn-primary flex items-center gap-2">
                <Pencil size={14} />
                编辑项目
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
