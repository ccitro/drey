import Tooltip from "components/Tooltip";

interface TempBlockProps {
    temp: string;
    label: string;
    tip: string;
    onClick?: (() => void) | undefined;
}

export function TempBlock({ temp, label, tip, onClick }: TempBlockProps) {
    return (
        <div className="w-16 text-center select-none flex flex-col">
            <button onClick={onClick} className={`text-2xl ${onClick ? "cursor-pointer" : "cursor-default"}`}>
                {temp}
            </button>
            <Tooltip className="mx-auto" title={tip}>
                <div className="w-max cursor-help underline decoration-dashed">{label}</div>
            </Tooltip>
        </div>
    );
}
