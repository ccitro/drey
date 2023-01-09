import { Tab } from "@headlessui/react";
import plus from "@iconify-icons/mdi/plus";
import { ActionIcon } from "components/ActionIcon";
import Input from "components/Input";
import { useDispatch } from "react-redux";

import { insertSystem, setTopLevelString } from "../../store/configEditorSlice";
import { useAppSelector } from "../../store/store";
import { SystemConfigForm } from "./SystemConfigForm";

function buildTabLabel(id: string, seq: number): string {
    if (id === "") {
        return `System #${seq + 1}`;
    }

    if (id.includes(".")) {
        id = id.split(".")[1];
    }

    id = id.replaceAll("_", " ");
    id = id.replace(/ s /g, "'s ");
    id = id
        .toLowerCase()
        .split(" ")
        .map((s) => s.charAt(0).toUpperCase() + s.substring(1))
        .join(" ");
    return id;
}

export function ConfigEditorForm() {
    const config = useAppSelector((s) => s.configEditor.dreyConfig);
    const dispatch = useDispatch();

    return (
        <div className="flex flex-col space-y-4">
            <Input
                label="Home Assistant Host"
                placeholder="127.0.0.1"
                value={config.ha_host}
                onChange={(e) => dispatch(setTopLevelString({ key: "ha_host", value: e.target.value }))}
            />
            <Input
                label="Home Assistant Token"
                value={config.ha_key}
                onChange={(e) => dispatch(setTopLevelString({ key: "ha_key", value: e.target.value }))}
            />
            <Input
                label="External Sensor Entity ID"
                placeholder="sensor.dark_sky_temperature"
                value={config.external_sensor}
                onChange={(e) => dispatch(setTopLevelString({ key: "external_sensor", value: e.target.value }))}
            />
            <Input
                label="Time Zone"
                placeholder="America/Chicago"
                value={config.tz}
                onChange={(e) => dispatch(setTopLevelString({ key: "tz", value: e.target.value }))}
            />

            <hr />

            <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold">Thermostats / Systems</h3>
                <ActionIcon
                    title="Add a Thermostat"
                    className="border border-green-400 text-green-400 hover:bg-green-900 rounded-lg"
                    icon={plus}
                    size={16}
                    onClick={() => dispatch(insertSystem())}
                />
            </div>

            <Tab.Group as="div">
                <Tab.List>
                    {config.configs.map((s, i) => (
                        <Tab key={i} className={({ selected }) => `tab ${selected ? "tab-selected" : ""}`}>
                            {buildTabLabel(s.thermostat_entity_id, i)}
                        </Tab>
                    ))}
                </Tab.List>
                {config.configs.map((_, i) => (
                    <Tab.Panel key={i}>
                        <SystemConfigForm key={i} systemSeq={i} />
                    </Tab.Panel>
                ))}
            </Tab.Group>
        </div>
    );
}
