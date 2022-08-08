import { processSystem } from "./planner";
import { fetchLastStates, getExternalTemperature, setThermostatTemperature } from "./sensors";
import { getConfig } from "./stores/config";
import { getOverrides } from "./stores/overrides";
import { cleanupSystemStates, updateSystemState } from "./stores/system-state";
import { sleep, temperatureValue } from "./utils";

async function handleSystem(systemConfig: SystemConfig, externalSensor: string, tz: string): Promise<void> {
    const thermostat = systemConfig.thermostat_entity_id;
    const { thermostatState, sensorStates } = fetchLastStates(systemConfig);

    if (!thermostatState || !sensorStates) {
        console.log(`Missing state(s) for thermostat ${thermostat}`, thermostatState, sensorStates);
        return;
    }

    const result = await processSystem(
        systemConfig.thermostat_sensor,
        thermostatState,
        sensorStates,
        systemConfig.heating_schedule,
        systemConfig.cooling_schedule,
        await getOverrides(thermostat),
        getExternalTemperature(externalSensor) ?? 70,
        tz
    );

    updateSystemState(thermostat, result.newThermostatStatus, result.newSensorStatuses);
    if (result.newThermostatStatus.targetTempType !== "off") {
        const startingTargetTemp = temperatureValue(thermostatState.attributes.temperature).toFixed(0);
        if (result.newTargetTemperature !== startingTargetTemp) {
            void setThermostatTemperature(thermostat, result.newTargetTemperature);
        }
    }
}

export async function startEventLoop(): Promise<void> {
    while (true) {
        try {
            const config = getConfig();
            cleanupSystemStates(config.configs.map((c) => c.thermostat_entity_id));
            for (const systemConfig of config.configs) {
                await handleSystem(systemConfig, config.external_sensor, config.tz);
            }
        } catch (err) {
            console.error("Error in event loop loop", err);
        }

        await sleep(1000);
    }
}
