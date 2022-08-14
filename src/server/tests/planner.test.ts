import { jest } from "@jest/globals";
import dayjs from "dayjs";
import dayjsTimezone from "dayjs/plugin/timezone";
import dayjsUtc from "dayjs/plugin/utc";

import { MAX_TEMP, MIN_TEMP } from "../constants";
import { _private } from "../planner";

dayjs.extend(dayjsUtc);
dayjs.extend(dayjsTimezone);

const {
    getSensorName,
    specialSensorStatus,
    needsCoolingProtection,
    sensorIsDisconnected,
    buildFutureDowDate,
    calculateDelta,
    needToActNowToReachTemp,
    pickActionNeeded,
    buildThermostatStatusFromSensorsAndThermostat,
    decideIfNextRuleRequiresAction,
    buildOverrideRule,
    buildSensorStatus,
    makeRuleDecision,
    processSystem,
} = _private;

process.env.TZ = "UTC";

// a Friday at 12:15 PM UTC
const tz = "America/Chicago";
const nowIsoDate = "2022-07-08T12:15:16.541Z";
const nowDate = new Date(nowIsoDate);
const oldDate = new Date(nowDate.getTime() - 60 * 60 * 1000);
const recentDate = new Date(nowDate.getTime() - 1 * 60 * 1000);
const soonDate = new Date(nowDate.getTime() + 1000 * 60 * 5);
const distantDate = new Date(nowDate.getTime() + 1000 * 60 * 60 * 5);
const weather: WeatherData = { condition: "sunny", externalTemperature: 70 };

beforeAll(() => {
    jest.useFakeTimers({ now: nowDate });
    jest.setSystemTime(nowDate);
});

afterAll(() => {
    jest.useRealTimers();
});

const todayDay = nowDate.getDay();
let tomorrowDay = todayDay + 1;
if (tomorrowDay > 6) {
    tomorrowDay = 0;
}

const mockScheduleRules: ScheduleRule[] = [
    { day: todayDay, label: "Test 1", temp: 60, time: 0 },
    { day: tomorrowDay, label: "Test 2", temp: 65, time: 0 },
];

const mockTempSensor: TempSensorEntityState = {
    entity_id: "sensor.mock_temp_sensor",
    state: "70",
    attributes: {
        state_class: "measurement",
        unit_of_measurement: "°F",
        device_class: "temperature",
        friendly_name: "Mock Sensor",
    },
    last_changed: recentDate.toISOString(),
    last_updated: nowDate.toISOString(),
};

const mockCoolingThermostatState: ThermostatEntityState = {
    entity_id: "climate.mock_thermostat",
    state: "cool",
    attributes: {
        min_temp: 50,
        max_temp: 90,
        current_temperature: 72,
        temperature: 72,
        target_temp_high: null,
        target_temp_low: null,
        fan_mode: "on",
        hvac_action: "idle",
        preset_mode: "none",
        friendly_name: "Mock Thermostat",
        supported_features: 27,
    },
    last_changed: recentDate.toISOString(),
    last_updated: nowDate.toISOString(),
};

const mockHeatingThermostatState: ThermostatEntityState = {
    ...mockCoolingThermostatState,
    state: "heat",
    attributes: {
        ...mockCoolingThermostatState.attributes,
        hvac_action: "heating",
    },
};

const mockCoolingSensorStatus: SensorStatus = {
    actionNeeded: "cool",
    currentTemp: parseFloat(mockTempSensor.state),
    desiredThermostatSetting:
        mockCoolingThermostatState.attributes.current_temperature -
        parseFloat(mockTempSensor.state) +
        mockScheduleRules[0].temp,
    id: mockTempSensor.entity_id,
    label: mockTempSensor.attributes.friendly_name,
    lastMeasuredAt: mockTempSensor.last_changed,
    ruleEndsAt: soonDate.toISOString(),
    ruleLabel: mockScheduleRules[0].label,
    ruleTemp: mockScheduleRules[0].temp,
    ruleType: "schedule",
};

const mockHeatingSensorStatus: SensorStatus = {
    ...mockCoolingSensorStatus,
    actionNeeded: "heat",
};

