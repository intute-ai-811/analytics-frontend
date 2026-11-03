// src/demo/demoData.js
// All mock data for the frontend-only demo mode.

export const DEMO_EMAIL = "demo@intuteai.in";
export const DEMO_PASSWORD = "password@demo";
export const DEMO_TOKEN = "demo-token-intuteai";

// Shape returned by /api/auth/me (and dispatched on "auth:login") for the demo user.
export const DEMO_USER = { name: "Demo User", email: DEMO_EMAIL, role: "admin" };

export const isDemoMode = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "null")?.email === DEMO_EMAIL;
  } catch {
    return false;
  }
};

// ── /api/vehicle-master/admin-summary ────────────────────────────────────────
// Shape consumed by AdminDashboard.jsx:
//   vehicle_master_id, vehicle_type, capacity, vehicle_no,
//   customer, status, total_hours, total_kwh, avg_kwh
export const DEMO_VEHICLES = [
  {
    vehicle_master_id: "demo-9001",
    vehicle_type: "Intute Loader",
    vehicle_no: "DL01AB1234",
    capacity: 7.5,
    customer: "IntuteAI Demo Client",
    status: "online",
    total_hours: 312.5,
    total_kwh: 1840.2,
    avg_kwh: 5.89,
  },
  {
    vehicle_master_id: "demo-9002",
    vehicle_type: "Intute Excavator",
    vehicle_no: "MH02CD5678",
    capacity: 3.5,
    customer: "IntuteAI Demo Client",
    status: "idle",
    total_hours: 198.0,
    total_kwh: 952.4,
    avg_kwh: 4.81,
  },
  {
    vehicle_master_id: "demo-9003",
    vehicle_type: "Intute Forklift",
    vehicle_no: "UP03EF9012",
    capacity: 5.0,
    customer: "IntuteAI Demo Client",
    status: "offline",
    total_hours: 84.0,
    total_kwh: 420.6,
    avg_kwh: 5.01,
  },
];

// last_seen drives the "live" status on the dashboards and fleet map
// (LIVE_THRESHOLD_MS = 15 s) — online vehicles are always "just seen".
const DEMO_LAST_SEEN_AGO_MS = {
  "demo-9001": 0,
  "demo-9002": 2 * 60_000,
  "demo-9003": 3 * 3_600_000,
};

export function demoLastSeen(vehicleId) {
  return new Date(Date.now() - (DEMO_LAST_SEEN_AGO_MS[vehicleId] ?? 3_600_000)).toISOString();
}

// ── /api/vehicle-master/admin-summary ── (adds a fresh last_seen per call)
export function makeDemoAdminSummary() {
  return DEMO_VEHICLES.map((v) => ({ ...v, last_seen: demoLastSeen(v.vehicle_master_id) }));
}

// ── /api/vehicle-master/my ── (CustomerDashboard shape)
export function makeDemoMyVehicles() {
  return DEMO_VEHICLES.map((v) => ({
    vehicle_master_id: v.vehicle_master_id,
    vehicle_make: "Intute",
    vehicle_model: v.vehicle_type.replace(/^Intute\s*/, ""),
    capacity: v.capacity,
    vehicle_reg_no: v.vehicle_no,
    total_hours: v.total_hours,
    total_kwh: v.total_kwh,
    avg_kwh: v.avg_kwh,
    status: v.status,
  }));
}

// ── /api/vehicle-master/admin-summary/stream  &  /api/vehicle-master/my/stream ──
// Per-vehicle status + all-time totals; online vehicle's counters creep up.
export function makeDemoSummaryUpdate(vehicleId, tick = 0) {
  const v = DEMO_VEHICLES.find((x) => x.vehicle_master_id === vehicleId);
  if (!v) return null;
  const running = v.status === "online";
  const total_hours = +(v.total_hours + (running ? tick * 0.001 : 0)).toFixed(2);
  const total_kwh = +(v.total_kwh + (running ? tick * 0.006 : 0)).toFixed(2);
  return {
    vehicle_master_id: vehicleId,
    status: v.status,
    total_hours,
    total_kwh,
    avg_kwh: +(total_kwh / total_hours).toFixed(2),
    last_seen: demoLastSeen(vehicleId),
  };
}

