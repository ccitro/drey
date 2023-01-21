import React from "react";

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export default function Input(props: React.PropsWithChildren<InputProps>) {
    return (
        <input
            {...props}
            className={`
                block w-full p-4 bg-neutral-700 border border-neutral-600 rounded-md text-sm shadow-sm placeholder-slate-300
                focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500
                disabled:bg-slate-500 disabled:text-slate-800 disabled:border-slate-800 disabled:shadow-none
                ${props.className ?? ""}
                `}
        />
    );
}
