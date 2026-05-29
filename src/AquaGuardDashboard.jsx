import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
} from 'recharts';
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
} from 'lucide-react';

// ══════════════════════════════════════════════════════════════════════════════
// إعدادات API — ضع رابط ngrok هنا عند تشغيل Backend من Colab
// ══════════════════════════════════════════════════════════════════════════════
const API_URL = ''; // ← ضع رابط ngrok هنا

async function apiPost(path, body) {
  if (!API_URL) return null;
  try {
    const r = await fetch(API_URL + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      mode: 'cors',
    });
    return r.ok ? r.json() : null;
  } catch {
    return null;
  }
}

async function apiGet(path) {
  if (!API_URL) return null;
  try {
    const r = await fetch(API_URL + path, { mode: 'cors' });
    return r.ok ? r.json() : null;
  } catch {
    return null;
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// بيانات الشبكة — محافظات الأردن مع سعات الخزانات
// ══════════════════════════════════════════════════════════════════════════════
// reservoirCap = initial reservoir capacity in m³ (realistic WAJ-style values)
const NETWORK = {
  Amman: {
    label: 'عمّان',
    source: 'King Abdullah Canal / Zai-WTP',
    nrw: 0.43,
    flowR: [80, 1400],
    presR: [60, 125],
    elev: 780,
    pop: 5540,
    color: '#c0c0c0',
    target_nrw: 0.3,
    reservoirCap: 180000,
    branches: {
      East: {
        color: '#38bdf8',
        segs: [
          { f: 'AMM-رئيسي', t: 'Marka', len: 820, age: 22, hw: 125 },
          { f: 'Marka', t: 'Abu-Nsair', len: 650, age: 28, hw: 118 },
          { f: 'Abu-Nsair', t: 'Hashmi', len: 480, age: 35, hw: 108 },
          { f: 'Hashmi', t: 'Basman', len: 390, age: 40, hw: 100 },
        ],
      },
      West: {
        color: '#22c55e',
        segs: [
          { f: 'AMM-رئيسي', t: 'Abdoun', len: 750, age: 15, hw: 140 },
          { f: 'Abdoun', t: 'Sweifieh', len: 620, age: 18, hw: 136 },
          { f: 'Sweifieh', t: 'Jubaiha', len: 530, age: 22, hw: 128 },
          { f: 'Jubaiha', t: 'Khilda', len: 460, age: 20, hw: 132 },
        ],
      },
      North: {
        color: '#f59e0b',
        segs: [
          { f: 'AMM-رئيسي', t: 'Shmeisani', len: 680, age: 20, hw: 132 },
          { f: 'Shmeisani', t: 'Rabieh', len: 710, age: 25, hw: 126 },
          { f: 'Rabieh', t: 'Tla-Ali', len: 590, age: 18, hw: 138 },
        ],
      },
      South: {
        color: '#a855f7',
        segs: [
          { f: 'AMM-رئيسي', t: 'Sahab', len: 900, age: 30, hw: 115 },
          { f: 'Sahab', t: 'Yadoudeh', len: 800, age: 35, hw: 108 },
          { f: 'Yadoudeh', t: 'Muwaqqar', len: 720, age: 40, hw: 102 },
        ],
      },
      Central: {
        color: '#ef4444',
        segs: [
          { f: 'AMM-رئيسي', t: 'Gardens', len: 600, age: 12, hw: 145 },
          { f: 'Gardens', t: 'Um-Uthaina', len: 550, age: 15, hw: 141 },
          { f: 'Um-Uthaina', t: 'Khalda', len: 490, age: 18, hw: 138 },
        ],
      },
    },
  },
  Irbid: {
    label: 'إربد',
    source: 'Yarmouk River WTP',
    nrw: 0.45,
    flowR: [60, 800],
    presR: [45, 100],
    elev: 620,
    pop: 3280,
    color: '#22c55e',
    target_nrw: 0.32,
    reservoirCap: 95000,
    branches: {
      Central: {
        color: '#38bdf8',
        segs: [
          { f: 'IRB-رئيسي', t: 'Husn', len: 700, age: 20, hw: 130 },
          { f: 'Husn', t: 'Manara', len: 620, age: 25, hw: 122 },
          { f: 'Manara', t: 'Ramtha', len: 550, age: 30, hw: 115 },
        ],
      },
      North: {
        color: '#22c55e',
        segs: [
          { f: 'IRB-رئيسي', t: 'Al-Huson', len: 680, age: 18, hw: 135 },
          { f: 'Al-Huson', t: 'Bait-Ras', len: 590, age: 22, hw: 128 },
          { f: 'Bait-Ras', t: 'Kufr-Asad', len: 510, age: 28, hw: 120 },
        ],
      },
      West: {
        color: '#f59e0b',
        segs: [
          { f: 'IRB-رئيسي', t: 'Koura', len: 850, age: 35, hw: 108 },
          { f: 'Koura', t: 'Kufrinja', len: 780, age: 40, hw: 100 },
          { f: 'Kufrinja', t: 'Deir-Said', len: 650, age: 45, hw: 95 },
        ],
      },
      South: {
        color: '#a855f7',
        segs: [
          { f: 'IRB-رئيسي', t: 'Aydoun', len: 760, age: 28, hw: 118 },
          { f: 'Aydoun', t: 'Bani-Kinana', len: 680, age: 32, hw: 112 },
          { f: 'Bani-Kinana', t: 'Tibne', len: 600, age: 38, hw: 106 },
        ],
      },
    },
  },
  Zarqa: {
    label: 'الزرقاء',
    source: 'Zarqa Municipal Reservoirs',
    nrw: 0.52,
    flowR: [50, 620],
    presR: [35, 90],
    elev: 580,
    pop: 4120,
    color: '#f59e0b',
    target_nrw: 0.35,
    reservoirCap: 72000,
    branches: {
      'Old-City': {
        color: '#38bdf8',
        segs: [
          { f: 'ZRQ-رئيسي', t: 'Zarqa-Center', len: 920, age: 42, hw: 96 },
          { f: 'Zarqa-Center', t: 'Rusaifa', len: 850, age: 48, hw: 90 },
          { f: 'Rusaifa', t: 'New-Zarqa', len: 780, age: 52, hw: 86 },
        ],
      },
      Industrial: {
        color: '#22c55e',
        segs: [
          { f: 'ZRQ-رئيسي', t: 'Ind-Zone', len: 800, age: 30, hw: 112 },
          { f: 'Ind-Zone', t: 'Hashimiyya', len: 720, age: 35, hw: 106 },
          { f: 'Hashimiyya', t: 'Dhiban', len: 650, age: 38, hw: 101 },
        ],
      },
      East: {
        color: '#f59e0b',
        segs: [
          { f: 'ZRQ-رئيسي', t: 'Azraq', len: 1200, age: 20, hw: 138 },
          { f: 'Azraq', t: 'Safawi', len: 1100, age: 15, hw: 142 },
          { f: 'Safawi', t: 'Ruwaished', len: 900, age: 12, hw: 146 },
        ],
      },
    },
  },
  Karak: {
    label: 'الكرك',
    source: 'Karak WAJ Supply',
    nrw: 0.56,
    flowR: [15, 220],
    presR: [25, 72],
    elev: 930,
    pop: 85,
    color: '#ef4444',
    target_nrw: 0.38,
    reservoirCap: 28000,
    branches: {
      Central: {
        color: '#38bdf8',
        segs: [
          { f: 'KRK-رئيسي', t: 'Karak-City', len: 950, age: 45, hw: 90 },
          { f: 'Karak-City', t: 'Mazar', len: 880, age: 50, hw: 85 },
          { f: 'Mazar', t: 'Mutah', len: 800, age: 55, hw: 80 },
        ],
      },
      North: {
        color: '#22c55e',
        segs: [
          { f: 'KRK-رئيسي', t: 'Al-Qasr', len: 820, age: 38, hw: 98 },
          { f: 'Al-Qasr', t: 'Safi', len: 760, age: 42, hw: 93 },
          { f: 'Safi', t: 'Al-Lajjun', len: 680, age: 48, hw: 87 },
        ],
      },
    },
  },
  Aqaba: {
    label: 'العقبة',
    source: 'Aqaba Desalination Plant',
    nrw: 0.41,
    flowR: [25, 380],
    presR: [35, 92],
    elev: 10,
    pop: 310,
    color: '#06b6d4',
    target_nrw: 0.28,
    reservoirCap: 45000,
    branches: {
      Port: {
        color: '#38bdf8',
        segs: [
          { f: 'AQB-رئيسي', t: 'Aqaba-Port', len: 700, age: 20, hw: 132 },
          { f: 'Aqaba-Port', t: 'Ind-Zone-AQ', len: 650, age: 25, hw: 126 },
          { f: 'Ind-Zone-AQ', t: 'South-Aqaba', len: 580, age: 18, hw: 138 },
        ],
      },
      Residential: {
        color: '#22c55e',
        segs: [
          { f: 'AQB-رئيسي', t: 'Aqaba-Center', len: 620, age: 15, hw: 140 },
          { f: 'Aqaba-Center', t: 'Quweira', len: 580, age: 20, hw: 134 },
          { f: 'Quweira', t: 'Wadi-Rum', len: 520, age: 25, hw: 128 },
        ],
      },
    },
  },
  Mafraq: {
    label: 'المفرق',
    source: 'Mafraq Groundwater Wells',
    nrw: 0.5,
    flowR: [20, 320],
    presR: [28, 78],
    elev: 690,
    pop: 13,
    color: '#8b5cf6',
    target_nrw: 0.33,
    reservoirCap: 35000,
    branches: {
      Central: {
        color: '#38bdf8',
        segs: [
          { f: 'MFQ-رئيسي', t: 'Mafraq-City', len: 1100, age: 15, hw: 140 },
          { f: 'Mafraq-City', t: 'Rhab', len: 980, age: 18, hw: 136 },
          { f: 'Rhab', t: 'Umm-Jimal', len: 850, age: 22, hw: 130 },
        ],
      },
      North: {
        color: '#22c55e',
        segs: [
          { f: 'MFQ-رئيسي', t: 'Safawi-Town', len: 1300, age: 12, hw: 145 },
          { f: 'Safawi-Town', t: 'Ruwaished-N', len: 1200, age: 15, hw: 142 },
          { f: 'Ruwaished-N', t: 'Azraq-N', len: 1100, age: 18, hw: 138 },
        ],
      },
    },
  },
  Maan: {
    label: 'معان',
    source: 'Maan Groundwater Wells',
    nrw: 0.55,
    flowR: [8, 170],
    presR: [20, 68],
    elev: 1070,
    pop: 4,
    color: '#fb923c',
    target_nrw: 0.36,
    reservoirCap: 22000,
    branches: {
      City: {
        color: '#38bdf8',
        segs: [
          { f: 'MAN-رئيسي', t: 'Maan-Center', len: 950, age: 18, hw: 138 },
          { f: 'Maan-Center', t: 'Qatraneh', len: 880, age: 22, hw: 132 },
          { f: 'Qatraneh', t: 'Jafr', len: 800, age: 28, hw: 125 },
        ],
      },
      South: {
        color: '#22c55e',
        segs: [
          { f: 'MAN-رئيسي', t: 'Wadi-Musa', len: 1050, age: 22, hw: 132 },
          { f: 'Wadi-Musa', t: 'Shobak', len: 980, age: 28, hw: 125 },
          { f: 'Shobak', t: 'Ras-Naqab', len: 900, age: 35, hw: 117 },
        ],
      },
    },
  },
  Ajloun: {
    label: 'عجلون',
    source: 'Ajloun Spring Network',
    nrw: 0.54,
    flowR: [5, 120],
    presR: [22, 62],
    elev: 1250,
    pop: 393,
    color: '#84cc16',
    target_nrw: 0.35,
    reservoirCap: 18000,
    branches: {
      Central: {
        color: '#38bdf8',
        segs: [
          { f: 'AJL-رئيسي', t: 'Ajloun-City', len: 750, age: 35, hw: 100 },
          { f: 'Ajloun-City', t: 'Anjara', len: 680, age: 40, hw: 95 },
          { f: 'Anjara', t: 'Orjan', len: 600, age: 45, hw: 90 },
        ],
      },
      North: {
        color: '#22c55e',
        segs: [
          { f: 'AJL-رئيسي', t: 'Shtafina', len: 820, age: 30, hw: 105 },
          { f: 'Shtafina', t: 'Rasun', len: 750, age: 35, hw: 100 },
        ],
      },
    },
  },
  Jerash: {
    label: 'جرش',
    source: 'Jerash WAJ Network',
    nrw: 0.48,
    flowR: [8, 150],
    presR: [25, 68],
    elev: 600,
    pop: 585,
    color: '#10b981',
    target_nrw: 0.32,
    reservoirCap: 20000,
    branches: {
      City: {
        color: '#38bdf8',
        segs: [
          { f: 'JRS-رئيسي', t: 'Jerash-City', len: 700, age: 25, hw: 115 },
          { f: 'Jerash-City', t: 'Sakeb', len: 640, age: 30, hw: 108 },
          { f: 'Sakeb', t: 'Kufr-Khall', len: 580, age: 35, hw: 102 },
        ],
      },
      South: {
        color: '#22c55e',
        segs: [
          { f: 'JRS-رئيسي', t: 'Al-Hashimiyya', len: 780, age: 20, hw: 122 },
          { f: 'Al-Hashimiyya', t: 'Beit-Ras-J', len: 720, age: 25, hw: 116 },
        ],
      },
    },
  },
  Madaba: {
    label: 'مادبا',
    source: 'Madaba Municipal Wells',
    nrw: 0.51,
    flowR: [10, 200],
    presR: [28, 72],
    elev: 800,
    pop: 202,
    color: '#f472b6',
    target_nrw: 0.34,
    reservoirCap: 24000,
    branches: {
      City: {
        color: '#38bdf8',
        segs: [
          { f: 'MDB-رئيسي', t: 'Madaba-City', len: 800, age: 28, hw: 112 },
          { f: 'Madaba-City', t: 'Libb', len: 740, age: 32, hw: 106 },
          { f: 'Libb', t: 'Yadoudeh-M', len: 680, age: 38, hw: 100 },
        ],
      },
      East: {
        color: '#22c55e',
        segs: [
          { f: 'MDB-رئيسي', t: 'Dhiban', len: 900, age: 22, hw: 118 },
          { f: 'Dhiban', t: 'Ar-Rabbah', len: 840, age: 28, hw: 112 },
        ],
      },
    },
  },
  Balqa: {
    label: 'البلقاء',
    source: 'Balqa WAJ Supply',
    nrw: 0.47,
    flowR: [15, 280],
    presR: [30, 80],
    elev: 900,
    pop: 455,
    color: '#67e8f9',
    target_nrw: 0.31,
    reservoirCap: 32000,
    branches: {
      Central: {
        color: '#38bdf8',
        segs: [
          { f: 'BLQ-رئيسي', t: 'Salt-City', len: 750, age: 20, hw: 125 },
          { f: 'Salt-City', t: 'Shuneh-N', len: 700, age: 25, hw: 118 },
          { f: 'Shuneh-N', t: 'Kafrein', len: 650, age: 30, hw: 112 },
        ],
      },
      West: {
        color: '#22c55e',
        segs: [
          { f: 'BLQ-رئيسي', t: 'Wadi-Sir', len: 680, age: 15, hw: 130 },
          { f: 'Wadi-Sir', t: 'Naur', len: 620, age: 20, hw: 124 },
          { f: 'Naur', t: 'Abu-Nsair-B', len: 560, age: 25, hw: 118 },
        ],
      },
    },
  },
  Tafilah: {
    label: 'الطفيلة',
    source: 'Tafilah Groundwater',
    nrw: 0.53,
    flowR: [5, 100],
    presR: [20, 65],
    elev: 1100,
    pop: 48,
    color: '#fbbf24',
    target_nrw: 0.36,
    reservoirCap: 16000,
    branches: {
      Central: {
        color: '#38bdf8',
        segs: [
          { f: 'TFL-رئيسي', t: 'Tafilah-City', len: 850, age: 30, hw: 108 },
          { f: 'Tafilah-City', t: 'Busaira', len: 800, age: 35, hw: 102 },
          { f: 'Busaira', t: 'Aina', len: 720, age: 40, hw: 96 },
        ],
      },
      North: {
        color: '#22c55e',
        segs: [
          { f: 'TFL-رئيسي', t: 'Qadisiyya', len: 900, age: 25, hw: 112 },
          { f: 'Qadisiyya', t: 'Habis', len: 820, age: 30, hw: 106 },
        ],
      },
    },
  },
  NationalCarrier: {
    label: 'الناقل الوطني',
    source: 'Red Sea Intake / Aqaba → Amman Delivery Corridor',
    nrw: 0.12,
    flowR: [570000, 588000],
    presR: [102, 148],
    elev: 910,
    pop: 11000,
    color: '#06b6d4',
    target_nrw: 0.18,
    reservoirCap: 25000000,
    branches: {
      'Carrier Corridor': {
        color: '#e5e7eb',
        segs: [
          { f: 'Intake', t: 'BPS2', len: 12000, age: 3, hw: 145 },
          { f: 'BPS2', t: 'BPS3', len: 18000, age: 3, hw: 145 },
          { f: 'BPS3', t: 'RGT1', len: 24000, age: 4, hw: 144 },
          { f: 'RGT1', t: 'BPS4', len: 27000, age: 4, hw: 144 },
          { f: 'BPS4', t: 'RGT2', len: 26000, age: 5, hw: 143 },
          { f: 'RGT2', t: 'BPT', len: 31000, age: 5, hw: 143 },
          { f: 'BPT', t: 'PS ADC', len: 19000, age: 6, hw: 142 },
          { f: 'PS ADC', t: 'AL MUNTAZAH', len: 7000, age: 6, hw: 142 },
          { f: 'PS ADC', t: 'ABU ALANDA', len: 5000, age: 6, hw: 142 },
        ],
      },
    },
  },
};

const NATIONAL_CARRIER_KEY = 'NationalCarrier';
const NATIONAL_CARRIER_ROUTE = [
  {
    code: 'Intake',
    label: 'Intake',
    kind: 'intake',
    gov: 'البحر الأحمر',
    x: 50,
    y: 430,
  },

  { code: 'BPS2', label: 'BPS2', kind: 'pump', gov: 'العقبة', x: 128, y: 420 },
  { code: 'BPS3', label: 'BPS3', kind: 'pump', gov: 'العقبة', x: 170, y: 360 },

  { code: 'RGT1', label: 'RGT1', kind: 'reg', gov: 'معان', x: 350, y: 390 },
  { code: 'BPS4', label: 'BPS4', kind: 'pump', gov: 'معان', x: 400, y: 280 },
  { code: 'RGT2', label: 'RGT2', kind: 'reg', gov: 'معان', x: 490, y: 199 },
  { code: 'BPT', label: 'BPT', kind: 'tank', gov: 'معان', x: 500, y: 140 },

  { code: 'PS ADC', label: 'PS ADC', kind: 'hub', gov: 'عمّان', x: 490, y: 92 },

  /* نقطة تفرع مخفية لتحسين شكل التفرع */
  {
    code: 'AMMAN_SPLIT',
    label: '',
    kind: 'hidden',
    gov: 'عمّان',
    x: 1000,
    y: 78,
    hidden: true,
  },

  {
    code: 'AL MUNTAZAH',
    label: 'AL MUNTAZAH',
    kind: 'terminal-red',
    gov: 'عمّان',
    x: 400,
    y: 70,
  },
  {
    code: 'ABU ALANDA',
    label: 'ABU ALANDA',
    kind: 'terminal-red',
    gov: 'عمّان',
    x: 460,
    y: 40,
  },
];

const ANOMALY_TYPES = ['normal', 'leak', 'burst', 'theft'];
const TYPE_CONFIG = {
  normal: {
    color: '#22c55e',
    glow: '#22c55e40',
    label: 'طبيعي',
    icon: '✓',
    urgency: 0,
  },
  leak: {
    color: '#f59e0b',
    glow: '#f59e0b40',
    label: 'تسرب',
    icon: '~',
    urgency: 2,
  },
  burst: {
    color: '#ef4444',
    glow: '#ef444440',
    label: 'انفجار',
    icon: '!',
    urgency: 3,
  },
  theft: {
    color: '#a855f7',
    glow: '#a855f740',
    label: 'سرقة',
    icon: '?',
    urgency: 1,
  },
};

const UPDATE_INTERVAL_SEC = 15;
const NORMAL_PIPE_COLOR = '#6b7280';
const NORMAL_PIPE_EDGE = '#9ca3af';
const NORMAL_CONNECTOR_COLOR = '#4b5563';

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
// Every UPDATE_INTERVAL_SEC seconds the pump fires: total branch inflow leaves the reservoir.
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
      forcedType && forcedType !== 'normal'
        ? Math.floor(Math.random() * branch.segs.length)
        : -1;

    branch.segs.forEach((seg, si) => {
      const isForcedFault = si === faultIdx;
      const ftype = isForcedFault
        ? forcedType || null
        : Math.random() < gov.nrw * 0.15
        ? ANOMALY_TYPES[Math.floor(Math.random() * 4)]
        : 'normal';
      const dpPred = darcyDP(flowIn, seg.len, seg.hw);
      let sev = 0,
        flowOut = flowIn,
        pressOut = pressIn;

      if (ftype === 'leak') {
        sev = 0.04 + Math.random() * 0.14;
        flowOut = flowIn * (1 - sev);
        pressOut = pressIn - dpPred - sev * pressIn * 0.5;
      } else if (ftype === 'burst') {
        sev = 0.25 + Math.random() * 0.47;
        flowOut = flowIn * (1 - sev);
        pressOut = pressIn - dpPred - sev * pressIn * 0.8;
      } else if (ftype === 'theft') {
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
        faultHere: ftype !== 'normal' ? 1 : 0,
        branchColor: branch.color,
        alert: ftype !== 'normal',
      };
      results.push(segData);
      if (ftype !== 'normal')
        alerts.push({ ...segData, ts: new Date().toLocaleTimeString() });
      flowIn = flowOut;
      pressIn = pressOut;
    });
  });

  // ─── Mass balance: L/min → m³ per configurable pump cycle ────────────────
  // totalBranchInflow is L/min; cycle is UPDATE_INTERVAL_SEC → multiply by (UPDATE_INTERVAL_SEC/60)/1000
  const DEMO_SPEED = govKey === NATIONAL_CARRIER_KEY ? 1 : 150;
  const cycleOutflowM3 =
    ((totalBranchInflow * (UPDATE_INTERVAL_SEC / 60)) / 1000) * DEMO_SPEED;
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
  const levelColor = pct > 60 ? '#22c55e' : pct > 30 ? '#f59e0b' : '#ef4444';

  const [waveOffset, setWaveOffset] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setWaveOffset((o) => (o + 1) % 48), 80);
    return () => clearInterval(id);
  }, []);

  const W = 126,
    H = 196;
  const tankX = 18,
    tankY = 26,
    tankW = 82,
    tankH = 136,
    rx = tankW / 2,
    ry = 11;
  const waterBottomY = tankY + tankH;
  const waterTopY = tankY + tankH - (pct / 100) * tankH;

  let wavePath = `M ${tankX} ${waterTopY}`;
  for (let x = tankX; x <= tankX + tankW; x += 2) {
    const y = waterTopY + Math.sin(((x + waveOffset) / 18) * Math.PI * 2) * 2.8;
    wavePath += ` L ${x} ${y}`;
  }
  wavePath += ` L ${
    tankX + tankW
  } ${waterBottomY} L ${tankX} ${waterBottomY} Z`;

  return (
    <div style={{ position: 'relative', width: W, height: H, flexShrink: 0 }}>
      <svg width={W} height={H} style={{ display: 'block' }}>
        <defs>
          <linearGradient id="tankOuterGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="45%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#020617" />
          </linearGradient>
          <linearGradient id="tankFrontGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#334155" stopOpacity="0.92" />
            <stop offset="22%" stopColor="#0f172a" stopOpacity="0.98" />
            <stop offset="55%" stopColor="#1e293b" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#020617" stopOpacity="1" />
          </linearGradient>
          <linearGradient id="waterCylinderGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={levelColor} stopOpacity="0.52" />
            <stop offset="20%" stopColor={levelColor} stopOpacity="0.88" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="0.25" />
            <stop offset="80%" stopColor={levelColor} stopOpacity="0.82" />
            <stop offset="100%" stopColor={levelColor} stopOpacity="0.45" />
          </linearGradient>
          <linearGradient id="waterTopGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
            <stop offset="100%" stopColor={levelColor} stopOpacity="0.9" />
          </linearGradient>
          <filter id="tankShadow" x="-20%" y="-20%" width="140%" height="160%">
            <feDropShadow
              dx="0"
              dy="8"
              stdDeviation="8"
              floodColor="#000000"
              floodOpacity="0.35"
            />
          </filter>
          <filter id="tankGlow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <ellipse
          cx={tankX + rx}
          cy={tankY}
          rx={rx}
          ry={ry}
          fill="url(#tankOuterGrad)"
          stroke={pulsing ? levelColor : govColor}
          strokeWidth={pulsing ? '2' : '1.5'}
          filter={pulsing ? 'url(#tankGlow)' : undefined}
        />

        <rect
          x={tankX}
          y={tankY}
          width={tankW}
          height={tankH}
          fill="url(#tankFrontGrad)"
          stroke={pulsing ? levelColor : govColor}
          strokeWidth={pulsing ? '2' : '1.5'}
          filter="url(#tankShadow)"
          style={{ transition: 'stroke .3s' }}
        />

        <ellipse
          cx={tankX + rx}
          cy={tankY + tankH}
          rx={rx}
          ry={ry}
          fill="#020617"
          stroke={pulsing ? levelColor : govColor}
          strokeWidth={pulsing ? '2' : '1.5'}
        />

        {pct > 0 && (
          <>
            <path d={wavePath} fill="url(#waterCylinderGrad)" opacity="0.95" />
            <ellipse
              cx={tankX + rx}
              cy={waterTopY}
              rx={rx - 1}
              ry={ry - 2}
              fill="url(#waterTopGrad)"
              stroke={levelColor}
              strokeOpacity="0.8"
              strokeWidth="1"
            />
            <line
              x1={tankX + 12}
              y1={tankY + 14}
              x2={tankX + 12}
              y2={tankY + tankH - 10}
              stroke="#ffffff"
              strokeOpacity="0.18"
              strokeWidth="4"
              strokeLinecap="round"
            />
          </>
        )}

        {[25, 50, 75].map((t) => {
          const y = tankY + tankH - (t / 100) * tankH;
          return (
            <g key={t}>
              <line
                x1={tankX + tankW + 2}
                y1={y}
                x2={tankX + tankW + 11}
                y2={y}
                stroke="#475569"
                strokeWidth="0.8"
              />
              <text
                x={tankX + tankW + 14}
                y={y + 3}
                fill="#64748b"
                fontSize="7"
                fontFamily="monospace"
              >
                {t}%
              </text>
            </g>
          );
        })}

        <rect
          x={43}
          y="7"
          width="32"
          height="12"
          rx="3"
          fill="#334155"
          stroke="#475569"
        />
        <rect x={54} y="2" width="10" height="7" rx="2" fill="#64748b" />

        <text
          x={tankX + rx}
          y={tankY + tankH / 2 + 6}
          fill="#f8fafc"
          fontSize="18"
          fontWeight="700"
          fontFamily="monospace"
          textAnchor="middle"
          style={{ textShadow: '0 0 6px rgba(0,0,0,.9)' }}
        >
          {pct.toFixed(1)}%
        </text>

        {pulsing && (
          <circle cx={tankX + tankW - 6} cy={tankY - 2} r="4" fill="#22d3ee">
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
        )}
      </svg>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PIPE NETWORK SVG
// ══════════════════════════════════════════════════════════════════════════════

function NationalCarrierMap({
  segments,
  onSegClick,
  selectedSeg,
  pumping,
  totalOutflowM3PerHr,
}) {
  const W = 940;
  const H = 560;
  const mapX = 32;
  const mapY = 34;

  const annualالهدف = 300000000;
  const monthlyالهدف = 25000000;
  const dailyالهدف = 833333;
  const hourlyالهدف = annualالهدف / 365 / 24;
  const corridorKm = 169;

  const pointsByCode = Object.fromEntries(
    NATIONAL_CARRIER_ROUTE.map((p) => [p.code, p])
  );

  const routeSegments = (segments || []).filter(
    (seg) => pointsByCode[seg.from] && pointsByCode[seg.to]
  );

  const zoneStyles = {
    sea: {
      stroke: 'rgba(103,232,249,.88)',
    },
    aqaba: {
      stroke: 'rgba(255,255,255,.86)',
    },
    maan: {
      stroke: 'rgba(255,255,255,.86)',
    },
    amman: {
      stroke: 'rgba(255,255,255,.94)',
    },
  };

  const getPipeColors = (type) => {
    switch (type) {
      case 'burst':
        return { body: '#ef4444', glow: 'url(#ncGlowRed)' };
      case 'leak':
        return { body: '#f59e0b', glow: 'url(#ncGlowAmber)' };
      case 'theft':
        return { body: '#a855f7', glow: 'url(#ncGlowPurple)' };
      default:
        return { body: '#e5e7eb', glow: 'url(#ncPipeShadow)' };
    }
  };

  const labelOffsets = {
    Intake: { dx: 10, dy: 26, anchor: 'start' },
    BPS2: { dx: 12, dy: 18, anchor: 'start' },
    BPS3: { dx: 12, dy: 18, anchor: 'start' },
    RGT1: { dx: 12, dy: 18, anchor: 'start' },
    BPS4: { dx: 12, dy: 18, anchor: 'start' },
    RGT2: { dx: 12, dy: 18, anchor: 'start' },
    BPT: { dx: 14, dy: -8, anchor: 'start' },
    'PS ADC': { dx: 14, dy: 18, anchor: 'start' },
    'AL MUNTAZAH': { dx: 16, dy: -8, anchor: 'start' },
    'ABU ALANDA': { dx: 16, dy: -10, anchor: 'start' },
  };

  const renderNode = (point, activeType = null, isSelected = false) => {
    const lc = activeType ? TYPE_CONFIG[activeType].color : '#ffffff';
    const offs = labelOffsets[point.code] || {
      dx: 12,
      dy: -12,
      anchor: 'start',
    };

    const nodeShape = () => {
      if (point.kind === 'terminal-red') {
        return (
          <text
            x={point.x}
            y={point.y + 7}
            textAnchor="middle"
            fill="#ef4444"
            fontSize="24"
            fontWeight="900"
            stroke="#ffffff"
            strokeWidth="0.9"
            paintOrder="stroke"
          >
            ★
          </text>
        );
      }

      if (point.kind === 'hub') {
        return (
          <text
            x={point.x}
            y={point.y + 7}
            textAnchor="middle"
            fill="#f8fafc"
            fontSize="22"
            fontWeight="900"
            stroke="#111827"
            strokeWidth="0.8"
            paintOrder="stroke"
          >
            ★
          </text>
        );
      }

      if (
        point.kind === 'pump' ||
        point.kind === 'reg' ||
        point.kind === 'tank'
      ) {
        return (
          <rect
            x={point.x - 8}
            y={point.y - 8}
            width="16"
            height="16"
            rx="2"
            fill="#facc15"
            stroke="#f8fafc"
            strokeWidth="1.6"
          />
        );
      }

      return (
        <circle
          cx={point.x}
          cy={point.y}
          r="7"
          fill="#38bdf8"
          stroke="#f8fafc"
          strokeWidth="1.6"
        />
      );
    };

    return (
      <g key={point.code}>
        {isSelected && (
          <circle
            cx={point.x}
            cy={point.y}
            r="18"
            fill="none"
            stroke={lc}
            strokeWidth="1.8"
            opacity="0.58"
          />
        )}

        {nodeShape()}

        <text
          x={point.x + offs.dx}
          y={point.y + offs.dy}
          textAnchor={offs.anchor}
          fill="#f8fafc"
          fontSize="10.4"
          fontWeight="900"
          style={{ textShadow: '0 1px 4px rgba(0,0,0,.9)' }}
        >
          {point.label}
        </text>

        <text
          x={point.x + offs.dx}
          y={point.y + offs.dy + 12}
          textAnchor={offs.anchor}
          fill="#7dd3fc"
          fontSize="8.2"
          fontWeight="700"
          style={{ textShadow: '0 1px 4px rgba(0,0,0,.9)' }}
        >
          {point.gov}
        </text>
      </g>
    );
  };

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: '100%', height: H, display: 'block' }}
    >
      <defs>
        <pattern
          id="ncGrid"
          width="28"
          height="28"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M 28 0 L 0 0 0 28"
            fill="none"
            stroke="rgba(56,189,248,.06)"
            strokeWidth="1"
          />
        </pattern>

        <linearGradient id="ncSeaGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="rgba(34,211,238,.80)" />
          <stop offset="100%" stopColor="rgba(14,165,233,.22)" />
        </linearGradient>

        <linearGradient id="ncAqabaGrad" x1="0" y1="0" x2="0.9" y2="1">
          <stop offset="0%" stopColor="rgba(6,182,212,.95)" />
          <stop offset="100%" stopColor="rgba(8,145,178,.72)" />
        </linearGradient>

        <linearGradient id="ncMaanGrad" x1="0" y1="0" x2="0.9" y2="1">
          <stop offset="0%" stopColor="rgba(29,78,216,.74)" />
          <stop offset="100%" stopColor="rgba(21,94,117,.92)" />
        </linearGradient>

        <linearGradient id="ncAmmanGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="rgba(59,130,246,.98)" />
          <stop offset="100%" stopColor="rgba(37,99,235,.84)" />
        </linearGradient>

        <linearGradient id="ncMetal" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f8fafc" />
          <stop offset="26%" stopColor="#e5e7eb" />
          <stop offset="56%" stopColor="#cbd5e1" />
          <stop offset="100%" stopColor="#94a3b8" />
        </linearGradient>

        <filter id="ncGlowRed">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <filter id="ncGlowAmber">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <filter id="ncGlowPurple">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <filter id="ncGlowCyan">
          <feGaussianBlur stdDeviation="3.5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <filter id="ncPipeShadow" x="-20%" y="-80%" width="150%" height="260%">
          <feDropShadow
            dx="0"
            dy="2.2"
            stdDeviation="2.4"
            floodColor="#000000"
            floodOpacity="0.45"
          />
        </filter>
      </defs>

      <rect x="0" y="0" width={W} height={H} fill="rgba(6,12,24,.18)" />
      <rect
        x={mapX}
        y={mapY}
        width="584"
        height="492"
        rx="18"
        fill="rgba(3,15,32,.34)"
        stroke="rgba(56,189,248,.08)"
      />
      <rect
        x={mapX}
        y={mapY}
        width="584"
        height="492"
        rx="18"
        fill="url(#ncGrid)"
      />

      <text x="48" y="58" fill="#e2e8f0" fontSize="18" fontWeight="800">
        مشروع الناقل الوطني الأردني
      </text>
      <text x="48" y="80" fill="#38bdf8" fontSize="11" fontWeight="700">
        البحر الأحمر → العقبة → معان → عمّان → AL MUNTAZAH / ABU ALANDA
      </text>

      <text
        x={W - 48}
        y="58"
        textAnchor="end"
        fill="#f8fafc"
        fontSize="11"
        fontFamily="monospace"
        fontWeight="700"
      >
        التدفق الحالي ≈{' '}
        {(totalOutflowM3PerHr || 0).toLocaleString(undefined, {
          maximumFractionDigits: 0,
        })}{' '}
        m³/h
      </text>

      <text
        x={W - 48}
        y="78"
        textAnchor="end"
        fill="#86efac"
        fontSize="10.5"
        fontWeight="700"
      >
        تصميم سنوي: 300,000,000 m³
      </text>

      <g transform="translate(58 56)">
        {/* البحر الأحمر */}
        {/* البحر الأحمر - أسفل الخريطة */}
        <path
          d="M 54 430 
     L 84 492  
     L 99 414 
     L 102 388 
     L 99  Z"
          fill="url(#ncSeaGrad)"
          stroke={zoneStyles.sea.stroke}
          strokeWidth="1.8"
        />
        <text
          x="104"
          y="448"
          textAnchor="middle"
          fill="#67e8f9"
          fontSize="13"
          fontWeight="900"
          style={{ textShadow: '0 1px 4px rgba(0,0,0,.95)' }}
        >
          البحر الأحمر
        </text>
        {/* العقبة - شكل قريب من حرف L */}
        <path
          d="M 118 492
     L 200 444
     L 200 404
     L 200 404
     L 200 326
     L 151 326
     L 108 372
     L 100 430 Z"
          fill="url(#ncAqabaGrad)"
          stroke={zoneStyles.aqaba.stroke}
          strokeWidth="2"
        />
        <text
          x="176"
          y="428"
          textAnchor="middle"
          fill="#f8fafc"
          fontSize="18"
          fontWeight="900"
          style={{ textShadow: '0 1px 4px rgba(0,0,0,.95)' }}
        >
          العقبة
        </text>
        {/* معان - داخلة في جوف العقبة بصريًا وممتدة للأعلى */}
        <path
          d="M 202 326
     L 200 500
     L 300 500
     L 530 380
     L 490 248
     L 574 140
     L 468 170
     L 430 118
     L 362 44
     L 304 44
     L 300 44 Z"
          fill="url(#ncMaanGrad)"
          stroke={zoneStyles.maan.stroke}
          strokeWidth="2.1"
        />
        <text
          x="430"
          y="350"
          textAnchor="middle"
          fill="#f8fafc"
          fontSize="22"
          fontWeight="900"
          style={{ textShadow: '0 1px 4px rgba(0,0,0,.95)' }}
        >
          معان
        </text>
        {/* عمّان - متصلة من الجزء العلوي لمعان فقط */}
        <path
          d="M 430 118
     L 468 170
     L 560 142
     L 626 96
     L 604 4
     L 528 5
     L 360 45 Z"
          fill="url(#ncAmmanGrad)"
          stroke={zoneStyles.amman.stroke}
          strokeWidth="2.2"
        />
        <text
          x="540"
          y="112"
          textAnchor="middle"
          fill="#f8fafc"
          fontSize="20"
          fontWeight="900"
          style={{ textShadow: '0 1px 4px rgba(0,0,0,.95)' }}
        >
          عمّان
        </text>
        <text
          x="144"
          y="462"
          fill="rgba(226,232,240,.85)"
          fontSize="10"
          textAnchor="middle"
        >
          حصة الأردن من البحر الأحمر ---
        </text>
        <text
          x="532"
          y="92"
          fill="rgba(226,232,240,.82)"
          fontSize="9"
          textAnchor="middle"
        >
          أبو علندا / المنتزه / PS ADC
        </text>
        ---
        {routeSegments.map((seg) => {
          const p1 = pointsByCode[seg.from];
          const p2 = pointsByCode[seg.to];
          if (!p1 || !p2) return null;

          const isAnomaly = ['burst', 'leak', 'theft'].includes(seg.predType);
          const showFaultMarker = Boolean(
            seg.alert || seg.faultHere === 1 || isAnomaly
          );
          const colors = getPipeColors(isAnomaly ? seg.predType : 'normal');
          const isSel = selectedSeg?.id === seg.id;
          const midX = (p1.x + p2.x) / 2;
          const midY = (p1.y + p2.y) / 2;

          return (
            <g
              key={seg.id}
              style={{ cursor: 'pointer' }}
              onClick={() => onSegClick(seg)}
            >
              <line
                x1={p1.x}
                y1={p1.y + 3}
                x2={p2.x}
                y2={p2.y + 3}
                stroke="rgba(0,0,0,.48)"
                strokeWidth="12"
                strokeLinecap="round"
              />

              <line
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                stroke={isAnomaly ? colors.body : 'url(#ncMetal)'}
                strokeWidth={isAnomaly ? 9.4 : 8.8}
                strokeLinecap="round"
                filter={colors.glow}
              />

              <line
                x1={p1.x}
                y1={p1.y - 1.2}
                x2={p2.x}
                y2={p2.y - 1.2}
                stroke="rgba(255,255,255,.72)"
                strokeWidth="1.7"
                strokeLinecap="round"
                opacity="0.95"
              />

              {pumping && (
                <line
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  stroke="#22d3ee"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeDasharray="8 6"
                  filter="url(#ncGlowCyan)"
                >
                  <animate
                    attributeName="stroke-dashoffset"
                    from="0"
                    to="-22"
                    dur="0.7s"
                    repeatCount="indefinite"
                  />
                </line>
              )}

              {showFaultMarker && (
                <g>
                  <circle
                    cx={midX}
                    cy={midY}
                    r="24"
                    fill="none"
                    stroke={TYPE_CONFIG[seg.predType].color}
                    strokeWidth="1.6"
                    opacity="0.48"
                  />
                  <line
                    x1={midX}
                    y1={midY - 30}
                    x2={midX}
                    y2={midY - 12}
                    stroke={TYPE_CONFIG[seg.predType].color}
                    strokeWidth="1.4"
                    strokeDasharray="3 3"
                    opacity="0.85"
                  />
                  <circle
                    cx={midX}
                    cy={midY - 40}
                    r="11"
                    fill="#08111f"
                    stroke={TYPE_CONFIG[seg.predType].color}
                    strokeWidth="2"
                    filter={colors.glow}
                  />
                  <text
                    x={midX}
                    y={midY - 35}
                    textAnchor="middle"
                    fill={TYPE_CONFIG[seg.predType].color}
                    fontSize="15"
                    fontWeight="900"
                  >
                    !
                  </text>
                </g>
              )}

              {isSel && (
                <circle
                  cx={p2.x}
                  cy={p2.y}
                  r="21"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="1.8"
                  opacity="0.6"
                />
              )}

              <text
                x={midX + 12}
                y={midY - 10}
                fill={isAnomaly ? TYPE_CONFIG[seg.predType].color : '#7dd3fc'}
                fontSize="8.8"
                fontFamily="monospace"
                fontWeight="700"
              >
                {seg.flowLoss.toFixed(1)}%
              </text>
            </g>
          );
        })}
        {NATIONAL_CARRIER_ROUTE.map((point) => {
          const related = routeSegments.find(
            (seg) => seg.to === point.code || seg.from === point.code
          );

          return renderNode(
            point,
            related && related.alert ? related.predType : null,
            selectedSeg?.to === point.code || selectedSeg?.from === point.code
          );
        })}
      </g>

      <g transform="translate(688 104)">
        <rect
          x="0"
          y="0"
          width="266"
          height="150"
          rx="16"
          fill="rgba(10,22,40,.86)"
          stroke="rgba(56,189,248,.16)"
        />
        <text x="80" y="24" fill="#e2e8f0" fontSize="13" fontWeight="800">
          ملخص الناقل الوطني
        </text>

        {[
          ['التزويد السنوي', '300,000,000 m³ / year', '#22d3ee'],
          ['التزويد الشهري', '25,000,000 m³ / month', '#f8fafc'],
          ['التزويد اليومي', '833,333 m³ / day', '#93c5fd'],
          [
            'التدفق التصميمي',
            `${hourlyالهدف.toLocaleString(undefined, {
              maximumFractionDigits: 0,
            })} m³/h`,
            '#86efac',
          ],
          ['طول المسار', `${'450'} km`, '#fbbf24'],
        ].map(([l, v, c], i) => (
          <g key={l} transform={`translate(18 ${50 + i * 16})`}>
            <text x="0" y="0" fill="#64748b" fontSize="10">
              {l}
            </text>
            <text
              x="108"
              y="0"
              fill={c}
              fontSize="10.6"
              fontFamily="monospace"
              fontWeight="700"
            >
              {v}
            </text>
          </g>
        ))}
      </g>

      <g transform="translate(640 278)">
        <rect
          x="0"
          y="0"
          width="310"
          height="178"
          rx="16"
          fill="rgba(8,18,34,.82)"
          stroke="rgba(56,189,248,.14)"
        />
        <text x="130" y="24" fill="#e2e8f0" fontSize="13" fontWeight="800">
          المسار التشغيلي
        </text>
        <text x="80" y="44" fill="#64748b" fontSize="10">
          البحر الأحمر → العقبة → معان → عمّان
        </text>

        {[
          'المأخذ من البحر الأحمر ضمن حصة الأردن.',
          'الدخول إلى العقبة ثم العبور داخل الممر الرئيسي.',
          'المرور عبر معان خلال محطات BPS3 و RGT1 و BPS4 و RGT2 و BPT.',
          'الوصول إلى PS ADC داخل عمّان.',
          'التفرع النهائي إلى AL MUNTAZAH و ABU ALANDA.',
          `عدد المقاطع المتتابعة: ${routeSegments.length || 9}`,
        ].map((line, i) => (
          <text
            key={i}
            x="18"
            y={68 + i * 18}
            fill={i < 5 ? '#cbd5e1' : '#22d3ee'}
            fontSize="10.2"
          >
            • {line}
          </text>
        ))}
      </g>
    </svg>
  );
}

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

  if (govKey === NATIONAL_CARRIER_KEY) {
    return (
      <NationalCarrierMap
        segments={segments}
        onSegClick={onSegClick}
        selectedSeg={selectedSeg}
        pumping={pumping}
        totalOutflowM3PerHr={totalOutflowM3PerHr}
      />
    );
  }

  const branches = Object.entries(gov.branches);
  const H = 560,
    W = 940;
  const MAIN_NODE_X = 116,
    MANIFOLD_X = 212,
    LABEL_X = 310,
    ENTRY_X = 356,
    SEG_START = 402,
    SEG_END = W - 42,
    NODE_R = 18,
    ROW_H = H / (branches.length + 1);
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setPulse((p) => (p + 1) % 100), 80);
    return () => clearInterval(id);
  }, []);

  const segsByBranch = useMemo(() => {
    const map = {};
    segments.forEach((seg) => {
      map[seg.branch] = map[seg.branch] || [];
      map[seg.branch].push(seg);
    });
    return map;
  }, [segments]);

  const mainY = H / 2;
  const topBranchY = ROW_H;
  const bottomBranchY = ROW_H * branches.length;
  const pulseScale = 1 + Math.sin(pulse * 0.063) * 0.14;
  const branchM3 = (bn) => ((branchInflows?.[bn] || 0) * 0.06).toFixed(1);

  const getPipeTheme = (type = 'normal') => {
    switch (type) {
      case 'supply':
        return {
          body: 'url(#pipeGradSupply)',
          shadow: 'rgba(8,47,73,.48)',
          shade: 'rgba(8,47,73,.22)',
          highlight: 'rgba(224,242,254,.75)',
          filter: pumping ? 'url(#glow-cyan)' : 'url(#pipeShadowSoft)',
        };
      case 'burst':
        return {
          body: 'url(#pipeGradانفجار)',
          shadow: 'rgba(127,29,29,.52)',
          shade: 'rgba(127,29,29,.18)',
          highlight: 'rgba(254,226,226,.68)',
          filter: 'url(#glow-red)',
        };
      case 'leak':
        return {
          body: 'url(#pipeGradتسرب)',
          shadow: 'rgba(120,53,15,.48)',
          shade: 'rgba(120,53,15,.18)',
          highlight: 'rgba(255,247,237,.66)',
          filter: 'url(#glow-amber)',
        };
      case 'theft':
        return {
          body: 'url(#pipeGradسرقة)',
          shadow: 'rgba(88,28,135,.48)',
          shade: 'rgba(88,28,135,.18)',
          highlight: 'rgba(245,243,255,.66)',
          filter: 'url(#glow-purple)',
        };
      default:
        return {
          body: 'url(#pipeGradMetal)',
          shadow: 'rgba(2,6,23,.66)',
          shade: 'rgba(15,23,42,.28)',
          highlight: 'rgba(255,255,255,.88)',
          filter: 'url(#pipeShadowSoft)',
        };
    }
  };

  const renderPipeLine = ({
    x1,
    y1,
    x2,
    y2,
    type = 'normal',
    width = 8.8,
    animate = false,
    animateColor = '#22d3ee',
    animateFilter = 'url(#glow-cyan)',
    opacity = 1,
  }) => {
    const theme = getPipeTheme(type);
    return (
      <g opacity={opacity}>
        <line
          x1={x1}
          y1={y1 + 2.4}
          x2={x2}
          y2={y2 + 2.4}
          stroke={theme.shadow}
          strokeWidth={width + 2.6}
          strokeLinecap="round"
          opacity="0.92"
        />
        <line
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke="#0f172a"
          strokeWidth={width + 1.6}
          strokeLinecap="round"
          opacity="0.55"
        />
        <line
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={theme.body}
          strokeWidth={width}
          strokeLinecap="round"
          filter={theme.filter}
        />
        <line
          x1={x1}
          y1={y1 + Math.max(0.9, width * 0.16)}
          x2={x2}
          y2={y2 + Math.max(0.9, width * 0.16)}
          stroke={theme.shade}
          strokeWidth={Math.max(1.4, width * 0.3)}
          strokeLinecap="round"
          opacity="0.95"
        />
        <line
          x1={x1}
          y1={y1 - Math.max(1.1, width * 0.18)}
          x2={x2}
          y2={y2 - Math.max(1.1, width * 0.18)}
          stroke={theme.highlight}
          strokeWidth={Math.max(1.6, width * 0.22)}
          strokeLinecap="round"
          opacity="0.96"
        />
        {animate && (
          <line
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={animateColor}
            strokeWidth={Math.max(1.6, width * 0.18)}
            strokeLinecap="round"
            strokeDasharray="7 6"
            filter={animateFilter}
            opacity="0.95"
          >
            <animate
              attributeName="stroke-dashoffset"
              from="0"
              to="-20"
              dur="0.6s"
              repeatCount="indefinite"
            />
          </line>
        )}
      </g>
    );
  };

  const getNodeX = (index, count) => {
    if (count <= 1) return SEG_START;
    return SEG_START + index * ((SEG_END - SEG_START) / (count - 1));
  };

  const formatNodeLabel = (name = '') => {
    const base = name.split('-').filter(Boolean).pop() || '';
    if (base.length <= 8) return base;
    return `${base.slice(0, 7)}…`;
  };

  const getNodeLabelWidth = (label = '') =>
    Math.max(42, Math.min(74, label.length * 7 + 16));

  const renderNodeLabel = ({ x, y, label, color, active = false }) => {
    const width = getNodeLabelWidth(label);
    return (
      <g>
        <rect
          x={x - width / 2}
          y={y - 10}
          width={width}
          height="20"
          rx="10"
          fill={active ? 'rgba(15,23,42,.96)' : 'rgba(8,17,31,.92)'}
          stroke={active ? color : 'rgba(148,163,184,.28)'}
          strokeWidth={active ? '1.4' : '1'}
        />
        <text
          x={x}
          y={y + 4}
          textAnchor="middle"
          fill={active ? '#ffffff' : '#e2e8f0'}
          fontSize="8.3"
          fontWeight="800"
        >
          {label}
        </text>
      </g>
    );
  };

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: '100%', height: H, display: 'block' }}
    >
      <defs>
        <filter id="glow-red">
          <feGaussianBlur stdDeviation="4" result="blur" />
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
        <filter id="glow-purple">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter
          id="pipeShadowSoft"
          x="-20%"
          y="-80%"
          width="150%"
          height="260%"
        >
          <feDropShadow
            dx="0"
            dy="2.2"
            stdDeviation="2.2"
            floodColor="#000000"
            floodOpacity="0.40"
          />
        </filter>
        <linearGradient id="pipeGradMetal" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c0c0c0" />
          <stop offset="20%" stopColor="#c0c0c0" />
          <stop offset="46%" stopColor="#c0c0c0" />
          <stop offset="72%" stopColor="#c0c0c0" />
          <stop offset="100%" stopColor="#c0c0c0" />
        </linearGradient>
        <linearGradient id="pipeGradSupply" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#dbeafe" />
          <stop offset="24%" stopColor="#7dd3fc" />
          <stop offset="58%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0c4a6e" />
        </linearGradient>
        <linearGradient id="pipeGradانفجار" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fee2e2" />
          <stop offset="24%" stopColor="#fca5a5" />
          <stop offset="58%" stopColor="#ef4444" />
          <stop offset="100%" stopColor="#991b1b" />
        </linearGradient>
        <linearGradient id="pipeGradتسرب" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fffbeb" />
          <stop offset="24%" stopColor="#fde68a" />
          <stop offset="58%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#92400e" />
        </linearGradient>
        <linearGradient id="pipeGradسرقة" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f5f3ff" />
          <stop offset="24%" stopColor="#ddd6fe" />
          <stop offset="58%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#6b21a8" />
        </linearGradient>
      </defs>

      <rect
        x="8"
        y={mainY - 32}
        width="66"
        height="64"
        rx="9"
        fill={pumping ? '#0c4a6e' : '#0f172a'}
        stroke={pumping ? '#22d3ee' : '#38bdf8'}
        strokeWidth={pumping ? '2.5' : '1.5'}
        filter={pumping ? 'url(#glow-cyan)' : undefined}
      />
      <text
        x="41"
        y={mainY - 10}
        textAnchor="middle"
        fill="#38bdf8"
        fontSize="10"
        fontWeight="700"
      >
        مصدر
      </text>
      <text
        x="41"
        y={mainY + 10}
        textAnchor="middle"
        fill="#67e8f9"
        fontSize="10"
        fontWeight="700"
      >
        المياه
      </text>
      <text
        x="41"
        y={mainY - 42}
        textAnchor="middle"
        fill="#22d3ee"
        fontSize="9"
        fontWeight="700"
        fontFamily="monospace"
      >
        {totalOutflowM3PerHr?.toFixed?.(0) ?? '0'} m³/h
      </text>

      {renderPipeLine({
        x1: 74,
        y1: mainY,
        x2: MAIN_NODE_X - NODE_R,
        y2: mainY,
        type: 'supply',
        width: 10.5,
        animate: pumping,
      })}

      {renderPipeLine({
        x1: MAIN_NODE_X + NODE_R,
        y1: mainY,
        x2: MANIFOLD_X,
        y2: mainY,
        type: 'supply',
        width: 9.4,
        animate: pumping,
      })}

      {renderPipeLine({
        x1: MANIFOLD_X,
        y1: topBranchY,
        x2: MANIFOLD_X,
        y2: bottomBranchY,
        type: 'normal',
        width: 7.6,
        animate: pumping,
        animateColor: 'rgba(56,189,248,.85)',
      })}

      <circle
        cx={MAIN_NODE_X}
        cy={mainY}
        r={NODE_R + 2}
        fill="#38bdf8"
        fillOpacity="0.12"
        stroke="#38bdf8"
        strokeWidth="2"
      />
      <circle
        cx={MAIN_NODE_X}
        cy={mainY}
        r={NODE_R}
        fill="#0f172a"
        stroke={pumping ? '#22d3ee' : '#38bdf8'}
        strokeWidth="2.2"
      />
      <text
        x={MAIN_NODE_X}
        y={mainY + 4}
        textAnchor="middle"
        fill="#38bdf8"
        fontSize="9"
        fontWeight="800"
      >
        رئيسي
      </text>
      {pumping && (
        <circle
          cx={MAIN_NODE_X}
          cy={mainY}
          r={NODE_R + 8}
          fill="none"
          stroke="#22d3ee"
          strokeWidth="1.5"
          opacity="0.7"
        >
          <animate
            attributeName="r"
            values={`${NODE_R + 6};${NODE_R + 16};${NODE_R + 6}`}
            dur="0.9s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.8;0;0.8"
            dur="0.9s"
            repeatCount="indefinite"
          />
        </circle>
      )}

      {branches.map(([bname, bcfg], bi) => {
        const brY = ROW_H * (bi + 1);
        const brSegs = segsByBranch[bname] || [];
        const segCount = brSegs.length;

        return (
          <g key={bname}>
            {renderPipeLine({
              x1: MANIFOLD_X,
              y1: brY,
              x2: ENTRY_X,
              y2: brY,
              type: 'normal',
              width: 6.8,
              animate: pumping,
              animateColor: `${bcfg.color}cc`,
            })}

            <text
              x={LABEL_X}
              y={brY - 10}
              textAnchor="end"
              fill="#e2e8f0"
              fontSize="12"
              fontWeight="700"
            >
              {bname.replace(/^[^-]+-/, '')}
            </text>
            <text
              x={LABEL_X}
              y={brY + 8}
              textAnchor="end"
              fill="#93c5fd"
              fontSize="9"
              fontFamily="monospace"
              fontWeight="700"
            >
              {branchM3(bname)} m³/h
            </text>

            {brSegs.map((seg, si) => {
              const endX = getNodeX(si, segCount);
              const startX = si === 0 ? ENTRY_X : getNodeX(si - 1, segCount);
              const isAnomalyType = ['burst', 'leak', 'theft'].includes(
                seg.predType
              );
              const showFaultMarker = Boolean(
                seg.alert || seg.faultHere === 1 || isAnomalyType
              );
              const isAl = showFaultMarker;
              const tColor = TYPE_CONFIG[seg.predType]?.color || '#22c55e';
              const isSel = selectedSeg?.id === seg.id;
              const pipeType = isAnomalyType ? seg.predType : 'normal';
              const pipeWidth = isAl ? 9.8 : 8.6;
              const midX = (startX + endX) / 2;
              const nodeName = formatNodeLabel(seg.to || '');
              const labelY = brY - NODE_R - 14;
              const labelTopY = labelY - 10;
              const markerShiftX = si === 0 ? 30 : si === 1 ? 18 : 0;
              const markerDropY = si <= 1 ? 8 : 0;
              const markerX = midX - markerShiftX;
              const markerBadgeY = labelTopY - 16 + markerDropY;
              const markerLineY1 = markerBadgeY + 12;
              const markerLineY2 =
                labelTopY - 4 + Math.min(markerDropY * 0.35, 4);

              return (
                <g
                  key={seg.id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => onSegClick(seg)}
                >
                  {renderPipeLine({
                    x1: startX,
                    y1: brY,
                    x2: endX,
                    y2: brY,
                    type: pipeType,
                    width: pipeWidth,
                  })}

                  {showFaultMarker && (
                    <g>
                      <circle
                        cx={markerX}
                        cy={brY}
                        r={22 + pulseScale * 4}
                        fill="none"
                        stroke={tColor}
                        strokeWidth="1.7"
                        opacity="0.45"
                      />
                      <line
                        x1={markerX}
                        y1={markerLineY1}
                        x2={markerX}
                        y2={markerLineY2}
                        stroke={tColor}
                        strokeWidth="1.4"
                        strokeOpacity="0.8"
                        strokeDasharray="3 3"
                      />
                      <circle
                        cx={markerX}
                        cy={markerBadgeY}
                        r="12"
                        fill="#08111f"
                        stroke={tColor}
                        strokeWidth="2"
                        filter={
                          seg.predType === 'burst'
                            ? 'url(#glow-red)'
                            : seg.predType === 'leak'
                            ? 'url(#glow-amber)'
                            : seg.predType === 'theft'
                            ? 'url(#glow-purple)'
                            : 'url(#glow-red)'
                        }
                      />
                      <text
                        x={markerX}
                        y={markerBadgeY + 5}
                        textAnchor="middle"
                        fill={tColor}
                        fontSize="16"
                        fontWeight="900"
                      >
                        !
                      </text>
                    </g>
                  )}

                  <circle
                    cx={endX}
                    cy={brY}
                    r={NODE_R}
                    fill={isAl ? `${tColor}20` : '#0d1830'}
                    stroke={isSel ? '#ffffff' : isAl ? tColor : bcfg.color}
                    strokeWidth={isSel ? 2.6 : isAl ? 2.1 : 1.8}
                    filter={
                      isAl
                        ? seg.predType === 'burst'
                          ? 'url(#glow-red)'
                          : seg.predType === 'leak'
                          ? 'url(#glow-amber)'
                          : seg.predType === 'theft'
                          ? 'url(#glow-purple)'
                          : 'url(#glow-red)'
                        : undefined
                    }
                  />
                  <circle
                    cx={endX - 4}
                    cy={brY - 4}
                    r="4"
                    fill="rgba(255,255,255,.14)"
                  />
                  {renderNodeLabel({
                    x: endX,
                    y: labelY,
                    label: nodeName,
                    color: isAl ? tColor : bcfg.color,
                    active: isAl || isSel,
                  })}
                  <text
                    x={endX}
                    y={brY + NODE_R + 16}
                    textAnchor="middle"
                    fill={isAl ? tColor : '#64748b'}
                    fontSize="10"
                    fontWeight="700"
                  >
                    {seg.flowLoss.toFixed(1)}%
                  </text>
                </g>
              );
            })}
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
      name: 'NRW',
      value: pct,
      fill: nrw > 0.5 ? '#ef4444' : nrw > 0.4 ? '#f59e0b' : '#22c55e',
    },
    { name: 'Gap', value: 100 - pct, fill: '#1e293b' },
  ];
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
      }}
    >
      <div style={{ position: 'relative', width: 130, height: 74 }}>
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
              background={{ fill: '#1e293b' }}
              cornerRadius={4}
            />
          </RadialBarChart>
        </ResponsiveContainer>
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontSize: 20,
              fontWeight: 700,
              fontFamily: 'monospace',
              color: pct > 50 ? '#ef4444' : pct > 40 ? '#f59e0b' : '#22c55e',
            }}
          >
            {pct}%
          </div>
        </div>
      </div>
      <div style={{ fontSize: 10, color: '#64748b' }}>
        الهدف: <span style={{ color: '#22c55e', fontWeight: 600 }}>{tgt}%</span>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// COMPETITION-READY MAIN DASHBOARD
