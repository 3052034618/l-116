import type { Building, EmissionRecord, Measure, AnnualTarget, QuarterlyReport } from "@/types"
import { EMISSION_FACTORS } from "@/types"

export const buildings: Building[] = [
  { id: "b1", name: "A栋·研发中心", area: 18500, department: "研发部" },
  { id: "b2", name: "B栋·制造车间", area: 24000, department: "生产部" },
  { id: "b3", name: "C栋·办公楼", area: 12000, department: "行政部" },
  { id: "b4", name: "D栋·数据中心", area: 8000, department: "IT部" },
  { id: "b5", name: "E栋·仓储物流", area: 15000, department: "物流部" },
]

function calcCO2(electricity: number, water: number, gas: number, vehicleMileage: number, purchasedSteam: number) {
  const electricityCO2 = +(electricity * EMISSION_FACTORS.electricity).toFixed(2)
  const waterCO2 = +(water * EMISSION_FACTORS.water).toFixed(2)
  const gasCO2 = +(gas * EMISSION_FACTORS.gas).toFixed(2)
  const vehicleCO2 = +(vehicleMileage * EMISSION_FACTORS.vehicleMileage).toFixed(2)
  const steamCO2 = +(purchasedSteam * EMISSION_FACTORS.purchasedSteam).toFixed(2)
  const totalCO2 = +(electricityCO2 + waterCO2 + gasCO2 + vehicleCO2 + steamCO2).toFixed(2)
  return { electricityCO2, waterCO2, gasCO2, vehicleCO2, steamCO2, totalCO2 }
}

function genEmissionRecord(id: string, buildingId: string, month: string, electricity: number, water: number, gas: number, vehicleMileage: number, purchasedSteam: number): EmissionRecord {
  return { id, buildingId, month, electricity, water, gas, vehicleMileage, purchasedSteam, ...calcCO2(electricity, water, gas, vehicleMileage, purchasedSteam) }
}

