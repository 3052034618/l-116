import { create } from "zustand"
import type { Building, EmissionRecord, Measure, AnnualTarget, BudgetUsage, Milestone, EmissionImpact } from "@/types"
import { EMISSION_FACTORS } from "@/types"
import { buildings as initBuildings, emissionRecords as initEmissionRecords, measures as initMeasures, annualTargets as initAnnualTargets } from "@/data/mockData"

const STORAGE_KEY = "carbon-neutral-store-v1"

interface PersistedData {
  emissionRecords: EmissionRecord[]
  measures: Measure[]
  annualTargets: AnnualTarget[]
  todoStatuses: Record<string, "pending" | "done">
  selectedBuildingId: string | null
  persistedAt: number
}

function loadFromStorage(): PersistedData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function saveToStorage(state: Omit<StoreState, "buildings" | keyof StoreActions> & { todoStatuses: Record<string, "pending" | "done"> }) {
  try {
    const data: PersistedData = {
      emissionRecords: state.emissionRecords,
      measures: state.measures,
      annualTargets: state.annualTargets,
      todoStatuses: state.todoStatuses,
      selectedBuildingId: state.selectedBuildingId,
      persistedAt: Date.now(),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
  }
}

function getInitialState() {
  const persisted = loadFromStorage()
  return {
    buildings: initBuildings,
    emissionRecords: persisted?.emissionRecords ?? initEmissionRecords,
    measures: persisted?.measures ?? initMeasures,
    annualTargets: persisted?.annualTargets ?? initAnnualTargets,
    selectedBuildingId: persisted?.selectedBuildingId ?? null,
    todoStatuses: persisted?.todoStatuses ?? {},
  }
}

interface StoreState {
  buildings: Building[]
  emissionRecords: EmissionRecord[]
  measures: Measure[]
  annualTargets: AnnualTarget[]
  selectedBuildingId: string | null
  todoStatuses: Record<string, "pending" | "done">
}

interface StoreActions {
  setSelectedBuilding: (id: string | null) => void

  addEmissionRecord: (record: Omit<EmissionRecord, "id" | "electricityCO2" | "waterCO2" | "gasCO2" | "vehicleCO2" | "steamCO2" | "totalCO2">) => void
  updateEmissionRecord: (id: string, record: Omit<EmissionRecord, "id" | "electricityCO2" | "waterCO2" | "gasCO2" | "vehicleCO2" | "steamCO2" | "totalCO2">) => void
  deleteEmissionRecord: (id: string) => void

  addMeasure: (measure: Omit<Measure, "id" | "budgetUsage" | "milestones" | "emissionImpacts">) => void
  updateMeasure: (id: string, measure: Partial<Measure>) => void
  deleteMeasure: (id: string) => void

  addBudgetUsage: (measureId: string, item: Omit<BudgetUsage, "id">) => void
  updateBudgetUsage: (measureId: string, itemId: string, item: Partial<BudgetUsage>) => void
  deleteBudgetUsage: (measureId: string, itemId: string) => void

  addMilestone: (measureId: string, milestone: Omit<Milestone, "id">) => void
  updateMilestone: (measureId: string, milestoneId: string, milestone: Partial<Milestone>) => void
  deleteMilestone: (measureId: string, milestoneId: string) => void

  addEmissionImpact: (measureId: string, impact: Omit<EmissionImpact, "id">) => void
  updateEmissionImpact: (measureId: string, impactId: string, impact: Partial<EmissionImpact>) => void
  deleteEmissionImpact: (measureId: string, impactId: string) => void

  addAnnualTarget: (target: Omit<AnnualTarget, "id">) => void
  updateAnnualTarget: (id: string, target: Partial<AnnualTarget>) => void
  deleteAnnualTarget: (id: string) => void

  setTodoStatus: (todoId: string, status: "pending" | "done") => void

  resetToMockData: () => void
}

function calcCO2(electricity: number, water: number, gas: number, vehicleMileage: number, purchasedSteam: number) {
  const electricityCO2 = +(electricity * EMISSION_FACTORS.electricity).toFixed(2)
  const waterCO2 = +(water * EMISSION_FACTORS.water).toFixed(2)
  const gasCO2 = +(gas * EMISSION_FACTORS.gas).toFixed(2)
  const vehicleCO2 = +(vehicleMileage * EMISSION_FACTORS.vehicleMileage).toFixed(2)
  const steamCO2 = +(purchasedSteam * EMISSION_FACTORS.purchasedSteam).toFixed(2)
  const totalCO2 = +(electricityCO2 + waterCO2 + gasCO2 + vehicleCO2 + steamCO2).toFixed(2)
  return { electricityCO2, waterCO2, gasCO2, vehicleCO2, steamCO2, totalCO2 }
}

export const useStore = create<StoreState & StoreActions>((set, get) => {
  const initialState = getInitialState()

  const persist = () => {
    const state = get()
    saveToStorage({
      emissionRecords: state.emissionRecords,
      measures: state.measures,
      annualTargets: state.annualTargets,
      todoStatuses: state.todoStatuses,
      selectedBuildingId: state.selectedBuildingId,
    })
  }

  return {
    ...initialState,

    setSelectedBuilding: (id) => { set({ selectedBuildingId: id }); persist() },

    addEmissionRecord: (record) => {
      set((state) => {
        const co2 = calcCO2(record.electricity, record.water, record.gas, record.vehicleMileage, record.purchasedSteam)
        const newRecord: EmissionRecord = {
          ...record,
          id: `e${Date.now()}`,
          ...co2,
        }
        return { emissionRecords: [...state.emissionRecords, newRecord] }
      })
      persist()
    },

    updateEmissionRecord: (id, record) => {
      set((state) => ({
        emissionRecords: state.emissionRecords.map((r) => {
          if (r.id !== id) return r
          const co2 = calcCO2(record.electricity, record.water, record.gas, record.vehicleMileage, record.purchasedSteam)
          return { ...r, ...record, ...co2 }
        }),
      }))
      persist()
    },

    deleteEmissionRecord: (id) => {
      set((state) => ({
        emissionRecords: state.emissionRecords.filter((r) => r.id !== id),
      }))
      persist()
    },

    addMeasure: (measure) => {
      set((state) => ({
        measures: [
          ...state.measures,
          {
            ...measure,
            id: `m${Date.now()}`,
            budgetUsage: [],
            milestones: [],
            emissionImpacts: [],
          },
        ],
      }))
      persist()
    },

    updateMeasure: (id, measure) => {
      set((state) => ({
        measures: state.measures.map((m) => (m.id === id ? { ...m, ...measure } : m)),
      }))
      persist()
    },

    deleteMeasure: (id) => {
      set((state) => ({
        measures: state.measures.filter((m) => m.id !== id),
      }))
      persist()
    },

    addBudgetUsage: (measureId, item) => {
      set((state) => ({
        measures: state.measures.map((m) =>
          m.id === measureId
            ? { ...m, budgetUsage: [...m.budgetUsage, { ...item, id: `bu${Date.now()}` }] }
            : m
        ),
      }))
      persist()
    },

    updateBudgetUsage: (measureId, itemId, item) => {
      set((state) => ({
        measures: state.measures.map((m) =>
          m.id === measureId
            ? {
                ...m,
                budgetUsage: m.budgetUsage.map((b) => (b.id === itemId ? { ...b, ...item } : b)),
              }
            : m
        ),
      }))
      persist()
    },

    deleteBudgetUsage: (measureId, itemId) => {
      set((state) => ({
        measures: state.measures.map((m) =>
          m.id === measureId
            ? { ...m, budgetUsage: m.budgetUsage.filter((b) => b.id !== itemId) }
            : m
        ),
      }))
      persist()
    },

    addMilestone: (measureId, milestone) => {
      set((state) => ({
        measures: state.measures.map((m) =>
          m.id === measureId
            ? { ...m, milestones: [...m.milestones, { ...milestone, id: `ms${Date.now()}` }] }
            : m
        ),
      }))
      persist()
    },

    updateMilestone: (measureId, milestoneId, milestone) => {
      set((state) => ({
        measures: state.measures.map((m) =>
          m.id === measureId
            ? {
                ...m,
                milestones: m.milestones.map((ms) => (ms.id === milestoneId ? { ...ms, ...milestone } : ms)),
              }
            : m
        ),
      }))
      persist()
    },

    deleteMilestone: (measureId, milestoneId) => {
      set((state) => ({
        measures: state.measures.map((m) =>
          m.id === measureId
            ? { ...m, milestones: m.milestones.filter((ms) => ms.id !== milestoneId) }
            : m
        ),
      }))
      persist()
    },

    addEmissionImpact: (measureId, impact) => {
      set((state) => ({
        measures: state.measures.map((m) =>
          m.id === measureId
            ? { ...m, emissionImpacts: [...m.emissionImpacts, { ...impact, id: `ei${Date.now()}` }] }
            : m
        ),
      }))
      persist()
    },

    updateEmissionImpact: (measureId, impactId, impact) => {
      set((state) => ({
        measures: state.measures.map((m) =>
          m.id === measureId
            ? {
                ...m,
                emissionImpacts: m.emissionImpacts.map((ei) => (ei.id === impactId ? { ...ei, ...impact } : ei)),
              }
            : m
        ),
      }))
      persist()
    },

    deleteEmissionImpact: (measureId, impactId) => {
      set((state) => ({
        measures: state.measures.map((m) =>
          m.id === measureId
            ? { ...m, emissionImpacts: m.emissionImpacts.filter((ei) => ei.id !== impactId) }
            : m
        ),
      }))
      persist()
    },

    addAnnualTarget: (target) => {
      set((state) => ({
        annualTargets: [...state.annualTargets, { ...target, id: `t${Date.now()}` }],
      }))
      persist()
    },

    updateAnnualTarget: (id, target) => {
      set((state) => ({
        annualTargets: state.annualTargets.map((t) => (t.id === id ? { ...t, ...target } : t)),
      }))
      persist()
    },

    deleteAnnualTarget: (id) => {
      set((state) => ({
        annualTargets: state.annualTargets.filter((t) => t.id !== id),
      }))
      persist()
    },

    setTodoStatus: (todoId, status) => {
      set((state) => ({
        todoStatuses: { ...state.todoStatuses, [todoId]: status },
      }))
      persist()
    },

    resetToMockData: () => {
      localStorage.removeItem(STORAGE_KEY)
      set({
        emissionRecords: initEmissionRecords,
        measures: initMeasures,
        annualTargets: initAnnualTargets,
        selectedBuildingId: null,
        todoStatuses: {},
      })
    },
  }
})
