import { createSelector, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { HYDRATE } from "next-redux-wrapper";

import { selectiveUpdate } from "./selectiveUpdate";
import { AppState } from "./store";

interface SystemSliceState {
    thermostats: Record<string, ThermostatStatus>;
    thermostatSensors: Record<string, string[]>;
    sensors: Record<string, SensorStatus>;
}

const systemStatesInitialState: SystemSliceState = { thermostats: {}, thermostatSensors: {}, sensors: {} };

export const systemStatesSlice = createSlice({
    name: "systemStates",
    initialState: systemStatesInitialState,
    extraReducers: { [HYDRATE]: (state, action) => ({ ...state, ...action.payload.systemStates }) },
    reducers: {
        importStates: (state, { payload }: PayloadAction<SystemStates>) => {
            const newThermostats = Object.keys(payload).reduce((p, c) => {
                p[c] = payload[c].thermostatStatus;
                return p;
            }, {} as Record<string, ThermostatStatus>);
            selectiveUpdate(state.thermostats, newThermostats);

            const newThemorstatSensors = Object.entries(payload).reduce((p, c) => {
                p[c[0]] = c[1].sensorStatuses.map((s) => s.id);
                return p;
            }, {} as Record<string, string[]>);
            selectiveUpdate(state.thermostatSensors, newThemorstatSensors);

            const newSensors = Object.values(payload)
                .flatMap((s) => s.sensorStatuses)
                .reduce((p, c) => {
                    p[c.id] = c;
                    return p;
                }, {} as Record<string, SensorStatus>);
            selectiveUpdate(state.sensors, newSensors);
        },
    },
});

export const { importStates } = systemStatesSlice.actions;

const selectThermostatsSensors = (state: AppState) => state.systemStates.thermostatSensors;
const selectThermostats = (state: AppState) => state.systemStates.thermostats;
const selectSensors = (state: AppState) => state.systemStates.sensors;

export const selectThermostat = createSelector(
    [selectThermostats, (_, thermostat: string) => thermostat],
    (thermostats, thermostat) => thermostats[thermostat]
);

export const selectSensor = createSelector(
    [selectSensors, (_, sensor: string) => sensor],
    (sensors, sensor) => sensors[sensor]
);

export const selectThermostatSensorIds = createSelector(
    [selectThermostatsSensors, (_, thermostat: string) => thermostat],
    (thermostatsSensors, thermostat) => thermostatsSensors[thermostat]
);

export const selectThermostatSensors = createSelector(
    [selectSensors, selectThermostatSensorIds],
    (allSensors, sensorIds) => sensorIds.map((id) => allSensors[id])
);

export const selectThermostatActiveSensor = createSelector([selectThermostat], (t) => t.activeSensor);
export const selectThermostatMainSensor = createSelector([selectThermostat], (t) => t.thermostatSensor);
