import { create } from "zustand"
import type { Building, EmissionRecord, Measure, AnnualTarget } from "@/types"
import { EMISSION_FACTORS } from "@/types"
import { buildings as initBuildings, emissionRecords as initEmissionRecords, measures as initMeasures, annualTargets as initAnnualTargets } from "@/data/mockData"

interface StoreState {
  buildings: Building[]
  emissionRecords: EmissionRecord[]
  measures: Measure[]
  annualTargets: AnnualTarget[]
  selectedBuildingId: string | null

  setSelectedBuilding: (id: string | null) => void

  addEmissionRecord: (record: Omit<EmissionRecord, "id" | "electricityCO2" | "waterCO2" | "gasCO2" | "vehicleCO2" | "steamCO2" | "totalCO2">) => void
  updateEmissionRecord: (id: string, record: Omit<EmissionRecord, "id" | "electricityCO2" | "waterCO2" | "gasCO2" | "vehicleCO2" | "steamCO2" | "totalCO2">) => void
  deleteEmissionRecord: (id: string) => void

  addMeasure: (measure: Omit<Measure, "id">) => void
  updateMeasure: (id: string, measure: Partial<Measure>) => void
  deleteMeasure: (id: string) => void

  addAnnualTarget: (target: Omit<AnnualTarget, "id">) => void
  updateAnnualTarget: (id: string, target: Partial<AnnualTarget>) => void
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

export const useStore = create<StoreState>((set) => ({
  buildings: initBuildings,
  emissionRecords: initEmissionRecords,
  measures: initMeasures,
  annualTargets: initAnnualTargets,
  selectedBuildingId: null,

  setSelectedBuilding: (id) => set({ selectedBuildingId: id }),

  addEmissionRecord: (record) =>
    set((state) => {
      const co2 = calcCO2(record.electricity, record.water, record.gas, record.vehicleMileage, record.purchasedSteam)
      const newRecord: EmissionRecord = {
        ...record,
        id: `e${Date.now()}`,
        ...co2,
      }
      return { emissionRecords: [...state.emissionRecords, newRecord] }
    }),

  updateEmissionRecord: (id, record) =>
    set((state) => ({
      emissionRecords: state.emissionRecords.map((r) => {
        if (r.id !== id) return r
        const co2 = calcCO2(record.electricity, record.water, record.gas, record.vehicleMileage, record.purchasedSteam)
        return { ...r, ...record, ...co2 }
      }),
    })),

  deleteEmissionRecord: (id) =>
    set((state) => ({
      emissionRecords: state.emissionRecords.filter((r) => r.id !== id),
    })),

  addMeasure: (measure) =>
    set((state) => ({
      measures: [...state.measures, { ...measure, id: `m${Date.now()}` }],
    })),

  updateMeasure: (id, measure) =>
    set((state) => ({
      measures: state.measures.map((m) => (m.id === id ? { ...m, ...measure } : m)),
    })),

  deleteMeasure: (id) =>
    set((state) => ({
      measures: state.measures.filter((m) => m.id !== id),
    })),

  addAnnualTarget: (target) =>
    set((state) => ({
      annualTargets: [...state.annualTargets, { ...target, id: `t${Date.now()}` }],
    })),

  updateAnnualTarget: (id, target) =>
    set((state) => ({
      annualTargets: state.annualTargets.map((t) => (t.id === id ? { ...t, ...target } : t)),
    })),
}))
