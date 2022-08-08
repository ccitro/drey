import { HomeAssistant } from "./homeassistant";
import { registerConfigListener } from "./stores/config";

let connection: HomeAssistant;
let lastTemp: number | undefined = undefined;
const lastTempSetCalls: Record<string, [number, string]> = {};

export function getExternalTemperature(sensor: string): number | undefined {
    if (!connection) {
        return undefined;
    }
    const state: WeatherEntityState | null = connection.state(sensor);
    const temp = !state || !state.state ? NaN : parseFloat(state.state);
    const newTemp = isNaN(temp) ? undefined : temp;
    if (newTemp !== lastTemp) {
        console.log(`External temp updated`, newTemp);
        lastTemp = newTemp;
    }
    return newTemp;
}

export function fetchLastStates(systemConfig: SystemConfig): {
    thermostatState: ThermostatEntityState | null;
    sensorStates: TempSensorEntityState[] | null;
} {
    if (!connection) {
        return { thermostatState: null, sensorStates: null };
    }
    const thermostat_id = systemConfig.thermostat_entity_id;

    let thermostatState: ThermostatEntityState | null = connection.state(thermostat_id);
    if (thermostatState && thermostatState.entity_id !== thermostat_id) {
        console.error(`HA thermostat mismatch.  Expected ${thermostat_id}, got ${JSON.stringify(thermostatState)}`);
        thermostatState = null;
    }

    const sensorStates = systemConfig.temp_sensors.map((s) => {
        if (!s || !connection) {
            return null;
        }

        const state: TempSensorEntityState | null = connection.state(s);
        if (!state) {
            return null;
        }

        if (state.entity_id !== s) {
            console.error(`HA sensor mismatch.  Expected ${s}, got ${JSON.stringify(state)}`);
            return null;
        }

        return state;
    });

    const nonNullSensors = sensorStates.filter((s): s is TempSensorEntityState => s !== null);
    return { thermostatState, sensorStates: nonNullSensors.length === sensorStates.length ? nonNullSensors : null };
}

export async function setThermostatTemperature(entityId: string, temp: string): Promise<void> {
    try {
        if (process.env.NODE_ENV === "development") {
            return;
        }

        const now = new Date().getTime();
        const lastTempSetCall = lastTempSetCalls[entityId] ?? [0, "0"];
        const age = (now - lastTempSetCall[0]) / 1000;
        if (lastTempSetCall[1] === temp && age < 10) {
            return;
        }

        lastTempSetCalls[entityId] = [now, temp];

        const response = await connection.call({
            domain: "climate",
            service: "set_temperature",
            service_data: {
                entity_id: entityId,
                temperature: temp,
            },
        });
        console.log(`Temp set: ${entityId}=${temp}`, response?.success);
    } catch (err) {
        console.error("Failed to set temp", err);
    }
}

export async function startSensors(): Promise<void> {
    let hostUsed: string | null = null;
    let tokenUsed: string | null = null;

    registerConfigListener(async (c) => {
        if (c.ha_host !== hostUsed || c.ha_key !== tokenUsed) {
            hostUsed = c.ha_host;
            tokenUsed = c.ha_key;
            if (connection) {
                console.log("Destroying existing home assistant connection...");
                connection.destroy();
            }

            if (c.ha_host !== "" && c.ha_key !== "") {
                console.log("Connecting to home assistant at " + c.ha_host);
                connection = new HomeAssistant({ host: c.ha_host, token: c.ha_key });
                connection.on((e) => console.log("Home Assistant Event", e));
                await connection.connect();
            }
        }
    });
}