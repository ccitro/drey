import { useCallback, useState } from "react";
import { deleteOverride, setOverride } from "services/api";
import { useAppSelector } from "store/store";
import { selectSensor, selectThermostatActiveSensor, selectThermostatMainSensor } from "store/systemStatesSlice";

import OverrideEditor, { ModalOverrideResult } from "./OverrideEditor";
import { SensorIcons } from "./SensorIcons";
import { TempBlock } from "./TempBlock";

type SensorProps = {
    thermostat: string;
    sensor: string;
};

function capitalize(string: string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function localTime(isoTime: string): string {
    return new Date(isoTime).toLocaleString().split(", ")[1].replace(":00 ", " ");
}

function getLabel(sensor: SensorStatus): string {
    if (sensor.ruleType === "override" && sensor.ruleLabel === "Preconditioning") {
        return "Future";
    }

    return capitalize(sensor.ruleType);
}

function getReason(sensor: SensorStatus): string {
    const endType = sensor.ruleType === "future" ? "reach by" : "maintain until";
    let reason = `${endType} ${localTime(sensor.ruleEndsAt)} per rule '${sensor.ruleLabel}'`;
    if (sensor.ruleType === "off") {
        reason = "The system is off";
    } else if (sensor.ruleType === "disconnected") {
        reason = "This device is missing or disconnected";
    }
    return reason;
}

export default function Sensor({ thermostat, sensor }: SensorProps) {
    const [overrideOpen, setOverrideOpen] = useState(false);
    const activeSensor = useAppSelector((state) => selectThermostatActiveSensor(state, thermostat));
    const thermostatSensor = useAppSelector((state) => selectThermostatMainSensor(state, thermostat));
    const sensorStatus = useAppSelector((state) => selectSensor(state, sensor));

    const onOverrideResult = useCallback(
        async (result: ModalOverrideResult) => {
            if (result.actionChosen === "delete") {
                await deleteOverride(thermostat, sensor);
            } else if (result.actionChosen === "set" && result.newOverrideTemp !== undefined) {
                await setOverride(thermostat, sensor, result.newOverrideTemp);
            }

            setOverrideOpen(false);
        },
        [thermostat, sensor]
    );

    if (!sensorStatus) {
        return null;
    }

    const onOverrideClick = () => {
        if (sensorStatus.ruleType !== "protection") {
            setOverrideOpen(true);
        }
    };

    const isActiveSensor = activeSensor === sensorStatus.id;
    const isThermostatSensor = thermostatSensor === sensorStatus.id;
    const ruleTemp = ["disconnected", "off"].includes(sensorStatus.ruleType) ? "-" : sensorStatus.ruleTemp.toFixed(1);

    let backgroundColor = "transparent";
    if (sensorStatus.actionNeeded === "cool") {
        backgroundColor = "#3700b3";
    } else if (sensorStatus.actionNeeded === "heat") {
        backgroundColor = "#e53935";
    }

    return (
        <div className="flex p-2 space-x-4 items-center" style={{ backgroundColor }}>
            {overrideOpen && (
                <OverrideEditor opened={overrideOpen} sensorStatus={sensorStatus} onResult={onOverrideResult} />
            )}
            <SensorIcons isActiveSensor={isActiveSensor} isThermostatSensor={isThermostatSensor} />
            <div className="font-bold text-lg grow max-w-full">{sensorStatus.label}</div>
            <TempBlock
                temp={sensorStatus.currentTemp.toFixed(1)}
                label={sensorStatus.ruleType === "disconnected" ? "Last" : "Current"}
                tip={`Temperature as of ${localTime(sensorStatus.lastMeasuredAt)}`}
            />
            <TempBlock
                temp={ruleTemp}
                label={getLabel(sensorStatus)}
                onClick={onOverrideClick}
                tip={getReason(sensorStatus)}
            />
        </div>
    );
}
