import { Icon } from "@iconify-icon/react";
import plus from "@iconify-icons/mdi/plus";
import sortNumericAscending from "@iconify-icons/mdi/sort-numeric-ascending";
import trashCan from "@iconify-icons/mdi/trash-can";
import { ActionIcon, Box, Group, Loader, Stack, Text, TextInput } from "@mantine/core";
import { TimeInput } from "@mantine/dates";
import dayjs from "dayjs";
import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";

import {
    deleteRule,
    insertRule,
    selectEditorSystemSensorRules,
    sortModeRules,
    updateRuleField,
} from "../../store/configEditorSlice";
import { useAppSelector } from "../../store/store";

interface ScheduleRulesEditorProps {
    type: OperationMode;
    systemSeq: number;
    sensorSeq: number;
}

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function ScheduleRulesEditor({ type, systemSeq, sensorSeq }: ScheduleRulesEditorProps) {
    const rules = useAppSelector((state) => selectEditorSystemSensorRules(state, systemSeq, sensorSeq, type));

    const dispatch = useDispatch();
    const [frontendLoaded, setFrontendLoaded] = useState(false);
    useEffect(() => setFrontendLoaded(true), []);

    if (!frontendLoaded) {
        return <Loader variant="dots" />;
    }

    const onSortClick = () => dispatch(sortModeRules({ type, systemSeq, sensorSeq }));
    let ruleSeq = -1;
    return (
        <Stack
            sx={{
                "> div > div:nth-of-type(1)": {
                    width: "80px",
                },
                "> div > div:nth-of-type(2)": {
                    width: "35px",
                },
                "> div > div:nth-of-type(3)": {
                    width: "calc(100% - 35px - 80px - 25px)",
                },
                "> div > div:nth-of-type(4)": {
                    width: "25px",
                },
            }}
        >
            <Group position="apart">
                <Text sx={{ whiteSpace: "nowrap" }} size="md">
                    {type.charAt(0).toUpperCase() + type.slice(1)}ing Rules
                </Text>
                <ActionIcon title="Sort rules" variant="outline" size="md" onClick={onSortClick}>
                    <Icon icon={sortNumericAscending} />
                </ActionIcon>
            </Group>
            {dayNames.map((dayName, daySeq) => {
                const dayRules = rules.filter((r) => r.day === daySeq);
                return (
                    <React.Fragment key={daySeq}>
                        <Group position="apart">
                            <Text size="md" color="dimmed" pt="sm" px="xs">
                                {dayName}
                            </Text>

                            <ActionIcon
                                title="Add rule to day"
                                color="green"
                                variant="outline"
                                size="xs"
                                onClick={() => dispatch(insertRule({ systemSeq, sensorSeq, type, daySeq }))}
                            >
                                <Icon icon={plus} />
                            </ActionIcon>
                        </Group>
                        {dayRules.map((rule) => {
                            ruleSeq++;
                            return (
                                <DayRule
                                    key={ruleSeq}
                                    systemSeq={systemSeq}
                                    sensorSeq={sensorSeq}
                                    ruleSeq={ruleSeq}
                                    type={type}
                                    rule={rule}
                                />
                            );
                        })}
                    </React.Fragment>
                );
            })}
        </Stack>
    );
}

const DayRule = React.memo(({ type, systemSeq, sensorSeq, ruleSeq, rule }: DayRuleProps) => {
    const dispatch = useDispatch();

    return (
        <Group spacing={0}>
            <Box>
                <TimeInput
                    size="xs"
                    format="12"
                    value={buildDate(rule.time)}
                    onChange={(d) =>
                        dispatch(
                            updateRuleField({
                                systemSeq,
                                sensorSeq,
                                type,
                                ruleSeq,
                                key: "time",
                                value: String(buildTime(d)),
                            })
                        )
                    }
                />
            </Box>
            <Box>
                <TextInput
                    size="xs"
                    placeholder="72"
                    value={rule.temp}
                    onChange={(e) =>
                        dispatch(
                            updateRuleField({
                                systemSeq,
                                sensorSeq,
                                type,
                                ruleSeq,
                                key: "temp",
                                value: e.target.value,
                            })
                        )
                    }
                />
            </Box>
            <Box>
                <TextInput
                    size="xs"
                    placeholder="My Room"
                    value={rule.label}
                    onChange={(e) =>
                        dispatch(
                            updateRuleField({
                                systemSeq,
                                sensorSeq,
                                type,
                                ruleSeq,
                                key: "label",
                                value: e.target.value,
                            })
                        )
                    }
                />
            </Box>
            <Box>
                <ActionIcon
                    title="Delete rule"
                    color="red"
                    size="md"
                    variant="filled"
                    onClick={() => dispatch(deleteRule({ systemSeq, sensorSeq, type, ruleSeq }))}
                >
                    <Icon icon={trashCan} />
                </ActionIcon>
            </Box>
        </Group>
    );
});
DayRule.displayName = "DayRule";

interface DayRuleProps {
    systemSeq: number;
    sensorSeq: number;
    ruleSeq: number;
    type: OperationMode;
    rule: ScheduleRule;
}

function buildDate(mins: number) {
    return dayjs()
        .second(0)
        .hour(Math.floor(mins / 60))
        .minute(mins % 60)
        .toDate();
}

function buildTime(date: Date): number {
    const d = dayjs(date);
    return d.minute() + d.hour() * 60;
}
