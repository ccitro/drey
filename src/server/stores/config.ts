import { PrismaClient } from "@prisma/client";
import Ajv from "ajv";
import betterAjvErrors from "better-ajv-errors";
import { readFileSync } from "fs";

import { getResFilePath } from "../utils";

const prisma = new PrismaClient();
const globalStorage = globalThis as unknown as DreyGlobal;
if (!globalStorage.config) globalStorage.config = null;
if (!globalStorage.configListeners) globalStorage.configListeners = [];
const ajv = new Ajv();
const schema = JSON.parse(readFileSync(getResFilePath("DreyConfig.schema.json")).toString());
const validate = ajv.compile(schema);

const defaultConfig: DreyConfig = {
    version: 1,
    ha_host: "",
    ha_key: "",
    external_sensor: "",
    tz: process.env.TZ ?? "UTC",
    configs: [],
};

export function registerConfigListener(l: ServerConfigListener) {
    globalStorage.configListeners.push(l);
    globalStorage.config && l(globalStorage.config);
}

export function unregisterConfigListener(l: ServerConfigListener) {
    globalStorage.configListeners = globalStorage.configListeners.filter((existing) => existing !== l);
}

export function getConfig(): DreyConfig {
    if (!globalStorage.config) {
        throw new Error("Config not yet loaded");
    }
    return globalStorage.config;
}

export function getConfigErrors(testConfig: DreyConfig): string[] {
    const valid = validate(testConfig);
    if (valid) {
        return [];
    }

    const consoleErrors = betterAjvErrors(schema, testConfig, validate.errors ?? [], { indent: 2 });
    console.log(consoleErrors);

    const jsErrors = betterAjvErrors(schema, testConfig, validate.errors ?? [], { format: "js" });
    return jsErrors.map((e) => e.error);
}

export async function loadConfig(): Promise<DreyConfig> {
    if (globalStorage.config === null) {
        const configRecord = await prisma.datastore.findFirst({
            where: { data_key: "config" },
        });

        if (configRecord && configRecord.data_value.length > 0) {
            const testConfig = JSON.parse(configRecord.data_value);
            const errors = getConfigErrors(testConfig);
            if (errors.length === 0) {
                globalStorage.config = testConfig;
                return testConfig;
            }
            console.error("Failed to load config", errors, JSON.stringify(configRecord.data_value));
        }

        await updateConfig(defaultConfig);
        return defaultConfig;
    }

    return globalStorage.config;
}

export async function updateConfig(newConfig: DreyConfig): Promise<void> {
    const errors = getConfigErrors(newConfig);
    if (errors.length > 0) {
        throw new Error(`Error(s) in new config: ` + errors.join(", "));
    }

    globalStorage.config = newConfig;
    const data_value = JSON.stringify(globalStorage.config);
    await prisma.datastore.upsert({
        where: { data_key: "config" },
        update: { data_value },
        create: { data_key: "config", data_value },
    });

    globalStorage.configListeners.forEach((l) => l(newConfig));
}
