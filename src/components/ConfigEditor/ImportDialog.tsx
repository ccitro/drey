import Button from "components/Button";
import DreyDialog from "components/DreyDialog";
import { useRef } from "react";

interface ImportDialogProps {
    opened: boolean;
    onClose: () => void;
    onSave: (newConfigJson: string) => void;
}

export function ImportDialog({ opened, onClose, onSave }: ImportDialogProps) {
    const importRef = useRef<HTMLTextAreaElement>(null);

    return (
        <DreyDialog open={opened} onClose={onClose} fullScreen={true}>
            <h3 className="text-lg font-bold mb-4">Import Config</h3>
            <div className="grow w-fill h-fill flex flex-col">
                <textarea
                    ref={importRef}
                    className={`
                block w-fill grow p-4 bg-neutral-700 border border-neutral-600 rounded-md text-sm shadow-sm placeholder-slate-300
                focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500
                disabled:bg-slate-500 disabled:text-slate-800 disabled:border-slate-800 disabled:shadow-none
                `}
                />

                <div className="flex flex-none ml-auto space-x-2 mt-4">
                    <Button variant="danger" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button variant="default" onClick={() => onSave(importRef.current?.value ?? "")}>
                        Import
                    </Button>
                </div>
            </div>
        </DreyDialog>
    );
}