// UX-first version for IT judges: guided demo + operator view + pilot plan
// ══════════════════════════════════════════════════════════════════════════════
const ACTION_LIBRARY = {
  normal: {
    title: 'الوضع التشغيلي مستقر',
    titleAr: 'الوضع التشغيلي مستقر',
    badge: 'أولوية منخفضة',
    action: 'استمرار المراقبة فقط، ولا يوجد تدخل ميداني مطلوب حالياً.',
    actionAr: 'استمرار المراقبة فقط، ولا يوجد إجراء ميداني مطلوب حالياً.',
    response: 'المراقبة',
  },
  leak: {
    title: 'تسرب تدريجي محتمل',
    titleAr: 'تسرب تدريجي محتمل',
    badge: 'أولوية متوسطة',
    action:
      'إرسال فريق صيانة للموقع مع دراسة تخفيض الضغط بنسبة 10–15% إذا كان ذلك آمناً.',
    actionAr:
      'إرسال فريق صيانة للموقع مع دراسة تخفيض الضغط بنسبة 10–15% إذا كان ذلك آمناً.',
    response: 'إرسال فريق',
  },
  burst: {
    title: 'انفجار حرج في الخط',
    titleAr: 'انفجار حرج في الخط',
    badge: 'حرج',
    action: 'عزل المقطع المتأثر فوراً وفتح بلاغ صيانة طارئ.',
    actionAr: 'عزل المقطع المتأثر فوراً وفتح بلاغ صيانة طارئ.',
    response: 'العزل الفوري',
  },
  theft: {
    title: 'نمط استعمال غير مشروع',
    titleAr: 'نمط استعمال غير مشروع',
    badge: 'تحقق ميداني',
    action: 'فحص الوصلات غير المشروعة ومقارنة آخر 72 ساعة مع سجلات العدادات.',
    actionAr:
      'فحص الوصلات غير المشروعة ومقارنة آخر 72 ساعة مع سجلات الاستهلاك.',
    response: 'التحقق',
  },
};

