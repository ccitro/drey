import { Icon, IconifyIcon } from "@iconify-icon/react";
import star from "@iconify-icons/mdi/star";
import thermostat from "@iconify-icons/mdi/thermostat";
import { Stack, Tooltip } from "@mantine/core";

interface SensorIconsProps {
    isActiveSensor: boolean;
    isThermostatSensor: boolean;
}

function SensorIcon({ label, icon }: { label: string; icon: IconifyIcon }) {
    return (
        <Tooltip label={label}>
            <Icon icon={icon} height={20} />
        </Tooltip>
    );
}

export function SensorIcons({ isActiveSensor, isThermostatSensor }: SensorIconsProps) {
    return (
        <Stack sx={{ width: "16px" }}>
            {isActiveSensor && <SensorIcon icon={star} label="This sensor is dictating how the thermostat is set" />}
            {isThermostatSensor && <SensorIcon icon={thermostat} label="This is the thermostat's main sensor" />}
        </Stack>
    );
}