const mockHeatingSensorStatuses: SensorStatus[] = [
    mockHeatingSensorStatus,
    {
        ...mockHeatingSensorStatus,
        id: "sensor.neutral",
        actionNeeded: "none",
        currentTemp: mockHeatingSensorStatus.currentTemp - 5,
        desiredThermostatSetting: mockHeatingSensorStatus.desiredThermostatSetting - 5,
        ruleTemp: mockHeatingSensorStatus.ruleTemp - 5,
    },
    {
        ...mockHeatingSensorStatus,
        id: "sensor.demanding",
        currentTemp: mockHeatingSensorStatus.currentTemp + 5,
        desiredThermostatSetting: mockHeatingSensorStatus.desiredThermostatSetting + 5,
        ruleTemp: mockHeatingSensorStatus.ruleTemp + 5,
    },
];

const mockCoolingSensorStatuses: SensorStatus[] = [
    mockCoolingSensorStatus,
    {
        ...mockCoolingSensorStatus,
        id: "sensor.neutral",
        actionNeeded: "none",
        currentTemp: mockCoolingSensorStatus.currentTemp + 5,
        desiredThermostatSetting: mockCoolingSensorStatus.desiredThermostatSetting + 5,
        ruleTemp: mockCoolingSensorStatus.ruleTemp + 5,
    },
    {
        ...mockCoolingSensorStatus,
        id: "sensor.demanding",
        currentTemp: mockCoolingSensorStatus.currentTemp - 5,
        desiredThermostatSetting: mockCoolingSensorStatus.desiredThermostatSetting - 5,
        ruleTemp: mockCoolingSensorStatus.ruleTemp - 5,
    },
];

describe("getSensorName", () => {
    test("Uses the friendly name if available", () => {
        const s = { ...mockTempSensor, attributes: { ...mockTempSensor.attributes, friendly_name: "Test 1" } };
        expect(getSensorName(s)).toBe(s.attributes.friendly_name);
    });
    test("Removes verbose text at the end", () => {
        const s = {
            ...mockTempSensor,
            attributes: { ...mockTempSensor.attributes, friendly_name: "Test 1 Temperature" },
        };
        expect(getSensorName(s)).toBe("Test 1");
    });
    test("Falls back to the entity id if a friendly name is not available", () => {
        const nameless = { ...mockTempSensor, attributes: { ...mockTempSensor.attributes, friendly_name: "" } };
        expect(getSensorName(nameless)).toBe(nameless.entity_id);
    });
});

describe("specialSensorStatus", () => {
    test("Picks the right extreme temp", () => {
        expect(specialSensorStatus("cool", mockTempSensor, "disconnected").ruleTemp).toBe(MAX_TEMP);
        expect(specialSensorStatus("heat", mockTempSensor, "disconnected").ruleTemp).toBe(MIN_TEMP);
    });
    test("Rule label is based on type", () => {
        expect(specialSensorStatus("cool", mockTempSensor, "off").ruleLabel).toBe("Off");
        expect(specialSensorStatus("cool", mockTempSensor, "disconnected").ruleLabel).toBe("Disconnected");
    });
    test("Attributes are passed on", () => {
        expect(specialSensorStatus("cool", mockTempSensor, "off").id).toBe(mockTempSensor.entity_id);
        expect(specialSensorStatus("cool", mockTempSensor, "disconnected").ruleType).toBe("disconnected");
        expect(specialSensorStatus("cool", mockTempSensor, "off").ruleType).toBe("off");
    });
    test("No action is taken`", () => {
        expect(specialSensorStatus("cool", mockTempSensor, "off").actionNeeded).toBe("none");
    });
});

describe("needsCoolingProtection", () => {
    test("Heating does not need protection", () => {
        expect(needsCoolingProtection(mockCoolingThermostatState, 80)).toBe(false);
        expect(needsCoolingProtection(mockCoolingThermostatState, 50)).toBe(true);
    });
    test("Cooling when cold outside requires protection", () => {
        expect(needsCoolingProtection(mockHeatingThermostatState, 50)).toBe(false);
    });
    test("Cooling when hot out side does not require protection", () => {
        expect(needsCoolingProtection(mockHeatingThermostatState, 80)).toBe(false);
    });
});

