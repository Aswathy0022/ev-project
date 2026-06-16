const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "Request failed");
  }
  return res.json() as Promise<T>;
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export interface User { id: number; name: string; email: string; mode: string; is_admin: boolean }
export interface TokenResponse { access_token: string; token_type: string; user: User }

export const auth = {
  signup: (name: string, email: string, password: string) =>
    apiFetch<TokenResponse>("/auth/signup", { method: "POST", body: JSON.stringify({ name, email, password }) }),
  login: (email: string, password: string) =>
    apiFetch<TokenResponse>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  logout: () => apiFetch<{ message: string }>("/auth/logout", { method: "POST" }),
  me: () => apiFetch<User>("/auth/me"),
};

// ── Predictions ───────────────────────────────────────────────────────────────

export interface RangeRequest {
  battery_level: number; temperature: number; weather: string; battery_health: number;
  speed_kmph?: number; vehicle_base_range_km?: number; ride_mode?: string;
  terrain?: string; traffic?: string; rider_weight_kg?: number;
  passenger_count?: number; luggage_kg?: number;
}
export interface RangeResult {
  predicted_range_km: number; full_charge_range_km: number;
  performance_score: number; efficiency_factor: number;
}

export interface ChargeTimeRequest {
  battery_level: number; charging_rate_kw: number; charging_load_kw: number;
  battery_health: number; target_level?: number; charge_bias?: number;
}

export const predict = {
  range: (body: RangeRequest) =>
    apiFetch<RangeResult>("/predict/range", { method: "POST", body: JSON.stringify(body) }),
  chargeTime: (body: ChargeTimeRequest) =>
    apiFetch<{ charge_minutes: number }>("/predict/charge-time", { method: "POST", body: JSON.stringify(body) }),
  waitTime: (crowd: number, slots: number, hour: number) =>
    apiFetch<{ wait_minutes: number }>("/predict/wait-time", { method: "POST", body: JSON.stringify({ crowd, slots, hour }) }),
  readiness: (predicted_range_km: number, trip_distance_km?: number) =>
    apiFetch<{ decision: string; detail: string }>("/predict/travel-readiness", {
      method: "POST", body: JSON.stringify({ predicted_range_km, trip_distance_km }),
    }),
};

// ── Stations ──────────────────────────────────────────────────────────────────

export interface Station {
  station_name: string; city: string; latitude: number; longitude: number;
  distance_km: number; free_slots: number; total_slots: number; wait_minutes: number;
  rate_kw: number; load_kw: number; status: string; score: number;
}

export const stations = {
  rank: (user_lat: number, user_lon: number, opts?: {
    max_distance_km?: number; min_rate_kw?: number; sort_by?: string;
  }) => apiFetch<Station[]>("/stations/rank", {
    method: "POST",
    body: JSON.stringify({ user_lat, user_lon, ...opts }),
  }),
};

// ── Trips ─────────────────────────────────────────────────────────────────────

export interface TripResult {
  trip_distance_km: number; needed_range_km: number; remaining_range_km: number;
  decision: string; detail: string;
  backup_station?: { name: string; distance_km: number; wait_minutes: number; rate_kw: number; free_slots: number };
}

export const trips = {
  evaluate: (body: {
    current_lat: number; current_lon: number; destination_lat: number; destination_lon: number;
    predicted_range_km: number; required_arrival_range_km?: number; safety_buffer_percent?: number;
  }) => apiFetch<TripResult>("/trips/evaluate", { method: "POST", body: JSON.stringify(body) }),
};

// ── History ───────────────────────────────────────────────────────────────────

export interface HistoryEntry {
  id: number; session_time: string; station_name: string; battery_percent: number;
  battery_health: number; charge_minutes: number; wait_minutes: number;
  energy_drawn_kwh: number; weather: string;
}
export interface HistorySummary { sessions: number; energy_kwh: number; avg_wait: number; favorite_station: string }

export const history = {
  list: (limit = 20) => apiFetch<HistoryEntry[]>(`/history?limit=${limit}`),
  summary: () => apiFetch<HistorySummary>("/history/summary"),
};

// ── Vehicles ──────────────────────────────────────────────────────────────────

export interface Vehicle { name: string; base_range_km: number; fast_charge_bias: number; full_charge_bias: number }

export const vehicles = {
  list: () => apiFetch<Vehicle[]>("/vehicles"),
};

// ── Geocode ───────────────────────────────────────────────────────────────────

export interface GeocodeResult { lat: number | null; lon: number | null; label: string | null; status: string; message: string }

export const geocode = {
  search: (place: string) => apiFetch<GeocodeResult>(`/geocode?place=${encodeURIComponent(place)}`),
  cities: () => apiFetch<string[]>("/geocode/cities"),
};

// ── Admin ─────────────────────────────────────────────────────────────────────

export interface StationAdmin {
  id: number; station_name: string; city: string; latitude: number; longitude: number;
  free_slots: number; total_slots: number; wait_minutes: number; rate_kw: number;
  load_kw: number; status: string;
}

export interface StationIn {
  station_name: string; city: string; latitude: number; longitude: number;
  free_slots: number; total_slots: number; wait_minutes: number; rate_kw: number;
  load_kw: number; status: string;
}

export const adminApi = {
  listStations: () => apiFetch<StationAdmin[]>("/admin/stations"),
  createStation: (body: StationIn) =>
    apiFetch<StationAdmin>("/admin/stations", { method: "POST", body: JSON.stringify(body) }),
  updateStation: (id: number, body: StationIn) =>
    apiFetch<StationAdmin>(`/admin/stations/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteStation: (id: number) =>
    apiFetch<void>(`/admin/stations/${id}`, { method: "DELETE" }),
};
