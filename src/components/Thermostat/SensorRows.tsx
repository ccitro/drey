import { Divider, Stack } from "@mantine/core";
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
        <Stack spacing={0}>
            <Divider />
            {sensors.map((sensor) => (
                <React.Fragment key={sensor}>
                    <Sensor sensor={sensor} thermostat={thermostat} />
                    <Divider />
                </React.Fragment>
            ))}
        </Stack>
    );
}
