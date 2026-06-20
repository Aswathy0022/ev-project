// Derives indicative pack telemetry from real inputs (SoC, health, ambient temp)
// using a standard Li-ion SoC->cell-voltage curve. Not sensor data — there is no
// BMS to read from — but every figure is computed from live state, never a fixed
// stub. Surfaced in the UI as "estimated".

const CELL_NOMINAL_V = 3.7;
const CELL_EMPTY_V = 3.0;
const CELL_FULL_V = 4.2;

export interface BatteryTelemetry {
  cellVoltageV: number;
  cellCount: number;
  packVoltageV: number;
  currentA: number;
  powerW: number;
  batteryTempC: number;
}

export function deriveBatteryTelemetry(
  batteryLevel: number,
  batteryHealth: number,
  ambientTempC: number,
  nominalVoltageV: number,
): BatteryTelemetry {
  const soc = Math.min(Math.max(batteryLevel, 0), 100) / 100;
  const health = Math.min(Math.max(batteryHealth, 0), 100) / 100;

  const cellCount = Math.round(nominalVoltageV / CELL_NOMINAL_V);
  const cellVoltageV = CELL_EMPTY_V + soc * (CELL_FULL_V - CELL_EMPTY_V) * (0.85 + 0.15 * health);
  const packVoltageV = cellVoltageV * cellCount;

  // Degraded cells run hotter under the same load due to higher internal resistance.
  const batteryTempC = ambientTempC + (1 - health) * 8;

  // At rest (not actively charging/riding): small parasitic draw, larger when health is poor.
  const currentA = -(1.2 + (1 - health) * 3);
  const powerW = packVoltageV * currentA;

  return {
    cellVoltageV: Math.round(cellVoltageV * 100) / 100,
    cellCount,
    packVoltageV: Math.round(packVoltageV * 10) / 10,
    currentA: Math.round(currentA * 10) / 10,
    powerW: Math.round(powerW),
    batteryTempC: Math.round(batteryTempC * 10) / 10,
  };
}
