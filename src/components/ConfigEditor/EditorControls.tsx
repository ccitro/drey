import { Button, CopyButton, Group } from "@mantine/core";

interface EditorControlsProps {
    config: DreyConfig;
    configChanged: boolean;
    onSaveClick: () => void;
    onDiscardClick: () => void;
    onImportClick: () => void;
}

export function EditorControls({
    config,
    configChanged,
    onSaveClick,
    onDiscardClick,
    onImportClick,
}: EditorControlsProps) {
    return (
        <Group position="apart" my="md">
            <Group>
                <Button disabled={!configChanged} onClick={onSaveClick}>
                    Save
                </Button>
                <Button color="red" disabled={!configChanged} onClick={onDiscardClick}>
                    Discard
                </Button>
            </Group>
            <Group>
                <CopyButton value={JSON.stringify(config)}>
                    {({ copied, copy }) => (
                        <Button sx={{ width: "140px" }} color={copied ? "teal" : "blue"} onClick={copy}>
                            {copied ? "Copied Config" : "Export Config"}
                        </Button>
                    )}
                </CopyButton>
                <Button onClick={onImportClick}>Import Config</Button>
            </Group>
        </Group>
    );
}