export const emissionRecords: EmissionRecord[] = [
  genEmissionRecord("e1", "b1", "2025-01", 85000, 1200, 3500, 8000, 120, ),
  genEmissionRecord("e2", "b2", "2025-01", 145000, 2800, 8200, 22000, 450, ),
  genEmissionRecord("e3", "b3", "2025-01", 42000, 800, 1800, 5000, 80, ),
  genEmissionRecord("e4", "b4", "2025-01", 128000, 600, 800, 2000, 320, ),
  genEmissionRecord("e5", "b5", "2025-01", 38000, 500, 4500, 35000, 200, ),
  genEmissionRecord("e6", "b1", "2025-02", 82000, 1100, 3200, 7500, 115, ),
  genEmissionRecord("e7", "b2", "2025-02", 140000, 2600, 7800, 21000, 430, ),
  genEmissionRecord("e8", "b3", "2025-02", 40000, 750, 1600, 4800, 75, ),
  genEmissionRecord("e9", "b4", "2025-02", 125000, 580, 750, 1900, 310, ),
  genEmissionRecord("e10", "b5", "2025-02", 36000, 480, 4200, 33000, 190, ),
  genEmissionRecord("e11", "b1", "2025-03", 88000, 1300, 3800, 8200, 125, ),
  genEmissionRecord("e12", "b2", "2025-03", 150000, 3000, 8500, 23000, 460, ),
  genEmissionRecord("e13", "b3", "2025-03", 44000, 850, 2000, 5200, 85, ),
  genEmissionRecord("e14", "b4", "2025-03", 132000, 620, 850, 2100, 330, ),
  genEmissionRecord("e15", "b5", "2025-03", 40000, 520, 4800, 37000, 210, ),
  genEmissionRecord("e16", "b1", "2025-04", 78000, 1150, 3000, 7800, 110, ),
  genEmissionRecord("e17", "b2", "2025-04", 135000, 2700, 7500, 20000, 420, ),
  genEmissionRecord("e18", "b3", "2025-04", 38000, 700, 1500, 4500, 70, ),
  genEmissionRecord("e19", "b4", "2025-04", 120000, 550, 700, 1800, 300, ),
  genEmissionRecord("e20", "b5", "2025-04", 35000, 460, 4000, 31000, 185, ),
  genEmissionRecord("e21", "b1", "2025-05", 92000, 1400, 4000, 8500, 130, ),
  genEmissionRecord("e22", "b2", "2025-05", 155000, 3200, 9000, 24000, 480, ),
  genEmissionRecord("e23", "b3", "2025-05", 46000, 900, 2200, 5500, 90, ),
  genEmissionRecord("e24", "b4", "2025-05", 135000, 650, 900, 2200, 340, ),
  genEmissionRecord("e25", "b5", "2025-05", 42000, 550, 5200, 38000, 220, ),
  genEmissionRecord("e26", "b1", "2025-06", 95000, 1500, 4200, 9000, 135, ),
  genEmissionRecord("e27", "b2", "2025-06", 160000, 3400, 9500, 25000, 500, ),
  genEmissionRecord("e28", "b3", "2025-06", 48000, 950, 2400, 5800, 95, ),
  genEmissionRecord("e29", "b4", "2025-06", 140000, 700, 950, 2400, 350, ),
  genEmissionRecord("e30", "b5", "2025-06", 45000, 600, 5500, 40000, 230, ),
  genEmissionRecord("e31", "b1", "2025-07", 98000, 1600, 4500, 9500, 140, ),
  genEmissionRecord("e32", "b2", "2025-07", 165000, 3500, 10000, 26000, 520, ),
  genEmissionRecord("e33", "b3", "2025-07", 50000, 1000, 2600, 6000, 100, ),
  genEmissionRecord("e34", "b4", "2025-07", 145000, 720, 1000, 2500, 360, ),
  genEmissionRecord("e35", "b5", "2025-07", 48000, 650, 5800, 42000, 240, ),
  genEmissionRecord("e36", "b1", "2025-08", 96000, 1550, 4300, 9200, 138, ),
  genEmissionRecord("e37", "b2", "2025-08", 162000, 3400, 9800, 25500, 510, ),
  genEmissionRecord("e38", "b3", "2025-08", 49000, 980, 2500, 5900, 98, ),
  genEmissionRecord("e39", "b4", "2025-08", 142000, 710, 980, 2450, 355, ),
  genEmissionRecord("e40", "b5", "2025-08", 46000, 620, 5600, 41000, 235, ),
  genEmissionRecord("e41", "b1", "2025-09", 90000, 1350, 3800, 8800, 125, ),
  genEmissionRecord("e42", "b2", "2025-09", 152000, 3100, 9000, 23500, 470, ),
  genEmissionRecord("e43", "b3", "2025-09", 45000, 880, 2200, 5400, 88, ),
  genEmissionRecord("e44", "b4", "2025-09", 130000, 640, 880, 2200, 325, ),
  genEmissionRecord("e45", "b5", "2025-09", 41000, 530, 5000, 36000, 210, ),
  genEmissionRecord("e46", "b1", "2025-10", 84000, 1200, 3400, 8200, 118, ),
  genEmissionRecord("e47", "b2", "2025-10", 148000, 2900, 8500, 22500, 450, ),
  genEmissionRecord("e48", "b3", "2025-10", 43000, 820, 1900, 5100, 82, ),
  genEmissionRecord("e49", "b4", "2025-10", 126000, 600, 820, 2050, 315, ),
  genEmissionRecord("e50", "b5", "2025-10", 37000, 490, 4500, 34000, 195, ),
  genEmissionRecord("e51", "b1", "2025-11", 80000, 1100, 3100, 7800, 112, ),
  genEmissionRecord("e52", "b2", "2025-11", 142000, 2700, 8000, 21500, 440, ),
  genEmissionRecord("e53", "b3", "2025-11", 41000, 780, 1700, 4900, 78, ),
  genEmissionRecord("e54", "b4", "2025-11", 122000, 580, 780, 1950, 305, ),
  genEmissionRecord("e55", "b5", "2025-11", 34000, 470, 4200, 32000, 185, ),
  genEmissionRecord("e56", "b1", "2025-12", 82000, 1150, 3300, 8000, 116, ),
  genEmissionRecord("e57", "b2", "2025-12", 146000, 2850, 8300, 22000, 445, ),
  genEmissionRecord("e58", "b3", "2025-12", 42000, 800, 1800, 5000, 80, ),
  genEmissionRecord("e59", "b4", "2025-12", 124000, 590, 800, 2000, 310, ),
  genEmissionRecord("e60", "b5", "2025-12", 36000, 480, 4400, 33500, 190, ),
]

