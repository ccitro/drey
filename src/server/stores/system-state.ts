import { diff } from "deep-object-diff";

const globalStorage = globalThis as unknown as DreyGlobal;
if (!globalStorage.systemStates) globalStorage.systemStates = {};
if (!globalStorage.stateListeners) globalStorage.stateListeners = [];

export function getSystemStates(): SystemStates {
    return JSON.parse(JSON.stringify(globalStorage.systemStates));
}

export const registerSystemStateListener = (l: ServerStateListener) => globalStorage.stateListeners.push(l);
export const unregisterSystemStateListener = (l: ServerStateListener) =>
    (globalStorage.stateListeners = globalStorage.stateListeners.filter((existing) => existing !== l));

function withoutLastChanged(c: SystemState): SystemState {
    return { ...c, thermostatStatus: { ...c.thermostatStatus, lastChanged: "" } };
}

export function cleanupSystemStates(systems: string[]): void {
    const toDelete: string[] = [];
    for (const k in globalStorage.systemStates) {
        if (!systems.includes(k)) {
            toDelete.push(k);
        }
    }

    for (const k of toDelete) {
        delete globalStorage.systemStates[k];
    }
}

export function updateSystemState(
    thermostat: string,
    newThermostatStatus: ThermostatStatus,
    newSensorStatuses: SensorStatus[]
): boolean {
    const existingSystemState = globalStorage.systemStates[thermostat];
    const newSystemState: SystemState = {
        sensorStatuses: newSensorStatuses,
        thermostatStatus: newThermostatStatus,
    };
    globalStorage.systemStates[thermostat] = newSystemState;

    let changes: object | null = null;
    if (!existingSystemState) {
        changes = newSystemState;
    } else {
        const d = diff(withoutLastChanged(existingSystemState), withoutLastChanged(newSystemState));
        if (Object.keys(d).length > 0) {
            changes = d;
        }
    }

    if (changes !== null) {
        console.log("System state updated", changes);
        const n = getSystemStates();
        globalStorage.stateListeners.forEach((l) => l(n));
    }

    return changes !== null;
}
