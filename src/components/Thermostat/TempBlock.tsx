import { Stack, Text, Tooltip } from "@mantine/core";

interface TempBlockProps {
    temp: string;
    label: string;
    tip: string;
    onClick?: (() => void) | undefined;
}

export function TempBlock({ temp, label, tip, onClick }: TempBlockProps) {
    return (
        <Stack sx={{ width: "65px", textAlign: "center", userSelect: "none" }} spacing={0}>
            <Text onClick={onClick} sx={{ fontSize: "24px", cursor: onClick ? "pointer" : "inherit" }}>
                {temp}
            </Text>
            <Tooltip label={tip}>
                <Text sx={{ cursor: "help", textDecoration: "underline dashed" }}>{label}</Text>
            </Tooltip>
        </Stack>
    );
}
