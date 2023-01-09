import { Tab } from "@headlessui/react";
import plus from "@iconify-icons/mdi/plus";
import { ActionIcon } from "components/ActionIcon";
import Button from "components/Button";
import Input from "components/Input";
import { useDispatch } from "react-redux";

import {
    deleteSystem,
    insertSensor,
    selectEditorSystem,
    setThermostatEntityId,
    setThermostatSensor,
} from "../../store/configEditorSlice";
import { useAppSelector } from "../../store/store";
import { SensorEditor } from "./SensorEditor";

function buildTabLabel(id: string, seq: number): string {
    if (id === "") {
        return `Sensor #${seq + 1}`;
    }

    if (id.includes(".")) {
        id = id.split(".")[1];
    }

    id = id.replaceAll("_", " ");
    id = id.replace(/ temperature$/, "");
    id = id.replace(/ s /g, "'s ");
    id = id
        .toLowerCase()
        .split(" ")
        .map((s) => s.charAt(0).toUpperCase() + s.substring(1))
        .join(" ");
    return id;
}

export function SystemConfigForm({ systemSeq }: { systemSeq: number }) {
    const systemConfig = useAppSelector((state) => selectEditorSystem(state, systemSeq));
    const dispatch = useDispatch();

    return (
        <div className="flex flex-col space-y-4 p-4 bg-neutral-800">
            <Input
                label="Thermostat Entity ID"
                placeholder="climate.thermostat"
                value={systemConfig.thermostat_entity_id}
                onChange={(e) => dispatch(setThermostatEntityId({ systemSeq, value: e.target.value }))}
            />

            <Input
                label="Thermostat Sensor"
                placeholder="sensor.thermostat_temperature"
                value={systemConfig.thermostat_sensor}
                onChange={(e) => dispatch(setThermostatSensor({ systemSeq, value: e.target.value }))}
            />

            <div className="flex justify-between">
                <h5>Sensors/Rooms and Schedules</h5>
                <ActionIcon
                    title="Add a Sensor"
                    className="border border-green-400 text-green-400 hover:bg-green-900 rounded-lg"
                    size={14}
                    icon={plus}
                    onClick={() => dispatch(insertSensor({ systemSeq }))}
                />
            </div>
            <Tab.Group as="div">
                <Tab.List>
                    {systemConfig.temp_sensors.map((s, i) => (
                        <Tab key={i} className={({ selected }) => `tab ${selected ? "tab-selected" : ""}`}>
                            {buildTabLabel(s, i)}
                        </Tab>
                    ))}
                </Tab.List>
                {systemConfig.temp_sensors.map((_, i) => (
                    <Tab.Panel key={i}>
                        <SensorEditor systemSeq={systemSeq} sensorSeq={i} />
                    </Tab.Panel>
                ))}
            </Tab.Group>
            <hr />
            <Button variant="danger" onClick={() => dispatch(deleteSystem({ systemSeq }))}>
                Delete System
            </Button>
        </div>
    );
}