export const measures: Measure[] = [
  { id: "m1", name: "A栋LED照明改造", buildingId: "b1", responsiblePerson: "张伟", budget: 120000, estimatedReduction: 28, actualReduction: 25, startDate: "2025-01-15", endDate: "2025-06-30", status: "completed", description: "将A栋全部传统灯具更换为LED节能灯具",
    budgetUsage: [
      { id: "bu1", date: "2025-02-10", item: "LED灯具采购", amount: 85000, category: "设备采购" },
      { id: "bu2", date: "2025-03-15", item: "安装施工费", amount: 28000, category: "施工服务" },
      { id: "bu3", date: "2025-06-20", item: "验收检测费", amount: 5000, category: "检测服务" },
    ],
    milestones: [
      { id: "ms1", name: "方案设计审批", targetDate: "2025-02-01", actualDate: "2025-01-28", status: "completed" },
      { id: "ms2", name: "灯具采购到货", targetDate: "2025-02-28", actualDate: "2025-03-05", status: "completed" },
      { id: "ms3", name: "安装施工完成", targetDate: "2025-05-31", actualDate: "2025-06-10", status: "completed" },
      { id: "ms4", name: "验收交付", targetDate: "2025-06-30", actualDate: "2025-06-28", status: "completed" },
    ],
    emissionImpacts: [
      { id: "ei1", month: "2025-07", baseline: 55000, actual: 48000, reduction: 7000, note: "改造后第一个月" },
      { id: "ei2", month: "2025-08", baseline: 56000, actual: 49000, reduction: 7000, note: "持续稳定" },
      { id: "ei3", month: "2025-09", baseline: 52000, actual: 46000, reduction: 6000, note: "季节性降低" },
    ],
  },
  { id: "m2", name: "B栋余热回收系统", buildingId: "b2", responsiblePerson: "李明", budget: 580000, estimatedReduction: 120, actualReduction: 85, startDate: "2025-03-01", endDate: "2025-12-31", status: "executing", description: "安装余热回收装置，回收生产余热用于供暖",
    budgetUsage: [
      { id: "bu4", date: "2025-03-20", item: "换热器设备", amount: 320000, category: "设备采购" },
      { id: "bu5", date: "2025-05-10", item: "管道工程", amount: 150000, category: "施工服务" },
      { id: "bu6", date: "2025-08-15", item: "控制系统", amount: 60000, category: "设备采购" },
    ],
    milestones: [
      { id: "ms5", name: "方案设计审批", targetDate: "2025-03-15", actualDate: "2025-03-12", status: "completed" },
      { id: "ms6", name: "主体设备安装", targetDate: "2025-06-30", actualDate: "2025-07-05", status: "completed" },
      { id: "ms7", name: "调试运行", targetDate: "2025-09-30", actualDate: "2025-10-10", status: "completed" },
      { id: "ms8", name: "验收交付", targetDate: "2025-12-31", status: "pending" },
    ],
    emissionImpacts: [
      { id: "ei4", month: "2025-10", baseline: 152000, actual: 145000, reduction: 7000, note: "调试期效果初显" },
      { id: "ei5", month: "2025-11", baseline: 142000, actual: 134000, reduction: 8000, note: "冬季供暖期" },
      { id: "ei6", month: "2025-12", baseline: 146000, actual: 138000, reduction: 8000, note: "持续运行" },
    ],
  },
  { id: "m3", name: "C栋智能空调控制", buildingId: "b3", responsiblePerson: "王芳", budget: 85000, estimatedReduction: 35, actualReduction: 30, startDate: "2025-02-01", endDate: "2025-08-31", status: "completed", description: "部署智能温控系统，根据人流量自动调节空调运行",
    budgetUsage: [
      { id: "bu7", date: "2025-03-01", item: "温控器设备", amount: 55000, category: "设备采购" },
      { id: "bu8", date: "2025-05-15", item: "安装调试", amount: 25000, category: "施工服务" },
    ],
    milestones: [
      { id: "ms9", name: "需求确认", targetDate: "2025-02-15", actualDate: "2025-02-12", status: "completed" },
      { id: "ms10", name: "设备采购", targetDate: "2025-03-31", actualDate: "2025-03-20", status: "completed" },
      { id: "ms11", name: "安装调试", targetDate: "2025-06-30", actualDate: "2025-06-25", status: "completed" },
      { id: "ms12", name: "验收", targetDate: "2025-08-31", actualDate: "2025-08-28", status: "completed" },
    ],
    emissionImpacts: [
      { id: "ei7", month: "2025-07", baseline: 50000, actual: 43000, reduction: 7000 },
      { id: "ei8", month: "2025-08", baseline: 49000, actual: 42500, reduction: 6500 },
      { id: "ei9", month: "2025-09", baseline: 45000, actual: 39500, reduction: 5500 },
    ],
  },
  { id: "m4", name: "D栋服务器虚拟化整合", buildingId: "b4", responsiblePerson: "刘洋", budget: 320000, estimatedReduction: 95, actualReduction: 0, startDate: "2025-07-01", endDate: "2026-03-31", status: "executing", description: "将物理服务器整合为虚拟化集群，降低数据中心能耗",
    budgetUsage: [
      { id: "bu9", date: "2025-08-10", item: "虚拟化软件授权", amount: 180000, category: "软件采购" },
      { id: "bu10", date: "2025-10-15", item: "服务器硬件升级", amount: 100000, category: "设备采购" },
    ],
    milestones: [
      { id: "ms13", name: "现状评估", targetDate: "2025-07-31", actualDate: "2025-07-28", status: "completed" },
      { id: "ms14", name: "方案设计", targetDate: "2025-08-31", actualDate: "2025-08-25", status: "completed" },
      { id: "ms15", name: "实施阶段一", targetDate: "2025-12-31", actualDate: "2026-01-05", status: "completed" },
      { id: "ms16", name: "实施阶段二", targetDate: "2026-03-31", status: "in_progress" },
    ],
    emissionImpacts: [],
  },
  { id: "m5", name: "E栋电动叉车替换", buildingId: "b5", responsiblePerson: "赵强", budget: 450000, estimatedReduction: 55, actualReduction: 0, startDate: "2025-09-01", endDate: "2026-06-30", status: "planning", description: "将柴油叉车逐步替换为电动叉车",
    budgetUsage: [],
    milestones: [
      { id: "ms17", name: "选型采购", targetDate: "2025-11-30", status: "in_progress" },
      { id: "ms18", name: "首批交付", targetDate: "2026-02-28", status: "pending" },
      { id: "ms19", name: "全部替换完成", targetDate: "2026-06-30", status: "pending" },
    ],
    emissionImpacts: [],
  },
  { id: "m6", name: "园区光伏发电项目", buildingId: "b1", responsiblePerson: "陈磊", budget: 1200000, estimatedReduction: 200, actualReduction: 0, startDate: "2025-10-01", endDate: "2026-12-31", status: "planning", description: "在A栋和B栋屋顶安装分布式光伏发电系统",
    budgetUsage: [],
    milestones: [
      { id: "ms20", name: "报批备案", targetDate: "2025-12-31", status: "in_progress" },
      { id: "ms21", name: "设计招标", targetDate: "2026-02-28", status: "pending" },
      { id: "ms22", name: "施工安装", targetDate: "2026-06-30", status: "pending" },
      { id: "ms23", name: "并网发电", targetDate: "2026-12-31", status: "pending" },
    ],
    emissionImpacts: [],
  },
  { id: "m7", name: "B栋空压机变频改造", buildingId: "b2", responsiblePerson: "孙涛", budget: 180000, estimatedReduction: 48, actualReduction: 40, startDate: "2025-04-01", endDate: "2025-10-31", status: "completed", description: "将定频空压机升级为变频空压机",
    budgetUsage: [
      { id: "bu11", date: "2025-04-20", item: "变频空压机", amount: 140000, category: "设备采购" },
      { id: "bu12", date: "2025-06-10", item: "安装调试", amount: 35000, category: "施工服务" },
    ],
    milestones: [
      { id: "ms24", name: "设备选型", targetDate: "2025-04-15", actualDate: "2025-04-10", status: "completed" },
      { id: "ms25", name: "采购到货", targetDate: "2025-05-31", actualDate: "2025-05-25", status: "completed" },
      { id: "ms26", name: "安装调试", targetDate: "2025-08-31", actualDate: "2025-08-20", status: "completed" },
      { id: "ms27", name: "验收", targetDate: "2025-10-31", actualDate: "2025-10-25", status: "completed" },
    ],
    emissionImpacts: [
      { id: "ei10", month: "2025-09", baseline: 162000, actual: 155000, reduction: 7000 },
      { id: "ei11", month: "2025-10", baseline: 148000, actual: 141000, reduction: 7000 },
    ],
  },
  { id: "m8", name: "C栋雨水回收利用", buildingId: "b3", responsiblePerson: "周静", budget: 95000, estimatedReduction: 12, actualReduction: 8, startDate: "2025-05-01", endDate: "2025-11-30", status: "completed", description: "建设雨水收集系统用于绿化灌溉和卫生间冲水",
    budgetUsage: [
      { id: "bu13", date: "2025-05-20", item: "储水罐及管道", amount: 65000, category: "设备采购" },
      { id: "bu14", date: "2025-07-15", item: "净化系统", amount: 25000, category: "设备采购" },
    ],
    milestones: [
      { id: "ms28", name: "设计审批", targetDate: "2025-05-15", actualDate: "2025-05-12", status: "completed" },
      { id: "ms29", name: "设施建设", targetDate: "2025-08-31", actualDate: "2025-08-25", status: "completed" },
      { id: "ms30", name: "验收", targetDate: "2025-11-30", actualDate: "2025-11-28", status: "completed" },
    ],
    emissionImpacts: [
      { id: "ei12", month: "2025-09", baseline: 880, actual: 800, reduction: 80 },
      { id: "ei13", month: "2025-10", baseline: 820, actual: 750, reduction: 70 },
    ],
  },
  { id: "m9", name: "D栋冷热通道隔离", buildingId: "b4", responsiblePerson: "刘洋", budget: 150000, estimatedReduction: 60, actualReduction: 0, startDate: "2025-11-01", endDate: "2026-04-30", status: "paused", description: "数据中心机房冷热通道隔离改造，提高制冷效率",
    budgetUsage: [
      { id: "bu15", date: "2025-11-20", item: "隔离门帘采购", amount: 45000, category: "设备采购" },
    ],
    milestones: [
      { id: "ms31", name: "设计方案", targetDate: "2025-11-15", actualDate: "2025-11-10", status: "completed" },
      { id: "ms32", name: "材料采购", targetDate: "2025-12-31", actualDate: "2025-12-15", status: "completed" },
      { id: "ms33", name: "施工改造", targetDate: "2026-03-31", status: "delayed" },
    ],
    emissionImpacts: [],
  },
  { id: "m10", name: "E栋仓库保温改造", buildingId: "b5", responsiblePerson: "赵强", budget: 210000, estimatedReduction: 40, actualReduction: 0, startDate: "2026-01-01", endDate: "2026-06-30", status: "planning", description: "仓库外墙及屋顶加装保温层，降低采暖能耗",
    budgetUsage: [],
    milestones: [
      { id: "ms34", name: "设计招标", targetDate: "2026-01-31", status: "pending" },
      { id: "ms35", name: "材料采购", targetDate: "2026-03-31", status: "pending" },
      { id: "ms36", name: "施工改造", targetDate: "2026-05-31", status: "pending" },
      { id: "ms37", name: "验收", targetDate: "2026-06-30", status: "pending" },
    ],
    emissionImpacts: [],
  },
]

