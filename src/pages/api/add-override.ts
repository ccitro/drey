import type { NextApiRequest, NextApiResponse } from "next";
import { addOverride } from "server/stores/overrides";
import { getSystemStates } from "server/stores/system-state";

type Data = SystemStates;

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
    const systemState = getSystemStates();
    const sensorStatus = systemState[req.body.thermostat]?.sensorStatuses?.find((s) => s.id === req.body.sensor);
    if (!sensorStatus) {
        console.error("Invalid sensor in add-override", req.body);
        throw new Error("Invalid sensor");
    }

    await addOverride(req.body.thermostat, sensorStatus, parseFloat(req.body.targetTemp));
    res.json(getSystemStates());
}
