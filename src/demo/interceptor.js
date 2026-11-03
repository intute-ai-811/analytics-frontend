// src/demo/interceptor.js
// Intercepts all API calls when a demo user is logged in so no real
// backend requests are made. Three mechanisms are used:
//   1. Axios request interceptor (adapter override) for axios calls
//   2. window.fetch override for native fetch calls
//   3. window.EventSource override for SSE streams — the dashboards, Fleet
//      Map and Live Tracking all open their streams through
//      lib/useEventSourceWithBackoff (`new EventSource(url)`), so swapping
//      the global constructor feeds them simulated ticks with no
//      per-component demo branch. (LiveView/LiveCharts additionally keep
//      their own isDemoMode() interval branches; this shim also covers
//      them if they open a stream.)

import axios from "axios";
import {
  DEMO_USER,
  DEMO_VEHICLES,
  DEMO_BATCH_ANALYTICS,
  makeDemoAdminSummary,
  makeDemoMyVehicles,
  makeDemoSummaryUpdate,
  makeDemoVehicleInfo,
  makeDemoFleetLocations,
  makeDemoLocation,
  makeDemoActivity,
  makeLiveSnapshot,
  makeDemoTimeseries,
  makeDemoMotorAnalytics,
  makeDemoMotorDay,
  makeDemoBatteryAnalytics,
  makeDemoBatteryDay,
} from "./demoData";