const ACTION_SUGGESTIONS = {
  normal: [
    {
      title: 'استمرار المراقبة التشغيلية',
      detail: 'لا يوجد خلل نشط؛ يتم الاكتفاء بتحديث القراءات ومراقبة الانحرافات القادمة.',
      priority: 'منخفضة',
    },
    {
      title: 'توثيق دورة القياس الحالية',
      detail: 'حفظ حالة الشبكة الطبيعية كمرجع للمقارنة مع أي تغير لاحق.',
      priority: 'منخفضة',
    },
  ],
  leak: [
    {
      title: 'إرسال فريق صيانة للفحص الميداني',
      detail: 'توجيه الفريق إلى المقطع المحدد مع أولوية متوسطة قبل تحول التسرب إلى عطل أكبر.',
      priority: 'متوسطة',
    },
    {
      title: 'تخفيض الضغط بنسبة 10–15% مؤقتاً',
      detail: 'تقليل الفاقد لحين وصول الفريق مع التأكد من عدم التأثير على التزويد الأساسي.',
      priority: 'متوسطة',
    },
    {
      title: 'تشغيل فحص صوتي موضعي',
      detail: 'استخدام حساس التسرب الصوتي لتأكيد النقطة الأدق قبل الحفر أو الإغلاق.',
      priority: 'متوسطة',
    },
  ],
  burst: [
    {
      title: 'عزل المقطع المتأثر فوراً',
      detail: 'إغلاق الصمام الذكي أو المحبس الأقرب لتقليل الفاقد وحصر الضرر.',
      priority: 'حرجة',
    },
    {
      title: 'فتح بلاغ صيانة طارئ',
      detail: 'إرسال فريق إصلاح مع إحداثيات المقطع وقراءات التدفق والضغط الداعمة للقرار.',
      priority: 'حرجة',
    },
    {
      title: 'إعادة توزيع التزويد مؤقتاً',
      detail: 'تحويل جزء من التدفق إلى مسار بديل لتقليل أثر الانقطاع على المشتركين.',
      priority: 'مرتفعة',
    },
  ],
  theft: [
    {
      title: 'فتح مهمة تحقق ميداني',
      detail: 'فحص الوصلات غير المشروعة حول المقطع المحدد دون قطع الخدمة مباشرة.',
      priority: 'تحقق',
    },
    {
      title: 'مقارنة آخر 72 ساعة مع سجلات العدادات',
      detail: 'ربط نمط الفاقد مع قراءات الاستهلاك للتأكد من وجود استخدام غير مشروع.',
      priority: 'تحقق',
    },
    {
      title: 'توثيق الحالة كاشتباه سرقة',
      detail: 'حفظ القراءات والموقع والوقت كمرجع للجهة المختصة قبل الإجراء القانوني.',
      priority: 'تحقق',
    },
  ],
};

