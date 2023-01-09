import Button from "components/Button";
import Input from "components/Input";
import { useDispatch } from "react-redux";
import { useAppSelector } from "store/store";

import { deleteSensor, selectEditorSystemSensor, setSensorId } from "../../store/configEditorSlice";
import { ScheduleRulesEditor } from "./ScheduleRulesEditor";

export function SensorEditor({ systemSeq, sensorSeq }: { systemSeq: number; sensorSeq: number }) {
    const dispatch = useDispatch();
    const sensor = useAppSelector((state) => selectEditorSystemSensor(state, systemSeq, sensorSeq));

    return (
        <div className="flex flex-col space-y-4 p-4 bg-neutral-900">
            <Input
                label="Entity ID"
                placeholder="sensor.bedroom_temperature"
                value={sensor}
                onChange={(e) => dispatch(setSensorId({ systemSeq, sensorSeq, id: e.target.value }))}
            />
            <hr />
            <ScheduleRulesEditor type="cool" systemSeq={systemSeq} sensorSeq={sensorSeq} />
            <hr />
            <ScheduleRulesEditor type="heat" systemSeq={systemSeq} sensorSeq={sensorSeq} />
            <hr />
            <Button variant="danger" onClick={() => dispatch(deleteSensor({ systemSeq, sensorSeq }))}>
                Delete Sensor
            </Button>
        </div>
    );
}
