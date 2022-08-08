import { startEventLoop } from "./server/event-loop";
import { startSensors } from "./server/sensors";
import { loadConfig } from "./server/stores/config";
import { startWebserver } from "./server/webserver";

process.title = "drey";
process.env.TZ = "UTC";

async function main(): Promise<void> {
    try {
        await loadConfig();
        void startWebserver(parseInt(process.env.PORT || "3001"), process.env.ip ?? "0.0.0.0");
        void startSensors();
        void startEventLoop();
    } catch (err) {
        console.error("Failed to start:", err);
    }
}

void main();