function fmtNum(v, digits = 0) {
  if (!Number.isFinite(Number(v))) return '0';
  return Number(v).toLocaleString(undefined, { maximumFractionDigits: digits });
}

function fmtM3(v, digits = 1) {
  return `${fmtNum(v || 0, digits)} m³`;
}

function getTypeColor(type) {
  return TYPE_CONFIG[type]?.color || '#22c55e';
}

function getRiskLabel(type) {
  if (type === 'burst') return 'حرج';
  if (type === 'leak') return 'مرتفع';
  if (type === 'theft') return 'تحقيق';
  return 'طبيعي';
}

function getTypeLabelAr(type) {
  if (type === 'burst') return 'انفجار';
  if (type === 'leak') return 'تسرب';
  if (type === 'theft') return 'سرقة';
  return 'طبيعي';
}

function SmallPill({ children, color = '#38bdf8', filled = false }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '5px 9px',
        borderRadius: 999,
        border: `1px solid ${color}66`,
        background: filled ? `${color}22` : 'rgba(2,6,23,.28)',
        color,
        fontSize: 10,
        fontWeight: 800,
        letterSpacing: 0.35,
        fontFamily: 'monospace',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  );
}

function SectionCard({ children, title, icon, right, style = {} }) {
  return (
    <div
      style={{
        background:
          'linear-gradient(180deg,rgba(15,23,42,.92),rgba(8,15,30,.94))',
        border: '1px solid rgba(56,189,248,.12)',
        borderRadius: 16,
        boxShadow: '0 18px 44px rgba(0,0,0,.18)',
        overflow: 'hidden',
        ...style,
      }}
    >
      {title && (
        <div
          style={{
            padding: '14px 16px',
            borderBottom: '1px solid rgba(56,189,248,.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            {icon}
            <div style={{ fontSize: 13, fontWeight: 900, color: '#f8fafc' }}>
              {title}
            </div>
          </div>
          {right}
        </div>
      )}
      <div style={{ padding: 16 }}>{children}</div>
    </div>
  );
}

function KpiCard({ label, value, sub, color = '#38bdf8', icon, trend }) {
  return (
    <div
      style={{
        background: `linear-gradient(135deg,${color}14,rgba(15,23,42,.88) 52%)`,
        border: `1px solid ${color}2e`,
        borderRadius: 14,
        padding: 14,
        minHeight: 96,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          right: -18,
          top: -18,
          width: 72,
          height: 72,
          borderRadius: '50%',
          background: `${color}16`,
        }}
      />
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            fontSize: 10,
            color: '#94a3b8',
            fontFamily: 'monospace',
            fontWeight: 800,
            letterSpacing: 0.6,
          }}
        >
          {label}
        </div>
        <div style={{ color, opacity: 0.9 }}>{icon}</div>
      </div>
      <div
        style={{
          fontSize: 24,
          color: '#f8fafc',
          fontWeight: 950,
          marginTop: 10,
          fontFamily: 'monospace',
        }}
      >
        {value}
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 8,
          marginTop: 6,
        }}
      >
        <div style={{ fontSize: 11, color: '#64748b' }}>{sub}</div>
        {trend && (
          <div
            style={{
              color,
              fontSize: 10,
              fontFamily: 'monospace',
              fontWeight: 800,
            }}
          >
            {trend}
          </div>
        )}
      </div>
    </div>
  );
}

function MiniMetric({ label, value, color = '#e2e8f0', sub }) {
  return (
    <div
      style={{
        border: '1px solid rgba(148,163,184,.13)',
        background: 'rgba(2,6,23,.28)',
        borderRadius: 12,
        padding: '12px 13px',
      }}
    >
      <div
        style={{
          color: '#64748b',
          fontSize: 10,
          fontFamily: 'monospace',
          fontWeight: 800,
          letterSpacing: 0.5,
        }}
      >
        {label}
      </div>
      <div
        style={{
          color,
          fontSize: 19,
          fontFamily: 'monospace',
          fontWeight: 950,
          marginTop: 5,
        }}
      >
        {value}
      </div>
      {sub && (
        <div style={{ color: '#64748b', fontSize: 10, marginTop: 4 }}>
          {sub}
        </div>
      )}
    </div>
  );
}