function matchUrl(url) {
  if (!url) return null;

  // ── Auth (cookie session in the real app) ──
  if (/\/api\/auth\/me/.test(url)) return { user: DEMO_USER };
  if (/\/api\/auth\/(refresh|logout)/.test(url)) return {};

  if (/\/api\/vehicle-master\/admin-summary/.test(url)) {
    return makeDemoAdminSummary();
  }
  if (/\/api\/vehicle-master\/my/.test(url)) return makeDemoMyVehicles();

  // Must come before the generic /api/vehicles/:id patterns
  if (/\/api\/vehicles\/analytics\/batch/.test(url)) {
    return DEMO_BATCH_ANALYTICS;
  }
  if (/\/api\/vehicles\/locations/.test(url)) return makeDemoFleetLocations(0);

  const liveMatch = url.match(/\/api\/vehicles\/([^/?]+)\/live/);
  if (liveMatch) return makeLiveSnapshot(liveMatch[1], 0);

  const tsMatch = url.match(/\/api\/vehicles\/([^/?]+)\/timeseries/);
  if (tsMatch) return makeDemoTimeseries(tsMatch[1]);

  const actMatch = url.match(/\/api\/vehicles\/([^/?]+)\/activity(.*)/);
  if (actMatch) {
    const params = new URLSearchParams(actMatch[2].replace(/^\?/, ""));
    const date = params.get("date") || new Date().toISOString().slice(0, 10);
    return makeDemoActivity(actMatch[1], date);
  }

  const infoMatch = url.match(/\/api\/vehicles\/([^/?]+)\/?(\?|$)/);
  if (infoMatch) return makeDemoVehicleInfo(infoMatch[1]) ?? {};

  const motorMatch = url.match(/\/api\/motor\/analytics\/([^/?]+)(.*)/);
  if (motorMatch) {
    const params = new URLSearchParams(motorMatch[2].replace(/^\?/, ""));
    const date = params.get("date");
    return date
      ? makeDemoMotorDay(motorMatch[1], date)
      : makeDemoMotorAnalytics(motorMatch[1]);
  }

  const battMatch = url.match(/\/api\/battery\/analytics\/([^/?]+)(.*)/);
  if (battMatch) {
    const params = new URLSearchParams(battMatch[2].replace(/^\?/, ""));
    const date = params.get("date");
    return date
      ? makeDemoBatteryDay(battMatch[1], date)
      : makeDemoBatteryAnalytics(battMatch[1]);
  }

  // Specific tabs that need structured empty responses
  if (/\/api\/faults\//.test(url)) return [];
  if (/\/api\/database-logs\//.test(url)) return [];

  // Catch-all: any remaining /api/ call returns [] so nothing reaches the backend
  // This is safe because the interceptor only installs when the demo user is logged in.
  if (/\/api\//.test(url)) return [];

  return null;
}

/* =========================
   SSE STREAMS
   Returns a function(tick) => array of payloads to emit on that tick, or
   null for an unknown stream (which then opens but stays silent).
========================= */
const ONLINE_IDS = DEMO_VEHICLES.filter((v) => v.status !== "offline").map(
  (v) => v.vehicle_master_id
);

function matchStream(url) {
  if (!url) return null;

  if (/\/api\/vehicle-master\/(admin-summary|my)\/stream/.test(url)) {
    return (tick) =>
      DEMO_VEHICLES.map((v) => makeDemoSummaryUpdate(v.vehicle_master_id, tick));
  }

  if (/\/api\/vehicles\/locations\/stream/.test(url)) {
    return (tick) =>
      makeDemoFleetLocations(tick).filter((v) => ONLINE_IDS.includes(v.vehicle_master_id));
  }

  const locMatch = url.match(/\/api\/vehicles\/([^/?]+)\/location\/stream/);
  if (locMatch) return (tick) => [makeDemoLocation(locMatch[1], tick)];

  const liveMatch = url.match(/\/api\/vehicles\/([^/?]+)\/stream/);
  if (liveMatch) return (tick) => [makeLiveSnapshot(liveMatch[1], tick)];

  return null;
}

const DEMO_SSE_INTERVAL_MS = 3_000;

class DemoEventSource {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSED = 2;

  constructor(url, init) {
    this.url = String(url);
    this.withCredentials = Boolean(init?.withCredentials);
    this.readyState = DemoEventSource.CONNECTING;
    this.onopen = null;
    this.onmessage = null;
    this.onerror = null;
    this._listeners = {};
    this._tick = 0;

    const producer = matchStream(this.url);

    this._openTimer = setTimeout(() => {
      if (this.readyState === DemoEventSource.CLOSED) return;
      this.readyState = DemoEventSource.OPEN;
      this._dispatch("open", new Event("open"));
      if (!producer) return;
      const emit = () => {
        if (this.readyState !== DemoEventSource.OPEN) return;
        (producer(this._tick++) || []).forEach((payload) => {
          if (payload == null) return;
          this._dispatch(
            "message",
            new MessageEvent("message", { data: JSON.stringify(payload) })
          );
        });
      };
      emit();
      this._interval = setInterval(emit, DEMO_SSE_INTERVAL_MS);
    }, 50);
  }

  _dispatch(type, event) {
    const handler = this[`on${type}`];
    if (typeof handler === "function") handler.call(this, event);
    (this._listeners[type] || []).forEach((fn) => fn.call(this, event));
  }

  addEventListener(type, fn) {
    (this._listeners[type] ||= []).push(fn);
  }

  removeEventListener(type, fn) {
    this._listeners[type] = (this._listeners[type] || []).filter((f) => f !== fn);
  }

  close() {
    this.readyState = DemoEventSource.CLOSED;
    clearTimeout(this._openTimer);
    clearInterval(this._interval);
  }
}

function fakeAxiosResponse(data, config) {
  return { data, status: 200, statusText: "OK", headers: {}, config, request: {} };
}

function fakeFetchResponse(data) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

let installed = false;
let _axiosInterceptorId = null;
const _originalFetch = window.fetch.bind(window);
const _OriginalEventSource = window.EventSource;

export function isDemoInterceptorInstalled() {
  return installed;
}

export function installDemoInterceptor() {
  if (installed) return;
  installed = true;

  // 1. Axios adapter override
  _axiosInterceptorId = axios.interceptors.request.use((config) => {
    const mock = matchUrl(config.url);
    if (mock !== null) {
      config.adapter = (cfg) => Promise.resolve(fakeAxiosResponse(mock, cfg));
    }
    return config;
  });

  // 2. Native fetch override
  window.fetch = function demofetch(input, init) {
    const url = typeof input === "string" ? input : input?.url ?? "";
    const mock = matchUrl(url);
    if (mock !== null) return Promise.resolve(fakeFetchResponse(mock));
    return _originalFetch(input, init);
  };

  // 3. EventSource (SSE) override
  window.EventSource = DemoEventSource;
}

export function uninstallDemoInterceptor() {
  if (!installed) return;
  installed = false;

  if (_axiosInterceptorId !== null) {
    axios.interceptors.request.eject(_axiosInterceptorId);
    _axiosInterceptorId = null;
  }

  window.fetch = _originalFetch;
  if (_OriginalEventSource) window.EventSource = _OriginalEventSource;
}
