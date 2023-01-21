import { Icon, IconifyIcon } from "@iconify-icon/react";
import Link from "next/link";

interface TopIconProps {
    href: string;
    icon: IconifyIcon;
    label: string;
}

export function TopIcon({ href, icon, label }: TopIconProps) {
    return (
        <Link href={href} passHref>
            <button
                className="absolute top-2 right-2 cursor-pointer text-white rounded-full p-2 flex place-content-center hover:bg-gray-700 active:bg-gray-500"
                title={label}
            >
                <Icon icon={icon} width={24} />
            </button>
        </Link>
    );
}
