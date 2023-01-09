import React from "react";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
    label?: string;
    holderClassName?: string;
};

export default function Input(props: React.PropsWithChildren<InputProps>) {
    const nativeProps = { ...props };
    delete nativeProps["label"];
    delete nativeProps["holderClassName"];
    return (
        <div className={props.holderClassName}>
            {props.label && <div className="text-sm">{props.label}</div>}
            <input
                {...nativeProps}
                className={`
                block w-full p-2 bg-zinc-900 border border-zinc-700 rounded-md text-sm shadow-sm placeholder-zinc-500
                focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500
                disabled:bg-slate-500 disabled:text-slate-800 disabled:border-slate-800 disabled:shadow-none
                ${props.className ?? ""}
                `}
            />
        </div>
    );
}