describe("sensorIsDisconnected", () => {
    const thermostatSensor = "thermostat_sensor";
    const freshRemoteSensor: TempSensorEntityState = { ...mockTempSensor, last_updated: nowDate.toISOString() };
    const recentRemoteSensor: TempSensorEntityState = { ...mockTempSensor, last_updated: recentDate.toISOString() };
    const oldRemoteSensor: TempSensorEntityState = { ...mockTempSensor, last_updated: oldDate.toISOString() };

    const freshThermostatSensor: TempSensorEntityState = { ...freshRemoteSensor, entity_id: thermostatSensor };
    const recentThermostatSensor: TempSensorEntityState = { ...recentRemoteSensor, entity_id: thermostatSensor };
    const oldThermostatSensor: TempSensorEntityState = { ...oldRemoteSensor, entity_id: thermostatSensor };

    test("Old remote sensors are disconnected", () => {
        expect(sensorIsDisconnected(oldRemoteSensor, thermostatSensor)).toBe(true);
    });
    test("Recent or current remote sensors are not disconnected", () => {
        expect(sensorIsDisconnected(freshRemoteSensor, thermostatSensor)).toBe(false);
        expect(sensorIsDisconnected(recentRemoteSensor, thermostatSensor)).toBe(false);
    });
    test("The thermostat sensor is never disconnected", () => {
        expect(sensorIsDisconnected(freshThermostatSensor, thermostatSensor)).toBe(false);
        expect(sensorIsDisconnected(recentThermostatSensor, thermostatSensor)).toBe(false);
        expect(sensorIsDisconnected(oldThermostatSensor, thermostatSensor)).toBe(false);
    });
});

describe("buildFutureDowDate", () => {
    test("Builds the correct date for same-day calcs", () => {
        expect(buildFutureDowDate(nowDate, 5, 13 * 60, tz).toISOString()).toBe("2022-07-08T18:00:00.541Z");
        expect(buildFutureDowDate(nowDate, 5, 14 * 60 + 29, tz).toISOString()).toBe("2022-07-08T19:29:00.541Z");
    });
    test("Builds the correct date for same dow but past time", () => {
        expect(buildFutureDowDate(nowDate, 5, 7 * 60, tz).toISOString()).toBe("2022-07-15T12:00:00.541Z");
    });
    test("Builds the correct date for yesterday's dow", () => {
        expect(buildFutureDowDate(nowDate, 4, 30, tz).toISOString()).toBe("2022-07-14T05:30:00.541Z");
    });
    test("Builds the correct date for tomorrow's dow", () => {
        expect(buildFutureDowDate(nowDate, 6, 30, tz).toISOString()).toBe("2022-07-09T05:30:00.541Z");
    });
    test("Builds the correct date for 0 dow", () => {
        expect(buildFutureDowDate(nowDate, 0, 30, tz).toISOString()).toBe("2022-07-10T05:30:00.541Z");
    });

    test("Handles forward date transition for time zones", () => {
        const borderlineTime = new Date("2022-07-08T23:15:16.541Z");
        const local = "America/Chicago";
        const utc = "UTC";

        expect(buildFutureDowDate(borderlineTime, 5, 20 * 60, utc).toISOString()).toBe("2022-07-15T20:00:00.541Z");
        expect(buildFutureDowDate(borderlineTime, 5, 20 * 60, local).toISOString()).toBe("2022-07-09T01:00:00.541Z");
    });

    test("Handles backwards date transition for time zones", () => {
        const borderlineTime = new Date("2022-07-08T01:15:16.541Z");
        const local = "America/Chicago";
        const utc = "UTC";

        expect(buildFutureDowDate(borderlineTime, 5, 2 * 60, utc).toISOString()).toBe("2022-07-08T02:00:00.541Z");
        expect(buildFutureDowDate(borderlineTime, 5, 2 * 60, local).toISOString()).toBe("2022-07-08T07:00:00.541Z");
    });
});

describe("calculateDelta", () => {
    const localDistantDate = dayjs(distantDate).tz(tz);
    const secOffset = localDistantDate.second();
    const sampleRule: ScheduleRule = {
        day: localDistantDate.day(),
        label: "Sample",
        temp: 68,
        time: localDistantDate.hour() * 60 + localDistantDate.minute(),
    };
    test("1 week less seconds offset if day, hours, and mins match", () => {
        expect(calculateDelta(distantDate, sampleRule, tz)).toBe(7 * 24 * 60 * 60 - secOffset);
    });
    test("Correct delta for various same day offsets", () => {
        const offsets = [1, 10, 100, 8 * 60 - 15];
        for (const offset of offsets) {
            expect(calculateDelta(distantDate, { ...sampleRule, time: sampleRule.time + offset }, tz)).toBe(
                offset * 60 - secOffset
            );
        }
    });
    test("Correct delta for a next day rule", () => {
        expect(calculateDelta(distantDate, { ...sampleRule, day: sampleRule.day + 1 }, tz)).toBe(
            24 * 60 * 60 - secOffset
        );
    });
    test("Correct delta for a prior dow rule", () => {
        expect(calculateDelta(distantDate, { ...sampleRule, day: sampleRule.day - 1 }, tz)).toBe(
            24 * 60 * 60 * 6 - secOffset
        );
    });
    test("Correct delta for a rule from 1 second ago", () => {
        expect(calculateDelta(distantDate, { ...sampleRule, time: sampleRule.time - 1 }, tz)).toBe(
            24 * 60 * 60 * 7 - 60 - secOffset
        );
    });
});

