import React from "react";

interface TooltipProps {
    title: string;
    className?: string;
}

export default function Tooltip(props: React.PropsWithChildren<TooltipProps>) {
    return (
        <div className={`flex ${props.className ?? ""}`} title={props.title}>
            {props.children}
        </div>
    );
}
