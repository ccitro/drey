import { Container, Title } from "@mantine/core";
import { NextPage } from "next";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { getConfig } from "server/stores/config";
import { getSystemStates } from "server/stores/system-state";
import { importEditorConfig } from "store/configEditorSlice";
import { importLiveConfig } from "store/liveConfigSlice";
import { wrapper } from "store/store";
import { importStates } from "store/systemStatesSlice";

function linkThermostat(id: string): string {
    return "/thermostat/" + id.split(".")[1];
}

export const getServerSideProps = wrapper.getServerSideProps((store) => async () => {
    // preload the redux store
    const config = getConfig();
    const systems = getSystemStates();
    store.dispatch(importStates(systems));
    store.dispatch(importLiveConfig(config));
    store.dispatch(importEditorConfig(config));

    const keys = Object.keys(systems);

    let redirect = "";
    if (keys.length === 0) {
        redirect = "/config";
    } else if (keys.length === 1) {
        redirect = linkThermostat(keys[0]);
    }

    if (redirect !== "") {
        return {
            redirect: {
                permanent: false,
                destination: redirect,
            },
        };
    }

    return { props: { systemStates: systems } };
});

interface HomeProps {
    systemStates: SystemStates;
}

const Home: NextPage<HomeProps> = ({ systemStates }) => {
    const router = useRouter();

    useEffect(() => {
        const keys = Object.keys(systemStates);
        if (keys.length === 0) {
            void router.push("/config");
        } else if (keys.length === 1) {
            void router.push(linkThermostat(keys[0]));
        }
    }, [router, systemStates]);

    const keys = Object.keys(systemStates);
    if (keys.length < 2) {
        return <span>Redirecting, please wait...</span>;
    }

    return (
        <Container size="sm" my="lg">
            <Title order={3}>Select a Thermostat / System</Title>
            <ul>
                {keys.map((k) => (
                    <li key={k}>
                        <Link href={linkThermostat(k)}>{k}</Link>
                    </li>
                ))}
            </ul>
        </Container>
    );
};

export default Home;
