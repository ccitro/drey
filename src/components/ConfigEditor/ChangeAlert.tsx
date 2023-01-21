import { Icon } from "@iconify-icon/react";
import alertCircle from "@iconify-icons/mdi/alert-circle";

export function ChangeAlert() {
    return (
        <div className="flex space-x-3 bg-rose-900 p-3 rounded-lg m-2 align-top">
            <Icon icon={alertCircle} className="my-1" />
            <div>The config has been changed by an external source. Discard your changes to view the new config.</div>
        </div>
    );
}
