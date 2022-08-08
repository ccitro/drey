import type { NextApiRequest, NextApiResponse } from "next";
import { deleteOverride } from "server/stores/overrides";
import { getSystemStates } from "server/stores/system-state";

type Data = SystemStates;

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
    await deleteOverride(req.body.thermostat, req.body.sensor);
    res.json(getSystemStates());
}