function ProgressBar({ value, color = '#38bdf8', height = 8 }) {
  const pct = Math.max(0, Math.min(100, Number(value || 0)));
  return (
    <div
      style={{
        height,
        borderRadius: 999,
        background: 'rgba(51,65,85,.7)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: `${pct}%`,
          height: '100%',
          borderRadius: 999,
          background: color,
          transition: 'width .35s ease',
        }}
      />
    </div>
  );
}

function HeroLanding({ onLaunch, onDemo }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background:
          'radial-gradient(circle at 20% 12%,rgba(56,189,248,.18),transparent 34%), radial-gradient(circle at 75% 22%,rgba(99,102,241,.16),transparent 30%), #060c18',
        color: '#e2e8f0',
        fontFamily: "'Tajawal','Cairo','Inter',system-ui,sans-serif",
        direction: 'rtl',
        textAlign: 'right',
        padding: 24,
      }}
    >
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 16,
            padding: '12px 0 42px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 13,
                background: 'linear-gradient(135deg,#0ea5e9,#6366f1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 34px rgba(56,189,248,.18)',
              }}
            >
              <Droplets size={23} color="#fff" />
            </div>
            <div>
              <div style={{ fontWeight: 950, fontSize: 18, color: '#f8fafc' }}>
                AquaGuard AI
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: '#7dd3fc',
                  fontFamily: 'monospace',
                }}
              >
                نظام دعم قرار لشبكات المياه الذكية
              </div>
            </div>
          </div>
          <SmallPill color="#22c55e" filled>
            جاهز للعرض أمام الحكّام
          </SmallPill>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0,1.1fr) minmax(340px,.9fr)',
            gap: 24,
            alignItems: 'center',
          }}
        >
          <div>
            <div
              style={{
                display: 'flex',
                gap: 8,
                flexWrap: 'wrap',
                marginBottom: 18,
              }}
            >
              <SmallPill color="#38bdf8">
                ذكاء اصطناعي + إنترنت الأشياء
              </SmallPill>
              <SmallPill color="#a855f7">التحقق عبر نقاط القياس</SmallPill>
              <SmallPill color="#f59e0b">تجربة مستخدم للمشغّل</SmallPill>
            </div>
            <h1
              style={{
                fontSize: 56,
                lineHeight: 1.02,
                margin: 0,
                letterSpacing: -1.8,
                color: '#f8fafc',
              }}
            >
              من إشارات فاقد المياه إلى قرار تشغيلي واضح في لوحة واحدة.
            </h1>
            <p
              style={{
                fontSize: 17,
                color: '#94a3b8',
                lineHeight: 1.75,
                maxWidth: 780,
                marginTop: 20,
              }}
            >
              يتوقع AquaGuard AI الطلب المتوقع، ويتحقق من المياه المضخوخة عبر
              نقاط قياس التدفق والضغط، ويكشف أنماط التسرب والانفجار والسرقة، ثم
              يحدد المقطع المتأثر ويعطي المشغّل الإجراء التالي بوضوح.
            </p>
            <div
              style={{
                display: 'flex',
                gap: 12,
                flexWrap: 'wrap',
                marginTop: 26,
              }}
            >
              <button onClick={onDemo} style={primaryButton('#38bdf8')}>
                <Zap size={16} /> ابدأ عرض التحكيم خلال 15 ثانية
              </button>
              <button onClick={onLaunch} style={secondaryButton()}>
                <Eye size={16} /> افتح لوحة التحكم الحية
              </button>
            </div>
          </div>

          <div
            style={{
              background:
                'linear-gradient(180deg,rgba(15,23,42,.82),rgba(2,6,23,.74))',
              border: '1px solid rgba(56,189,248,.16)',
              borderRadius: 24,
              padding: 20,
              boxShadow: '0 28px 80px rgba(0,0,0,.32)',
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 12,
              }}
            >
              <MiniMetric
                label="دقة الكشف"
                value="99.94%"
                color="#22c55e"
                sub="نتيجة النموذج المعتمدة v4.2"
              />
              <MiniMetric
                label="دورة الاستجابة"
                value="15s"
                color="#38bdf8"
                sub="دورة عرض مختصرة للتحكيم"
              />
              <MiniMetric
                label="الحالات"
                value="4"
                color="#f59e0b"
                sub="طبيعي / تسرب / انفجار / سرقة"
              />
              <MiniMetric
                label="التغطية"
                value="12+"
                color="#a855f7"
                sub="محافظات الأردن + الناقل الوطني"
              />
            </div>
            <div
              style={{
                marginTop: 16,
                padding: 14,
                borderRadius: 16,
                background: 'rgba(8,15,30,.85)',
                border: '1px solid rgba(148,163,184,.12)',
              }}
            >
              <div
                style={{
                  color: '#f8fafc',
                  fontWeight: 900,
                  fontSize: 13,
                  marginBottom: 10,
                }}
              >
                ما الذي سيراه الحكّام؟
              </div>
              {[
                ['1', 'التحقق بين الطلب المتوقع والضخ والكمية الواصلة'],
                ['2', 'خريطة حية مع تحديد موقع الخلل'],
                ['3', 'توصية تشغيلية جاهزة للمشغّل'],
                ['4', 'خطة تطبيق واقعية وقابلة للتنفيذ'],
              ].map(([n, t]) => (
                <div
                  key={n}
                  style={{
                    display: 'flex',
                    gap: 10,
                    alignItems: 'center',
                    margin: '9px 0',
                  }}
                >
                  <span
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      background: 'rgba(56,189,248,.14)',
                      color: '#38bdf8',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 11,
                      fontWeight: 900,
                    }}
                  >
                    {n}
                  </span>
                  <span style={{ color: '#cbd5e1', fontSize: 12 }}>{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{responsiveCss()}</style>
    </div>
  );
}

function primaryButton(color = '#38bdf8') {
  return {
    border: `1px solid ${color}80`,
    background: `linear-gradient(135deg,${color}33,rgba(15,23,42,.9))`,
    color: '#f8fafc',
    borderRadius: 12,
    padding: '11px 15px',
    fontWeight: 900,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    boxShadow: `0 12px 36px ${color}16`,
  };
}

function secondaryButton() {
  return {
    border: '1px solid rgba(148,163,184,.24)',
    background: 'rgba(15,23,42,.55)',
    color: '#cbd5e1',
    borderRadius: 12,
    padding: '11px 15px',
    fontWeight: 850,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
  };
}

function DecisionCard({ seg, gov, mass, onIsolate }) {
  const type = seg?.predType || 'normal';
  const cfg = ACTION_LIBRARY[type] || ACTION_LIBRARY.normal;
  const color = getTypeColor(type);
  const confidence = seg?.confidence
    ? Math.round(seg.confidence * 100)
    : type === 'normal'
    ? 99
    : 0;

  return (
    <SectionCard
      title="بطاقة القرار التشغيلي"
      icon={<Shield size={16} color={color} />}
      right={
        <SmallPill color={color} filled>
          {cfg.badge}
        </SmallPill>
      }
    >
      <div style={{ display: 'grid', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              background: `${color}22`,
              border: `1px solid ${color}55`,
              color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 950,
              fontSize: 20,
            }}
          >
            {type === 'normal' ? '✓' : '!'}
          </div>
          <div>
            <div style={{ color: '#f8fafc', fontSize: 17, fontWeight: 950 }}>
              {cfg.title}
            </div>
            <div
              style={{
                color: '#94a3b8',
                fontSize: 12,
                lineHeight: 1.6,
                marginTop: 4,
              }}
            >
              {cfg.titleAr}
            </div>
          </div>
        </div>

        <div
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}
        >
          <MiniMetric
            label="ما الحالة؟"
            value={getTypeLabelAr(type)}
            color={color}
            sub={getRiskLabel(type)}
          />
          <MiniMetric
            label="الثقة"
            value={`${confidence}%`}
            color="#38bdf8"
            sub="نسبة ثقة معايرة من النموذج"
          />
        </div>

        <div
          style={{
            border: '1px solid rgba(148,163,184,.12)',
            background: 'rgba(2,6,23,.26)',
            borderRadius: 12,
            padding: 12,
          }}
        >
          <div
            style={{
              color: '#64748b',
              fontSize: 10,
              fontFamily: 'monospace',
              fontWeight: 850,
            }}
          >
            أين؟
          </div>
          <div
            style={{
              color: '#e2e8f0',
              fontSize: 13,
              fontWeight: 850,
              marginTop: 5,
            }}
          >
            {type !== 'normal' && seg
              ? `${gov.label} · ${seg.branch} · ${seg.from} → ${seg.to}`
              : `${gov.label} · لا يوجد خلل نشط محدد`}
          </div>
        </div>

        <div
          style={{
            border: '1px solid rgba(148,163,184,.12)',
            background: 'rgba(2,6,23,.26)',
            borderRadius: 12,
            padding: 12,
          }}
        >
          <div
            style={{
              color: '#64748b',
              fontSize: 10,
              fontFamily: 'monospace',
              fontWeight: 850,
            }}
          >
            لماذا؟
          </div>
          <div
            style={{
              color: '#cbd5e1',
              fontSize: 12,
              lineHeight: 1.65,
              marginTop: 5,
            }}
          >
            {type !== 'normal' && seg
              ? `فقد التدفق ${seg.flowLoss?.toFixed?.(
                  1
                )}% مع انحراف ضغط ${seg.dpDev?.toFixed?.(
                  3
                )} PSI. تمت مقارنة النمط مع ميزان الكتلة الهيدروليكي ونموذج الذكاء الاصطناعي المجمّع.`
              : 'سلوك الضغط والتدفق الحالي ضمن حدود الفقد الخلفي المتوقع.'}
          </div>
        </div>

        <div
          style={{
            border: `1px solid ${color}44`,
            background: `${color}12`,
            borderRadius: 12,
            padding: 12,
          }}
        >
          <div
            style={{
              color,
              fontSize: 10,
              fontFamily: 'monospace',
              fontWeight: 900,
            }}
          >
            الإجراء المقترح
          </div>
          <div
            style={{
              color: '#f8fafc',
              fontSize: 13,
              fontWeight: 850,
              lineHeight: 1.6,
              marginTop: 6,
            }}
          >
            {cfg.action}
          </div>
          <div
            style={{
              color: '#cbd5e1',
              fontSize: 12,
              lineHeight: 1.6,
              marginTop: 5,
            }}
          >
            {cfg.actionAr}
          </div>
        </div>

        <button
          onClick={onIsolate}
          disabled={type === 'normal'}
          style={{
            ...primaryButton(color),
            opacity: type === 'normal' ? 0.45 : 1,
            justifyContent: 'center',
            width: '100%',
          }}
        >
          <Zap size={15} /> محاكاة: {cfg.response}
        </button>

        <div
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}
        >
          <MiniMetric
            label="الفقد الحالي"
            value={fmtM3(mass.systemLossM3, 2)}
            color="#f59e0b"
            sub="ضمن دورة القياس الحالية"
          />
          <MiniMetric
            label="الكمية الواصلة"
            value={fmtM3(mass.deliveredM3, 2)}
            color="#22c55e"
            sub="بعد احتساب معامل الفاقد"
          />
        </div>
      </div>
    </SectionCard>
  );
}

function DemandVerificationCard({
  gov,
  mass,
  totalSystemLoss,
  isolationSavings,
}) {
  const expectedDemand = Math.max(
    mass.deliveredM3 || 0,
    (mass.cycleOutflowM3 || 0) * (1 - gov.target_nrw)
  );
  const pumped = mass.cycleOutflowM3 || 0;
  const delivered = mass.deliveredM3 || 0;
  const gap = Math.max(0, pumped - delivered);
  const gapPct = pumped > 0 ? (gap / pumped) * 100 : 0;

  return (
    <SectionCard
      title="الطلب المتوقع ← الضخ ← التحقق عبر نقاط القياس"
      icon={<Database size={16} color="#38bdf8" />}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4,1fr)',
          gap: 10,
        }}
        className="aq-grid-4"
      >
        <MiniMetric
          label="الطلب المتوقع"
          value={fmtM3(expectedDemand, 1)}
          color="#38bdf8"
          sub="تقدير حاجة المنطقة"
        />
        <MiniMetric
          label="الضخ المعتمد"
          value={fmtM3(pumped, 1)}
          color="#f8fafc"
          sub="كمية الدورة الحالية"
        />
        <MiniMetric
          label="الكمية المقاسة الواصلة"
          value={fmtM3(delivered, 1)}
          color="#22c55e"
          sub="نتيجة نقاط القياس"
        />
        <MiniMetric
          label="الفجوة غير المبررة"
          value={fmtM3(gap, 1)}
          color={gapPct > 35 ? '#ef4444' : '#f59e0b'}
          sub={`${gapPct.toFixed(1)}% من الضخ`}
        />
      </div>

      <div
        style={{
          marginTop: 14,
          border: '1px solid rgba(148,163,184,.12)',
          background: 'rgba(2,6,23,.26)',
          borderRadius: 12,
          padding: 13,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 12,
            marginBottom: 8,
          }}
        >
          <span
            style={{
              fontSize: 11,
              color: '#94a3b8',
              fontFamily: 'monospace',
              fontWeight: 800,
            }}
          >
            فجوة التحقق
          </span>
          <span
            style={{
              fontSize: 11,
              color: gapPct > 35 ? '#ef4444' : '#f59e0b',
              fontFamily: 'monospace',
              fontWeight: 900,
            }}
          >
            {gapPct.toFixed(1)}%
          </span>
        </div>
        <ProgressBar
          value={gapPct}
          color={gapPct > 35 ? '#ef4444' : '#f59e0b'}
        />
        <div
          style={{
            color: '#64748b',
            fontSize: 11,
            lineHeight: 1.6,
            marginTop: 9,
          }}
        >
          هذه البطاقة تحول النظام من مجرد لوحة حساسات إلى سلسلة تشغيلية قابلة
          للتحقق: طلب متوقع، كمية ضخ، كمية واصلة عبر نقاط القياس، ثم قرار حول
          وجود خلل.
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 10,
          marginTop: 10,
        }}
        className="aq-grid-2"
      >
        <MiniMetric
          label="إجمالي الفاقد التراكمي"
          value={fmtM3(totalSystemLoss, 1)}
          color="#f59e0b"
          sub="منذ بداية الجلسة"
        />
        <MiniMetric
          label="وفورات العزل"
          value={fmtM3(isolationSavings, 1)}
          color="#22c55e"
          sub="فاقد متجنب بالمحاكاة"
        />
      </div>
    </SectionCard>
  );
}