// ── /api/vehicles/:id ── (VehicleLiveTrack identity card)
export function makeDemoVehicleInfo(vehicleId) {
  const v = DEMO_VEHICLES.find((x) => x.vehicle_master_id === vehicleId);
  if (!v) return null;
  return {
    vehicle_master_id: vehicleId,
    vehicle_reg_no: v.vehicle_no,
    make: "Intute",
    model: v.vehicle_type.replace(/^Intute\s*/, ""),
    customer: v.customer,
  };
}

// ── /api/vehicles/analytics/batch ────────────────────────────────────────────
// Keyed by vehicle_master_id — merged into rows by AdminDashboard for "today" mode.
export const DEMO_BATCH_ANALYTICS = {
  "demo-9001": { running_hours: 6.5,  kwh_consumed: 38.3, avg_kwh: 5.89 },
  "demo-9002": { running_hours: 3.2,  kwh_consumed: 15.4, avg_kwh: 4.81 },
  "demo-9003": { running_hours: 0,    kwh_consumed: 0,    avg_kwh: 0    },
};

// ── /api/vehicles/:id/live  (also used as SSE tick source) ───────────────────
// tick counter produces smooth sine-wave variation so values evolve realistically.
export function makeLiveSnapshot(vehicleId, tick = 0) {
  const isV1 = vehicleId === "demo-9001";
  // demo-9003 is offline — show low/static values
  const isV3 = vehicleId === "demo-9003";
  const baseSOC = isV1 ? 65 : isV3 ? 18 : 42;
  const soc = Math.max(10, Math.min(100, baseSOC + Math.sin(tick * 0.08) * 2.5));

  const stackV = 580 + Math.sin(tick * 0.18) * 8;
  const dcCurr = isV1 ? 42 + Math.sin(tick * 0.3) * 5 : isV3 ? 0 : 2.1;
  const outKW  = isV1 ? 24.5 + Math.sin(tick * 0.3) * 3 : isV3 ? 0 : 1.2;
  const mTorq  = isV1 ? 185 + Math.sin(tick * 0.38) * 22 : 0;
  const mRPM   = isV1 ? 1460 + Math.sin(tick * 0.38) * 160 : 0;
  const mTempC = 62 + Math.sin(tick * 0.06) * 4;
  const maxT   = 38.5 + Math.sin(tick * 0.08) * 2;
  const minT   = 34.2 + Math.sin(tick * 0.07) * 1.5;

  return {
    recorded_at: new Date().toISOString(),

    // BMS
    soc_percent: soc,
    battery_status: isV1 ? "Discharging" : isV3 ? "Offline" : "Idle",
    stack_voltage_v: stackV,
    dc_current_a: dcCurr,
    output_power_kw: outKW,
    charging_current_a: 0,
    max_voltage_v: 3.872 + Math.sin(tick * 0.14) * 0.008,
    min_voltage_v: 3.841 + Math.sin(tick * 0.11) * 0.008,
    avg_voltage_v: 3.856 + Math.sin(tick * 0.1) * 0.004,
    max_temp_c: maxT,
    min_temp_c: minT,
    avg_temp_c: (maxT + minT) / 2,

    // Temperature modules (3 modules × 12 sensors)
    temp_modules: [0, 1, 2].map((m) =>
      Array.from({ length: 12 }, (_, i) => 35 + m * 0.8 + i * 0.25 + Math.sin(tick * 0.05 + i + m) * 1.2)
    ),
    temp_pack_stats: { max_c: maxT, avg_c: (maxT + minT) / 2, min_c: minT },
    temp_module_stats: [
      { min_c: 35.0, max_c: 38.0, status: "OK" },
      { min_c: 35.8, max_c: 38.5, status: "OK" },
      { min_c: 34.2, max_c: 37.5, status: "OK" },
    ],

    // Cell voltage modules (3 modules × 12 cells)
    cell_modules: [0, 1, 2].map((m) =>
      Array.from({ length: 12 }, (_, i) => 3.84 + m * 0.004 + Math.sin(tick * 0.04 + i) * 0.006)
    ),
    cell_pack_stats: { max_v: 3.872, avg_v: 3.856, min_v: 3.841, outliers: 0 },
    cell_module_stats: [
      { min_v: 3.841, max_v: 3.866 },
      { min_v: 3.845, max_v: 3.869 },
      { min_v: 3.838, max_v: 3.864 },
    ],

    // Motor / MCU
    motor_torque_nm: mTorq,
    motor_torque_limit: 350,
    motor_operation_mode: isV1 ? "Torque Control" : isV3 ? "Off" : "Standby",
    motor_speed_rpm: mRPM,
    motor_rotation_dir: "Forward",
    ac_current_a: isV1 ? 38 + Math.sin(tick * 0.35) * 4 : 0,
    motor_ac_voltage_v: isV1 ? 380 + Math.sin(tick * 0.2) * 5 : 0,
    dc_side_voltage_v: stackV,
    mcu_enable_state: "Enabled",
    motor_temp_c: mTempC,
    mcu_temp_c: 48 + Math.sin(tick * 0.05) * 3,
    radiator_temp_c: 44 + Math.sin(tick * 0.04) * 2,
    motor_status_word: "0x0021",
    motor_freq_raw: isV1 ? 48.3 + Math.sin(tick * 0.2) * 1.2 : 0,
    motor_total_wattage_w: isV1 ? 24500 + Math.sin(tick * 0.3) * 2800 : 1200,

    // ODO / Trip
    total_hours: isV1 ? 312.5 : isV3 ? 84.0 : 198.0,
    last_trip_hrs: isV1 ? 6.5 : isV3 ? 0 : 3.2,
    total_kwh: isV1 ? 1840.2 : isV3 ? 420.6 : 952.4,
    last_trip_kwh: isV1 ? 38.3 : isV3 ? 0 : 15.4,

    // Alarms — all clear for demo
    alarms_over_voltage: false,
    alarms_under_voltage: false,
    alarms_over_temperature: false,
    alarms_motor_fault: false,
    alarms_comm_loss: false,
    alarms_low_soc: false,
    alarms_charger_fault: false,
  };
}

