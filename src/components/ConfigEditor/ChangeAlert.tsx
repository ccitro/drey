import { Icon } from "@iconify-icon/react";
import alertCircle from "@iconify-icons/mdi/alert-circle";
import { Alert } from "@mantine/core";

export function ChangeAlert() {
    return (
        <Alert icon={<Icon icon={alertCircle} />} color="red">
            The config has been changed by an external source. Discard your changes to view the new config.
        </Alert>
    );
}
