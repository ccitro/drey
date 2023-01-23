import { Icon, IconifyIcon } from "@iconify-icon/react";
import star from "@iconify-icons/mdi/star";
import thermostat from "@iconify-icons/mdi/thermostat";
import Tooltip from "components/Tooltip";

interface SensorIconsProps {
    isActiveSensor: boolean;
    isThermostatSensor: boolean;
}

function SensorIcon({ label, icon }: { label: string; icon: IconifyIcon }) {
    return (
        <Tooltip title={label}>
            <Icon icon={icon} height={20} />
        </Tooltip>
    );
}

export function SensorIcons({ isActiveSensor, isThermostatSensor }: SensorIconsProps) {
    return (
        <div className="w-4 flex flex-col space-y-2 items-center">
            {isActiveSensor && <SensorIcon icon={star} label="This sensor is dictating how the thermostat is set" />}
            {isThermostatSensor && <SensorIcon icon={thermostat} label="This is the thermostat's main sensor" />}
        </div>
    );
}