// ── /api/vehicles/:id/timeseries?minutes=5 ───────────────────────────────────
// 30 historical points (10 s apart) for LiveCharts seed.
export function makeDemoTimeseries() {
  const now = Date.now();
  return Array.from({ length: 30 }, (_, i) => {
    const t   = now - (29 - i) * 10_000;
    const tick = i;
    return {
      recorded_at:    new Date(t).toISOString(),
      output_power_kw: 24 + Math.sin(tick * 0.4) * 4,
      motor_speed_rpm: 1420 + Math.sin(tick * 0.35) * 180,
      motor_torque_nm: 175 + Math.sin(tick * 0.4) * 25,
      dc_current_a:    40 + Math.sin(tick * 0.3) * 6,
      motor_ac_voltage_v: 378 + Math.sin(tick * 0.2) * 6,
      ac_current_a:    36 + Math.sin(tick * 0.35) * 5,
    };
  });
}

// ── /api/motor/analytics/:id ─────────────────────────────────────────────────
export function makeDemoMotorAnalytics() {
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return {
      day:                  d.toISOString().slice(0, 10),
      max_op_power_kw:      22 + Math.sin(i * 0.5) * 6,
      max_op_torque_nm:     165 + Math.sin(i * 0.4) * 35,
      max_motor_temp_c:     60 + Math.sin(i * 0.3) * 10,
      max_motor_speed_rpm:  1380 + Math.sin(i * 0.45) * 180,
      avg_op_power_kw:      17 + Math.sin(i * 0.5) * 4,
      total_running_hrs:    6 + Math.sin(i * 0.35) * 3,
    };
  });
}

export function makeDemoMotorDay(vehicleId, date) {
  return [{
    day:                 date,
    max_op_power_kw:     25.4,
    max_op_torque_nm:    198,
    max_motor_temp_c:    67,
    max_motor_speed_rpm: 1520,
    avg_op_power_kw:     19.2,
    total_running_hrs:   7.5,
  }];
}

// ── /api/battery/analytics/:id ───────────────────────────────────────────────
export function makeDemoBatteryAnalytics() {
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return {
      day:                   d.toISOString().slice(0, 10),
      total_kwh_consumed:    28 + Math.sin(i * 0.45) * 12,
      max_op_dc_current_a:   38 + Math.sin(i * 0.4) * 9,
      max_cell_temp_c:       37 + Math.sin(i * 0.35) * 7,
      avg_cell_temp_c:       33 + Math.sin(i * 0.3) * 4,
      min_cell_voltage_v:    3.780 + Math.sin(i * 0.2) * 0.04,
      max_cell_voltage_v:    3.900 + Math.sin(i * 0.2) * 0.025,
    };
  });
}

