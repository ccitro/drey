import { Icon, IconifyIcon } from "@iconify-icon/react";
import { ActionIcon } from "@mantine/core";
import Link from "next/link";

interface TopIconProps {
    href: string;
    icon: IconifyIcon;
    label: string;
}

export function TopIcon({ href, icon, label }: TopIconProps) {
    return (
        <Link href={href} passHref>
            <ActionIcon sx={{ position: "absolute", top: "16px", right: "16px", cursor: "pointer" }} title={label}>
                <Icon icon={icon} width={24} />
            </ActionIcon>
        </Link>
    );
}
