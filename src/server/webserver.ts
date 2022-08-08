import express from "express";
import next from "next";

const dev = process.env.NODE_ENV !== "production";
const nextApp = next({ dev });
const handle = nextApp.getRequestHandler();
const expressApp = express();

export async function startWebserver(port: number, ip: string): Promise<void> {
    await nextApp.prepare();

    expressApp.all("*", (req, res) => handle(req, res));
    expressApp.listen(port, ip, () => {
        console.log(`> Ready on http://localhost:${port}`);
    });
}