describe("needToActNowToReachTemp", () => {
    test("Heating does not trigger pre-conditioning", () => {
        expect(needToActNowToReachTemp("heat", 5, 1, weather)).toBe(false);
        expect(needToActNowToReachTemp("heat", -5, 1, weather)).toBe(false);
    });
    test("Eminent cooling triggers pre-conditioning", () => {
        expect(needToActNowToReachTemp("cool", 5, 1, weather)).toBe(true);
    });

    test("Far off cooling does not trigger pre-conditioning", () => {
        expect(needToActNowToReachTemp("cool", 5, 100000, weather)).toBe(false);
    });

    test("Cooling does not trigger pre-conditioning if under temp", () => {
        expect(needToActNowToReachTemp("cool", -5, 1, weather)).toBe(false);
    });

    test("Precooling should happen on a hot day", () => {
        const testWeather: WeatherData = { condition: "sunny", externalTemperature: 95 };
        expect(needToActNowToReachTemp("cool", 3, 60 * 60, testWeather)).toBe(true);
    });

    test("Precooling should not happen on a cool day", () => {
        const testWeather: WeatherData = { condition: "cloudy", externalTemperature: 75 };
        expect(needToActNowToReachTemp("cool", 3, 60 * 60, testWeather)).toBe(false);
    });
});

describe("pickActionNeeded", () => {
    test("Correctly picks cooling action", () => {
        for (let t = 70.5; t < 71.5; t += 0.1) {
            for (let s = 70.5; s < 71.5; s += 0.1) {
                const coolActionNeeded: ActionNeeded = s <= t ? "none" : "cool";
                const heatActionNeeded: ActionNeeded = s >= t ? "none" : "heat";
                const r: ScheduleRule = { day: 0, label: "", temp: t, time: 0 };

                expect(pickActionNeeded(r, { ...mockTempSensor, state: String(s) }, "cool")).toBe(coolActionNeeded);
                expect(pickActionNeeded(r, { ...mockTempSensor, state: String(s) }, "heat")).toBe(heatActionNeeded);
            }
        }
    });
});

describe("buildThermostatStatusFromSensorsAndThermostat", () => {
    test("Copies basic information to thermostat status", () => {
        const testSetups: [SensorStatus, ThermostatEntityState][] = [
            [mockHeatingSensorStatus, mockHeatingThermostatState],
            [mockCoolingSensorStatus, mockCoolingThermostatState],
        ];

        for (const s of testSetups) {
            const thermostatStatus = buildThermostatStatusFromSensorsAndThermostat(s[0].id, s[1], [s[0]]);
            expect(thermostatStatus.activeSensor).toBe(s[0].id);
            expect(thermostatStatus.thermostatSensor).toBe(s[0].id);
            expect(thermostatStatus.fanState).toBe(s[1].attributes.fan_mode === "on");
            expect(thermostatStatus.hvacState).toBe(s[1].attributes.hvac_action);
            expect(thermostatStatus.targetTemp).toBe(s[0].desiredThermostatSetting);
            expect(thermostatStatus.targetTempType).toBe(s[1].state);
        }
    });

    test("Correctly chooses demanding cooling sensor", () => {
        // check that the correct sensor is picked regardless of ordering
        const reversed = mockCoolingSensorStatuses.slice().reverse();
        // the most demanding mock sensor has a known entity id
        const demandingTemp = reversed.find((s) => s.id === "sensor.demanding")?.desiredThermostatSetting ?? -1;
        for (const ss of [mockCoolingSensorStatuses, reversed]) {
            const thermostatStatus = buildThermostatStatusFromSensorsAndThermostat(
                mockCoolingSensorStatus.id,
                mockCoolingThermostatState,
                ss
            );
            expect(thermostatStatus.activeSensor).toBe("sensor.demanding");
            expect(thermostatStatus.targetTemp).toBe(demandingTemp);
        }
    });

    test("Correctly chooses demanding heating sensor", () => {
        // check that the correct sensor is picked regardless of ordering
        const reversed = mockHeatingSensorStatuses.slice().reverse();
        // the most demanding mock sensor has a known entity id
        const demandingTemp = reversed.find((s) => s.id === "sensor.demanding")?.desiredThermostatSetting ?? -1;
        for (const ss of [mockHeatingSensorStatuses, reversed]) {
            const thermostatStatus = buildThermostatStatusFromSensorsAndThermostat(
                mockHeatingSensorStatus.id,
                mockHeatingThermostatState,
                ss
            );
            expect(thermostatStatus.activeSensor).toBe("sensor.demanding");
            expect(thermostatStatus.targetTemp).toBe(demandingTemp);
        }
    });
});

