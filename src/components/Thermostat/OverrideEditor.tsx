import { Button, Group, Modal, Stack, Text, TextInput } from "@mantine/core";
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
        <Modal opened={opened} onClose={cancel} title={`Override for ${sensorStatus?.label ?? ""}`}>
            {opened && (
                <Stack spacing="md">
                    <Text color="dimmed" size="sm">
                        Will last until {localTime(sensorStatus.ruleEndsAt)}
                    </Text>
                    <TextInput
                        onFocus={(e) => e.target.select()}
                        onKeyUp={(e) => e.key === "Enter" && setOverride()}
                        data-autofocus
                        value={overrideTemp}
                        type="number"
                        onChange={(e) => setOverrideTemp(parseFloat(e.target.value))}
                    />
                    <Group position="right">
                        {sensorStatus.ruleType === "override" && (
                            <Button color="red" onClick={deleteOverride}>
                                Delete
                            </Button>
                        )}
                        <Button onClick={setOverride}>Set</Button>
                    </Group>
                </Stack>
            )}
        </Modal>
    );
}
