import { Icon } from "@iconify-icon/react";
import alertCircle from "@iconify-icons/mdi/alert-circle";
import close from "@iconify-icons/mdi/close";
import { showNotification } from "@mantine/notifications";
import { TopIcon } from "components/TopIcon";
import { NextPage } from "next";
import { useCallback, useState } from "react";
import { getConfig } from "server/stores/config";
import { getSystemStates } from "server/stores/system-state";
import { importEditorConfig } from "store/configEditorSlice";
import { importLiveConfig } from "store/liveConfigSlice";
import { useAppSelector, wrapper } from "store/store";
import { importStates } from "store/systemStatesSlice";

import ConfigEditor from "../components/ConfigEditor/ConfigEditor";
import Working from "../components/Working";
import { saveConfig } from "../services/api";

export const getServerSideProps = wrapper.getServerSideProps((store) => async () => {
    // preload the redux store
    const config = getConfig();
    const systems = getSystemStates();
    store.dispatch(importStates(systems));
    store.dispatch(importLiveConfig(config));
    store.dispatch(importEditorConfig(config));

    return { props: {} };
});

const Config: NextPage = () => {
    const config = useAppSelector((state) => state.configEditor.dreyConfig);
    const [working, setWorking] = useState(false);

    const onSaveRequest = useCallback(
        async (newConfigJson: string): Promise<boolean> => {
            if (working) {
                return false;
            }
            setWorking(true);
            const r = await saveConfig(newConfigJson);
            setWorking(false);
            if (r) {
                showNotification({
                    icon: <Icon icon={alertCircle} />,
                    color: "red",
                    title: "Failed to update config",
                    message: r,
                });
                return false;
            }

            showNotification({ message: "Config updated!" });
            return true;
        },
        [working]
    );

    return (
        <div>
            {config.configs.length > 0 && <TopIcon icon={close} href="/" label="Close" />}
            <Working working={working} />
            <ConfigEditor onSaveRequest={onSaveRequest} />
        </div>
    );
};

export default Config;
