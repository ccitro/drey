import { IconifyIcon } from "@iconify-icon/react";
import Link from "next/link";

import { ActionIcon } from "./ActionIcon";

interface TopIconProps {
    href: string;
    icon: IconifyIcon;
    label: string;
}

export function TopIcon({ href, icon, label }: TopIconProps) {
    return (
        <Link href={href} passHref className="absolute top-2 right-2">
            <ActionIcon
                title={label}
                icon={icon}
                size={24}
                onClick={() => undefined}
                className="text-white rounded-full hover:bg-gray-700 active:bg-gray-500"
            />
        </Link>
    );
}
