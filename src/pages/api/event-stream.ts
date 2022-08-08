import type { NextApiRequest, NextApiResponse } from "next";
import { getConfig, registerConfigListener, unregisterConfigListener } from "server/stores/config";
import {
    getSystemStates,
    registerSystemStateListener,
    unregisterSystemStateListener,
} from "server/stores/system-state";

function sendApiEvent(res: NextApiResponse, e: ApiEvent) {
    res.write(`data: ${JSON.stringify(e)}\n\n`);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    console.log(`Event stream connected`);
    res.writeHead(200, {
        "Content-Type": "text/event-stream",
        Connection: "keep-alive",
        "Cache-Control": "no-cache, no-transform",
    });

    let connected = true;
    sendApiEvent(res, { eventType: "STATE", payload: getSystemStates() });
    sendApiEvent(res, { eventType: "CONFIG", payload: getConfig() });

    const configListener: ServerConfigListener = (c) => {
        if (connected) sendApiEvent(res, { eventType: "CONFIG", payload: c });
    };

    const stateListener: ServerStateListener = (c) => {
        if (connected) sendApiEvent(res, { eventType: "STATE", payload: c });
    };

    const pinger = setInterval(() => {
        if (connected) sendApiEvent(res, { eventType: "PING" });
    }, 30000);

    registerConfigListener(configListener);
    registerSystemStateListener(stateListener);

    req.on("close", () => {
        console.log(`Event stream closed`);
        connected = false;
        unregisterConfigListener(configListener);
        unregisterSystemStateListener(stateListener);
        clearInterval(pinger);
    });
}
