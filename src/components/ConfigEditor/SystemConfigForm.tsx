import { Icon } from "@iconify-icon/react";
import plus from "@iconify-icons/mdi/plus";
import { ActionIcon, Button, Card, Divider, Group, Stack, Tabs, TextInput, Title } from "@mantine/core";
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
        <Card>
            <Stack>
                <TextInput
                    label="Thermostat Entity ID"
                    placeholder="climate.thermostat"
                    value={systemConfig.thermostat_entity_id}
                    onChange={(e) => dispatch(setThermostatEntityId({ systemSeq, value: e.target.value }))}
                />

                <TextInput
                    label="Thermostat Sensor"
                    placeholder="sensor.thermostat_temperature"
                    value={systemConfig.thermostat_sensor}
                    onChange={(e) => dispatch(setThermostatSensor({ systemSeq, value: e.target.value }))}
                />

                <Group position="apart">
                    <Title order={5}>Sensors/Rooms and Schedules</Title>
                    <ActionIcon
                        title="Add a Sensor"
                        color="green"
                        variant="outline"
                        size="xs"
                        onClick={() => dispatch(insertSensor({ systemSeq }))}
                    >
                        <Icon icon={plus} />
                    </ActionIcon>
                </Group>
                <Tabs defaultValue="0">
                    <Tabs.List>
                        {systemConfig.temp_sensors.map((s, i) => (
                            <Tabs.Tab key={i} value={String(i)}>
                                {buildTabLabel(s, i)}
                            </Tabs.Tab>
                        ))}
                    </Tabs.List>
                    {systemConfig.temp_sensors.map((_, i) => (
                        <Tabs.Panel key={i} value={String(i)}>
                            <SensorEditor systemSeq={systemSeq} sensorSeq={i} />
                        </Tabs.Panel>
                    ))}
                </Tabs>
                <Divider />
                <Button color="red" onClick={() => dispatch(deleteSystem({ systemSeq }))}>
                    Delete System
                </Button>
            </Stack>
        </Card>
    );
}
