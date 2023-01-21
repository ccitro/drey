import React from "react";

interface TooltipProps {
    title: string;
    className?: string;
}

export default function Tooltip(props: React.PropsWithChildren<TooltipProps>) {
    return (
        <div className={`relative flex flex-col items-center group ` + (props.className ?? "")}>
            {props.children}
            <div className="absolute bottom-0 flex-col items-center hidden z-10 mb-6 group-hover:flex">
                <span className="whitespace-nowrap relative z-10 p-4 text-xs leading-none text-white  bg-neutral-800 rounded-md shadow-lg">
                    {props.title}
                </span>
                <div className="w-3 h-3 -mt-2 rotate-45 bg-neutral-800"></div>
            </div>
        </div>
    );
}
