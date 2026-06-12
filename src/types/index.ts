export interface Building {
  id: string
  name: string
  area: number
  department: string
}

export interface EmissionRecord {
  id: string
  buildingId: string
  month: string
  electricity: number
  water: number
  gas: number
  vehicleMileage: number
  purchasedSteam: number
  electricityCO2: number
  waterCO2: number
  gasCO2: number
  vehicleCO2: number
  steamCO2: number
  totalCO2: number
}

export interface BudgetUsage {
  id: string
  date: string
  item: string
  amount: number
  category: string
  note?: string
}

export interface Milestone {
  id: string
  name: string
  targetDate: string
  actualDate?: string
  status: "pending" | "in_progress" | "completed" | "delayed"
  description?: string
}

export interface EmissionImpact {
  id: string
  month: string
  baseline: number
  actual: number
  reduction: number
  note?: string
}

export interface Measure {
  id: string
  name: string
  buildingId: string
  responsiblePerson: string
  budget: number
  estimatedReduction: number
  actualReduction: number
  startDate: string
  endDate: string
  status: "planning" | "executing" | "completed" | "paused"
  description: string
  budgetUsage: BudgetUsage[]
  milestones: Milestone[]
  emissionImpacts: EmissionImpact[]
}

export interface AnnualTarget {
  id: string
  buildingId: string
  year: number
  targetCO2: number
  department: string
}

export interface AnomalyItem {
  id: string
  month: string
  buildingName: string
  description: string
  severity: "low" | "medium" | "high"
}

export interface TodoItem {
  id: string
  title: string
  type: "overdue_measure" | "expiring_project" | "missing_data"
  dueDate: string
  status: "pending" | "done"
}

export interface QuarterlyReport {
  id: string
  year: number
  quarter: number
  totalEmission: number
  yoyChange: number
  measureProgress: string
  anomalies: AnomalyItem[]
  todos: TodoItem[]
}

export const EMISSION_FACTORS = {
  electricity: 0.581,
  water: 0.148,
  gas: 2.1622,
  vehicleMileage: 0.21,
  purchasedSteam: 0.11,
} as const

export const EMISSION_LABELS: Record<string, string> = {
  electricity: "电力",
  water: "水",
  gas: "燃气",
  vehicleMileage: "车辆里程",
  purchasedSteam: "外购蒸汽",
}

export const EMISSION_UNITS: Record<string, string> = {
  electricity: "kWh",
  water: "吨",
  gas: "m³",
  vehicleMileage: "km",
  purchasedSteam: "GJ",
}

export const MEASURE_STATUS_LABELS: Record<string, string> = {
  planning: "规划中",
  executing: "执行中",
  completed: "已完成",
  paused: "已暂停",
}

export const MEASURE_STATUS_COLORS: Record<string, string> = {
  planning: "bg-blue-100 text-blue-700",
  executing: "bg-amber-100 text-amber-700",
  completed: "bg-emerald-100 text-emerald-700",
  paused: "bg-gray-100 text-gray-600",
}