describe("decideIfNextRuleRequiresAction", () => {
    function bRule(date: Date, temp: number): ScheduleRule {
        const localDate = dayjs(date).tz(tz);
        return {
            day: localDate.day(),
            label: "Sample",
            temp,
            time: localDate.hour() * 60 + localDate.minute(),
        };
    }

    const bSensor = (temp: number): TempSensorEntityState => ({
        ...mockTempSensor,
        state: String(temp),
    });

    const currentRule = bRule(recentDate, 68);

    test("Does not require action if thermostat is off", () => {
        const decision = decideIfNextRuleRequiresAction(
            "off",
            bSensor(79),
            currentRule,
            bRule(soonDate, 68),
            soonDate,
            tz,
            weather
        );
        expect(decision.relevantRule).toBe(currentRule);
        expect(decision.ruleType).toBe("schedule");
    });

    test("Does not require cool action if next rule is distant", () => {
        const decision = decideIfNextRuleRequiresAction(
            "cool",
            bSensor(72),
            currentRule,
            bRule(distantDate, 70),
            distantDate,
            tz,
            weather
        );
        expect(decision.relevantRule).toBe(currentRule);
        expect(decision.ruleType).toBe("schedule");
    });

    test("Does not require heat action if next rule is distant", () => {
        const decision = decideIfNextRuleRequiresAction(
            "heat",
            bSensor(70),
            currentRule,
            bRule(distantDate, 72),
            distantDate,
            tz,
            weather
        );
        expect(decision.relevantRule).toBe(currentRule);
        expect(decision.ruleType).toBe("schedule");
    });

    test("Does not require heat action if next rule is soon", () => {
        const decision = decideIfNextRuleRequiresAction(
            "heat",
            bSensor(70),
            currentRule,
            bRule(soonDate, 72),
            soonDate,
            tz,
            weather
        );
        expect(decision.relevantRule).toBe(currentRule);
        expect(decision.ruleType).toBe("schedule");
    });

    test("Requires cool action if next rule is soon", () => {
        const coolRule = bRule(soonDate, 65);
        const decision = decideIfNextRuleRequiresAction(
            "cool",
            bSensor(currentRule.temp),
            currentRule,
            coolRule,
            soonDate,
            tz,
            weather
        );
        expect(decision.relevantRule).toBe(coolRule);
        expect(decision.ruleType).toBe("future");
    });
});

describe("buildOverrideRule", () => {
    const sampleMatchingOverride: Override = {
        holdUntil: distantDate.toISOString(),
        reason: "override",
        sensor: mockTempSensor.entity_id,
        targetTemp: 60,
    };
    const sampleOtherOverride: Override = { ...sampleMatchingOverride, sensor: "other" };
    test("Does not build an override if there are no overrides", () => {
        expect(buildOverrideRule(mockTempSensor, [])).toBe(null);
    });
    test("Does not build an override if there are no matching overrides", () => {
        expect(buildOverrideRule(mockTempSensor, [sampleOtherOverride])).toBe(null);
    });
    test("Builds an override rule decision if there is a matching override", () => {
        const result = buildOverrideRule(mockTempSensor, [sampleMatchingOverride, sampleMatchingOverride]);
        expect(result?.nextRuleStartsAt.toISOString()).toBe(sampleMatchingOverride.holdUntil);
        expect(result?.relevantRule?.temp).toBe(sampleMatchingOverride.targetTemp);
        expect(result?.relevantRule?.label?.includes(sampleMatchingOverride.reason)).toBe(true);
        expect(result?.ruleType).toBe("override");
    });
});

