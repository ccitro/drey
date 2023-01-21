import { Icon } from "@iconify-icon/react";
import signalOff from "@iconify-icons/mdi/signal-off";
import Tooltip from "components/Tooltip";
import React, { useEffect, useMemo, useState } from "react";
import { useAppSelector } from "store/store";

const MAX_AGE_SECONDS = 60;
const formatter = new Intl.DateTimeFormat("en-US", { timeStyle: "short" } as unknown as Intl.DateTimeFormatOptions);

function disconnectsInSeconds(date: Date): number {
    const ageSeconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    return MAX_AGE_SECONDS - ageSeconds;
}

export default function LastUpdated() {
    const lastCommunicationStr = useAppSelector((state) => state.connectivity.lastCommunication);
    const lastCommunication = useMemo(() => new Date(lastCommunicationStr), [lastCommunicationStr]);
    const [timeText, setTimeText] = useState("Connecting...");
    const [disconnected, setDisconnected] = useState<boolean>(disconnectsInSeconds(lastCommunication) < 0);

    useEffect(() => {
        setTimeText(`Last updated ${formatter.format(lastCommunication)}`);
        const disconnectsIn = disconnectsInSeconds(lastCommunication);
        setDisconnected(disconnectsIn <= 0);
        if (disconnectsIn > 0) {
            const timer = setTimeout(() => setDisconnected(true), disconnectsIn * 1000);
            return () => clearTimeout(timer);
        }
    }, [lastCommunication]);

    const spacer = <div className="w-4" />;

    return (
        <div className="mx-auto flex items-center">
            {disconnected && (
                <Tooltip title="Reconnecting...">
                    <Icon icon={signalOff} height={14} />
                </Tooltip>
            )}
            {!disconnected && spacer}
            <span className="p-2 text-center text-neutral-500 text-sm">{timeText}</span>
            {spacer}
        </div>
    );
}
