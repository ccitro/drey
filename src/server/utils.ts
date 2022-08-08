import { existsSync } from "fs";
import { join, resolve } from "path";
import { dirname } from "path";
import { fileURLToPath } from "url";

if (typeof __dirname === "undefined") {
    globalThis.__dirname = dirname(fileURLToPath(import.meta.url));
}
let baseDir = null as string | null;

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const dateToString = (d: Date) => d.toISOString().replace(/\.\d{0,3}Z/, "Z");

export const temperatureValue = (t: string | number) => Math.round(parseFloat(String(t)) * 10) / 10;

function getBaseDir(): string {
    if (baseDir === null) {
        baseDir = __dirname;
        let depth = 0;
        const maxDepth = 10;
        while (!existsSync(join(baseDir, "res"))) {
            depth++;
            if (depth > maxDepth) {
                throw new Error("Unable to locate base dir");
            }

            baseDir = resolve(join(baseDir, ".."));
        }
    }

    return baseDir;
}

export function getResFilePath(resFile: string): string {
    return join(getBaseDir(), "res", resFile);
}