export function makeDemoBatteryDay(vehicleId, date) {
  return [{
    day:                  date,
    total_kwh_consumed:   38.3,
    max_op_dc_current_a:  44.2,
    max_cell_temp_c:      41.5,
    avg_cell_temp_c:      36.1,
    min_cell_voltage_v:   3.792,
    max_cell_voltage_v:   3.921,
  }];
}

// ── GPS locations (static base, Pune India) ──────────────────────────────────
export const DEMO_LOCATION = {
  "demo-9001": { lat: 18.5204, lon: 73.8567 },
  "demo-9002": { lat: 18.5304, lon: 73.8667 },
  "demo-9003": { lat: 18.5124, lon: 73.8712 },
};

// Single GPS fix — /api/vehicles/:id/location/stream payload. Only the
// online vehicle drifts in a slow circle; the others sit still.
export function makeDemoLocation(vehicleId, tick = 0) {
  const base = DEMO_LOCATION[vehicleId] ?? DEMO_LOCATION["demo-9001"];
  const moving = vehicleId === "demo-9001";
  const angle = tick * 0.15;
  return {
    vehicle_master_id: vehicleId,
    lat: moving ? base.lat + Math.sin(angle) * 0.0003 : base.lat,
    lon: moving ? base.lon + Math.cos(angle) * 0.0003 : base.lon,
    heading_deg: moving ? (((90 - (angle * 180) / Math.PI) % 360) + 360) % 360 : 45,
    speed_mps: moving ? 2.4 + Math.sin(tick * 0.3) * 0.6 : 0,
    accuracy_m: moving ? 6 : 12,
    recorded_at: new Date().toISOString(),
  };
}

// ── /api/vehicles/locations ── (FleetMap snapshot, one row per vehicle)
export function makeDemoFleetLocations(tick = 0) {
  return DEMO_VEHICLES.map((v) => {
    const live = makeLiveSnapshot(v.vehicle_master_id, tick);
    return {
      ...makeDemoLocation(v.vehicle_master_id, tick),
      vehicle_no: v.vehicle_no,
      vehicle_type: v.vehicle_type,
      customer: v.customer,
      soc_percent: live.soc_percent,
      total_hours: live.total_hours,
      last_seen: demoLastSeen(v.vehicle_master_id),
    };
  });
}

// ── /api/vehicles/:id/activity?date=YYYY-MM-DD ── (LiveCharts "Daily Activity")
// 5-minute buckets; hrs_start/hrs_end are odometer seconds, so a positive
// delta marks the bucket as "running".
export function makeDemoActivity(vehicleId, date) {
  const v = DEMO_VEHICLES.find((x) => x.vehicle_master_id === vehicleId);
  if (!v || v.status === "offline") return { buckets: [], summary: { running_hours: 0 } };

  const isV1 = vehicleId === "demo-9001";
  const dayStart = new Date(`${date}T00:00:00+05:30`).getTime();
  const end = Math.min(dayStart + 86_400_000, Date.now());
  // Shift plan (IST hours): charge overnight, run morning + afternoon shifts.
  const stateAt = (h) => {
    if (h < 6) return "Charging";
    if ((h >= 8 && h < 12.5) || (h >= 13.5 && h < (isV1 ? 18 : 16))) return "Running";
    if (h >= 6 && h < 20) return "Discharging";
    return null;
  };

  let odo = v.total_hours * 3600;
  let runningSecs = 0;
  const buckets = [];
  for (let t = dayStart; t < end; t += 5 * 60_000) {
    const h = (t - dayStart) / 3_600_000;
    const st = stateAt(h);
    if (!st) continue;
    const delta = st === "Running" ? 240 + Math.round(Math.sin(t / 1e6) * 50) : 0;
    buckets.push({
      bucket: new Date(t).toISOString(),
      row_count: 60,
      battery_status: st === "Running" ? "Discharging" : st,
      hrs_start: odo,
      hrs_end: odo + delta,
    });
    odo += delta;
    runningSecs += delta;
  }
  return { buckets, summary: { running_hours: runningSecs / 3600 } };
}
