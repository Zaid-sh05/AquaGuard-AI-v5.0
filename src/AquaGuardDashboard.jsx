import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  AreaChart,
  Area,
} from "recharts";
import {
  Activity,
  AlertTriangle,
  Zap,
  Shield,
  Droplets,
  MapPin,
  Radio,
  TrendingDown,
  ChevronDown,
  Search,
  RefreshCw,
  Settings,
  Eye,
  Bell,
  Cpu,
  GitBranch,
  Waves,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Gauge,
  Sliders,
  Database,
} from "lucide-react";

// ══════════════════════════════════════════════════════════════════════════════
// API CONFIGURATION — paste your ngrok URL here when running Colab backend
// ══════════════════════════════════════════════════════════════════════════════
const API_URL = "https://abc123.ngrok.io"; // ← paste ngrok URL here

async function apiPost(path, body) {
  if (!API_URL) return null;
  try {
    const r = await fetch(API_URL + path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      mode: "cors",
    });
    return r.ok ? r.json() : null;
  } catch {
    return null;
  }
}

async function apiGet(path) {
  if (!API_URL) return null;
  try {
    const r = await fetch(API_URL + path, { mode: "cors" });
    return r.ok ? r.json() : null;
  } catch {
    return null;
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// NETWORK DATA — All 12 Jordan Governorates (with reservoir capacities)
// ══════════════════════════════════════════════════════════════════════════════
// reservoirCap = initial reservoir capacity in m³ (realistic WAJ-style values)
const NETWORK = {
  Amman: {
    label: "عمّان",
    source: "King Abdullah Canal / Zai-WTP",
    nrw: 0.43,
    flowR: [80, 1400],
    presR: [60, 125],
    elev: 780,
    pop: 5540,
    color: "#38bdf8",
    target_nrw: 0.3,
    reservoirCap: 180000,
    branches: {
      East: {
        color: "#38bdf8",
        segs: [
          { f: "AMM-Main", t: "Marka", len: 820, age: 22, hw: 125 },
          { f: "Marka", t: "Abu-Nsair", len: 650, age: 28, hw: 118 },
          { f: "Abu-Nsair", t: "Hashmi", len: 480, age: 35, hw: 108 },
          { f: "Hashmi", t: "Basman", len: 390, age: 40, hw: 100 },
        ],
      },
      West: {
        color: "#22c55e",
        segs: [
          { f: "AMM-Main", t: "Abdoun", len: 750, age: 15, hw: 140 },
          { f: "Abdoun", t: "Sweifieh", len: 620, age: 18, hw: 136 },
          { f: "Sweifieh", t: "Jubaiha", len: 530, age: 22, hw: 128 },
          { f: "Jubaiha", t: "Khilda", len: 460, age: 20, hw: 132 },
        ],
      },
      North: {
        color: "#f59e0b",
        segs: [
          { f: "AMM-Main", t: "Shmeisani", len: 680, age: 20, hw: 132 },
          { f: "Shmeisani", t: "Rabieh", len: 710, age: 25, hw: 126 },
          { f: "Rabieh", t: "Tla-Ali", len: 590, age: 18, hw: 138 },
        ],
      },
      South: {
        color: "#a855f7",
        segs: [
          { f: "AMM-Main", t: "Sahab", len: 900, age: 30, hw: 115 },
          { f: "Sahab", t: "Yadoudeh", len: 800, age: 35, hw: 108 },
          { f: "Yadoudeh", t: "Muwaqqar", len: 720, age: 40, hw: 102 },
        ],
      },
      Central: {
        color: "#ef4444",
        segs: [
          { f: "AMM-Main", t: "Gardens", len: 600, age: 12, hw: 145 },
          { f: "Gardens", t: "Um-Uthaina", len: 550, age: 15, hw: 141 },
          { f: "Um-Uthaina", t: "Khalda", len: 490, age: 18, hw: 138 },
        ],
      },
    },
  },
  Irbid: {
    label: "إربد",
    source: "Yarmouk River WTP",
    nrw: 0.45,
    flowR: [60, 800],
    presR: [45, 100],
    elev: 620,
    pop: 3280,
    color: "#22c55e",
    target_nrw: 0.32,
    reservoirCap: 95000,
    branches: {
      Central: {
        color: "#38bdf8",
        segs: [
          { f: "IRB-Main", t: "Husn", len: 700, age: 20, hw: 130 },
          { f: "Husn", t: "Manara", len: 620, age: 25, hw: 122 },
          { f: "Manara", t: "Ramtha", len: 550, age: 30, hw: 115 },
        ],
      },
      North: {
        color: "#22c55e",
        segs: [
          { f: "IRB-Main", t: "Al-Huson", len: 680, age: 18, hw: 135 },
          { f: "Al-Huson", t: "Bait-Ras", len: 590, age: 22, hw: 128 },
          { f: "Bait-Ras", t: "Kufr-Asad", len: 510, age: 28, hw: 120 },
        ],
      },
      West: {
        color: "#f59e0b",
        segs: [
          { f: "IRB-Main", t: "Koura", len: 850, age: 35, hw: 108 },
          { f: "Koura", t: "Kufrinja", len: 780, age: 40, hw: 100 },
          { f: "Kufrinja", t: "Deir-Said", len: 650, age: 45, hw: 95 },
        ],
      },
      South: {
        color: "#a855f7",
        segs: [
          { f: "IRB-Main", t: "Aydoun", len: 760, age: 28, hw: 118 },
          { f: "Aydoun", t: "Bani-Kinana", len: 680, age: 32, hw: 112 },
          { f: "Bani-Kinana", t: "Tibne", len: 600, age: 38, hw: 106 },
        ],
      },
    },
  },
  Zarqa: {
    label: "الزرقاء",
    source: "Zarqa Municipal Reservoirs",
    nrw: 0.52,
    flowR: [50, 620],
    presR: [35, 90],
    elev: 580,
    pop: 4120,
    color: "#f59e0b",
    target_nrw: 0.35,
    reservoirCap: 72000,
    branches: {
      "Old-City": {
        color: "#38bdf8",
        segs: [
          { f: "ZRQ-Main", t: "Zarqa-Center", len: 920, age: 42, hw: 96 },
          { f: "Zarqa-Center", t: "Rusaifa", len: 850, age: 48, hw: 90 },
          { f: "Rusaifa", t: "New-Zarqa", len: 780, age: 52, hw: 86 },
        ],
      },
      Industrial: {
        color: "#22c55e",
        segs: [
          { f: "ZRQ-Main", t: "Ind-Zone", len: 800, age: 30, hw: 112 },
          { f: "Ind-Zone", t: "Hashimiyya", len: 720, age: 35, hw: 106 },
          { f: "Hashimiyya", t: "Dhiban", len: 650, age: 38, hw: 101 },
        ],
      },
      East: {
        color: "#f59e0b",
        segs: [
          { f: "ZRQ-Main", t: "Azraq", len: 1200, age: 20, hw: 138 },
          { f: "Azraq", t: "Safawi", len: 1100, age: 15, hw: 142 },
          { f: "Safawi", t: "Ruwaished", len: 900, age: 12, hw: 146 },
        ],
      },
    },
  },
  Karak: {
    label: "الكرك",
    source: "Karak WAJ Supply",
    nrw: 0.56,
    flowR: [15, 220],
    presR: [25, 72],
    elev: 930,
    pop: 85,
    color: "#ef4444",
    target_nrw: 0.38,
    reservoirCap: 28000,
    branches: {
      Central: {
        color: "#38bdf8",
        segs: [
          { f: "KRK-Main", t: "Karak-City", len: 950, age: 45, hw: 90 },
          { f: "Karak-City", t: "Mazar", len: 880, age: 50, hw: 85 },
          { f: "Mazar", t: "Mutah", len: 800, age: 55, hw: 80 },
        ],
      },
      North: {
        color: "#22c55e",
        segs: [
          { f: "KRK-Main", t: "Al-Qasr", len: 820, age: 38, hw: 98 },
          { f: "Al-Qasr", t: "Safi", len: 760, age: 42, hw: 93 },
          { f: "Safi", t: "Al-Lajjun", len: 680, age: 48, hw: 87 },
        ],
      },
    },
  },
  Aqaba: {
    label: "العقبة",
    source: "Aqaba Desalination Plant",
    nrw: 0.41,
    flowR: [25, 380],
    presR: [35, 92],
    elev: 10,
    pop: 310,
    color: "#06b6d4",
    target_nrw: 0.28,
    reservoirCap: 45000,
    branches: {
      Port: {
        color: "#38bdf8",
        segs: [
          { f: "AQB-Main", t: "Aqaba-Port", len: 700, age: 20, hw: 132 },
          { f: "Aqaba-Port", t: "Ind-Zone-AQ", len: 650, age: 25, hw: 126 },
          { f: "Ind-Zone-AQ", t: "South-Aqaba", len: 580, age: 18, hw: 138 },
        ],
      },
      Residential: {
        color: "#22c55e",
        segs: [
          { f: "AQB-Main", t: "Aqaba-Center", len: 620, age: 15, hw: 140 },
          { f: "Aqaba-Center", t: "Quweira", len: 580, age: 20, hw: 134 },
          { f: "Quweira", t: "Wadi-Rum", len: 520, age: 25, hw: 128 },
        ],
      },
    },
  },
  Mafraq: {
    label: "المفرق",
    source: "Mafraq Groundwater Wells",
    nrw: 0.5,
    flowR: [20, 320],
    presR: [28, 78],
    elev: 690,
    pop: 13,
    color: "#8b5cf6",
    target_nrw: 0.33,
    reservoirCap: 35000,
    branches: {
      Central: {
        color: "#38bdf8",
        segs: [
          { f: "MFQ-Main", t: "Mafraq-City", len: 1100, age: 15, hw: 140 },
          { f: "Mafraq-City", t: "Rhab", len: 980, age: 18, hw: 136 },
          { f: "Rhab", t: "Umm-Jimal", len: 850, age: 22, hw: 130 },
        ],
      },
      North: {
        color: "#22c55e",
        segs: [
          { f: "MFQ-Main", t: "Safawi-Town", len: 1300, age: 12, hw: 145 },
          { f: "Safawi-Town", t: "Ruwaished-N", len: 1200, age: 15, hw: 142 },
          { f: "Ruwaished-N", t: "Azraq-N", len: 1100, age: 18, hw: 138 },
        ],
      },
    },
  },
  Maan: {
    label: "معان",
    source: "Maan Groundwater Wells",
    nrw: 0.55,
    flowR: [8, 170],
    presR: [20, 68],
    elev: 1070,
    pop: 4,
    color: "#fb923c",
    target_nrw: 0.36,
    reservoirCap: 22000,
    branches: {
      City: {
        color: "#38bdf8",
        segs: [
          { f: "MAN-Main", t: "Maan-Center", len: 950, age: 18, hw: 138 },
          { f: "Maan-Center", t: "Qatraneh", len: 880, age: 22, hw: 132 },
          { f: "Qatraneh", t: "Jafr", len: 800, age: 28, hw: 125 },
        ],
      },
      South: {
        color: "#22c55e",
        segs: [
          { f: "MAN-Main", t: "Wadi-Musa", len: 1050, age: 22, hw: 132 },
          { f: "Wadi-Musa", t: "Shobak", len: 980, age: 28, hw: 125 },
          { f: "Shobak", t: "Ras-Naqab", len: 900, age: 35, hw: 117 },
        ],
      },
    },
  },
  Ajloun: {
    label: "عجلون",
    source: "Ajloun Spring Network",
    nrw: 0.54,
    flowR: [5, 120],
    presR: [22, 62],
    elev: 1250,
    pop: 393,
    color: "#84cc16",
    target_nrw: 0.35,
    reservoirCap: 18000,
    branches: {
      Central: {
        color: "#38bdf8",
        segs: [
          { f: "AJL-Main", t: "Ajloun-City", len: 750, age: 35, hw: 100 },
          { f: "Ajloun-City", t: "Anjara", len: 680, age: 40, hw: 95 },
          { f: "Anjara", t: "Orjan", len: 600, age: 45, hw: 90 },
        ],
      },
      North: {
        color: "#22c55e",
        segs: [
          { f: "AJL-Main", t: "Shtafina", len: 820, age: 30, hw: 105 },
          { f: "Shtafina", t: "Rasun", len: 750, age: 35, hw: 100 },
        ],
      },
    },
  },
  Jerash: {
    label: "جرش",
    source: "Jerash WAJ Network",
    nrw: 0.48,
    flowR: [8, 150],
    presR: [25, 68],
    elev: 600,
    pop: 585,
    color: "#10b981",
    target_nrw: 0.32,
    reservoirCap: 20000,
    branches: {
      City: {
        color: "#38bdf8",
        segs: [
          { f: "JRS-Main", t: "Jerash-City", len: 700, age: 25, hw: 115 },
          { f: "Jerash-City", t: "Sakeb", len: 640, age: 30, hw: 108 },
          { f: "Sakeb", t: "Kufr-Khall", len: 580, age: 35, hw: 102 },
        ],
      },
      South: {
        color: "#22c55e",
        segs: [
          { f: "JRS-Main", t: "Al-Hashimiyya", len: 780, age: 20, hw: 122 },
          { f: "Al-Hashimiyya", t: "Beit-Ras-J", len: 720, age: 25, hw: 116 },
        ],
      },
    },
  },
  Madaba: {
    label: "مادبا",
    source: "Madaba Municipal Wells",
    nrw: 0.51,
    flowR: [10, 200],
    presR: [28, 72],
    elev: 800,
    pop: 202,
    color: "#f472b6",
    target_nrw: 0.34,
    reservoirCap: 24000,
    branches: {
      City: {
        color: "#38bdf8",
        segs: [
          { f: "MDB-Main", t: "Madaba-City", len: 800, age: 28, hw: 112 },
          { f: "Madaba-City", t: "Libb", len: 740, age: 32, hw: 106 },
          { f: "Libb", t: "Yadoudeh-M", len: 680, age: 38, hw: 100 },
        ],
      },
      East: {
        color: "#22c55e",
        segs: [
          { f: "MDB-Main", t: "Dhiban", len: 900, age: 22, hw: 118 },
          { f: "Dhiban", t: "Ar-Rabbah", len: 840, age: 28, hw: 112 },
        ],
      },
    },
  },
  Balqa: {
    label: "البلقاء",
    source: "Balqa WAJ Supply",
    nrw: 0.47,
    flowR: [15, 280],
    presR: [30, 80],
    elev: 900,
    pop: 455,
    color: "#67e8f9",
    target_nrw: 0.31,
    reservoirCap: 32000,
    branches: {
      Central: {
        color: "#38bdf8",
        segs: [
          { f: "BLQ-Main", t: "Salt-City", len: 750, age: 20, hw: 125 },
          { f: "Salt-City", t: "Shuneh-N", len: 700, age: 25, hw: 118 },
          { f: "Shuneh-N", t: "Kafrein", len: 650, age: 30, hw: 112 },
        ],
      },
      West: {
        color: "#22c55e",
        segs: [
          { f: "BLQ-Main", t: "Wadi-Sir", len: 680, age: 15, hw: 130 },
          { f: "Wadi-Sir", t: "Naur", len: 620, age: 20, hw: 124 },
          { f: "Naur", t: "Abu-Nsair-B", len: 560, age: 25, hw: 118 },
        ],
      },
    },
  },
  Tafilah: {
    label: "الطفيلة",
    source: "Tafilah Groundwater",
    nrw: 0.53,
    flowR: [5, 100],
    presR: [20, 65],
    elev: 1100,
    pop: 48,
    color: "#fbbf24",
    target_nrw: 0.36,
    reservoirCap: 16000,
    branches: {
      Central: {
        color: "#38bdf8",
        segs: [
          { f: "TFL-Main", t: "Tafilah-City", len: 850, age: 30, hw: 108 },
          { f: "Tafilah-City", t: "Busaira", len: 800, age: 35, hw: 102 },
          { f: "Busaira", t: "Aina", len: 720, age: 40, hw: 96 },
        ],
      },
      North: {
        color: "#22c55e",
        segs: [
          { f: "TFL-Main", t: "Qadisiyya", len: 900, age: 25, hw: 112 },
          { f: "Qadisiyya", t: "Habis", len: 820, age: 30, hw: 106 },
        ],
      },
    },
  },
};

const ANOMALY_TYPES = ["normal", "leak", "burst", "theft"];
const TYPE_CONFIG = {
  normal: {
    color: "#22c55e",
    glow: "#22c55e40",
    label: "Normal",
    icon: "✓",
    urgency: 0,
  },
  leak: {
    color: "#f59e0b",
    glow: "#f59e0b40",
    label: "Leak",
    icon: "~",
    urgency: 2,
  },
  burst: {
    color: "#ef4444",
    glow: "#ef444440",
    label: "Burst",
    icon: "!",
    urgency: 3,
  },
  theft: {
    color: "#a855f7",
    glow: "#a855f740",
    label: "Theft",
    icon: "?",
    urgency: 1,
  },
};

// ══════════════════════════════════════════════════════════════════════════════
// PHYSICS & ML INFERENCE (unchanged)
// ══════════════════════════════════════════════════════════════════════════════
function darcyDP(flowLpm, lengthM, hw = 128) {
  const D = 0.05,
    Q = Math.max(flowLpm, 0.1) / 60000,
    A = Math.PI * (D / 2) ** 2;
  const v = Q / A,
    Re = Math.max((v * D) / 1.004e-6, 1);
  const eps = 0.26e-3 / D;
  const Ac = (-2.457 * Math.log((7 / Re) ** 0.9 + 0.27 * eps)) ** 16;
  const Bc = (37530 / Re) ** 16;
  const f = 8 * ((8 / Re) ** 12 + (Ac + Bc) ** -1.5) ** (1 / 12);
  return Math.min(
    Math.max(f * (lengthM / D) * (v ** 2 / 19.62) * 1.422, 0.01),
    60
  );
}

function mlInfer(seg) {
  const { flowLoss, dpDev, excessLoss, pipeAge } = seg;
  const lgb = Math.min(
    1,
    (flowLoss * 0.4 + Math.abs(dpDev) * 0.3 + excessLoss * 0.3) / 20
  );
  const xgb = Math.min(
    1,
    (flowLoss * 0.45 + pipeAge * 0.002 + excessLoss * 0.35) / 20
  );
  const nn = Math.min(
    1,
    (flowLoss * 0.5 + Math.abs(dpDev) * 0.25 + excessLoss * 0.25) / 20
  );
  const lstm = Math.min(
    1,
    (flowLoss * 0.35 + Math.abs(dpDev) * 0.4 + excessLoss * 0.25) / 20
  );
  return {
    lgb: +(lgb * 100).toFixed(1),
    xgb: +(xgb * 100).toFixed(1),
    nn: +(nn * 100).toFixed(1),
    lstm: +(lstm * 100).toFixed(1),
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// HYDRAULIC MASS-BALANCE SIMULATION
// ══════════════════════════════════════════════════════════════════════════════
// Key contract: reservoir → branches → segments — all volumes add up.
// Every 40s the pump fires: total branch inflow leaves the reservoir.
// NRW loss factor: a fraction of that outflow "disappears" (leaks/theft)
// so it is tracked separately as systemLoss.

function simulateGov(govKey, forcedType = null) {
  const gov = NETWORK[govKey];
  const h = new Date().getHours();
  const peakFactor =
    (h >= 7 && h <= 9) || (h >= 18 && h <= 21) ? 1.35 : h < 5 ? 0.45 : 1.0;
  const results = [];
  const alerts = [];
  const branchInflows = {}; // branchName → L/min inflow
  let totalBranchInflow = 0;

  Object.entries(gov.branches).forEach(([branchName, branch]) => {
    let flowIn =
      (gov.flowR[0] + Math.random() * (gov.flowR[1] - gov.flowR[0])) *
      peakFactor;
    let pressIn = gov.presR[0] + Math.random() * (gov.presR[1] - gov.presR[0]);
    const branchEntryFlow = flowIn;
    branchInflows[branchName] = branchEntryFlow;
    totalBranchInflow += branchEntryFlow;

    const faultIdx =
      forcedType && forcedType !== "normal"
        ? Math.floor(Math.random() * branch.segs.length)
        : -1;

    branch.segs.forEach((seg, si) => {
      const isFault = si === faultIdx;
      const ftype = isFault
        ? forcedType || null
        : Math.random() < gov.nrw * 0.15
        ? ANOMALY_TYPES[Math.floor(Math.random() * 4)]
        : "normal";
      const dpPred = darcyDP(flowIn, seg.len, seg.hw);
      let sev = 0,
        flowOut = flowIn,
        pressOut = pressIn;

      if (ftype === "leak") {
        sev = 0.04 + Math.random() * 0.14;
        flowOut = flowIn * (1 - sev);
        pressOut = pressIn - dpPred - sev * pressIn * 0.5;
      } else if (ftype === "burst") {
        sev = 0.25 + Math.random() * 0.47;
        flowOut = flowIn * (1 - sev);
        pressOut = pressIn - dpPred - sev * pressIn * 0.8;
      } else if (ftype === "theft") {
        sev = 0.05 + Math.random() * 0.09;
        flowOut = flowIn * (1 - sev);
        pressOut = pressIn - dpPred - sev * pressIn * 0.1;
      } else {
        const bg = 0.003 + seg.age / 5000;
        flowOut = flowIn * (1 - bg);
        pressOut = pressIn - dpPred;
      }

      flowOut = Math.max(flowOut + Math.random() * 0.5 - 0.25, 0.1);
      pressOut = Math.max(pressOut + Math.random() * 0.3 - 0.15, 0.5);
      const flowLoss = ((flowIn - flowOut) / flowIn) * 100;
      const dpActual = pressIn - pressOut;
      const dpDev = dpActual - dpPred;
      const bgRate = (0.003 + seg.age / 5000) * 100;
      const excessLoss = Math.max(flowLoss - bgRate, 0);
      const models = mlInfer({ flowLoss, dpDev, excessLoss, pipeAge: seg.age });
      const conf = Math.min(
        0.99,
        (models.lgb + models.xgb + models.nn + models.lstm) / 400
      );

      const segData = {
        id: `${govKey}-${branchName}-D${si + 1}`,
        branch: branchName,
        depth: si + 1,
        from: seg.f,
        to: seg.t,
        len: seg.len,
        age: seg.age,
        hw: seg.hw,
        flowIn: +flowIn.toFixed(2),
        flowOut: +flowOut.toFixed(2),
        flowLoss: +flowLoss.toFixed(2),
        excessLoss: +excessLoss.toFixed(2),
        pressIn: +pressIn.toFixed(2),
        pressOut: +pressOut.toFixed(2),
        dpPred: +dpPred.toFixed(3),
        dpDev: +dpDev.toFixed(3),
        predType: ftype,
        severity: +sev.toFixed(3),
        confidence: +conf.toFixed(3),
        models,
        faultHere: isFault ? 1 : 0,
        branchColor: branch.color,
        alert: ftype !== "normal",
      };
      results.push(segData);
      if (ftype !== "normal")
        alerts.push({ ...segData, ts: new Date().toLocaleTimeString() });
      flowIn = flowOut;
      pressIn = pressOut;
    });
  });

  // ─── Mass balance: L/min → m³ per 40-second pump cycle ────────────────
  // totalBranchInflow is L/min; cycle is 40s → multiply by (40/60)/1000
  const DEMO_SPEED = 150;
  const cycleOutflowM3 = ((totalBranchInflow * (40 / 60)) / 1000) * DEMO_SPEED;
  const systemLossM3 = cycleOutflowM3 * gov.nrw; // NRW portion
  const deliveredM3 = cycleOutflowM3 - systemLossM3; // what reached customers

  return {
    segments: results,
    alerts,
    mass: {
      branchInflows, // L/min per branch
      totalBranchInflow, // L/min total
      totalOutflowLpm: totalBranchInflow, // alias
      totalOutflowM3PerHr: +((totalBranchInflow * 60) / 1000).toFixed(1),
      cycleOutflowM3: +cycleOutflowM3.toFixed(2),
      systemLossM3: +systemLossM3.toFixed(2),
      deliveredM3: +deliveredM3.toFixed(2),
    },
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// RESERVOIR TANK (vertical gauge)
// ══════════════════════════════════════════════════════════════════════════════
function ReservoirTank({ currentM3, capacityM3, pulsing, govColor }) {
  const pct = Math.max(0, Math.min(100, (currentM3 / capacityM3) * 100));
  const levelColor = pct > 60 ? "#22c55e" : pct > 30 ? "#f59e0b" : "#ef4444";

  // wave animation offset
  const [waveOffset, setWaveOffset] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setWaveOffset((o) => (o + 1) % 40), 80);
    return () => clearInterval(id);
  }, []);

  const W = 110,
    H = 180;
  const tankTop = 14,
    tankBottom = H - 6;
  const waterBottomY = tankBottom - 2;
  const waterTopY =
    tankTop + 4 + ((100 - pct) / 100) * (tankBottom - tankTop - 6);

  // wave path
  const waveAmp = 3;
  const waveLen = 20;
  const waveY0 = waterTopY;
  let wavePath = `M 6 ${waveY0}`;
  for (let x = 6; x <= W - 6; x += 2) {
    const y =
      waveY0 + Math.sin(((x + waveOffset) / waveLen) * Math.PI * 2) * waveAmp;
    wavePath += ` L ${x} ${y}`;
  }
  wavePath += ` L ${W - 6} ${waterBottomY} L 6 ${waterBottomY} Z`;

  return (
    <div style={{ position: "relative", width: W, height: H, flexShrink: 0 }}>
      <svg width={W} height={H} style={{ display: "block" }}>
        <defs>
          <linearGradient id="tankBg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#020617" />
          </linearGradient>
          <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={levelColor} stopOpacity="0.85" />
            <stop offset="100%" stopColor={levelColor} stopOpacity="0.55" />
          </linearGradient>
          <filter id="tankGlow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Tank outline */}
        <rect
          x="4"
          y={tankTop}
          width={W - 8}
          height={tankBottom - tankTop}
          rx="6"
          fill="url(#tankBg)"
          stroke={pulsing ? levelColor : govColor}
          strokeWidth={pulsing ? "2" : "1.5"}
          filter={pulsing ? "url(#tankGlow)" : undefined}
          style={{ transition: "stroke .3s" }}
        />

        {/* Water fill with animated wave */}
        {pct > 0 && <path d={wavePath} fill="url(#waterGrad)" opacity="0.9" />}

        {/* Wave highlight line */}
        {pct > 0 && (
          <path
            d={
              wavePath.split("L")[0] +
              wavePath
                .split("L")
                .slice(1, -3)
                .map((s) => "L" + s)
                .join("")
            }
            fill="none"
            stroke={levelColor}
            strokeWidth="1.5"
            opacity="0.8"
          />
        )}

        {/* Level ticks */}
        {[25, 50, 75].map((t) => {
          const y =
            tankTop + 4 + ((100 - t) / 100) * (tankBottom - tankTop - 6);
          return (
            <g key={t}>
              <line
                x1={W - 12}
                y1={y}
                x2={W - 4}
                y2={y}
                stroke="#334155"
                strokeWidth="0.8"
              />
              <text
                x={W - 14}
                y={y + 3}
                fill="#475569"
                fontSize="7"
                textAnchor="end"
                fontFamily="monospace"
              >
                {t}%
              </text>
            </g>
          );
        })}

        {/* Cap */}
        <rect
          x="18"
          y="6"
          width={W - 36}
          height="10"
          rx="2"
          fill="#1e293b"
          stroke="#334155"
        />
        <rect x="30" y="3" width="14" height="6" rx="1" fill="#334155" />

        {/* Percent overlay */}
        <text
          x={W / 2}
          y={H / 2 + 4}
          fill="#f8fafc"
          fontSize="18"
          fontWeight="700"
          fontFamily="monospace"
          textAnchor="middle"
          style={{ textShadow: "0 0 6px rgba(0,0,0,.9)" }}
        >
          {pct.toFixed(1)}%
        </text>

        {/* Pulsing pump indicator */}
        {pulsing && (
          <>
            <circle cx={W - 14} cy={tankTop + 2} r="4" fill="#22d3ee">
              <animate
                attributeName="r"
                values="3;6;3"
                dur="0.8s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="1;0.3;1"
                dur="0.8s"
                repeatCount="indefinite"
              />
            </circle>
          </>
        )}
      </svg>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PIPE NETWORK SVG
// ══════════════════════════════════════════════════════════════════════════════
function PipeNetworkMap({
  govKey,
  segments,
  onSegClick,
  selectedSeg,
  pumping,
  branchInflows,
  totalOutflowM3PerHr,
}) {
  const gov = NETWORK[govKey];
  const branches = Object.entries(gov.branches);
  const H = 480,
    W = 820;
  const MAIN_X = 90,
    ROW_H = H / (branches.length + 1);
  const NODE_R = 16,
    SEG_START = 220,
    SEG_END = W - 24;
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setPulse((p) => (p + 1) % 100), 80);
    return () => clearInterval(id);
  }, []);

  const segsByBranch = useMemo(() => {
    const m = {};
    segments.forEach((s) => {
      m[s.branch] = m[s.branch] || [];
      m[s.branch].push(s);
    });
    return m;
  }, [segments]);

  const mainY = H / 2;
  const pulseScale = 1 + Math.sin(pulse * 0.063) * 0.12;

  // Branch inflow → m³/hr label (L/min → m³/hr = ×0.06)
  const branchM3 = (bn) => ((branchInflows?.[bn] || 0) * 0.06).toFixed(1);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: "100%", height: H, display: "block" }}
    >
      <defs>
        <filter id="glow-green">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="glow-red">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="glow-amber">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="glow-cyan">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Source box (pulses when pumping) */}
      <rect
        x="4"
        y={mainY - 32}
        width="62"
        height="64"
        rx="8"
        fill={pumping ? "#0c4a6e" : "#0f172a"}
        stroke={pumping ? "#22d3ee" : "#38bdf8"}
        strokeWidth={pumping ? "2.5" : "1.5"}
        filter={pumping ? "url(#glow-cyan)" : undefined}
        style={{ transition: "all .3s" }}
      />
      <text
        x="35"
        y={mainY - 10}
        textAnchor="middle"
        fill={pumping ? "#67e8f9" : "#38bdf8"}
        fontSize="10"
        fontWeight="600"
      >
        مصدر
      </text>
      <text
        x="35"
        y={mainY + 8}
        textAnchor="middle"
        fill={pumping ? "#67e8f9" : "#38bdf8"}
        fontSize="10"
      >
        المياه
      </text>

      {/* Outflow label above source */}
      <text
        x="35"
        y={mainY - 40}
        textAnchor="middle"
        fill="#22d3ee"
        fontSize="9"
        fontWeight="700"
        fontFamily="monospace"
      >
        {totalOutflowM3PerHr?.toFixed?.(0) ?? "0"} m³/h
      </text>

      {/* Main pipe → main node (animated flow dashes when pumping) */}
      <line
        x1="66"
        y1={mainY}
        x2={MAIN_X - NODE_R}
        y2={mainY}
        stroke={pumping ? "#22d3ee" : "#38bdf8"}
        strokeWidth={pumping ? "4" : "3"}
        strokeDasharray="6 3"
        filter={pumping ? "url(#glow-cyan)" : undefined}
      >
        {pumping && (
          <animate
            attributeName="stroke-dashoffset"
            from="0"
            to="-18"
            dur="0.6s"
            repeatCount="indefinite"
          />
        )}
      </line>

      <circle
        cx={MAIN_X}
        cy={mainY}
        r={NODE_R + 2}
        fill="#38bdf8"
        fillOpacity={pumping ? "0.22" : "0.12"}
        stroke="#38bdf8"
        strokeWidth="2"
      />
      <circle
        cx={MAIN_X}
        cy={mainY}
        r={NODE_R}
        fill="#0f172a"
        stroke={pumping ? "#22d3ee" : "#38bdf8"}
        strokeWidth="2"
      />
      <text
        x={MAIN_X}
        y={mainY + 4}
        textAnchor="middle"
        fill="#38bdf8"
        fontSize="9"
        fontWeight="700"
      >
        Main
      </text>

      {pumping && (
        <circle
          cx={MAIN_X}
          cy={mainY}
          r={NODE_R + 8}
          fill="none"
          stroke="#22d3ee"
          strokeWidth="1.5"
          opacity="0.6"
        >
          <animate
            attributeName="r"
            values={`${NODE_R + 4};${NODE_R + 16};${NODE_R + 4}`}
            dur="0.8s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.8;0;0.8"
            dur="0.8s"
            repeatCount="indefinite"
          />
        </circle>
      )}

      {branches.map(([bname, bcfg], bi) => {
        const brY = ROW_H * (bi + 1);
        const brSegs = segsByBranch[bname] || [];
        const nSegs = brSegs.length;
        const segW = (SEG_END - SEG_START) / Math.max(nSegs, 1);
        const bColor = bcfg.color;

        return (
          <g key={bname}>
            {/* Vertical connector from main — animated when pumping */}
            <path
              d={`M ${MAIN_X} ${
                mainY > brY ? mainY - NODE_R : mainY + NODE_R
              } L ${MAIN_X} ${brY} L ${SEG_START - 30} ${brY}`}
              fill="none"
              stroke={bColor}
              strokeWidth={pumping ? "1.5" : "1"}
              strokeDasharray="4 5"
              strokeOpacity={pumping ? "0.85" : "0.5"}
            >
              {pumping && (
                <animate
                  attributeName="stroke-dashoffset"
                  from="0"
                  to="-18"
                  dur="0.6s"
                  repeatCount="indefinite"
                />
              )}
            </path>

            {/* Branch label + live flow rate */}
            <text
              x={SEG_START - 36}
              y={brY - 3}
              textAnchor="end"
              fill={bColor}
              fontSize="11"
              fontWeight="600"
            >
              {bname.replace(/^[^-]+-/, "")}
            </text>
            <text
              x={SEG_START - 36}
              y={brY + 11}
              textAnchor="end"
              fill="#64748b"
              fontSize="9"
              fontFamily="monospace"
              fontWeight="600"
            >
              {branchM3(bname)} m³/h
            </text>

            {brSegs.map((seg, si) => {
              const nx = SEG_START + si * segW + segW * 0.2;
              const nx2 =
                si < nSegs - 1
                  ? SEG_START + (si + 1) * segW + segW * 0.2
                  : SEG_END;
              const tColor = TYPE_CONFIG[seg.predType]?.color || "#22c55e";
              const isAl = seg.alert;
              const isSel = selectedSeg?.id === seg.id;
              const pipeH = Math.max(2, 5 * (1 - seg.flowLoss / 100));
              const glowFilter = isAl
                ? seg.predType === "burst"
                  ? "url(#glow-red)"
                  : seg.predType === "leak"
                  ? "url(#glow-amber)"
                  : "url(#glow-green)"
                : "none";

              return (
                <g
                  key={seg.id}
                  style={{ cursor: "pointer" }}
                  onClick={() => onSegClick(seg)}
                >
                  <line
                    x1={nx + NODE_R}
                    y1={brY}
                    x2={nx2 - NODE_R}
                    y2={brY}
                    stroke={isAl ? tColor : bColor}
                    strokeWidth={isAl ? pipeH + 2 : pipeH}
                    strokeLinecap="round"
                    opacity={isAl ? 1 : 0.7}
                    filter={isAl ? glowFilter : "none"}
                  />

                  {isAl && seg.faultHere === 1 && (
                    <circle
                      cx={(nx + NODE_R + nx2 - NODE_R) / 2}
                      cy={brY}
                      r={20 + pulseScale * 8}
                      fill="none"
                      stroke={tColor}
                      strokeWidth="1.5"
                      opacity={0.3 + Math.sin(pulse * 0.063) * 0.3}
                    />
                  )}

                  {isAl && (
                    <circle
                      cx={nx}
                      cy={brY}
                      r={NODE_R + 4}
                      fill={tColor}
                      fillOpacity="0.15"
                      stroke={tColor}
                      strokeWidth="0.5"
                      opacity={0.5 + Math.sin(pulse * 0.063) * 0.5}
                    />
                  )}
                  <circle
                    cx={nx}
                    cy={brY}
                    r={NODE_R}
                    fill={isAl ? `${tColor}22` : "#0d1830"}
                    stroke={isSel ? "#ffffff" : tColor}
                    strokeWidth={isSel ? 2.5 : isAl ? 2 : 1.5}
                    filter={isAl ? glowFilter : "none"}
                  />
                  <text
                    x={nx}
                    y={brY + 4}
                    textAnchor="middle"
                    fill={isAl ? tColor : "#94a3b8"}
                    fontSize="9"
                    fontWeight="700"
                  >
                    {seg.from.split("-").pop().slice(0, 5)}
                  </text>

                  <text
                    x={nx}
                    y={brY + NODE_R + 13}
                    textAnchor="middle"
                    fill={seg.flowLoss > 5 ? tColor : "#475569"}
                    fontSize="10"
                    fontWeight="600"
                  >
                    {seg.flowLoss.toFixed(1)}%
                  </text>

                  {seg.faultHere === 1 && isAl && (
                    <text
                      x={(nx + NODE_R + nx2 - NODE_R) / 2}
                      y={brY - 16}
                      textAnchor="middle"
                      fill={tColor}
                      fontSize="13"
                      fontWeight="900"
                    >
                      !
                    </text>
                  )}
                </g>
              );
            })}

            {brSegs.length > 0 && (
              <g>
                <circle
                  cx={SEG_END}
                  cy={brY}
                  r={12}
                  fill="#0d1830"
                  stroke={bColor}
                  strokeWidth="1.5"
                  strokeOpacity="0.7"
                />
                <text
                  x={SEG_END}
                  y={brY + 4}
                  textAnchor="middle"
                  fill={bColor}
                  fontSize="8"
                  fontWeight="600"
                >
                  {(brSegs[brSegs.length - 1]?.to || "")
                    .split("-")
                    .pop()
                    .slice(0, 6)}
                </text>
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// NRW GAUGE
// ══════════════════════════════════════════════════════════════════════════════
function NRWGauge({ nrw, target }) {
  const pct = Math.round(nrw * 100);
  const tgt = Math.round(target * 100);
  const data = [
    {
      name: "NRW",
      value: pct,
      fill: nrw > 0.5 ? "#ef4444" : nrw > 0.4 ? "#f59e0b" : "#22c55e",
    },
    { name: "Gap", value: 100 - pct, fill: "#1e293b" },
  ];
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 2,
      }}
    >
      <div style={{ position: "relative", width: 130, height: 74 }}>
        <ResponsiveContainer width={130} height={74}>
          <RadialBarChart
            cx={65}
            cy={64}
            innerRadius={40}
            outerRadius={60}
            startAngle={180}
            endAngle={0}
            data={data}
          >
            <RadialBar
              dataKey="value"
              background={{ fill: "#1e293b" }}
              cornerRadius={4}
            />
          </RadialBarChart>
        </ResponsiveContainer>
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 20,
              fontWeight: 700,
              fontFamily: "monospace",
              color: pct > 50 ? "#ef4444" : pct > 40 ? "#f59e0b" : "#22c55e",
            }}
          >
            {pct}%
          </div>
        </div>
      </div>
      <div style={{ fontSize: 10, color: "#64748b" }}>
        Target:{" "}
        <span style={{ color: "#22c55e", fontWeight: 600 }}>{tgt}%</span>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ══════════════════════════════════════════════════════════════════════════════
export default function AqurdDashboard() {
  const [govKey, setGovKey] = useState("Amman");
  const [simData, setSimData] = useState(null);
  const [allAlerts, setAllAlerts] = useState([]);
  const [selectedSeg, setSelectedSeg] = useState(null);
  const [tick, setTick] = useState(0);
  const [countdown, setCountdown] = useState(40);
  const [forceType, setForceType] = useState(null);
  const [showGovMenu, setShowGovMenu] = useState(false);
  const [govSearch, setGovSearch] = useState("");
  const [simMode, setSimMode] = useState(false);
  const [simPressure, setSimPressure] = useState(80);
  const [simFlow, setSimFlow] = useState(300);
  const [flowHist, setFlowHist] = useState(Array(30).fill(0));
  const [pressHist, setPressHist] = useState(Array(30).fill(0));
  const [scatterData, setScatterData] = useState([]);
  const [activeTab, setActiveTab] = useState("map");
  const menuRef = useRef(null);

  // ─── HYDRAULIC STATE ──────────────────────────────────────────────────
  // Persistent reservoir volumes per governorate (Record<string, number>)
  const [reservoirLevels, setReservoirLevels] = useState(() => {
    const init = {};
    Object.entries(NETWORK).forEach(([k, v]) => {
      init[k] = v.reservoirCap;
    });
    return init;
  });
  // Cumulative system loss (NRW water "disappeared") per governorate
  const [systemLoss, setSystemLoss] = useState(() => {
    const init = {};
    Object.keys(NETWORK).forEach((k) => {
      init[k] = 0;
    });
    return init;
  });
  // Pump pulse visual flag — true for the first ~1.2s after each cycle
  const [pumping, setPumping] = useState(false);

  const gov = NETWORK[govKey];

  // ─── runCycle: simulate + apply mass balance ──────────────────────────
  const runCycle = useCallback(
    async (ftype = null) => {
      const apiResult = await (async () => {
        await apiPost("/api/refresh", {
          gov: govKey,
          force: ftype || forceType,
        });
        return apiGet("/api/state");
      })();

      let segments, alerts, mass;
      if (apiResult && apiResult.segments) {
        segments = apiResult.segments;
        alerts = apiResult.allAlerts || [];
        mass = apiResult.mass || null;
        if (apiResult.fh) setFlowHist(apiResult.fh);
        if (apiResult.ph) setPressHist(apiResult.ph);
      } else {
        const sim = simulateGov(govKey, ftype || forceType);
        segments = sim.segments;
        alerts = sim.alerts;
        mass = sim.mass;
        if (segments.length) {
          const first = segments[0];
          setFlowHist((p) => [
            ...p.slice(1),
            +(first.flowIn + Math.random() * 5 - 2.5).toFixed(1),
          ]);
          setPressHist((p) => [
            ...p.slice(1),
            +(first.pressIn + Math.random() * 2 - 1).toFixed(2),
          ]);
        }
      }

      // Build fallback mass object if API didn't provide one
      if (!mass) {
        const totalFlow = segments.reduce(
          (s, seg) => s + (seg.depth === 1 ? seg.flowIn : 0),
          0
        );
        const branchInflows = {};
        segments.forEach((s) => {
          if (s.depth === 1) branchInflows[s.branch] = s.flowIn;
        });
        const cycleM3 = (totalFlow * 40) / 60 / 1000;
        mass = {
          branchInflows,
          totalBranchInflow: totalFlow,
          totalOutflowM3PerHr: +((totalFlow * 60) / 1000).toFixed(1),
          cycleOutflowM3: +cycleM3.toFixed(2),
          systemLossM3: +(cycleM3 * gov.nrw).toFixed(2),
          deliveredM3: +(cycleM3 * (1 - gov.nrw)).toFixed(2),
        };
      }

      // Apply mass balance to reservoir
      setReservoirLevels((prev) => {
        const cur = prev[govKey] ?? gov.reservoirCap;
        const nxt = Math.max(0, cur - mass.cycleOutflowM3);
        return { ...prev, [govKey]: nxt };
      });
      setSystemLoss((prev) => ({
        ...prev,
        [govKey]: (prev[govKey] || 0) + mass.systemLossM3,
      }));

      // Trigger pump pulse animation
      setPumping(true);
      setTimeout(() => setPumping(false), 1200);

      setSimData({ segments, govKey, mass });
      if (alerts.length) {
        setAllAlerts((prev) =>
          [
            ...alerts.map((a) => ({
              ...a,
              ts: a.ts || new Date().toLocaleTimeString(),
            })),
            ...prev,
          ].slice(0, 60)
        );
      }
      setScatterData(
        segments.map((s) => ({
          x: +s.flowLoss.toFixed(2),
          y: +Math.abs(s.dpDev).toFixed(3),
          type: s.predType,
          id: s.id,
        }))
      );
      setTick((t) => t + 1);
    },
    [govKey, forceType, gov.nrw, gov.reservoirCap]
  );

  useEffect(() => {
    runCycle();
  }, [govKey]);

  // 40-second SYNCHRONIZED PUMP CYCLE
  useEffect(() => {
    const id = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          runCycle();
          return 40;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [runCycle]);

  useEffect(() => {
    const h = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target))
        setShowGovMenu(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const segments = simData?.segments || [];
  const mass = simData?.mass || {
    branchInflows: {},
    totalOutflowM3PerHr: 0,
    cycleOutflowM3: 0,
    systemLossM3: 0,
    deliveredM3: 0,
  };
  const alertSegs = segments.filter((s) => s.alert);
  const burstSegs = segments.filter((s) => s.predType === "burst");
  const maxLoss = Math.max(0, ...segments.map((s) => s.flowLoss));
  const maxDP = Math.max(0, ...segments.map((s) => Math.abs(s.dpDev)));
  const worstType = burstSegs.length
    ? "burst"
    : alertSegs[0]?.predType || "normal";

  const currentReservoir = reservoirLevels[govKey] ?? gov.reservoirCap;
  const reservoirPct = (currentReservoir / gov.reservoirCap) * 100;
  const totalSystemLoss = systemLoss[govKey] || 0;

  const refillReservoir = () => {
    setReservoirLevels((prev) => ({ ...prev, [govKey]: gov.reservoirCap }));
    setSystemLoss((prev) => ({ ...prev, [govKey]: 0 }));
  };

  const simAnomalyProb = useMemo(() => {
    if (!simMode) return null;
    const fl = Math.max(0, (100 * (simFlow - 280)) / 280);
    const dp = Math.max(0, ((100 - simPressure) / 100) * 20);
    return Math.min(99, Math.round(fl * 0.5 + dp * 0.5));
  }, [simMode, simPressure, simFlow]);

  const filteredGovs = Object.entries(NETWORK).filter(
    ([k, v]) =>
      v.label.includes(govSearch) ||
      k.toLowerCase().includes(govSearch.toLowerCase())
  );

  const flowHistData = flowHist.map((v, i) => ({ i, v }));
  const pressHistData = pressHist.map((v, i) => ({ i, v }));

  const TYPE_DOT = {
    normal: "#22c55e",
    leak: "#f59e0b",
    burst: "#ef4444",
    theft: "#a855f7",
  };

  return (
    <div
      style={{
        background: "#060c18",
        minHeight: "100vh",
        color: "#e2e8f0",
        fontFamily: "'Inter',system-ui,sans-serif",
        overflow: "auto",
      }}
    >
      {/* ── HEADER ── */}
      <div
        style={{
          background: "#0a1628",
          borderBottom: "1px solid rgba(56,189,248,.15)",
          padding: "0 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 52,
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "linear-gradient(135deg,#0ea5e9,#6366f1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Droplets size={18} color="#fff" />
          </div>
          <div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "#f8fafc",
                letterSpacing: 0.3,
              }}
            >
              Aqurd AI v4.3
            </div>
            <div
              style={{
                fontSize: 10,
                color: "#475569",
                fontFamily: "monospace",
              }}
            >
              LGB + XGB + ResNet-MLP + BiLSTM · HYDRAULIC MASS-BALANCE · JORDAN
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {["normal", "leak", "burst", "theft"].map((t) => (
            <button
              key={t}
              onClick={() => {
                setForceType(t === "normal" ? null : t);
                runCycle(t === "normal" ? null : t);
              }}
              style={{
                padding: "4px 10px",
                borderRadius: 6,
                fontSize: 11,
                fontFamily: "monospace",
                cursor: "pointer",
                fontWeight: 600,
                background:
                  forceType === t || (!forceType && t === "normal")
                    ? `${TYPE_DOT[t]}22`
                    : "transparent",
                border: `1px solid ${TYPE_DOT[t]}80`,
                color: TYPE_DOT[t],
                transition: "all .15s",
              }}
            >
              {t.toUpperCase()}
            </button>
          ))}

          <button
            onClick={() => setSimMode((m) => !m)}
            style={{
              padding: "4px 10px",
              borderRadius: 6,
              fontSize: 11,
              cursor: "pointer",
              fontWeight: 600,
              background: simMode ? "rgba(99,102,241,.25)" : "transparent",
              border: "1px solid rgba(99,102,241,.5)",
              color: "#818cf8",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Sliders size={12} /> Sim
          </button>

          <button
            onClick={() => runCycle()}
            style={{
              padding: "4px 10px",
              borderRadius: 6,
              fontSize: 11,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4,
              background: "transparent",
              border: "1px solid rgba(56,189,248,.3)",
              color: "#38bdf8",
            }}
          >
            <RefreshCw size={12} /> Refresh
          </button>

          <div
            style={{
              padding: "4px 12px",
              borderRadius: 20,
              background: pumping
                ? "rgba(34,211,238,.15)"
                : API_URL
                ? "rgba(34,197,94,.1)"
                : "rgba(245,158,11,.1)",
              border: `1px solid ${
                pumping
                  ? "rgba(34,211,238,.5)"
                  : API_URL
                  ? "rgba(34,197,94,.3)"
                  : "rgba(245,158,11,.3)"
              }`,
              fontSize: 11,
              color: pumping ? "#22d3ee" : API_URL ? "#22c55e" : "#f59e0b",
              fontFamily: "monospace",
              display: "flex",
              alignItems: "center",
              gap: 5,
              transition: "all .3s",
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: pumping
                  ? "#22d3ee"
                  : API_URL
                  ? "#22c55e"
                  : "#f59e0b",
                display: "inline-block",
                animation: "pulse 1.4s infinite",
              }}
            />
            {pumping ? "PUMPING" : API_URL ? "ML LIVE" : "OFFLINE"} ·{" "}
            {countdown}s
          </div>
        </div>
      </div>

      <div
        style={{
          padding: "14px 20px",
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        {/* ── GOV SELECTOR + RESERVOIR SUMMARY ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div ref={menuRef} style={{ position: "relative" }}>
            <button
              onClick={() => setShowGovMenu((m) => !m)}
              style={{
                padding: "8px 14px",
                borderRadius: 8,
                background: "#0f1f3d",
                border: "1px solid rgba(56,189,248,.25)",
                color: "#e2e8f0",
                fontSize: 13,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
                minWidth: 200,
              }}
            >
              <MapPin size={14} color={gov.color} />
              <span style={{ flex: 1, textAlign: "right" }}>{gov.label}</span>
              <span
                style={{
                  color: "#64748b",
                  fontSize: 11,
                  fontFamily: "monospace",
                }}
              >
                {govKey}
              </span>
              <ChevronDown size={14} color="#64748b" />
            </button>
            {showGovMenu && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 4px)",
                  left: 0,
                  width: 280,
                  background: "#0f1f3d",
                  border: "1px solid rgba(56,189,248,.2)",
                  borderRadius: 10,
                  zIndex: 100,
                  overflow: "hidden",
                  boxShadow: "0 20px 60px rgba(0,0,0,.6)",
                }}
              >
                <div
                  style={{
                    padding: "8px 10px",
                    borderBottom: "1px solid rgba(56,189,248,.1)",
                  }}
                >
                  <input
                    value={govSearch}
                    onChange={(e) => setGovSearch(e.target.value)}
                    placeholder="Search governorate..."
                    style={{
                      width: "100%",
                      padding: "6px 10px",
                      borderRadius: 6,
                      background: "#060c18",
                      border: "1px solid rgba(56,189,248,.2)",
                      color: "#e2e8f0",
                      fontSize: 12,
                      outline: "none",
                    }}
                  />
                </div>
                <div style={{ maxHeight: 240, overflowY: "auto" }}>
                  {filteredGovs.map(([k, v]) => {
                    const pct =
                      ((reservoirLevels[k] ?? v.reservoirCap) /
                        v.reservoirCap) *
                      100;
                    return (
                      <button
                        key={k}
                        onClick={() => {
                          setGovKey(k);
                          setShowGovMenu(false);
                          setGovSearch("");
                        }}
                        style={{
                          width: "100%",
                          padding: "9px 14px",
                          background:
                            k === govKey
                              ? "rgba(56,189,248,.08)"
                              : "transparent",
                          border: "none",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          color: "#e2e8f0",
                          textAlign: "right",
                        }}
                      >
                        <span
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            background: v.color,
                            flexShrink: 0,
                          }}
                        />
                        <span
                          style={{ flex: 1, textAlign: "right", fontSize: 14 }}
                        >
                          {v.label}
                        </span>
                        <span
                          style={{
                            fontSize: 10,
                            color:
                              pct > 60
                                ? "#22c55e"
                                : pct > 30
                                ? "#f59e0b"
                                : "#ef4444",
                            fontFamily: "monospace",
                            fontWeight: 700,
                          }}
                        >
                          {pct.toFixed(0)}%
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div
            style={{ fontSize: 12, color: "#64748b", fontFamily: "monospace" }}
          >
            {gov.source}
          </div>

          {/* Reservoir capacity indicator */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "4px 12px",
              background: "rgba(56,189,248,.06)",
              borderRadius: 6,
              border: "1px solid rgba(56,189,248,.15)",
            }}
          >
            <Database size={12} color="#38bdf8" />
            <span style={{ fontSize: 10, color: "#64748b" }}>Capacity:</span>
            <span
              style={{
                fontSize: 11,
                color: "#38bdf8",
                fontFamily: "monospace",
                fontWeight: 700,
              }}
            >
              {(gov.reservoirCap / 1000).toFixed(0)}k m³
            </span>
          </div>

          <button
            onClick={refillReservoir}
            style={{
              padding: "4px 10px",
              borderRadius: 6,
              fontSize: 10,
              cursor: "pointer",
              fontWeight: 600,
              background: "rgba(34,197,94,.08)",
              border: "1px solid rgba(34,197,94,.4)",
              color: "#22c55e",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            ↻ Refill
          </button>

          <div
            style={{
              marginLeft: "auto",
              fontSize: 11,
              color: "#475569",
              fontFamily: "monospace",
            }}
          >
            Tick #{tick}
          </div>
        </div>

        {/* ── KPI ROW (now 9 cards incl. reservoir) ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(9,1fr)",
            gap: 8,
          }}
        >
          {[
            {
              l: "RESERVOIR",
              v: `${reservoirPct.toFixed(1)}%`,
              u: `${(currentReservoir / 1000).toFixed(1)}k m³`,
              c:
                reservoirPct > 60
                  ? "#22c55e"
                  : reservoirPct > 30
                  ? "#f59e0b"
                  : "#ef4444",
            },
            { l: "ALERTS", v: allAlerts.length, u: "total", c: "#ef4444" },
            { l: "ACTIVE", v: alertSegs.length, u: "this cycle", c: "#f59e0b" },
            { l: "BURST", v: burstSegs.length, u: "critical", c: "#ef4444" },
            {
              l: "NRW",
              v: `${Math.round(gov.nrw * 100)}%`,
              u: "non-revenue",
              c:
                gov.nrw > 0.5
                  ? "#ef4444"
                  : gov.nrw > 0.4
                  ? "#f59e0b"
                  : "#22c55e",
            },
            {
              l: "OUTFLOW",
              v: `${mass.totalOutflowM3PerHr?.toFixed?.(0) ?? 0}`,
              u: "m³/hour",
              c: "#22d3ee",
            },
            {
              l: "MAX LOSS",
              v: `${maxLoss.toFixed(1)}%`,
              u: "flow loss",
              c: "#f59e0b",
            },
            { l: "MAX DP", v: maxDP.toFixed(2), u: "PSI dev", c: "#a855f7" },
            {
              l: "SYS.LOSS",
              v: `${totalSystemLoss.toFixed(1)}`,
              u: "m³ lost total",
              c: "#ef4444",
            },
          ].map((k, i) => (
            <div
              key={i}
              style={{
                background: "#0a1628",
                border: "1px solid rgba(56,189,248,.08)",
                borderRadius: 10,
                padding: "10px 12px",
              }}
            >
              <div
                style={{
                  fontSize: 9,
                  color: "#475569",
                  fontFamily: "monospace",
                  letterSpacing: 0.5,
                  marginBottom: 4,
                }}
              >
                {k.l}
              </div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  fontFamily: "monospace",
                  color: k.c,
                  lineHeight: 1,
                }}
              >
                {k.v}
              </div>
              <div style={{ fontSize: 9, color: "#334155", marginTop: 3 }}>
                {k.u}
              </div>
            </div>
          ))}
        </div>

        {/* ── MAIN CONTENT GRID ── */}
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 14 }}
        >
          {/* LEFT: Map + tabs */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", gap: 4 }}>
              {[
                ["map", "Map"],
                ["scatter", "Scatter"],
                ["telemetry", "Telemetry"],
              ].map(([k, l]) => (
                <button
                  key={k}
                  onClick={() => setActiveTab(k)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 6,
                    fontSize: 12,
                    cursor: "pointer",
                    fontWeight: 500,
                    background:
                      activeTab === k ? "rgba(56,189,248,.15)" : "transparent",
                    border: `1px solid ${
                      activeTab === k
                        ? "rgba(56,189,248,.4)"
                        : "rgba(56,189,248,.1)"
                    }`,
                    color: activeTab === k ? "#38bdf8" : "#64748b",
                  }}
                >
                  {l}
                </button>
              ))}
            </div>

            {/* MAP TAB */}
            {activeTab === "map" && (
              <div
                style={{
                  background: "#0a1628",
                  border: "1px solid rgba(56,189,248,.1)",
                  borderRadius: 12,
                  padding: 16,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 10,
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      color: "#475569",
                      fontFamily: "monospace",
                      letterSpacing: 0.5,
                    }}
                  >
                    LIVE PIPE NETWORK — {gov.label} · {gov.source}
                  </div>
                  {pumping && (
                    <div
                      style={{
                        fontSize: 10,
                        color: "#22d3ee",
                        fontFamily: "monospace",
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: 4,
                        background: "rgba(34,211,238,.1)",
                        border: "1px solid rgba(34,211,238,.3)",
                      }}
                    >
                      ⚡ PUMP CYCLE ACTIVE
                    </div>
                  )}
                </div>
                <div
                  style={{ display: "flex", gap: 16, alignItems: "stretch" }}
                >
                  {/* Reservoir tank on the left of map */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 6,
                      paddingTop: 4,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 9,
                        color: "#475569",
                        fontFamily: "monospace",
                        letterSpacing: 0.3,
                      }}
                    >
                      RESERVOIR
                    </div>
                    <ReservoirTank
                      currentM3={currentReservoir}
                      capacityM3={gov.reservoirCap}
                      pulsing={pumping}
                      govColor={gov.color}
                    />
                    <div
                      style={{
                        fontSize: 9,
                        color: "#64748b",
                        fontFamily: "monospace",
                        textAlign: "center",
                      }}
                    >
                      {(currentReservoir / 1000).toFixed(1)}k
                      <br />
                      <span style={{ color: "#334155" }}>
                        / {(gov.reservoirCap / 1000).toFixed(0)}k m³
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: 8,
                        color: "#64748b",
                        textAlign: "center",
                        paddingTop: 4,
                        borderTop: "1px solid rgba(56,189,248,.1)",
                        marginTop: 2,
                        width: "100%",
                      }}
                    >
                      <div
                        style={{
                          color: "#ef4444",
                          fontWeight: 600,
                          fontFamily: "monospace",
                        }}
                      >
                        −{mass.systemLossM3?.toFixed(1) ?? 0}
                      </div>
                      <div>m³ this cycle</div>
                    </div>
                  </div>
                  {/* Pipe network */}
                  <div style={{ flex: 1 }}>
                    <PipeNetworkMap
                      govKey={govKey}
                      segments={segments}
                      onSegClick={setSelectedSeg}
                      selectedSeg={selectedSeg}
                      pumping={pumping}
                      branchInflows={mass.branchInflows}
                      totalOutflowM3PerHr={mass.totalOutflowM3PerHr}
                    />
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 16,
                    marginTop: 10,
                    fontSize: 11,
                    fontFamily: "monospace",
                  }}
                >
                  {Object.entries(TYPE_CONFIG).map(([k, v]) => (
                    <span
                      key={k}
                      style={{
                        color: v.color,
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: v.color,
                          display: "inline-block",
                        }}
                      />
                      {v.label}
                    </span>
                  ))}
                  <span style={{ marginLeft: "auto", color: "#475569" }}>
                    Click segment for detail
                  </span>
                </div>
              </div>
            )}

            {/* SCATTER TAB */}
            {activeTab === "scatter" && (
              <div
                style={{
                  background: "#0a1628",
                  border: "1px solid rgba(56,189,248,.1)",
                  borderRadius: 12,
                  padding: 16,
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    color: "#475569",
                    fontFamily: "monospace",
                    letterSpacing: 0.5,
                    marginBottom: 4,
                  }}
                >
                  SPATIAL SIGNATURES — Flow Loss % vs DP Deviation (PSI)
                </div>
                <div
                  style={{ fontSize: 10, color: "#334155", marginBottom: 12 }}
                >
                  Each dot = one pipe segment. Pattern reveals anomaly type.
                </div>
                <ResponsiveContainer width="100%" height={320}>
                  <ScatterChart
                    margin={{ top: 10, right: 20, bottom: 20, left: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis
                      dataKey="x"
                      name="Flow Loss %"
                      label={{
                        value: "Flow Loss %",
                        position: "insideBottom",
                        offset: -10,
                        fill: "#475569",
                        fontSize: 11,
                      }}
                      tick={{ fill: "#475569", fontSize: 10 }}
                      stroke="#1e293b"
                    />
                    <YAxis
                      dataKey="y"
                      name="DP Dev"
                      label={{
                        value: "DP Deviation",
                        angle: -90,
                        position: "insideLeft",
                        fill: "#475569",
                        fontSize: 11,
                      }}
                      tick={{ fill: "#475569", fontSize: 10 }}
                      stroke="#1e293b"
                    />
                    <RTooltip
                      cursor={{ strokeDasharray: "3 3" }}
                      content={({ payload }) => {
                        if (!payload?.length) return null;
                        const d = payload[0].payload;
                        return (
                          <div
                            style={{
                              background: "#0f1f3d",
                              border: "1px solid rgba(56,189,248,.3)",
                              borderRadius: 8,
                              padding: "8px 12px",
                              fontSize: 11,
                            }}
                          >
                            <div
                              style={{
                                color: TYPE_DOT[d.type],
                                fontWeight: 700,
                              }}
                            >
                              {d.type.toUpperCase()}
                            </div>
                            <div style={{ color: "#94a3b8" }}>
                              Flow Loss: {d.x}%
                            </div>
                            <div style={{ color: "#94a3b8" }}>
                              DP Dev: {d.y} PSI
                            </div>
                          </div>
                        );
                      }}
                    />
                    {Object.keys(TYPE_DOT).map((t) => (
                      <Scatter
                        key={t}
                        name={t}
                        data={scatterData.filter((d) => d.type === t)}
                        fill={TYPE_DOT[t]}
                        fillOpacity={0.75}
                        shape={(props) => {
                          const { cx, cy } = props;
                          return (
                            <circle
                              cx={cx}
                              cy={cy}
                              r={t === "burst" ? 7 : t === "leak" ? 5 : 4}
                              fill={TYPE_DOT[t]}
                              fillOpacity={0.8}
                            />
                          );
                        }}
                      />
                    ))}
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* TELEMETRY TAB */}
            {activeTab === "telemetry" && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                }}
              >
                {[
                  {
                    title: "Flow In — L/min",
                    data: flowHistData,
                    color: "#38bdf8",
                    key: "v",
                  },
                  {
                    title: "Pressure In — PSI",
                    data: pressHistData,
                    color: "#a855f7",
                    key: "v",
                  },
                ].map((ch, ci) => (
                  <div
                    key={ci}
                    style={{
                      background: "#0a1628",
                      border: "1px solid rgba(56,189,248,.1)",
                      borderRadius: 12,
                      padding: 16,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        color: "#475569",
                        fontFamily: "monospace",
                        marginBottom: 8,
                      }}
                    >
                      {ch.title}
                    </div>
                    <ResponsiveContainer width="100%" height={160}>
                      <AreaChart
                        data={ch.data}
                        margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#0f172a" />
                        <XAxis hide />
                        <YAxis
                          tick={{ fill: "#475569", fontSize: 9 }}
                          stroke="#0f172a"
                          width={36}
                        />
                        <Area
                          type="monotone"
                          dataKey={ch.key}
                          stroke={ch.color}
                          fill={`${ch.color}18`}
                          strokeWidth={2}
                          dot={false}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginTop: 8,
                        fontSize: 11,
                      }}
                    >
                      <span style={{ color: "#475569" }}>Current</span>
                      <span
                        style={{
                          color: ch.color,
                          fontFamily: "monospace",
                          fontWeight: 600,
                        }}
                      >
                        {ch.data[ch.data.length - 1]?.v.toFixed(1)}
                      </span>
                    </div>
                  </div>
                ))}

                <div
                  style={{
                    background: "#0a1628",
                    border: "1px solid rgba(56,189,248,.1)",
                    borderRadius: 12,
                    padding: 16,
                    gridColumn: "1/-1",
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      color: "#475569",
                      fontFamily: "monospace",
                      marginBottom: 12,
                    }}
                  >
                    ENSEMBLE MODEL SCORES — Anomaly Probability per Segment
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                      maxHeight: 280,
                      overflowY: "auto",
                    }}
                  >
                    {segments.slice(0, 12).map((seg) => {
                      const tc = TYPE_DOT[seg.predType];
                      return (
                        <div
                          key={seg.id}
                          onClick={() => setSelectedSeg(seg)}
                          style={{
                            cursor: "pointer",
                            padding: "8px 10px",
                            background: "#0d1830",
                            borderRadius: 8,
                            border: `1px solid ${
                              seg.alert ? tc + "50" : "rgba(56,189,248,.06)"
                            }`,
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              marginBottom: 6,
                            }}
                          >
                            <span
                              style={{
                                fontSize: 11,
                                color: "#94a3b8",
                                fontFamily: "monospace",
                              }}
                            >
                              {seg.from}→{seg.to}
                            </span>
                            <span
                              style={{
                                fontSize: 10,
                                padding: "1px 7px",
                                borderRadius: 4,
                                background: `${tc}22`,
                                color: tc,
                                fontWeight: 600,
                              }}
                            >
                              {seg.predType.toUpperCase()}
                            </span>
                          </div>
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "1fr 1fr 1fr 1fr",
                              gap: 6,
                            }}
                          >
                            {[
                              ["LGB", seg.models.lgb],
                              ["XGB", seg.models.xgb],
                              ["NN", seg.models.nn],
                              ["LSTM", seg.models.lstm],
                            ].map(([n, v]) => (
                              <div key={n}>
                                <div
                                  style={{
                                    fontSize: 9,
                                    color: "#475569",
                                    marginBottom: 2,
                                  }}
                                >
                                  {n}
                                </div>
                                <div
                                  style={{
                                    height: 4,
                                    background: "#1e293b",
                                    borderRadius: 2,
                                  }}
                                >
                                  <div
                                    style={{
                                      height: 4,
                                      width: `${Math.min(v, 100)}%`,
                                      background: v > 50 ? tc : "#38bdf8",
                                      borderRadius: 2,
                                      transition: "width .5s",
                                    }}
                                  />
                                </div>
                                <div
                                  style={{
                                    fontSize: 9,
                                    color: v > 50 ? tc : "#64748b",
                                    fontFamily: "monospace",
                                    marginTop: 2,
                                  }}
                                >
                                  {v.toFixed(0)}%
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* SIMULATION MODE */}
            {simMode && (
              <div
                style={{
                  background: "linear-gradient(135deg,#0f0d2e,#1a0a2e)",
                  border: "1px solid rgba(99,102,241,.3)",
                  borderRadius: 12,
                  padding: 16,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 14,
                  }}
                >
                  <Cpu size={14} color="#818cf8" />
                  <span
                    style={{
                      fontSize: 12,
                      color: "#818cf8",
                      fontFamily: "monospace",
                      fontWeight: 600,
                    }}
                  >
                    PREDICTIVE SIMULATION MODE — Adjust parameters to see AI
                    response
                  </span>
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: 16,
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "#6366f1",
                        marginBottom: 6,
                      }}
                    >
                      Inlet Pressure:{" "}
                      <span
                        style={{ color: "#c7d2fe", fontFamily: "monospace" }}
                      >
                        {simPressure} PSI
                      </span>
                    </div>
                    <input
                      type="range"
                      min={20}
                      max={130}
                      value={simPressure}
                      onChange={(e) => setSimPressure(+e.target.value)}
                      style={{ width: "100%", accentColor: "#6366f1" }}
                    />
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "#6366f1",
                        marginBottom: 6,
                      }}
                    >
                      Inlet Flow:{" "}
                      <span
                        style={{ color: "#c7d2fe", fontFamily: "monospace" }}
                      >
                        {simFlow} L/min
                      </span>
                    </div>
                    <input
                      type="range"
                      min={50}
                      max={600}
                      value={simFlow}
                      onChange={(e) => setSimFlow(+e.target.value)}
                      style={{ width: "100%", accentColor: "#6366f1" }}
                    />
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div
                      style={{
                        fontSize: 11,
                        color: "#6366f1",
                        marginBottom: 4,
                      }}
                    >
                      Anomaly Probability
                    </div>
                    <div
                      style={{
                        fontSize: 36,
                        fontWeight: 700,
                        fontFamily: "monospace",
                        color:
                          simAnomalyProb > 60
                            ? "#ef4444"
                            : simAnomalyProb > 30
                            ? "#f59e0b"
                            : "#22c55e",
                      }}
                    >
                      {simAnomalyProb}%
                    </div>
                    <div
                      style={{ fontSize: 11, color: "#4c1d95", marginTop: 2 }}
                    >
                      {simAnomalyProb > 60
                        ? "HIGH RISK"
                        : simAnomalyProb > 30
                        ? "ELEVATED"
                        : "NORMAL"}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT PANEL */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* NRW + Reservoir combined */}
            <div
              style={{
                background: "#0a1628",
                border: "1px solid rgba(56,189,248,.1)",
                borderRadius: 12,
                padding: 14,
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  color: "#475569",
                  fontFamily: "monospace",
                  letterSpacing: 0.5,
                  marginBottom: 10,
                }}
              >
                HYDRAULIC OVERVIEW
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <NRWGauge nrw={gov.nrw} target={gov.target_nrw} />
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    gap: 5,
                    fontSize: 11,
                  }}
                >
                  {[
                    {
                      l: "Delivered",
                      v: `${mass.deliveredM3?.toFixed(1) ?? 0} m³`,
                      c: "#22c55e",
                    },
                    {
                      l: "Lost (NRW)",
                      v: `−${mass.systemLossM3?.toFixed(1) ?? 0} m³`,
                      c: "#ef4444",
                    },
                    {
                      l: "Cycle Total",
                      v: `${mass.cycleOutflowM3?.toFixed(1) ?? 0} m³`,
                      c: "#38bdf8",
                    },
                    {
                      l: "Flow Rate",
                      v: `${mass.totalOutflowM3PerHr?.toFixed(0) ?? 0} m³/h`,
                      c: "#22d3ee",
                    },
                    { l: "Elevation", v: `${gov.elev}m`, c: "#94a3b8" },
                  ].map(({ l, v, c }) => (
                    <div
                      key={l}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <span style={{ color: "#475569" }}>{l}</span>
                      <span
                        style={{
                          color: c,
                          fontFamily: "monospace",
                          fontWeight: 600,
                        }}
                      >
                        {v}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Solution box */}
            <div
              style={{
                background: "#0a1628",
                border: `1px solid ${TYPE_CONFIG[worstType].color}40`,
                borderRight: `3px solid ${TYPE_CONFIG[worstType].color}`,
                borderRadius: 12,
                padding: 14,
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: TYPE_CONFIG[worstType].color,
                  marginBottom: 8,
                }}
              >
                {worstType === "normal" && "النظام طبيعي — All Clear"}
                {worstType === "leak" && "تسرب مكتشف — Leak Detected"}
                {worstType === "burst" && "انفجار حرج — Critical Burst"}
                {worstType === "theft" && "استهلاك غير مرخص — Theft"}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {worstType === "normal" &&
                  [
                    "All readings within normal thresholds.",
                    "No field intervention required.",
                  ].map((s, i) => (
                    <div
                      key={i}
                      style={{
                        fontSize: 11,
                        color: "#475569",
                        paddingBottom: 4,
                        borderBottom: "1px solid rgba(56,189,248,.05)",
                      }}
                    >
                      {s}
                    </div>
                  ))}
                {worstType === "leak" &&
                  [
                    "Deploy acoustic field detection team.",
                    "Reduce network pressure 15%.",
                    "File repair ticket — Medium priority.",
                  ].map((s, i) => (
                    <div
                      key={i}
                      style={{
                        fontSize: 11,
                        color: "#475569",
                        paddingBottom: 4,
                        borderBottom: "1px solid rgba(56,189,248,.05)",
                      }}
                    >
                      {s}
                    </div>
                  ))}
                {worstType === "burst" &&
                  [
                    "ISOLATE SECTION IMMEDIATELY.",
                    "Alert emergency response team.",
                    "Dispatch crew — ETA < 2 hours.",
                    "Document losses for management.",
                  ].map((s, i) => (
                    <div
                      key={i}
                      style={{
                        fontSize: 11,
                        color: "#475569",
                        paddingBottom: 4,
                        borderBottom: "1px solid rgba(56,189,248,.05)",
                      }}
                    >
                      {s}
                    </div>
                  ))}
                {worstType === "theft" &&
                  [
                    "Inspect lateral connections on site.",
                    "Review consumption logs — 72h.",
                    "Coordinate with Revenue Protection.",
                  ].map((s, i) => (
                    <div
                      key={i}
                      style={{
                        fontSize: 11,
                        color: "#475569",
                        paddingBottom: 4,
                        borderBottom: "1px solid rgba(56,189,248,.05)",
                      }}
                    >
                      {s}
                    </div>
                  ))}
              </div>
            </div>

            {/* Selected segment detail */}
            {selectedSeg && (
              <div
                style={{
                  background: "#0a1628",
                  border: "1px solid rgba(56,189,248,.15)",
                  borderRadius: 12,
                  padding: 14,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 10,
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      color: "#38bdf8",
                      fontFamily: "monospace",
                      fontWeight: 600,
                    }}
                  >
                    {selectedSeg.from} → {selectedSeg.to}
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      padding: "2px 8px",
                      borderRadius: 4,
                      background: `${TYPE_DOT[selectedSeg.predType]}22`,
                      color: TYPE_DOT[selectedSeg.predType],
                      fontWeight: 600,
                    }}
                  >
                    {selectedSeg.predType.toUpperCase()}
                  </span>
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "4px 12px",
                  }}
                >
                  {[
                    [
                      "Flow In",
                      `${selectedSeg.flowIn.toFixed(2)} L/m`,
                      "#38bdf8",
                    ],
                    [
                      "Flow Out",
                      `${selectedSeg.flowOut.toFixed(2)} L/m`,
                      "#22c55e",
                    ],
                    [
                      "Flow Loss",
                      `${selectedSeg.flowLoss.toFixed(2)}%`,
                      TYPE_DOT[selectedSeg.predType],
                    ],
                    [
                      "Excess Loss",
                      `${selectedSeg.excessLoss.toFixed(2)}%`,
                      TYPE_DOT[selectedSeg.predType],
                    ],
                    [
                      "Press. In",
                      `${selectedSeg.pressIn.toFixed(2)} PSI`,
                      "#a855f7",
                    ],
                    [
                      "Press. Out",
                      `${selectedSeg.pressOut.toFixed(2)} PSI`,
                      "#f59e0b",
                    ],
                    [
                      "DP Predicted",
                      `${selectedSeg.dpPred.toFixed(3)}`,
                      "#64748b",
                    ],
                    [
                      "DP Deviation",
                      `${selectedSeg.dpDev.toFixed(3)}`,
                      "#a855f7",
                    ],
                    ["Pipe Age", `${selectedSeg.age} yrs`, "#94a3b8"],
                    ["Pipe Length", `${selectedSeg.len} m`, "#94a3b8"],
                    ["HW Coeff.", `${selectedSeg.hw}`, "#94a3b8"],
                    [
                      "Confidence",
                      `${(selectedSeg.confidence * 100).toFixed(0)}%`,
                      TYPE_DOT[selectedSeg.predType],
                    ],
                  ].map(([l, v, c]) => (
                    <div
                      key={l}
                      style={{
                        padding: "3px 0",
                        borderBottom: "1px solid rgba(56,189,248,.04)",
                      }}
                    >
                      <div style={{ fontSize: 9, color: "#475569" }}>{l}</div>
                      <div
                        style={{
                          fontSize: 12,
                          color: c,
                          fontFamily: "monospace",
                          fontWeight: 600,
                        }}
                      >
                        {v}
                      </div>
                    </div>
                  ))}
                </div>
                <div
                  style={{
                    marginTop: 10,
                    paddingTop: 8,
                    borderTop: "1px solid rgba(56,189,248,.06)",
                  }}
                >
                  <div
                    style={{ fontSize: 9, color: "#475569", marginBottom: 6 }}
                  >
                    MODEL CONSENSUS
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr 1fr",
                      gap: 4,
                    }}
                  >
                    {[
                      ["LGB", selectedSeg.models.lgb],
                      ["XGB", selectedSeg.models.xgb],
                      ["NN", selectedSeg.models.nn],
                      ["LSTM", selectedSeg.models.lstm],
                    ].map(([n, v]) => (
                      <div key={n} style={{ textAlign: "center" }}>
                        <div
                          style={{
                            fontSize: 9,
                            color: "#475569",
                            marginBottom: 2,
                          }}
                        >
                          {n}
                        </div>
                        <div
                          style={{
                            fontSize: 14,
                            fontFamily: "monospace",
                            fontWeight: 700,
                            color:
                              v > 50
                                ? TYPE_DOT[selectedSeg.predType]
                                : "#38bdf8",
                          }}
                        >
                          {v.toFixed(0)}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Alert log */}
            <div
              style={{
                background: "#0a1628",
                border: "1px solid rgba(56,189,248,.1)",
                borderRadius: 12,
                padding: 14,
                flex: 1,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 10,
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    color: "#475569",
                    fontFamily: "monospace",
                    letterSpacing: 0.5,
                  }}
                >
                  ALERT LOG
                </span>
                <span
                  style={{
                    fontSize: 11,
                    color: "#ef4444",
                    fontFamily: "monospace",
                  }}
                >
                  {allAlerts.length}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 5,
                  maxHeight: 260,
                  overflowY: "auto",
                }}
              >
                {allAlerts.length === 0 && (
                  <div
                    style={{
                      color: "#334155",
                      fontSize: 11,
                      textAlign: "center",
                      padding: 16,
                    }}
                  >
                    No alerts...
                  </div>
                )}
                {allAlerts.slice(0, 20).map((a, i) => {
                  const tc = TYPE_DOT[a.predType];
                  return (
                    <div
                      key={i}
                      onClick={() => setSelectedSeg(a)}
                      style={{
                        background: "#0d1830",
                        borderRadius: 7,
                        padding: "8px 10px",
                        borderRight: `3px solid ${tc}`,
                        cursor: "pointer",
                        animation: "slideIn .2s ease",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: 3,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: "#e2e8f0",
                            fontFamily: "monospace",
                          }}
                        >
                          {a.branch} · D{a.depth}
                        </span>
                        <span
                          style={{
                            fontSize: 9,
                            color: "#475569",
                            fontFamily: "monospace",
                          }}
                        >
                          {a.ts}
                        </span>
                      </div>
                      <div style={{ fontSize: 10, color: "#64748b" }}>
                        {a.from} → {a.to}
                      </div>
                      <div style={{ fontSize: 10, color: "#64748b" }}>
                        ΔFlow: {a.flowLoss?.toFixed(1)}% · DP:{" "}
                        {a.dpDev?.toFixed(3)}
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          color: tc,
                          fontWeight: 600,
                          marginTop: 2,
                          fontFamily: "monospace",
                        }}
                      >
                        {a.predType.toUpperCase()} ·{" "}
                        {(a.confidence * 100).toFixed(0)}%
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── BOTTOM: All governorates NRW + reservoir overview ── */}
        <div
          style={{
            background: "#0a1628",
            border: "1px solid rgba(56,189,248,.08)",
            borderRadius: 12,
            padding: 14,
          }}
        >
          <div
            style={{
              fontSize: 10,
              color: "#475569",
              fontFamily: "monospace",
              letterSpacing: 0.5,
              marginBottom: 12,
            }}
          >
            JORDAN NETWORK OVERVIEW — Reservoir Levels × NRW per Governorate
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(12,1fr)",
              gap: 8,
            }}
          >
            {Object.entries(NETWORK).map(([k, v]) => {
              const nrwPct = Math.round(v.nrw * 100);
              const rPct =
                ((reservoirLevels[k] ?? v.reservoirCap) / v.reservoirCap) * 100;
              const isActive = k === govKey;
              return (
                <div
                  key={k}
                  onClick={() => setGovKey(k)}
                  style={{
                    cursor: "pointer",
                    textAlign: "center",
                    padding: "8px 4px",
                    borderRadius: 8,
                    background: isActive
                      ? "rgba(56,189,248,.08)"
                      : "transparent",
                    border: `1px solid ${
                      isActive ? "rgba(56,189,248,.3)" : "transparent"
                    }`,
                    transition: "all .15s",
                  }}
                >
                  {/* Mini tank */}
                  <div
                    style={{
                      width: 18,
                      height: 44,
                      margin: "0 auto 4px",
                      position: "relative",
                      background: "#0f172a",
                      borderRadius: 3,
                      overflow: "hidden",
                      border: "1px solid #1e293b",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: `${rPct}%`,
                        background:
                          rPct > 60
                            ? "#22c55e"
                            : rPct > 30
                            ? "#f59e0b"
                            : "#ef4444",
                        transition: "height .4s",
                      }}
                    />
                  </div>
                  <div
                    style={{
                      fontSize: 9,
                      color: isActive ? "#38bdf8" : "#64748b",
                      fontWeight: isActive ? 700 : 400,
                    }}
                  >
                    {v.label}
                  </div>
                  <div
                    style={{
                      fontSize: 9,
                      color:
                        rPct > 60
                          ? "#22c55e"
                          : rPct > 30
                          ? "#f59e0b"
                          : "#ef4444",
                      fontFamily: "monospace",
                      fontWeight: 600,
                    }}
                  >
                    {rPct.toFixed(0)}%
                  </div>
                  <div
                    style={{
                      fontSize: 8,
                      color:
                        v.nrw > 0.5
                          ? "#ef4444"
                          : v.nrw > 0.4
                          ? "#f59e0b"
                          : "#22c55e",
                      fontFamily: "monospace",
                    }}
                  >
                    NRW {nrwPct}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.3} }
        @keyframes slideIn { from{transform:translateX(-5px);opacity:0} to{transform:none;opacity:1} }
        ::-webkit-scrollbar{width:3px;height:3px}
        ::-webkit-scrollbar-track{background:#0a1628}
        ::-webkit-scrollbar-thumb{background:rgba(56,189,248,.25);border-radius:2px}
        input[type=range]{-webkit-appearance:none;height:4px;border-radius:2px;outline:none}
        input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;border-radius:50%;cursor:pointer}
      `}</style>
    </div>
  );
}
