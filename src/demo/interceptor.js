// src/demo/interceptor.js
// Intercepts all API calls when a demo user is logged in so no real
// backend requests are made. Two mechanisms are used:
//   1. Axios request interceptor (adapter override) for axios calls
//   2. window.fetch override for native fetch calls
// EventSource (SSE) is handled separately inside each component.

import axios from "axios";
import {
  DEMO_VEHICLES,
  DEMO_BATCH_ANALYTICS,
  makeLiveSnapshot,
  makeDemoTimeseries,
  makeDemoMotorAnalytics,
  makeDemoMotorDay,
  makeDemoBatteryAnalytics,
  makeDemoBatteryDay,
} from "./demoData";

function matchUrl(url) {
  if (!url) return null;

  if (/\/api\/vehicle-master\/admin-summary/.test(url)) {
    return DEMO_VEHICLES;
  }

  // Must come before the generic /api/vehicles/:id pattern
  if (/\/api\/vehicles\/analytics\/batch/.test(url)) {
    return DEMO_BATCH_ANALYTICS;
  }

  const liveMatch = url.match(/\/api\/vehicles\/([^/?]+)\/live/);
  if (liveMatch) return makeLiveSnapshot(liveMatch[1], 0);

  const tsMatch = url.match(/\/api\/vehicles\/([^/?]+)\/timeseries/);
  if (tsMatch) return makeDemoTimeseries(tsMatch[1]);

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

function fakeAxiosResponse(data) {
  return { data, status: 200, statusText: "OK", headers: {}, config: {} };
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

export function installDemoInterceptor() {
  if (installed) return;
  installed = true;

  // 1. Axios adapter override
  _axiosInterceptorId = axios.interceptors.request.use((config) => {
    const mock = matchUrl(config.url);
    if (mock !== null) {
      config.adapter = () => Promise.resolve(fakeAxiosResponse(mock));
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
}

export function uninstallDemoInterceptor() {
  if (!installed) return;
  installed = false;

  if (_axiosInterceptorId !== null) {
    axios.interceptors.request.eject(_axiosInterceptorId);
    _axiosInterceptorId = null;
  }

  window.fetch = _originalFetch;
}
