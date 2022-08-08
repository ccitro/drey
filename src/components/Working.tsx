import { Group, Loader, Modal, Text } from "@mantine/core";

export default function Working({ working }: { working: boolean }) {
    return (
        <Modal opened={working} withCloseButton={false} onClose={() => undefined}>
            <Group>
                <Loader />
                <Text>Working...</Text>
            </Group>
        </Modal>
    );
}
