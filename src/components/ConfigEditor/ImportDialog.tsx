import { Box, Button, Group, Modal, Stack, Textarea } from "@mantine/core";
import { useRef } from "react";

interface ImportDialogProps {
    opened: boolean;
    onClose: () => void;
    onSave: (newConfigJson: string) => void;
}

export function ImportDialog({ opened, onClose, onSave }: ImportDialogProps) {
    const importRef = useRef<HTMLTextAreaElement>(null);

    return (
        <Modal opened={opened} fullScreen onClose={onClose} title="Import Config">
            <Stack spacing="md">
                <Box sx={{ textarea: { height: "calc(100vh - 150px)" } }}>
                    <Textarea sx={{ height: "calc(100vh - 150px)" }} ref={importRef} />
                </Box>

                <Group position="right">
                    <Button color="red" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={() => onSave(importRef.current?.value ?? "")}>Import</Button>
                </Group>
            </Stack>
        </Modal>
    );
}
