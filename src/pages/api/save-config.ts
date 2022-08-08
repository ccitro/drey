import type { NextApiRequest, NextApiResponse } from "next";
import { getConfigErrors, updateConfig } from "server/stores/config";

interface Data {
    message: string;
    errors?: string[];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
    const configJson = req.body.config_json;
    let parsedConfig: DreyConfig;
    try {
        parsedConfig = JSON.parse(configJson);
    } catch (err) {
        res.status(400);
        res.send({ message: "Unparsable config JSON" });
        return;
    }

    try {
        const errors = getConfigErrors(parsedConfig);
        if (errors.length > 0) {
            res.status(400);
            res.send({ message: "Invalid Config", errors: errors });
        } else {
            await updateConfig(parsedConfig);
            res.send({ message: "Config updated" });
        }
    } catch (err) {
        res.status(500);
        res.send({ message: String(err) });
    }
}
