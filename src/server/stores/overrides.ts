import { PrismaClient } from "@prisma/client";

import { MAX_TEMP, MIN_TEMP } from "../constants";

const prisma = new PrismaClient();

export async function getOverrides(_thermostat: string): Promise<Override[]> {
    const { count } = await prisma.override.deleteMany({
        where: { holdUntil: { lt: new Date().toISOString() } },
    });

    if (count) {
        console.log(`Expired ${count} overrides`);
    }

    // @future limit to thermostat
    return await prisma.override.findMany();
}

export async function deleteOverride(_thermostat: string, sensor: string): Promise<void> {
    await prisma.override.delete({ where: { sensor } });
}

export async function addOverrideForSensor(
    sensor: string,
    holdUntil: string,
    targetTemp: number,
    reason: string
): Promise<Override> {
    if (isNaN(targetTemp) || targetTemp < MIN_TEMP || targetTemp > MAX_TEMP) {
        console.error("Invalid temp");
        throw new Error("Invalid temp");
    }

    const override: Override = {
        sensor,
        targetTemp,
        reason,
        holdUntil,
    };

    await prisma.override.upsert({
        where: { sensor },
        update: { ...override },
        create: { ...override },
    });

    return override;
}

export async function addOverride(
    thermostat: string,
    sensorStatus: SensorStatus,
    targetTemp: number
): Promise<Override> {
    return addOverrideForSensor(sensorStatus.id, sensorStatus.ruleEndsAt, targetTemp, "User Override");
}