function IncidentTimeline({ demoStep, activeType }) {
  const steps = [
    ['00s', 'توقع الطلب', 'تقدير احتياج المنطقة قبل الضخ.'],
    ['03s', 'اكتشاف فرق في نقاط القياس', 'النظام يلاحظ فرقاً غير طبيعي بين التدفق والضغط المتوقع والمقاس.'],
    ['07s', 'تصنيف الذكاء الاصطناعي', `النظام يصنف الحالة التشغيلية كـ ${getTypeLabelAr(activeType)}.`],
    ['11s', 'تحديد موقع الخلل', 'تمييز المقطع الأكثر احتمالاً على خريطة الشبكة.'],
    ['15s', 'قرار المشغّل', 'عرض الإجراءات المقترحة واعتماد القرار المناسب.'],
  ];
  return (
    <SectionCard
      title="الخط الزمني للحالة خلال 15 ثانية"
      icon={<Activity size={16} color="#22d3ee" />}
    >
      <div style={{ display: 'grid', gap: 10 }}>
        {steps.map(([time, title, body], idx) => {
          const active = idx <= Math.min(demoStep, steps.length - 1);
          return (
            <div
              key={time}
              style={{
                display: 'grid',
                gridTemplateColumns: '48px 18px 1fr',
                gap: 10,
                alignItems: 'start',
              }}
            >
              <div
                style={{
                  color: active ? '#22d3ee' : '#475569',
                  fontSize: 10,
                  fontFamily: 'monospace',
                  fontWeight: 900,
                }}
              >
                {time}
              </div>
              <div
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  background: active ? '#22d3ee' : '#1e293b',
                  border: '2px solid #0f172a',
                  boxShadow: active ? '0 0 18px rgba(34,211,238,.35)' : 'none',
                  marginTop: 2,
                }}
              />
              <div>
                <div
                  style={{
                    color: active ? '#f8fafc' : '#64748b',
                    fontSize: 12,
                    fontWeight: 900,
                  }}
                >
                  {title}
                </div>
                <div
                  style={{
                    color: '#64748b',
                    fontSize: 11,
                    lineHeight: 1.55,
                    marginTop: 2,
                  }}
                >
                  {body}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}

function UserResearchPanel() {
  const personas = [
    [
      'مشغّل غرفة التحكم',
      'يريد معرفة الحالة والموقع والإجراء بسرعة دون تحليل جداول طويلة.',
      'يحتاج: أولوية الإنذار، موقع الخريطة، نسبة الثقة، والإجراء.',
    ],
    [
      'قائد فريق الصيانة',
      'يريد نقطة واضحة للذهاب إليها ونوع الخلل قبل النزول للميدان.',
      'يحتاج: الفرع، المقطع، درجة الخطورة، وتوجيهات العزل.',
    ],
    [
      'صاحب القرار',
      'يريد مؤشرات الفاقد والمناطق الأخطر وأثر الحل على NRW.',
      'يحتاج: اتجاهات الفاقد، الأثر المالي، وقابلية التوسع.',
    ],
  ];
  const pains = [
    'تأخر اكتشاف التسربات والانفجارات',
    'بحث ميداني طويل عن موقع الخلل',
    'صعوبة التمييز بين التسرب والانفجار والسرقة',
    'تشتت البيانات بين الحساسات والفرق وصنّاع القرار',
  ];

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <SectionCard
        title="عرض بحث المستخدمين"
        icon={<Eye size={16} color="#a855f7" />}
      >
        <div
          style={{
            color: '#94a3b8',
            fontSize: 13,
            lineHeight: 1.75,
            marginBottom: 14,
          }}
        >
          هذا القسم مخصص لمعيار تجربة المستخدم؛ فهو يثبت أن AquaGuard مصمم حول
          مستخدمين تشغيليين حقيقيين وليس حول أرقام النموذج فقط.
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3,1fr)',
            gap: 12,
          }}
          className="aq-grid-3"
        >
          {personas.map(([title, ar, need]) => (
            <div
              key={title}
              style={{
                border: '1px solid rgba(168,85,247,.18)',
                background: 'rgba(88,28,135,.12)',
                borderRadius: 14,
                padding: 14,
              }}
            >
              <div style={{ color: '#f8fafc', fontWeight: 950, fontSize: 14 }}>
                {title}
              </div>
              <div
                style={{
                  color: '#cbd5e1',
                  fontSize: 12,
                  lineHeight: 1.7,
                  marginTop: 8,
                }}
              >
                {ar}
              </div>
              <div
                style={{
                  color: '#a78bfa',
                  fontSize: 11,
                  lineHeight: 1.6,
                  marginTop: 8,
                  fontFamily: 'monospace',
                }}
              >
                {need}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="نقاط الألم التي يعالجها النظام"
        icon={<AlertTriangle size={16} color="#f59e0b" />}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4,1fr)',
            gap: 10,
          }}
          className="aq-grid-4"
        >
          {pains.map((p, i) => (
            <div
              key={p}
              style={{
                padding: 13,
                borderRadius: 12,
                background: 'rgba(245,158,11,.10)',
                border: '1px solid rgba(245,158,11,.18)',
              }}
            >
              <div
                style={{
                  color: '#f59e0b',
                  fontWeight: 950,
                  fontFamily: 'monospace',
                  marginBottom: 6,
                }}
              >
                0{i + 1}
              </div>
              <div style={{ color: '#e2e8f0', fontSize: 12, lineHeight: 1.6 }}>
                {p}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

function PilotPlanPanel() {
  const phases = [
    [
      'النموذج الأولي',
      'حلقة صغيرة بخزانين + حساسات تدفق/ضغط + تحقق عبر الداشبورد',
    ],
    [
      'منطقة تجريبية',
      'منطقة DMA واحدة أو فرع في عمّان مع نقاط قياس دخول وخروج',
    ],
    ['توسع على مستوى المدينة', 'توسيع نقاط القياس وربط سير عمل فرق الصيانة'],
    ['توسع وطني', 'ربط المحافظات والأصول الاستراتيجية مثل الناقل الوطني'],
  ];
  const stack = [
    ['Sensors', 'حساس تدفق، حساس ضغط، حساس صوتي للتسرب، وصمام عزل ذكي'],
    [
      'الاتصال',
      'وحدة RTU / بوابة إنترنت أشياء باستخدام MQTT عبر الشبكة الخلوية أو LoRaWAN',
    ],
    [
      'Backend',
      'حالياً Flask API ويمكن نشره لاحقاً على Render أو Railway أو خادم سحابي',
    ],
    ['لوحة التحكم', 'واجهة React للمشغّل مع وضع محاكاة دون اتصال ووضع API حي'],
  ];

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <SectionCard
        title="الواقعية وقابلية التطبيق: خطة نشر تجريبية"
        icon={<Target size={16} color="#22c55e" />}
      >
        <div
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}
          className="aq-grid-2"
        >
          <div
            style={{
              border: '1px solid rgba(34,197,94,.16)',
              borderRadius: 14,
              padding: 14,
              background: 'rgba(34,197,94,.08)',
            }}
          >
            <div
              style={{
                color: '#22c55e',
                fontSize: 11,
                fontFamily: 'monospace',
                fontWeight: 900,
              }}
            >
              التجربة الأولى المقترحة
            </div>
            <div
              style={{
                color: '#f8fafc',
                fontWeight: 950,
                fontSize: 18,
                marginTop: 8,
              }}
            >
              فرع مراقب أو منطقة DMA صغيرة داخل عمّان
            </div>
            <div
              style={{
                color: '#94a3b8',
                fontSize: 12,
                lineHeight: 1.75,
                marginTop: 9,
              }}
            >
              نبدأ بنقطة قياس دخول واحدة ونقطتي قياس بعدية مع مسار استخدام
              واضح للمشغّل. هذا يحافظ على التكلفة الواقعية ويثبت الكشف وتحديد
              الموقع والاستجابة.
            </div>
          </div>
          <div
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}
          >
            <MiniMetric
              label="حجم التجربة"
              value="1 Zone"
              color="#22c55e"
              sub="نطاق مضبوط"
            />
            <MiniMetric
              label="نقاط القياس"
              value="3–5"
              color="#38bdf8"
              sub="أقل شبكة قابلة للإثبات"
            />
            <MiniMetric
              label="دورة التحديث"
              value="15s"
              color="#f59e0b"
              sub="مناسبة للعرض السريع"
            />
            <MiniMetric
              label="التكامل"
              value="MQTT"
              color="#a855f7"
              sub="جاهز لإنترنت الأشياء"
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="مراحل التطبيق"
        icon={<GitBranch size={16} color="#38bdf8" />}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4,1fr)',
            gap: 10,
          }}
          className="aq-grid-4"
        >
          {phases.map(([title, body], i) => (
            <div
              key={title}
              style={{
                border: '1px solid rgba(56,189,248,.14)',
                borderRadius: 14,
                padding: 14,
                background: 'rgba(56,189,248,.07)',
              }}
            >
              <div
                style={{
                  color: '#38bdf8',
                  fontFamily: 'monospace',
                  fontWeight: 950,
                }}
              >
                PHASE {i + 1}
              </div>
              <div style={{ color: '#f8fafc', fontWeight: 900, marginTop: 6 }}>
                {title}
              </div>
              <div
                style={{
                  color: '#94a3b8',
                  fontSize: 11,
                  lineHeight: 1.65,
                  marginTop: 7,
                }}
              >
                {body}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="مكونات التنفيذ"
        icon={<Cpu size={16} color="#a855f7" />}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4,1fr)',
            gap: 10,
          }}
          className="aq-grid-4"
        >
          {stack.map(([title, body]) => (
            <div
              key={title}
              style={{
                border: '1px solid rgba(148,163,184,.13)',
                borderRadius: 14,
                padding: 14,
                background: 'rgba(2,6,23,.26)',
              }}
            >
              <div style={{ color: '#e2e8f0', fontWeight: 950 }}>{title}</div>
              <div
                style={{
                  color: '#94a3b8',
                  fontSize: 11,
                  lineHeight: 1.65,
                  marginTop: 7,
                }}
              >
                {body}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

function SuggestedActionsPanel({ seg, gov, actionLog = [], onApproveAction, compact = false }) {
  const type = seg?.predType || 'normal';
  const color = getTypeColor(type);
  const suggestions = ACTION_SUGGESTIONS[type] || ACTION_SUGGESTIONS.normal;
  const gridColumns = compact ? '1fr' : 'repeat(3,1fr)';

  return (
    <SectionCard
      title="الإجراءات المقترحة"
      icon={<Shield size={16} color={color} />}
      right={<SmallPill color={color} filled>{getTypeLabelAr(type)}</SmallPill>}
    >
      <div
        style={{
          color: '#94a3b8',
          fontSize: compact ? 11 : 13,
          lineHeight: 1.7,
          marginBottom: 12,
        }}
      >
        اختر الإجراء الأنسب للحالة الحالية؛ بعد الاعتماد يتم حفظ القرار تلقائياً في سجل الإجراءات المعتمدة.
      </div>

      <div
        style={{ display: 'grid', gridTemplateColumns: gridColumns, gap: compact ? 9 : 12 }}
        className={compact ? undefined : 'aq-grid-3'}
      >
        {suggestions.map((action, i) => (
          <div
            key={action.title}
            style={{
              border: `1px solid ${color}33`,
              background: `${color}10`,
              borderRadius: 14,
              padding: compact ? 12 : 14,
              display: 'grid',
              gap: compact ? 8 : 10,
              minHeight: compact ? 0 : 176,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <SmallPill color={color}>اقتراح {i + 1}</SmallPill>
              <span style={{ color, fontSize: 10, fontFamily: 'monospace', fontWeight: 900 }}>{action.priority}</span>
            </div>
            <div style={{ color: '#f8fafc', fontSize: compact ? 12.5 : 14, fontWeight: 950, lineHeight: 1.45 }}>
              {action.title}
            </div>
            <div style={{ color: '#cbd5e1', fontSize: compact ? 11 : 12, lineHeight: 1.65 }}>
              {action.detail}
            </div>
            <button
              onClick={() => onApproveAction(action)}
              style={{ ...primaryButton(color), justifyContent: 'center', padding: compact ? '8px 10px' : '9px 11px', marginTop: 'auto', width: '100%' }}
            >
              <Zap size={14} /> اعتماد الإجراء
            </button>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function ActionLogPanel({ actionLog }) {
  return (
    <SectionCard
      title="سجل الإجراءات المعتمدة"
      icon={<Bell size={16} color="#22c55e" />}
      right={<SmallPill color="#22c55e">{actionLog.length} إجراء</SmallPill>}
    >
      <div style={{ display: 'grid', gap: 8, maxHeight: 260, overflowY: 'auto' }}>
        {actionLog.length === 0 && (
          <div style={{ color: '#64748b', fontSize: 12, textAlign: 'center', padding: 18 }}>
            لم يتم اعتماد أي إجراء بعد. عند اختيار المدير لأحد المقترحات سيظهر القرار هنا كمرجع تشغيلي للجهة المختصة.
          </div>
        )}
        {actionLog.map((item) => (
          <div
            key={item.id}
            style={{
              border: '1px solid rgba(34,197,94,.20)',
              background: 'rgba(34,197,94,.08)',
              borderRadius: 12,
              padding: 12,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
              <div style={{ color: '#f8fafc', fontWeight: 950, fontSize: 12.5, lineHeight: 1.5 }}>{item.action}</div>
              <SmallPill color="#22c55e" filled>{item.status}</SmallPill>
            </div>
            <div style={{ color: '#94a3b8', fontSize: 11, lineHeight: 1.6, marginTop: 6 }}>
              {item.gov} · {item.segment} · {item.type} · {item.time}
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}


function AlertLogPanel({ allAlerts = [], selectedOrWorst, setSelectedSeg, typeColors }) {
  return (
    <SectionCard
      title="سجل الإنذارات اللحظية"
      icon={<Bell size={16} color="#ef4444" />}
      right={<SmallPill color="#ef4444">{allAlerts.length} مسجلة</SmallPill>}
    >
      <div
        style={{
          display: 'grid',
          gap: 7,
          maxHeight: 330,
          overflowY: 'auto',
        }}
      >
        {allAlerts.length === 0 && (
          <div
            style={{
              color: '#475569',
              fontSize: 12,
              textAlign: 'center',
              padding: 20,
            }}
          >
            لا توجد إنذارات بعد. ابدأ عرض التحكيم أو اختر تسرب / انفجار / سرقة.
          </div>
        )}
        {allAlerts.slice(0, 25).map((a, i) => {
          const tc = typeColors?.[a.predType] || '#22c55e';
          return (
            <div
              key={`${a.id}-${i}`}
              onClick={() => setSelectedSeg(a)}
              style={{
                background:
                  selectedOrWorst?.id === a.id ? `${tc}16` : 'rgba(2,6,23,.25)',
                borderRadius: 10,
                padding: '9px 10px',
                borderRight: `3px solid ${tc}`,
                border: `1px solid ${
                  selectedOrWorst?.id === a.id ? `${tc}44` : 'rgba(148,163,184,.08)'
                }`,
                cursor: 'pointer',
                animation: 'slideIn .22s ease',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 8,
                  marginBottom: 4,
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 900,
                    color: '#e2e8f0',
                    fontFamily: 'monospace',
                  }}
                >
                  {a.branch} · D{a.depth}
                </span>
                <span
                  style={{
                    fontSize: 9,
                    color: '#64748b',
                    fontFamily: 'monospace',
                  }}
                >
                  {a.ts}
                </span>
              </div>
              <div style={{ fontSize: 10, color: '#94a3b8' }}>
                {a.from} → {a.to}
              </div>
              <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>
                فقد التدفق {a.flowLoss?.toFixed?.(1)}% · انحراف الضغط{' '}
                {a.dpDev?.toFixed?.(3)}
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: tc,
                  fontWeight: 900,
                  marginTop: 4,
                  fontFamily: 'monospace',
                }}
              >
                {getTypeLabelAr(a.predType)} · {(a.confidence * 100).toFixed(0)}%
              </div>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}

function TechnicalPanel({ selectedSeg, activeModels = 4 }) {
  const models = selectedSeg?.models || { lgb: 0, xgb: 0, nn: 0, lstm: 0 };
  const rows = [
    ['LightGBM', models.lgb || 0, 'خصائص جدولية من الضغط والتدفق'],
    ['XGBoost', models.xgb || 0, 'تحقق متقاطع للأنماط غير الخطية'],
    ['ResNet-MLP', models.nn || 0, 'نمذجة العلاقات المعقدة بين الخصائص'],
    ['BiLSTM', models.lstm || 0, 'فهم تسلسل المقاطع داخل الفرع'],
  ];
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <SectionCard
        title="شرح قرار الذكاء الاصطناعي"
        icon={<Cpu size={16} color="#38bdf8" />}
        right={
          <SmallPill color="#22c55e">{activeModels} نماذج فعالة</SmallPill>
        }
      >
        <div
          style={{
            color: '#94a3b8',
            fontSize: 13,
            lineHeight: 1.75,
            marginBottom: 14,
          }}
        >
          تشرح هذه الواجهة التقنية النموذج بلغة مناسبة للحكّام: النظام لا يعتمد على إشارة واحدة فقط، بل يدمج الخصائص الجدولية، وفيزياء الضغط والتدفق، وسلوك التسلسل الزمني، والتجميع بين النماذج، والمعايرة، وتحديد موقع الخلل.
        </div>
        <div style={{ display: 'grid', gap: 10 }}>
          {rows.map(([name, val, desc]) => (
            <div
              key={name}
              style={{
                display: 'grid',
                gridTemplateColumns: '110px 1fr 54px',
                gap: 12,
                alignItems: 'center',
              }}
            >
              <div style={{ color: '#e2e8f0', fontSize: 12, fontWeight: 900 }}>
                {name}
              </div>
              <ProgressBar
                value={val}
                color={val > 70 ? '#ef4444' : val > 35 ? '#f59e0b' : '#38bdf8'}
              />
              <div
                style={{
                  color: '#94a3b8',
                  fontFamily: 'monospace',
                  fontWeight: 900,
                  fontSize: 11,
                }}
              >
                {Number(val).toFixed(1)}%
              </div>
              <div />
              <div style={{ color: '#64748b', fontSize: 11, marginTop: -6 }}>
                {desc}
              </div>
              <div />
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="خصائص المقطع الحالي"
        icon={<Sliders size={16} color="#f59e0b" />}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4,1fr)',
            gap: 10,
          }}
          className="aq-grid-4"
        >
          <MiniMetric
            label="فقد التدفق"
            value={`${selectedSeg?.flowLoss?.toFixed?.(2) || '0.00'}%`}
            color="#f59e0b"
          />
          <MiniMetric
            label="الفقد الزائد"
            value={`${selectedSeg?.excessLoss?.toFixed?.(2) || '0.00'}%`}
            color="#ef4444"
          />
          <MiniMetric
            label="DP DEV"
            value={`${selectedSeg?.dpDev?.toFixed?.(3) || '0.000'}`}
            color="#38bdf8"
          />
          <MiniMetric
            label="PIPE AGE"
            value={`${selectedSeg?.age || 0}y`}
            color="#a855f7"
          />
        </div>
      </SectionCard>
    </div>
  );
}

function responsiveCss() {
  return `
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.32} }
    @keyframes slideIn { from{transform:translateY(6px);opacity:0} to{transform:none;opacity:1} }
    @keyframes glowLine { from{box-shadow:0 0 0 rgba(56,189,248,0)} to{box-shadow:0 0 28px rgba(56,189,248,.22)} }
    ::-webkit-scrollbar{width:4px;height:4px}
    ::-webkit-scrollbar-track{background:#0a1628}
    ::-webkit-scrollbar-thumb{background:rgba(56,189,248,.30);border-radius:999px}
    button:hover{filter:brightness(1.08)}
    input[type=range]{-webkit-appearance:none;appearance:none;width:100%;height:6px;border-radius:999px;outline:none;background:linear-gradient(90deg,#334155 0%,#475569 100%);border:1px solid rgba(99,102,241,.18)}
    input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:16px;height:16px;border-radius:50%;background:#818cf8;border:2px solid #e2e8f0;box-shadow:0 0 0 4px rgba(99,102,241,.18);cursor:pointer}
    @media (max-width: 1100px){
      .aq-main-grid{grid-template-columns:1fr !important}
      .aq-grid-4{grid-template-columns:repeat(2,1fr) !important}
      .aq-grid-3{grid-template-columns:1fr !important}
    }
    @media (max-width: 760px){
      .aq-topbar{height:auto !important;align-items:flex-start !important;flex-direction:column !important;padding:12px !important}
      .aq-grid-4,.aq-grid-2{grid-template-columns:1fr !important}
      .aq-tabs{overflow-x:auto !important;display:flex !important}
      h1{font-size:38px !important}
    }
  `;
}

export default function AquaGuardDashboard() {
  const [showLanding, setShowLanding] = useState(true);
  const [govKey, setGovKey] = useState('Amman');
  const [simData, setSimData] = useState(null);
  const [allAlerts, setAllAlerts] = useState([]);
  const [selectedSeg, setSelectedSeg] = useState(null);
  const [tick, setTick] = useState(0);
  const [countdown, setCountdown] = useState(UPDATE_INTERVAL_SEC);
  const [forceType, setForceType] = useState(null);
  const [showGovMenu, setShowGovMenu] = useState(false);
  const [govSearch, setGovSearch] = useState('');
  const [simMode, setSimMode] = useState(false);
  const [simPressure, setSimPressure] = useState(80);
  const [simFlow, setSimFlow] = useState(300);
  const [flowHist, setFlowHist] = useState(Array(30).fill(0));
  const [pressHist, setPressHist] = useState(Array(30).fill(0));
  const [scatterData, setScatterData] = useState([]);
  const [activeTab, setActiveTab] = useState('map');
  const [demoMode, setDemoMode] = useState(false);
  const [demoStep, setDemoStep] = useState(0);
  const [isolationSavings, setIsolationSavings] = useState(0);
  const [actionLog, setActionLog] = useState([]);
  const [actionToast, setActionToast] = useState(null);
  const menuRef = useRef(null);
  const demoTimerRef = useRef(null);

  const [reservoirLevels, setReservoirLevels] = useState(() => {
    const init = {};
    Object.entries(NETWORK).forEach(([k, v]) => {
      init[k] = v.reservoirCap;
    });
    return init;
  });

  const [systemLoss, setSystemLoss] = useState(() => {
    const init = {};
    Object.keys(NETWORK).forEach((k) => {
      init[k] = 0;
    });
    return init;
  });

  const [pumping, setPumping] = useState(false);
  const gov = NETWORK[govKey];

  const runCycle = useCallback(
    async (ftype = null, govOverride = null) => {
      const activeGovKey = govOverride || govKey;
      const activeGov = NETWORK[activeGovKey];
      const activeForce = ftype || forceType;

      const apiResult = await (async () => {
        if (govOverride) return null;
        await apiPost('/api/refresh', {
          gov: activeGovKey,
          force: activeForce,
        });
        return apiGet('/api/state');
      })();

      let segments, alerts, mass;
      if (apiResult && apiResult.segments) {
        segments = apiResult.segments;
        alerts = apiResult.allAlerts || [];
        mass = apiResult.mass || null;
        if (apiResult.fh) setFlowHist(apiResult.fh);
        if (apiResult.ph) setPressHist(apiResult.ph);
      } else {
        const sim = simulateGov(activeGovKey, activeForce);
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

      if (!mass) {
        const totalFlow = segments.reduce(
          (s, seg) => s + (seg.depth === 1 ? seg.flowIn : 0),
          0
        );
        const branchInflows = {};
        segments.forEach((s) => {
          if (s.depth === 1) branchInflows[s.branch] = s.flowIn;
        });
        const cycleM3 = (totalFlow * UPDATE_INTERVAL_SEC) / 60 / 1000;
        mass = {
          branchInflows,
          totalBranchInflow: totalFlow,
          totalOutflowM3PerHr: +((totalFlow * 60) / 1000).toFixed(1),
          cycleOutflowM3: +cycleM3.toFixed(2),
          systemLossM3: +(cycleM3 * activeGov.nrw).toFixed(2),
          deliveredM3: +(cycleM3 * (1 - activeGov.nrw)).toFixed(2),
        };
      }

      setReservoirLevels((prev) => {
        const cur = prev[activeGovKey] ?? activeGov.reservoirCap;
        const nxt = Math.max(0, cur - mass.cycleOutflowM3);
        return { ...prev, [activeGovKey]: nxt };
      });
      setSystemLoss((prev) => ({
        ...prev,
        [activeGovKey]: (prev[activeGovKey] || 0) + mass.systemLossM3,
      }));

      setPumping(true);
      setTimeout(() => setPumping(false), 1200);

      setSimData({ segments, govKey: activeGovKey, mass });
      const strongest =
        segments.find((s) => s.predType === 'burst') ||
        segments.find((s) => s.alert) ||
        segments[0] ||
        null;
      if (strongest) setSelectedSeg(strongest);

      if (alerts.length) {
        setAllAlerts((prev) =>
          [
            ...alerts.map((a) => ({
              ...a,
              ts: a.ts || new Date().toLocaleTimeString(),
            })),
            ...prev,
          ].slice(0, 70)
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
    [govKey, forceType]
  );

  useEffect(() => {
    runCycle();
  }, [govKey]);

  useEffect(() => {
    const id = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          runCycle();
          return UPDATE_INTERVAL_SEC;
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
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  useEffect(() => {
    return () => {
      if (demoTimerRef.current) clearInterval(demoTimerRef.current);
    };
  }, []);

  const stopJudgeDemo = useCallback(() => {
    if (demoTimerRef.current) clearInterval(demoTimerRef.current);
    demoTimerRef.current = null;
    setDemoMode(false);
    setDemoStep(0);
  }, []);

  const startJudgeDemo = useCallback(() => {
    if (demoTimerRef.current) clearInterval(demoTimerRef.current);
    setShowLanding(false);
    setDemoMode(true);
    setActiveTab('map');
    setAllAlerts([]);
    setSelectedSeg(null);
    setIsolationSavings(0);

    const steps = [
      () => {
        setDemoStep(0);
        setGovKey('Amman');
        setForceType(null);
        runCycle(null, 'Amman');
      },
      () => {
        setDemoStep(1);
        setGovKey('Amman');
        setForceType('burst');
        setActiveTab('map');
        runCycle('burst', 'Amman');
      },
      () => {
        setDemoStep(2);
        setActiveTab('map');
      },
      () => {
        setDemoStep(3);
        setActiveTab('technical');
      },
      () => {
        setDemoStep(4);
        setActiveTab('pilot');
      },
    ];

    let idx = 0;
    const runStep = () => {
      steps[idx]?.();
      idx += 1;
      if (idx >= steps.length && demoTimerRef.current) {
        clearInterval(demoTimerRef.current);
        demoTimerRef.current = null;
        setDemoMode(false);
      }
    };
    runStep();
    demoTimerRef.current = setInterval(runStep, 3000);
  }, [runCycle]);

  const refillReservoir = () => {
    setReservoirLevels((prev) => ({ ...prev, [govKey]: gov.reservoirCap }));
    setSystemLoss((prev) => ({ ...prev, [govKey]: 0 }));
    setIsolationSavings(0);
  };

  const simulateIsolation = () => {
    const saving = (simData?.mass?.systemLossM3 || 0) * 0.82;
    setIsolationSavings((v) => v + saving);
    setSystemLoss((prev) => ({
      ...prev,
      [govKey]: Math.max(0, (prev[govKey] || 0) - saving),
    }));
  };

  const approveAction = (action) => {
    const type = selectedOrWorst?.predType || worstType || 'normal';
    const item = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      time: new Date().toLocaleTimeString('ar-JO'),
      gov: gov.label,
      segment: selectedOrWorst
        ? `${selectedOrWorst.branch || 'الشبكة'} · ${selectedOrWorst.from || 'نقطة'} → ${selectedOrWorst.to || 'نقطة'}`
        : 'الشبكة العامة',
      type: getTypeLabelAr(type),
      action: action.title,
      status: 'تم اتخاذ الإجراء',
    };
    setActionLog((prev) => [item, ...prev].slice(0, 24));
    setActionToast(item);
    if (type !== 'normal' && /عزل|تخفيض|خفض/.test(action.title)) {
      simulateIsolation();
    }
    window.setTimeout(() => setActionToast(null), 2800);
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

  const segments = simData?.segments || [];
  const mass = simData?.mass || {
    branchInflows: {},
    totalOutflowM3PerHr: 0,
    cycleOutflowM3: 0,
    systemLossM3: 0,
    deliveredM3: 0,
  };
  const alertSegs = segments.filter((s) => s.alert);
  const burstSegs = segments.filter((s) => s.predType === 'burst');
  const leakSegs = segments.filter((s) => s.predType === 'leak');
  const theftSegs = segments.filter((s) => s.predType === 'theft');
  const maxLoss = Math.max(0, ...segments.map((s) => s.flowLoss));
  const maxDP = Math.max(0, ...segments.map((s) => Math.abs(s.dpDev)));
  const worstType = burstSegs.length
    ? 'burst'
    : alertSegs[0]?.predType || 'normal';
  const selectedOrWorst = selectedSeg || alertSegs[0] || segments[0] || null;
  const activeType =
    selectedOrWorst?.alert || selectedOrWorst?.predType !== 'normal'
      ? selectedOrWorst?.predType || worstType
      : worstType;
  const currentReservoir = reservoirLevels[govKey] ?? gov.reservoirCap;
  const reservoirPct = (currentReservoir / gov.reservoirCap) * 100;
  const totalSystemLoss = systemLoss[govKey] || 0;
  const flowHistData = flowHist.map((v, i) => ({ i, v }));
  const pressHistData = pressHist.map((v, i) => ({ i, v }));

  const TYPE_DOT = {
    normal: '#22c55e',
    leak: '#f59e0b',
    burst: '#ef4444',
    theft: '#a855f7',
  };

  if (showLanding) {
    return (
      <HeroLanding
        onLaunch={() => setShowLanding(false)}
        onDemo={startJudgeDemo}
      />
    );
  }

  const tabs = [
    ['map', 'الخريطة الحية'],
    ['scatter', 'بصمة الخلل'],
    ['telemetry', 'القياسات الحية'],
    ['users', 'بحث المستخدمين'],
    ['pilot', 'خطة التطبيق'],
    ['technical', 'شرح الذكاء الاصطناعي'],
  ];

  return (
    <div
      style={{
        background: '#060c18',
        minHeight: '100vh',
        color: '#e2e8f0',
        fontFamily: "'Tajawal','Cairo','Inter',system-ui,sans-serif",
        direction: 'rtl',
        textAlign: 'right',
        overflow: 'auto',
      }}
    >
      <div
        className="aq-topbar"
        style={{
          background: 'rgba(10,22,40,.96)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(56,189,248,.15)',
          padding: '0 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: 58,
          position: 'sticky',
          top: 0,
          zIndex: 50,
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              background: 'linear-gradient(135deg,#0ea5e9,#6366f1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Droplets size={20} color="#fff" />
          </div>
          <div>
            <div
              style={{
                fontSize: 15,
                fontWeight: 950,
                color: '#f8fafc',
                letterSpacing: 0.2,
              }}
            >
              AquaGuard AI v5.0
            </div>
            <div
              style={{
                fontSize: 10,
                color: '#7dd3fc',
                fontFamily: 'monospace',
              }}
            >
              توقع الطلب · التحقق من نقاط القياس · ذكاء الأعطال
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flexWrap: 'wrap',
          }}
        >
          <button onClick={startJudgeDemo} style={primaryButton('#38bdf8')}>
            <Zap size={14} /> عرض التحكيم
          </button>
          {demoMode && (
            <button onClick={stopJudgeDemo} style={secondaryButton()}>
              إيقاف العرض
            </button>
          )}

          {['normal', 'leak', 'burst', 'theft'].map((t) => (
            <button
              key={t}
              onClick={() => {
                stopJudgeDemo();
                setForceType(t === 'normal' ? null : t);
                runCycle(t === 'normal' ? null : t);
              }}
              style={{
                padding: '7px 10px',
                borderRadius: 9,
                fontSize: 10,
                fontFamily: 'monospace',
                cursor: 'pointer',
                fontWeight: 900,
                background:
                  forceType === t || (!forceType && t === 'normal')
                    ? `${TYPE_DOT[t]}22`
                    : 'transparent',
                border: `1px solid ${TYPE_DOT[t]}70`,
                color: TYPE_DOT[t],
              }}
            >
              {t.toUpperCase()}
            </button>
          ))}

          <button
            onClick={() => setSimMode((m) => !m)}
            style={{
              ...secondaryButton(),
              padding: '7px 10px',
              background: simMode
                ? 'rgba(99,102,241,.22)'
                : 'rgba(15,23,42,.55)',
              color: '#a5b4fc',
            }}
          >
            <Sliders size={13} /> Sim
          </button>

          <button
            onClick={() => runCycle()}
            style={{
              ...secondaryButton(),
              padding: '7px 10px',
              color: '#38bdf8',
            }}
          >
            <RefreshCw size={13} /> تحديث
          </button>

          <SmallPill
            color={pumping ? '#22d3ee' : API_URL ? '#22c55e' : '#f59e0b'}
            filled
          >
            <Radio size={11} />{' '}
            {pumping ? 'PUMPING' : API_URL ? 'ML LIVE' : 'محاكاة دون اتصال'} ·{' '}
            {countdown}s
          </SmallPill>
        </div>
      </div>

      {actionToast && (
        <div
          style={{
            position: 'fixed',
            top: 76,
            left: 22,
            zIndex: 120,
            minWidth: 280,
            maxWidth: 420,
            background: 'linear-gradient(135deg,rgba(34,197,94,.20),rgba(15,23,42,.96))',
            border: '1px solid rgba(34,197,94,.45)',
            color: '#f8fafc',
            borderRadius: 14,
            padding: '12px 14px',
            boxShadow: '0 18px 54px rgba(0,0,0,.32)',
            animation: 'slideIn .22s ease',
          }}
        >
          <div style={{ color: '#22c55e', fontWeight: 950, fontSize: 13 }}>تم اتخاذ الإجراء بنجاح</div>
          <div style={{ color: '#cbd5e1', fontSize: 12, lineHeight: 1.55, marginTop: 4 }}>{actionToast.action}</div>
        </div>
      )}

      <div style={{ padding: 18, display: 'grid', gap: 16 }}>
        <div
          style={{
            background:
              'linear-gradient(135deg,rgba(56,189,248,.13),rgba(99,102,241,.08),rgba(15,23,42,.72))',
            border: '1px solid rgba(56,189,248,.15)',
            borderRadius: 18,
            padding: 16,
            display: 'grid',
            gridTemplateColumns: '1.25fr .75fr',
            gap: 16,
          }}
          className="aq-grid-2"
        >
          <div>
            <div
              style={{
                display: 'flex',
                gap: 8,
                flexWrap: 'wrap',
                marginBottom: 10,
              }}
            >
              <SmallPill color="#38bdf8">السيناريو الحالي</SmallPill>
              <SmallPill color={getTypeColor(worstType)} filled>
                {worstType.toUpperCase()}
              </SmallPill>
              {demoMode && (
                <SmallPill color="#f59e0b" filled>
                  خطوة العرض {demoStep + 1}/5
                </SmallPill>
              )}
            </div>
            <div
              style={{
                color: '#f8fafc',
                fontSize: 24,
                fontWeight: 950,
                letterSpacing: -0.5,
              }}
            >
              {worstType === 'normal'
                ? 'الشبكة مستقرة، والمشغّل يواصل المراقبة.'
                : `${ACTION_LIBRARY[worstType].title} في ${gov.label}: تحتاج الشبكة إلى إجراء تشغيلي واضح.`}
            </div>
            <div
              style={{
                color: '#94a3b8',
                fontSize: 13,
                lineHeight: 1.7,
                marginTop: 8,
                maxWidth: 900,
              }}
            >
              تم ترتيب لوحة التحكم بما يناسب حكّام شركات التقنية: رحلة مستخدم واضحة، تصور حي للشبكة، شرح مبسط للذكاء الاصطناعي، بحث مستخدمين، وخطة تطبيق واقعية.
            </div>
          </div>
          <div
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}
          >
            <MiniMetric
              label="المحافظة"
              value={gov.label}
              color="#38bdf8"
              sub={gov.source}
            />
            <MiniMetric
              label="المخاطر"
              value={getRiskLabel(worstType)}
              color={getTypeColor(worstType)}
              sub="الدورة الحالية"
            />
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(6,1fr)',
            gap: 12,
          }}
          className="aq-grid-4"
        >
          <KpiCard
            label="إنذارات نشطة"
            value={alertSegs.length}
            sub={`${allAlerts.length} إنذار مسجل`}
            color="#ef4444"
            icon={<Bell size={17} />}
          />
          <KpiCard
            label="انفجار"
            value={burstSegs.length}
            sub="أعطال حرجة"
            color="#ef4444"
            icon={<AlertTriangle size={17} />}
          />
          <KpiCard
            label="تسرب"
            value={leakSegs.length}
            sub="تسربات تدريجية"
            color="#f59e0b"
            icon={<Waves size={17} />}
          />
          <KpiCard
            label="سرقة"
            value={theftSegs.length}
            sub="نمط استعمال غير مشروع"
            color="#a855f7"
            icon={<Eye size={17} />}
          />
          <KpiCard
            label="MAX LOSS"
            value={`${maxLoss.toFixed(1)}%`}
            sub="فقد تدفق في المقطع"
            color="#f59e0b"
            icon={<TrendingDown size={17} />}
          />
          <KpiCard
            label="أعلى انحراف ضغط"
            value={maxDP.toFixed(2)}
            sub="انحراف الضغط"
            color="#38bdf8"
            icon={<Gauge size={17} />}
          />
        </div>

        <DemandVerificationCard
          gov={gov}
          mass={mass}
          totalSystemLoss={totalSystemLoss}
          isolationSavings={isolationSavings}
        />

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0,1.85fr) minmax(340px,.65fr)',
            gap: 16,
          }}
          className="aq-main-grid"
        >
          <div style={{ display: 'grid', gap: 16 }}>
            <SectionCard
              title="غرفة تحكم شبكة المياه"
              icon={<MapPin size={16} color="#38bdf8" />}
              right={
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div ref={menuRef} style={{ position: 'relative' }}>
                    <button
                      onClick={() => setShowGovMenu((v) => !v)}
                      style={{
                        ...secondaryButton(),
                        padding: '8px 10px',
                        minWidth: 158,
                        justifyContent: 'space-between',
                      }}
                    >
                      {gov.label} <ChevronDown size={13} />
                    </button>
                    {showGovMenu && (
                      <div
                        style={{
                          position: 'absolute',
                          right: 0,
                          top: 42,
                          width: 245,
                          background: '#0a1628',
                          border: '1px solid rgba(56,189,248,.16)',
                          borderRadius: 12,
                          padding: 10,
                          zIndex: 60,
                          boxShadow: '0 22px 60px rgba(0,0,0,.34)',
                        }}
                      >
                        <div style={{ position: 'relative', marginBottom: 8 }}>
                          <Search
                            size={13}
                            style={{
                              position: 'absolute',
                              left: 9,
                              top: 9,
                              color: '#64748b',
                            }}
                          />
                          <input
                            value={govSearch}
                            onChange={(e) => setGovSearch(e.target.value)}
                            placeholder="ابحث عن محافظة..."
                            style={{
                              width: '100%',
                              boxSizing: 'border-box',
                              background: '#08111f',
                              border: '1px solid rgba(148,163,184,.13)',
                              color: '#e2e8f0',
                              padding: '8px 9px 8px 30px',
                              borderRadius: 9,
                              outline: 'none',
                              fontSize: 12,
                            }}
                          />
                        </div>
                        <div
                          style={{
                            maxHeight: 280,
                            overflowY: 'auto',
                            display: 'grid',
                            gap: 5,
                          }}
                        >
                          {filteredGovs.map(([k, v]) => (
                            <button
                              key={k}
                              onClick={() => {
                                setGovKey(k);
                                setShowGovMenu(false);
                                setSelectedSeg(null);
                                setCountdown(UPDATE_INTERVAL_SEC);
                              }}
                              style={{
                                background:
                                  k === govKey
                                    ? 'rgba(56,189,248,.12)'
                                    : 'transparent',
                                border: '1px solid transparent',
                                color: k === govKey ? '#38bdf8' : '#cbd5e1',
                                borderRadius: 9,
                                padding: '9px 10px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                cursor: 'pointer',
                              }}
                            >
                              <span>{v.label}</span>
                              <span
                                style={{
                                  fontFamily: 'monospace',
                                  color:
                                    v.nrw > 0.5
                                      ? '#ef4444'
                                      : v.nrw > 0.4
                                      ? '#f59e0b'
                                      : '#22c55e',
                                }}
                              >
                                {Math.round(v.nrw * 100)}%
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <SmallPill color="#22d3ee">
                    {fmtNum(mass.totalOutflowM3PerHr, 0)} m³/h
                  </SmallPill>
                </div>
              }
            >
              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  flexWrap: 'wrap',
                  marginBottom: 12,
                }}
              >
                {[
                  ['normal', 'طبيعي'],
                  ['leak', 'تسرب'],
                  ['burst', 'انفجار'],
                  ['theft', 'سرقة'],
                ].map(([t, l]) => (
                  <SmallPill
                    key={t}
                    color={TYPE_DOT[t]}
                    filled={worstType === t}
                  >
                    {l}
                  </SmallPill>
                ))}
                <SmallPill color="#22d3ee">الأزرق المتحرك = تدفق نشط</SmallPill>
              </div>

              <div
                className="aq-tabs"
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${tabs.length},1fr)`,
                  gap: 7,
                  marginBottom: 14,
                }}
              >
                {tabs.map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    style={{
                      padding: '9px 10px',
                      borderRadius: 10,
                      border: `1px solid ${
                        activeTab === key
                          ? 'rgba(56,189,248,.42)'
                          : 'rgba(148,163,184,.12)'
                      }`,
                      background:
                        activeTab === key
                          ? 'rgba(56,189,248,.12)'
                          : 'rgba(2,6,23,.18)',
                      color: activeTab === key ? '#38bdf8' : '#94a3b8',
                      fontSize: 11,
                      fontWeight: 900,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {activeTab === 'map' && (
                <div
                  style={{
                    background: 'rgba(2,6,23,.24)',
                    borderRadius: 14,
                    border: '1px solid rgba(148,163,184,.08)',
                    overflow: 'hidden',
                  }}
                >
                  <PipeNetworkMap
                    govKey={govKey}
                    segments={segments}
                    onSegClick={setSelectedSeg}
                    selectedSeg={selectedOrWorst}
                    pumping={pumping}
                    branchInflows={mass.branchInflows}
                    totalOutflowM3PerHr={mass.totalOutflowM3PerHr}
                  />
                </div>
              )}

              {activeTab === 'scatter' && (
                <div
                  style={{
                    height: 560,
                    background: 'rgba(2,6,23,.24)',
                    borderRadius: 14,
                    padding: 12,
                  }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart
                      margin={{ top: 20, right: 24, bottom: 42, left: 24 }}
                    >
                      <CartesianGrid stroke="rgba(148,163,184,.12)" />
                      <XAxis
                        type="number"
                        dataKey="x"
                        name="نسبة فقد التدفق %"
                        stroke="#64748b"
                        tick={{ fontSize: 11, fill: '#94a3b8' }}
                        label={{ value: 'محور X: نسبة فقد التدفق (%)', position: 'insideBottom', offset: -10, fill: '#94a3b8', fontSize: 11 }}
                      />
                      <YAxis
                        type="number"
                        dataKey="y"
                        name="انحراف الضغط"
                        stroke="#64748b"
                        tick={{ fontSize: 11, fill: '#94a3b8' }}
                        label={{ value: 'محور Y: انحراف الضغط', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 11 }}
                      />
                      <RTooltip
                        cursor={{ strokeDasharray: '3 3' }}
                        contentStyle={{
                          background: '#0a1628',
                          border: '1px solid rgba(56,189,248,.16)',
                          borderRadius: 10,
                          color: '#f8fafc',
                        }}
                        itemStyle={{ color: '#f8fafc' }}
                        labelStyle={{ color: '#f8fafc' }}
                        wrapperStyle={{ color: '#f8fafc' }}
                      />
                      {['normal', 'leak', 'burst', 'theft'].map((t) => (
                        <Scatter
                          key={t}
                          name={t}
                          data={scatterData.filter((d) => d.type === t)}
                          fill={TYPE_DOT[t]}
                          onClick={(d) => {
                            const seg = segments.find((s) => s.id === d?.id);
                            if (seg) setSelectedSeg(seg);
                          }}
                        />
                      ))}
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              )}

              {activeTab === 'telemetry' && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 12,
                  }}
                  className="aq-grid-2"
                >
                  <div
                    style={{
                      height: 260,
                      background: 'rgba(2,6,23,.24)',
                      borderRadius: 14,
                      padding: 12,
                    }}
                  >
                    <div
                      style={{
                        color: '#94a3b8',
                        fontSize: 11,
                        fontFamily: 'monospace',
                        fontWeight: 900,
                        marginBottom: 8,
                      }}
                    >
                      سجل التدفق
                    </div>
                    <ResponsiveContainer width="100%" height="88%">
                      <AreaChart data={flowHistData} margin={{ top: 10, right: 14, bottom: 30, left: 24 }}>
                        <defs>
                          <linearGradient
                            id="flowGrad"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#38bdf8"
                              stopOpacity={0.55}
                            />
                            <stop
                              offset="95%"
                              stopColor="#38bdf8"
                              stopOpacity={0.02}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid stroke="rgba(148,163,184,.10)" />
                        <XAxis
                          dataKey="i"
                          stroke="#64748b"
                          tick={{ fontSize: 10, fill: '#94a3b8' }}
                          label={{ value: 'محور X: آخر القراءات الزمنية', position: 'insideBottom', offset: -18, fill: '#94a3b8', fontSize: 10 }}
                        />
                        <YAxis
                          stroke="#64748b"
                          tick={{ fontSize: 10, fill: '#94a3b8' }}
                          label={{ value: 'محور Y: التدفق (L/min)', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 10 }}
                        />
                        <RTooltip
                          contentStyle={{
                            background: '#0a1628',
                            border: '1px solid rgba(56,189,248,.16)',
                            borderRadius: 10,
                            color: '#f8fafc',
                          }}
                          itemStyle={{ color: '#f8fafc' }}
                          labelStyle={{ color: '#f8fafc' }}
                        />
                        <Area
                          type="monotone"
                          dataKey="v"
                          stroke="#38bdf8"
                          fill="url(#flowGrad)"
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div
                    style={{
                      height: 260,
                      background: 'rgba(2,6,23,.24)',
                      borderRadius: 14,
                      padding: 12,
                    }}
                  >
                    <div
                      style={{
                        color: '#94a3b8',
                        fontSize: 11,
                        fontFamily: 'monospace',
                        fontWeight: 900,
                        marginBottom: 8,
                      }}
                    >
                      سجل الضغط
                    </div>
                    <ResponsiveContainer width="100%" height="88%">
                      <AreaChart data={pressHistData} margin={{ top: 10, right: 14, bottom: 30, left: 24 }}>
                        <defs>
                          <linearGradient
                            id="pressGrad"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#a855f7"
                              stopOpacity={0.55}
                            />
                            <stop
                              offset="95%"
                              stopColor="#a855f7"
                              stopOpacity={0.02}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid stroke="rgba(148,163,184,.10)" />
                        <XAxis
                          dataKey="i"
                          stroke="#64748b"
                          tick={{ fontSize: 10, fill: '#94a3b8' }}
                          label={{ value: 'محور X: آخر القراءات الزمنية', position: 'insideBottom', offset: -18, fill: '#94a3b8', fontSize: 10 }}
                        />
                        <YAxis
                          stroke="#64748b"
                          tick={{ fontSize: 10, fill: '#94a3b8' }}
                          label={{ value: 'محور Y: الضغط (PSI)', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 10 }}
                        />
                        <RTooltip
                          contentStyle={{
                            background: '#0a1628',
                            border: '1px solid rgba(56,189,248,.16)',
                            borderRadius: 10,
                            color: '#f8fafc',
                          }}
                          itemStyle={{ color: '#f8fafc' }}
                          labelStyle={{ color: '#f8fafc' }}
                        />
                        <Area
                          type="monotone"
                          dataKey="v"
                          stroke="#a855f7"
                          fill="url(#pressGrad)"
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  {simMode && (
                    <div
                      style={{
                        gridColumn: '1 / -1',
                        border: '1px solid rgba(99,102,241,.18)',
                        background: 'rgba(99,102,241,.08)',
                        borderRadius: 14,
                        padding: 14,
                      }}
                    >
                      <div
                        style={{
                          color: '#f8fafc',
                          fontWeight: 950,
                          marginBottom: 10,
                        }}
                      >
                        وضع المحاكاة التنبؤية
                      </div>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr 130px',
                          gap: 14,
                          alignItems: 'center',
                        }}
                        className="aq-grid-3"
                      >
                        <label style={{ color: '#94a3b8', fontSize: 12 }}>
                          ضغط الدخول:{' '}
                          <b style={{ color: '#e2e8f0' }}>{simPressure} PSI</b>
                          <input
                            type="range"
                            min="20"
                            max="130"
                            value={simPressure}
                            onChange={(e) => setSimPressure(+e.target.value)}
                          />
                        </label>
                        <label style={{ color: '#94a3b8', fontSize: 12 }}>
                          تدفق الدخول:{' '}
                          <b style={{ color: '#e2e8f0' }}>{simFlow} L/min</b>
                          <input
                            type="range"
                            min="50"
                            max="600"
                            value={simFlow}
                            onChange={(e) => setSimFlow(+e.target.value)}
                          />
                        </label>
                        <MiniMetric
                          label="المخاطر"
                          value={`${simAnomalyProb}%`}
                          color={
                            simAnomalyProb > 65
                              ? '#ef4444'
                              : simAnomalyProb > 35
                              ? '#f59e0b'
                              : '#22c55e'
                          }
                          sub={
                            simAnomalyProb > 65
                              ? 'مرتفع'
                              : simAnomalyProb > 35
                              ? 'متوسط'
                              : 'طبيعي'
                          }
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'users' && <UserResearchPanel />}
              {activeTab === 'pilot' && <PilotPlanPanel />}
              {activeTab === 'technical' && (
                <TechnicalPanel selectedSeg={selectedOrWorst} />
              )}
            </SectionCard>

            <div style={{ display: 'grid', gap: 16 }}>
              <SuggestedActionsPanel
                seg={selectedOrWorst}
                gov={gov}
                actionLog={actionLog}
                onApproveAction={approveAction}
              />

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)',
                  gap: 16,
                }}
                className="aq-grid-2"
              >
                <ActionLogPanel actionLog={actionLog} />
                <AlertLogPanel
                  allAlerts={allAlerts}
                  selectedOrWorst={selectedOrWorst}
                  setSelectedSeg={setSelectedSeg}
                  typeColors={TYPE_DOT}
                />
              </div>
            </div>

            <SectionCard
              title="نظرة عامة على شبكة الأردن"
              icon={<Database size={16} color="#22d3ee" />}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit,minmax(74px,1fr))',
                  gap: 8,
                }}
              >
                {Object.entries(NETWORK).map(([k, v]) => {
                  const nrwPct = Math.round(v.nrw * 100);
                  const rPct =
                    ((reservoirLevels[k] ?? v.reservoirCap) / v.reservoirCap) *
                    100;
                  const isActive = k === govKey;
                  return (
                    <div
                      key={k}
                      onClick={() => setGovKey(k)}
                      style={{
                        cursor: 'pointer',
                        textAlign: 'center',
                        padding: '9px 5px',
                        borderRadius: 10,
                        background: isActive
                          ? 'rgba(56,189,248,.10)'
                          : 'rgba(2,6,23,.16)',
                        border: `1px solid ${
                          isActive
                            ? 'rgba(56,189,248,.35)'
                            : 'rgba(148,163,184,.08)'
                        }`,
                      }}
                    >
                      <div
                        style={{
                          width: 19,
                          height: 42,
                          margin: '0 auto 5px',
                          position: 'relative',
                          background: '#0f172a',
                          borderRadius: 4,
                          overflow: 'hidden',
                          border: '1px solid #1e293b',
                        }}
                      >
                        <div
                          style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: `${rPct}%`,
                            background:
                              rPct > 60
                                ? '#22c55e'
                                : rPct > 30
                                ? '#f59e0b'
                                : '#ef4444',
                            transition: 'height .4s',
                          }}
                        />
                      </div>
                      <div
                        style={{
                          fontSize: 9,
                          color: isActive ? '#38bdf8' : '#94a3b8',
                          fontWeight: 850,
                        }}
                      >
                        {v.label}
                      </div>
                      <div
                        style={{
                          fontSize: 9,
                          color:
                            rPct > 60
                              ? '#22c55e'
                              : rPct > 30
                              ? '#f59e0b'
                              : '#ef4444',
                          fontFamily: 'monospace',
                          fontWeight: 900,
                        }}
                      >
                        {rPct.toFixed(0)}%
                      </div>
                      <div
                        style={{
                          fontSize: 8,
                          color:
                            v.nrw > 0.5
                              ? '#ef4444'
                              : v.nrw > 0.4
                              ? '#f59e0b'
                              : '#22c55e',
                          fontFamily: 'monospace',
                        }}
                      >
                        NRW {nrwPct}
                      </div>
                    </div>
                  );
                })}
              </div>
            </SectionCard>
          </div>

          <div style={{ display: 'grid', gap: 16, alignContent: 'start' }}>
            <SectionCard
              title="الخزان والفاقد NRW"
              icon={<Droplets size={16} color={gov.color} />}
              right={
                <SmallPill color={gov.color}>
                  الهدف {Math.round(gov.target_nrw * 100)}%
                </SmallPill>
              }
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <ReservoirTank
                  currentM3={currentReservoir}
                  capacityM3={gov.reservoirCap}
                  pulsing={pumping}
                  govColor={gov.color}
                />
                <div style={{ flex: 1 }}>
                  <MiniMetric
                    label="المستوى الحالي"
                    value={`${reservoirPct.toFixed(1)}%`}
                    color={
                      reservoirPct > 60
                        ? '#22c55e'
                        : reservoirPct > 30
                        ? '#f59e0b'
                        : '#ef4444'
                    }
                    sub={`${fmtM3(currentReservoir, 0)} متبقي`}
                  />
                  <div style={{ marginTop: 10 }}>
                    <NRWGauge nrw={gov.nrw} target={gov.target_nrw} />
                  </div>
                  <button
                    onClick={refillReservoir}
                    style={{
                      ...secondaryButton(),
                      width: '100%',
                      justifyContent: 'center',
                      marginTop: 10,
                    }}
                  >
                    تعبئة / إعادة ضبط المنطقة
                  </button>
                </div>
              </div>
            </SectionCard>

            <DecisionCard
              seg={selectedOrWorst}
              gov={gov}
              mass={mass}
              onIsolate={simulateIsolation}
            />

            <IncidentTimeline demoStep={demoStep} activeType={worstType} />

          </div>
        </div>
      </div>

      <style>{responsiveCss()}</style>
    </div>
  );
}
