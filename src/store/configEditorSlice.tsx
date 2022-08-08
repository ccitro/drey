import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { HYDRATE } from "next-redux-wrapper";

import { AppState } from "./store";

const configEditorInitialState: { dreyConfig: DreyConfig } = {
    dreyConfig: {
        version: 1,
        ha_host: "",
        ha_key: "",
        external_sensor: "",
        tz: "UTC",
        configs: [],
    },
};

const modeRuleSorter = (
    state: typeof configEditorInitialState,
    payload: { systemSeq: number; sensorSeq: number; type: OperationMode }
) => {
    const key = payload.type === "cool" ? "cooling_schedule" : "heating_schedule";
    const systemSeq = payload.systemSeq;
    const sensorSeq = payload.sensorSeq;
    const rules = state.dreyConfig.configs[systemSeq][key][sensorSeq].rules;
    state.dreyConfig.configs[systemSeq][key][sensorSeq].rules = rules.slice().sort((a, b) => {
        if (a.day < b.day) {
            return -1;
        } else if (a.day > b.day) {
            return 1;
        } else {
            return a.time - b.time;
        }
    });
};

export const configEditorSlice = createSlice({
    name: "configEditor",
    initialState: configEditorInitialState,
    reducers: {
        importEditorConfig: (state, { payload }: PayloadAction<DreyConfig>) => {
            state.dreyConfig = payload;
        },
        setTopLevelString: (state, { payload }: PayloadAction<{ key: keyof DreyConfig; value: string }>) => {
            state.dreyConfig = { ...state.dreyConfig, [payload.key]: payload.value };
        },
        insertSystem: (state) => {
            state.dreyConfig.configs.push({
                thermostat_sensor: "",
                temp_sensors: [],
                cooling_schedule: [],
                heating_schedule: [],
                thermostat_entity_id: "",
            });
        },
        deleteSystem: (state, { payload }: PayloadAction<{ systemSeq: number }>) => {
            state.dreyConfig.configs = state.dreyConfig.configs.filter((_, seq) => seq !== payload.systemSeq);
        },
        setThermostatEntityId: (state, { payload }: PayloadAction<{ systemSeq: number; value: string }>) => {
            state.dreyConfig.configs[payload.systemSeq].thermostat_entity_id = payload.value;
        },
        setThermostatSensor: (state, { payload }: PayloadAction<{ systemSeq: number; value: string }>) => {
            state.dreyConfig.configs[payload.systemSeq].thermostat_sensor = payload.value;
        },
        setSensorId: (state, { payload }: PayloadAction<{ systemSeq: number; sensorSeq: number; id: string }>) => {
            const oldId = state.dreyConfig.configs[payload.systemSeq].temp_sensors[payload.sensorSeq];
            state.dreyConfig.configs[payload.systemSeq].temp_sensors[payload.sensorSeq] = payload.id;
            const sch = state.dreyConfig.configs[payload.systemSeq].cooling_schedule;
            state.dreyConfig.configs[payload.systemSeq].cooling_schedule = sch.map((s: Schedule) => {
                return s.sensor !== oldId ? s : { ...s, sensor: payload.id };
            });
        },
        deleteSensor: (state, { payload }: PayloadAction<{ systemSeq: number; sensorSeq: number }>) => {
            const sensors = state.dreyConfig.configs[payload.systemSeq].temp_sensors;
            const sensor = sensors[payload.sensorSeq];
            const cooling = state.dreyConfig.configs[payload.systemSeq].cooling_schedule;
            const heating = state.dreyConfig.configs[payload.systemSeq].heating_schedule;
            state.dreyConfig.configs[payload.systemSeq].temp_sensors = sensors.filter(
                (_, i) => i !== payload.sensorSeq
            );
            state.dreyConfig.configs[payload.systemSeq].cooling_schedule = cooling.filter((s) => s.sensor !== sensor);
            state.dreyConfig.configs[payload.systemSeq].heating_schedule = heating.filter((s) => s.sensor !== sensor);
        },
        insertSensor: (state, { payload }: PayloadAction<{ systemSeq: number }>) => {
            let seq = state.dreyConfig.configs[payload.systemSeq].temp_sensors.length + 1;
            let id = `sensor.temp_sensor_${seq}`;
            while (state.dreyConfig.configs[payload.systemSeq].temp_sensors.includes(id)) {
                seq++;
                id = `sensor.temp_sensor_${seq}`;
            }

            state.dreyConfig.configs[payload.systemSeq].temp_sensors.push(id);
            state.dreyConfig.configs[payload.systemSeq].cooling_schedule.push({ rules: [], sensor: id });
            state.dreyConfig.configs[payload.systemSeq].heating_schedule.push({ rules: [], sensor: id });
        },
        insertRule: (
            state,
            { payload }: PayloadAction<{ systemSeq: number; sensorSeq: number; daySeq: number; type: OperationMode }>
        ) => {
            const s = payload.type === "cool" ? "cooling_schedule" : "heating_schedule";
            const sensor = state.dreyConfig.configs[payload.systemSeq].temp_sensors[payload.sensorSeq];
            const scheduleSeq = state.dreyConfig.configs[payload.systemSeq][s].findIndex((s) => s.sensor === sensor);

            state.dreyConfig.configs[payload.systemSeq][s][scheduleSeq].rules.push({
                temp: 72,
                time: 0,
                day: payload.daySeq,
                label: "New Rule",
            });
            modeRuleSorter(state, payload);
        },
        deleteRule: (
            state,
            { payload }: PayloadAction<{ systemSeq: number; sensorSeq: number; ruleSeq: number; type: OperationMode }>
        ) => {
            const s = payload.type === "cool" ? "cooling_schedule" : "heating_schedule";
            const sensor = state.dreyConfig.configs[payload.systemSeq].temp_sensors[payload.sensorSeq];
            const scheduleSeq = state.dreyConfig.configs[payload.systemSeq][s].findIndex((s) => s.sensor === sensor);
            const rules = state.dreyConfig.configs[payload.systemSeq][s][scheduleSeq].rules;

            state.dreyConfig.configs[payload.systemSeq][s][scheduleSeq].rules = rules.filter(
                (_, seq) => seq !== payload.ruleSeq
            );
        },
        updateRuleField: (
            state,
            {
                payload,
            }: PayloadAction<{
                systemSeq: number;
                sensorSeq: number;
                ruleSeq: number;
                type: OperationMode;
                key: keyof ScheduleRule;
                value: string;
            }>
        ) => {
            const s = payload.type === "cool" ? "cooling_schedule" : "heating_schedule";
            const sensor = state.dreyConfig.configs[payload.systemSeq].temp_sensors[payload.sensorSeq];
            const scheduleSeq = state.dreyConfig.configs[payload.systemSeq][s].findIndex((s) => s.sensor === sensor);
            const rule = state.dreyConfig.configs[payload.systemSeq][s][scheduleSeq].rules[payload.ruleSeq];
            const value = payload.key === "label" ? payload.value : parseInt(payload.value);

            state.dreyConfig.configs[payload.systemSeq][s][scheduleSeq].rules[payload.ruleSeq] = {
                ...rule,
                [payload.key]: value,
            };
        },
        setSystemConfig: (state, { payload }: PayloadAction<{ seq: number; newSc: SystemConfig }>) => {
            state.dreyConfig = {
                ...state.dreyConfig,
                configs: state.dreyConfig.configs.map((oldSc, i) => (i === payload.seq ? payload.newSc : oldSc)),
            };
        },
        sortModeRules: (
            state,
            { payload }: PayloadAction<{ systemSeq: number; sensorSeq: number; type: OperationMode }>
        ) => {
            modeRuleSorter(state, payload);
        },
    },

    extraReducers: {
        [HYDRATE]: (state, action) => {
            return {
                ...state,
                ...action.payload.configEditor,
            };
        },
    },
});

export const {
    importEditorConfig,
    setSystemConfig,
    setTopLevelString,
    insertSystem,
    deleteSystem,
    setThermostatEntityId,
    setThermostatSensor,
    setSensorId,
    updateRuleField,
    deleteRule,
    insertRule,
    insertSensor,
    deleteSensor,
    sortModeRules,
} = configEditorSlice.actions;

export const selectEditorSystem = (state: AppState, seq: number) => state.configEditor.dreyConfig.configs[seq];
export const selectEditorSystemSensor = (state: AppState, systemSeq: number, sensorSeq: number) =>
    state.configEditor.dreyConfig.configs[systemSeq].temp_sensors[sensorSeq];

export const selectEditorSystemSensorRules = (
    state: AppState,
    systemSeq: number,
    sensorSeq: number,
    type: OperationMode
) => {
    const key = type === "cool" ? "cooling_schedule" : "heating_schedule";
    const sensor = selectEditorSystemSensor(state, systemSeq, sensorSeq);
    return state.configEditor.dreyConfig.configs[systemSeq][key].find((s) => s.sensor === sensor)?.rules ?? [];
};
