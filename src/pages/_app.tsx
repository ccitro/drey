import { MantineProvider } from "@mantine/core";
import { NotificationsProvider } from "@mantine/notifications";
import type { AppProps } from "next/app";
import Head from "next/head";
import React from "react";
import { Provider } from "react-redux";
import { wrapper } from "store/store";

const MyApp: React.FC<AppProps> = ({ Component, ...rest }) => {
    const { store, props } = wrapper.useWrappedStore(rest);

    return (
        <Provider store={store}>
            <React.StrictMode>
                <MantineProvider theme={{ colorScheme: "dark" }} withGlobalStyles withNormalizeCSS>
                    <NotificationsProvider>
                        <div>
                            <Head>
                                <link rel="icon" type="image/svg+xml" href="/favicon.ico" />
                                <link rel="manifest" href="/manifest.json" />
                                <link rel="apple-touch-icon" href="/logo192.png" />
                                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                                <meta name="description" content="Drey " />
                                <meta name="theme-color" content="#000000" />
                                <title>Drey</title>
                            </Head>
                            <Component {...props.pageProps} />
                        </div>
                    </NotificationsProvider>
                </MantineProvider>
            </React.StrictMode>
        </Provider>
    );
};

export default MyApp;
