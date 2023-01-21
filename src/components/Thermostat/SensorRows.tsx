import React from "react";
import { useAppSelector } from "store/store";
import { selectThermostatSensorIds } from "store/systemStatesSlice";

import Sensor from "./Sensor";

interface SensorRowsProps {
    thermostat: string;
}

export default function SensorRows({ thermostat }: SensorRowsProps) {
    const sensors = useAppSelector((state) => selectThermostatSensorIds(state, thermostat));
    return (
        <div className="flex flex-col divide-y divide-neutral-700">
            <div />
            {sensors.map((sensor) => (
                <React.Fragment key={sensor}>
                    <Sensor sensor={sensor} thermostat={thermostat} />
                </React.Fragment>
            ))}
            <div />
        </div>
    );
}
