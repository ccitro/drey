import { Icon, IconifyIcon } from "@iconify-icon/react";

interface ActionIconProps {
    icon: IconifyIcon;
    title?: string;
    size?: number;
    className?: string;
    onClick: () => unknown;
}

export function ActionIcon(props: ActionIconProps) {
    return (
        <button
            className={`cursor-pointer p-1 flex place-content-center ${props.className ?? ""}`}
            title={props.title}
            onClick={props.onClick}
        >
            <Icon icon={props.icon} width={props.size ?? 24} />
        </button>
    );
}

export function RoundActionIcon(props: ActionIconProps) {
    const localProps = {
        ...props,
        className: `${props.className ?? ""}`,
    };

    return <ActionIcon {...localProps} />;
}
