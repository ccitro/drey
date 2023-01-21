import React from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant: "default" | "danger";
};

export default function Button(props: React.PropsWithChildren<ButtonProps>) {
    return (
        <button
            {...props}
            className={
                `p-2 rounded-md border-2 min-w-[4rem] text-white ` +
                (props.variant === "danger" ? "bg-rose-600" : "bg-blue-700") +
                (props.className ?? "")
            }
        >
            {props.children}
        </button>
    );
}
