import { Icon } from "@iconify-icon/react";
import plus from "@iconify-icons/mdi/plus";
import { ActionIcon, Divider, Group, PasswordInput, Stack, Tabs, TextInput, Title } from "@mantine/core";
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
        <Stack>
            <TextInput
                label="Home Assistant Host"
                placeholder="127.0.0.1"
                value={config.ha_host}
                onChange={(e) => dispatch(setTopLevelString({ key: "ha_host", value: e.target.value }))}
            />
            <PasswordInput
                label="Home Assistant Token"
                value={config.ha_key}
                onChange={(e) => dispatch(setTopLevelString({ key: "ha_key", value: e.target.value }))}
            />
            <TextInput
                label="External Sensor Entity ID"
                placeholder="sensor.dark_sky_temperature"
                value={config.external_sensor}
                onChange={(e) => dispatch(setTopLevelString({ key: "external_sensor", value: e.target.value }))}
            />
            <TextInput
                label="Time Zone"
                placeholder="America/Chicago"
                value={config.tz}
                onChange={(e) => dispatch(setTopLevelString({ key: "tz", value: e.target.value }))}
            />

            <Divider />

            <Group position="apart">
                <Title order={3}>Thermostats / Systems</Title>
                <ActionIcon
                    title="Add a Thermostat"
                    color="green"
                    variant="outline"
                    size="xs"
                    onClick={() => dispatch(insertSystem())}
                >
                    <Icon icon={plus} />
                </ActionIcon>
            </Group>

            <Tabs defaultValue="0">
                <Tabs.List>
                    {config.configs.map((s, i) => (
                        <Tabs.Tab key={i} value={String(i)}>
                            {buildTabLabel(s.thermostat_entity_id, i)}
                        </Tabs.Tab>
                    ))}
                </Tabs.List>
                {config.configs.map((_, i) => (
                    <Tabs.Panel key={i} value={String(i)}>
                        <SystemConfigForm key={i} systemSeq={i} />
                    </Tabs.Panel>
                ))}
            </Tabs>
        </Stack>
    );
}
