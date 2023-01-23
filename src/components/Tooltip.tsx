import "tippy.js/dist/tippy.css";

import Tippy from "@tippyjs/react";
import React from "react";

interface TooltipProps {
    title: string;
    className?: string;
}

export default function Tooltip(props: React.PropsWithChildren<TooltipProps>) {
    /* eslint-disable */
    const c = props.children as React.ReactElement<any>;
    return (
        <div className={`flex flex-col ${props.className ?? ""}`}>
            <Tippy content={props.title}>{c}</Tippy>
        </div>
    );
}
