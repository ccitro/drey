import Button from "components/Button";
import { useCallback, useState } from "react";

interface EditorControlsProps {
    config: DreyConfig;
    configChanged: boolean;
    onSaveClick: () => void;
    onDiscardClick: () => void;
    onImportClick: () => void;
}

export function EditorControls({
    config,
    configChanged,
    onSaveClick,
    onDiscardClick,
    onImportClick,
}: EditorControlsProps) {
    const [copied, setCopied] = useState(false);
    const onCopyClick = useCallback(async () => {
        await navigator.clipboard.writeText(JSON.stringify(config));
        setCopied(true);
        setTimeout(() => {
            setCopied(false);
        }, 2000);
    }, [config]);
    return (
        <div className="flex justify-between my-4">
            <div className="flex space-x-3">
                <Button variant="default" disabled={!configChanged} onClick={onSaveClick}>
                    Save
                </Button>
                <Button variant="danger" disabled={!configChanged} onClick={onDiscardClick}>
                    Discard
                </Button>
            </div>
            <div className="flex space-x-3">
                <Button variant="default" onClick={onCopyClick} className="w-20">
                    {copied ? "Copied!" : "Export"}
                </Button>
                <Button variant="default" onClick={onImportClick} className="w-20">
                    Import
                </Button>
            </div>
        </div>
    );
}