describe("buildSensorStatus", () => {
    const schedules: ScheduleRule[] = [{ day: 0, label: "Test", temp: 60, time: 0 }];
    const overrides: Override[] = [
        {
            holdUntil: distantDate.toISOString(),
            reason: "override",
            sensor: mockTempSensor.entity_id,
            targetTemp: 67,
        },
    ];

    test("Builds a disconnected sensor status when disconnected", () => {
        const oldRemoteSensor: TempSensorEntityState = { ...mockTempSensor, last_updated: oldDate.toISOString() };
        const sit = buildSensorStatus(oldRemoteSensor, mockCoolingThermostatState, "other", [], [], tz, weather);
        expect(sit.ruleType).toBe("disconnected");
    });
    test("Builds a scheduled sensor status", () => {
        const sit = buildSensorStatus(mockTempSensor, mockCoolingThermostatState, "other", schedules, [], tz, weather);
        expect(sit.ruleType).toBe("schedule");
        expect(sit.ruleLabel).toBe(schedules[0].label);
        expect(sit.ruleTemp).toBe(schedules[0].temp);
        expect(String(sit.currentTemp)).toBe(mockTempSensor.state);
    });
    test("Builds an override scheduled sensor status", () => {
        const sit = buildSensorStatus(
            mockTempSensor,
            mockCoolingThermostatState,
            "other",
            schedules,
            overrides,
            tz,
            weather
        );
        expect(sit.ruleType).toBe("override");
        expect(sit.ruleLabel.includes(overrides[0].reason)).toBe(true);
        expect(sit.ruleTemp).toBe(overrides[0].targetTemp);
        expect(String(sit.currentTemp)).toBe(mockTempSensor.state);
    });
});

describe("makeRuleDecision", () => {
    const overrides: Override[] = [
        {
            holdUntil: distantDate.toISOString(),
            reason: "override",
            sensor: mockTempSensor.entity_id,
            targetTemp: 67,
        },
    ];

    test("Makes an override rule if needed", () => {
        const decision = makeRuleDecision("cool", mockTempSensor, mockScheduleRules, overrides, tz, weather);
        expect(decision.ruleType).toBe("override");
        expect(decision.relevantRule.temp).toBe(overrides[0].targetTemp);
        expect(decision.relevantRule.label.includes(overrides[0].reason)).toBe(true);
        expect(decision.nextRuleStartsAt.toISOString()).toBe(overrides[0].holdUntil);
    });

    test("Picks the currently scheduled rule", () => {
        const scheduleOpts = [mockScheduleRules, mockScheduleRules.slice().reverse()];
        for (const s of scheduleOpts) {
            const decision = makeRuleDecision("cool", mockTempSensor, s, [], tz, weather);
            expect(decision.ruleType).toBe("schedule");
            expect(decision.relevantRule.temp).toBe(mockScheduleRules[0].temp);
            expect(decision.relevantRule.label.includes(mockScheduleRules[0].label)).toBe(true);
        }
    });
});

describe("processThermostat", () => {
    test("Only processes heat or cool states", async () => {
        const result = await processSystem(
            "other",
            { ...mockCoolingThermostatState, state: "range" },
            [mockTempSensor],
            [],
            [{ sensor: mockTempSensor.entity_id, rules: mockScheduleRules }],
            [],
            weather,
            tz
        );
        expect(result.newThermostatStatus.targetTempType).toBe("off");
        expect(result.newTargetTemperature).toBe(String(mockCoolingThermostatState.attributes.current_temperature));
    });

    test("Triggers protection mode when cold outside", async () => {
        const result = await processSystem(
            "other",
            mockCoolingThermostatState,
            [mockTempSensor],
            [],
            [{ sensor: mockTempSensor.entity_id, rules: mockScheduleRules }],
            [],
            { condition: "cloudy", externalTemperature: 50 },
            tz
        );
        expect(result.newTargetTemperature).toBe(String(MAX_TEMP));
    });

    test("Returns the correct basic structure", async () => {
        const result = await processSystem(
            mockTempSensor.entity_id,
            mockCoolingThermostatState,
            [mockTempSensor],
            [],
            [{ sensor: mockTempSensor.entity_id, rules: mockScheduleRules }],
            [],
            weather,
            tz
        );

        expect(result.newTargetTemperature).toBe(String(mockCoolingSensorStatus.desiredThermostatSetting));
        expect(result.newThermostatStatus.activeSensor).toBe(mockTempSensor.entity_id);
        expect(result.newThermostatStatus.targetTempType).toBe(mockCoolingThermostatState.state);
        expect(result.newSensorStatuses.length).toBe(1);
    });
});
