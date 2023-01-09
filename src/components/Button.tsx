import React from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant: "default" | "danger";
};

export default function Button(props: React.PropsWithChildren<ButtonProps>) {
    return (
        <button
            {...props}
            className={`
                ${props.variant === "danger" ? "bg-rose-600" : "bg-blue-700"}
                ${props.variant === "danger" ? "hover:bg-rose-700" : "hover:bg-blue-800"}
                disabled:bg-zinc-700 disabled:text-zinc-800
                p-2 text-sm leading-5 rounded-md font-semibold text-white min-w-[4rem]
                ${props.className ?? ""}
                `}
        >
            {props.children}
        </button>
    );
}
