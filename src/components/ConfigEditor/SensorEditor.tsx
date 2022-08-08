import { Button, Divider, Paper, Stack, TextInput } from "@mantine/core";
import { useDispatch } from "react-redux";
import { useAppSelector } from "store/store";

import { deleteSensor, selectEditorSystemSensor, setSensorId } from "../../store/configEditorSlice";
import { ScheduleRulesEditor } from "./ScheduleRulesEditor";

export function SensorEditor({ systemSeq, sensorSeq }: { systemSeq: number; sensorSeq: number }) {
    const dispatch = useDispatch();
    const sensor = useAppSelector((state) => selectEditorSystemSensor(state, systemSeq, sensorSeq));

    return (
        <Paper p="md">
            <Stack>
                <TextInput
                    label="Entity ID"
                    placeholder="sensor.bedroom_temperature"
                    value={sensor}
                    onChange={(e) => dispatch(setSensorId({ systemSeq, sensorSeq, id: e.target.value }))}
                />
                <Divider />
                <ScheduleRulesEditor type="cool" systemSeq={systemSeq} sensorSeq={sensorSeq} />
                <Divider />
                <ScheduleRulesEditor type="heat" systemSeq={systemSeq} sensorSeq={sensorSeq} />
                <Divider />
                <Button color="red" onClick={() => dispatch(deleteSensor({ systemSeq, sensorSeq }))}>
                    Delete Sensor
                </Button>
            </Stack>
        </Paper>
    );
}