export const annualTargets: AnnualTarget[] = [
  { id: "t1", buildingId: "b1", year: 2025, targetCO2: 750, department: "研发部" },
  { id: "t2", buildingId: "b2", year: 2025, targetCO2: 1500, department: "生产部" },
  { id: "t3", buildingId: "b3", year: 2025, targetCO2: 400, department: "行政部" },
  { id: "t4", buildingId: "b4", year: 2025, targetCO2: 950, department: "IT部" },
  { id: "t5", buildingId: "b5", year: 2025, targetCO2: 600, department: "物流部" },
  { id: "t6", buildingId: "b1", year: 2026, targetCO2: 700, department: "研发部" },
  { id: "t7", buildingId: "b2", year: 2026, targetCO2: 1400, department: "生产部" },
  { id: "t8", buildingId: "b3", year: 2026, targetCO2: 370, department: "行政部" },
  { id: "t9", buildingId: "b4", year: 2026, targetCO2: 880, department: "IT部" },
  { id: "t10", buildingId: "b5", year: 2026, targetCO2: 550, department: "物流部" },
]

export const quarterlyReports: QuarterlyReport[] = [
  {
    id: "r1", year: 2025, quarter: 1,
    totalEmission: 2279.63, yoyChange: -5.2,
    measureProgress: "Q1完成2项措施启动，A栋LED改造完成50%",
    anomalies: [
      { id: "a1", month: "2025-03", buildingName: "B栋·制造车间", description: "3月燃气消耗异常偏高，环比增长8.9%", severity: "medium" },
    ],
    todos: [
      { id: "td1", title: "B栋燃气异常排查", type: "overdue_measure", dueDate: "2025-04-15", status: "pending" },
      { id: "td2", title: "A栋LED改造验收", type: "expiring_project", dueDate: "2025-06-30", status: "pending" },
    ],
  },
  {
    id: "r2", year: 2025, quarter: 2,
    totalEmission: 2531.24, yoyChange: -3.8,
    measureProgress: "Q2完成3项措施，累计减排103吨CO₂",
    anomalies: [
      { id: "a2", month: "2025-06", buildingName: "D栋·数据中心", description: "6月电力消耗达年度峰值，同比增长9.5%", severity: "high" },
    ],
    todos: [
      { id: "td3", title: "D栋电力消耗优化方案", type: "overdue_measure", dueDate: "2025-07-15", status: "pending" },
      { id: "td4", title: "E栋电动叉车采购启动", type: "expiring_project", dueDate: "2025-09-01", status: "pending" },
      { id: "td5", title: "7月排放数据录入", type: "missing_data", dueDate: "2025-08-05", status: "pending" },
    ],
  },
  {
    id: "r3", year: 2025, quarter: 3,
    totalEmission: 2615.87, yoyChange: -2.1,
    measureProgress: "Q3新增2项措施启动，D栋虚拟化项目进入实施阶段",
    anomalies: [],
    todos: [
      { id: "td6", title: "D栋冷热通道改造恢复", type: "overdue_measure", dueDate: "2025-11-15", status: "pending" },
      { id: "td7", title: "E栋仓库保温方案审批", type: "expiring_project", dueDate: "2025-12-31", status: "pending" },
    ],
  },
  {
    id: "r4", year: 2025, quarter: 4,
    totalEmission: 2395.42, yoyChange: -4.5,
    measureProgress: "Q4完成年度减排目标83%，4项措施已完结",
    anomalies: [
      { id: "a3", month: "2025-12", buildingName: "E栋·仓储物流", description: "12月车辆里程数超出预期12%，年末物流高峰", severity: "low" },
    ],
    todos: [
      { id: "td8", title: "2025年度碳核查报告", type: "overdue_measure", dueDate: "2026-01-31", status: "pending" },
      { id: "td9", title: "2026年目标设定", type: "expiring_project", dueDate: "2026-02-28", status: "pending" },
      { id: "td10", title: "光伏项目施工启动", type: "expiring_project", dueDate: "2026-03-01", status: "pending" },
    ],
  },
]
