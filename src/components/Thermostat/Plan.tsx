import { useAppSelector } from "store/store";
import { selectThermostat, selectThermostatSensors } from "store/systemStatesSlice";

function buildOperationPlan(sensorSituations: SensorStatus[], thermostatStatus: ThermostatStatus): string {
    const defaultSensor = sensorSituations.length > 0 ? sensorSituations[0] : undefined;
    const activeSensor = sensorSituations.find((r) => r.id === thermostatStatus.activeSensor) ?? defaultSensor;
    if (!activeSensor) {
        return "Idle";
    }

    if (activeSensor.ruleType === "protection") {
        return `Disabling cooling to protect the system due to the external temperature`;
    }

    if (activeSensor.ruleType === "off") {
        return `The HVAC system is turned off.  Drey is disabled.  Switch the system to 'heat' or 'cool' to reenable.`;
    }

    let why = "";
    if (activeSensor.ruleType === "future") {
        why = `before the next rule starts`;
    } else if (activeSensor.ruleType === "schedule") {
        why = `for the '${activeSensor.ruleLabel}' rule`;
    } else {
        why = `due to an override`;
    }

    const verb = activeSensor.actionNeeded === "none" ? "maintain" : "reach";
    return `
        Setting thermostat to ${thermostatStatus.targetTemp} 
        so ${activeSensor.label} 
        can ${verb} ${activeSensor.ruleTemp}
        ${why}
    `;
}

export default function Plan({ thermostat }: { thermostat: string }) {
    const thermostatStatus = useAppSelector((state) => selectThermostat(state, thermostat));
    const sensorStatuses = useAppSelector((state) => selectThermostatSensors(state, thermostat));
    const operationPlan = buildOperationPlan(sensorStatuses, thermostatStatus);

    return (
        <div className="p-2">
            <div className="font-bold">What is it doing?</div>
            <div className="text-sm">{operationPlan}</div>
        </div>
    );
}
