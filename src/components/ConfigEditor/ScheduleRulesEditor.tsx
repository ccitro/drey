import { Icon } from "@iconify-icon/react";
import plus from "@iconify-icons/mdi/plus";
import sortNumericAscending from "@iconify-icons/mdi/sort-numeric-ascending";
import trashCan from "@iconify-icons/mdi/trash-can";
import { ActionIcon } from "components/ActionIcon";
import Input from "components/Input";
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
        return <div>Loading...</div>;
    }

    const onSortClick = () => dispatch(sortModeRules({ type, systemSeq, sensorSeq }));
    let ruleSeq = -1;
    return (
        <div className="flex flex-col space-y-4">
            <div className="flex justify-between">
                <div className="whitespace-nowrap">{type.charAt(0).toUpperCase() + type.slice(1)}ing Rules</div>
                <ActionIcon
                    title="Sort rules"
                    className="border border-white-600 text-white-600 hover:bg-neutral-600 rounded-lg"
                    size={16}
                    icon={sortNumericAscending}
                    onClick={onSortClick}
                />
            </div>
            {dayNames.map((dayName, daySeq) => {
                const dayRules = rules.filter((r) => r.day === daySeq);
                return (
                    <div key={daySeq}>
                        <div className="flex justify-between mb-2">
                            <div className="text-neutral-400">{dayName}</div>

                            <ActionIcon
                                title="Add rule to day"
                                className="border border-green-400 text-green-400 hover:bg-green-900 rounded-lg"
                                size={16}
                                icon={plus}
                                onClick={() => dispatch(insertRule({ systemSeq, sensorSeq, type, daySeq }))}
                            />
                        </div>
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
                    </div>
                );
            })}
        </div>
    );
}

const DayRule = React.memo(({ type, systemSeq, sensorSeq, ruleSeq, rule }: DayRuleProps) => {
    const dispatch = useDispatch();

    return (
        <div className="flex items-center space-x-2 mb-2">
            <Input
                type="time"
                className="h-7 w-28"
                value={buildDate(rule.time)}
                onChange={(e) =>
                    dispatch(
                        updateRuleField({
                            systemSeq,
                            sensorSeq,
                            type,
                            ruleSeq,
                            key: "time",
                            value: String(buildTime(e.target.value)),
                        })
                    )
                }
            />
            <Input
                placeholder="72"
                className="h-7 w-9"
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
            <Input
                placeholder="My Room"
                value={rule.label}
                className="h-7"
                holderClassName="flex-grow"
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
            <button
                title="Delete Rule"
                className="bg-rose-600 w-7 h-7 rounded-sm flex items-center justify-center hover:bg-rose-700"
                onClick={() => dispatch(deleteRule({ systemSeq, sensorSeq, type, ruleSeq }))}
            >
                <Icon width={16} icon={trashCan} />
            </button>
        </div>
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
        .format("HH:mm");
}

function buildTime(date: string): number | null {
    const pattern = /^\d{2}:\d{2}$/;
    if (!date.match(pattern)) {
        return null;
    }
    const [hours, mins] = date.split(":");
    return parseInt(hours) * 60 + parseInt(mins);
}
