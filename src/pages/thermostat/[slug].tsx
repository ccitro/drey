import cog from "@iconify-icons/mdi/cog";
import LastUpdated from "components/Thermostat/LastUpdated";
import Plan from "components/Thermostat/Plan";
import SensorRows from "components/Thermostat/SensorRows";
import ThermostatDial from "components/Thermostat/ThermostatDial";
import { TopIcon } from "components/TopIcon";
import { NextPage } from "next";
import { getConfig } from "server/stores/config";
import { getSystemStates } from "server/stores/system-state";
import { importEditorConfig } from "store/configEditorSlice";
import { importLiveConfig } from "store/liveConfigSlice";
import { wrapper } from "store/store";
import { importStates } from "store/systemStatesSlice";

export const getServerSideProps = wrapper.getServerSideProps((store) => async (context) => {
    const slug = context.params?.slug ?? "";
    if (typeof slug !== "string" || slug === "") {
        console.log("Missing slug");
        return { notFound: true };
    }

    const systems = getSystemStates();
    const config = getConfig();
    const thermostat = `climate.${slug ?? ""}`;
    if (!(thermostat in systems)) {
        console.log("Thermostat not in systems", systems);
        return { notFound: true };
    }

    // preload the redux store
    store.dispatch(importStates(systems));
    store.dispatch(importLiveConfig(config));
    store.dispatch(importEditorConfig(config));

    return { props: { thermostat } };
});

interface ThermostatProps {
    thermostat: string;
}

const Thermostat: NextPage<ThermostatProps> = ({ thermostat }) => {
    return (
        <div className="mx-auto w-[32rem] h-screen flex flex-col">
            <TopIcon icon={cog} href="/config" label="Config" />
            <ThermostatDial thermostat={thermostat} />
            <SensorRows thermostat={thermostat} />
            <div className="h-3" />
            <Plan thermostat={thermostat} />
            <div className="grow" />
            <LastUpdated />
        </div>
    );
};

export default Thermostat;
