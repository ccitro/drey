import Button from "components/Button";
import DreyDialog from "components/DreyDialog";
import { useState } from "react";

type OverrideEditorProps = {
    opened: boolean;
    sensorStatus: SensorStatus;
    onResult: (result: ModalOverrideResult) => void;
};

export interface ModalOverrideResult {
    actionChosen: "noop" | "delete" | "set";
    newOverrideTemp?: number;
}

function localTime(isoTime: string): string {
    return new Date(isoTime).toLocaleString().split(", ")[1].replace(":00 ", " ");
}

export default function OverrideEditor({ opened, sensorStatus, onResult }: OverrideEditorProps) {
    const [overrideTemp, setOverrideTemp] = useState<number>(sensorStatus?.ruleTemp ?? 0);
    const setOverride = () => onResult({ actionChosen: "set", newOverrideTemp: overrideTemp ?? 70 });
    const deleteOverride = () => onResult({ actionChosen: "delete" });
    const cancel = () => onResult({ actionChosen: "noop" });

    return (
        <DreyDialog open={opened} onClose={cancel}>
            {opened && (
                <div className="flex flex-col space-y-4">
                    <h2>Override for {sensorStatus?.label ?? ""}</h2>
                    <div className="text-neutral-500 text-sm">Will last until {localTime(sensorStatus.ruleEndsAt)}</div>
                    <input
                        className="rounded-md p-3"
                        onFocus={(e) => e.target.select()}
                        onKeyUp={(e) => e.key === "Enter" && setOverride()}
                        data-autofocus
                        value={overrideTemp}
                        type="number"
                        onChange={(e) => setOverrideTemp(parseFloat(e.target.value))}
                    />
                    <div className="flex ml-auto space-x-2">
                        {sensorStatus.ruleType === "override" && (
                            <Button variant="danger" onClick={deleteOverride}>
                                Delete
                            </Button>
                        )}
                        <Button variant="default" onClick={setOverride}>
                            Set
                        </Button>
                    </div>
                </div>
            )}
        </DreyDialog>
    );
}
