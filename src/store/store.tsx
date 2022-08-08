import { Action, configureStore, ThunkAction } from "@reduxjs/toolkit";
import { createWrapper } from "next-redux-wrapper";
import { TypedUseSelectorHook, useSelector } from "react-redux";
import { API_BASE } from "services/api";

import { configEditorSlice, importEditorConfig } from "./configEditorSlice";
import { communicationReceived, connectivitySlice } from "./connectivitySlice";
import { liveConfigSlice } from "./liveConfigSlice";
import { importStates, systemStatesSlice } from "./systemStatesSlice";

let eventSource: EventSource | null = null;

const isStateApiEvent = (e: ApiEvent): e is StateApiEvent => (e as unknown as StateApiEvent)?.eventType === "STATE";
const isConfigApiEvent = (e: ApiEvent): e is ConfigApiEvent => (e as unknown as ConfigApiEvent)?.eventType === "CONFIG";

export function setupEventSource(store: AppStore) {
    // only setup on client
    if (typeof window === "undefined") {
        return;
    }

    if (eventSource) {
        throw new Error("Unexpected re-initalization of event source");
    }

    eventSource = new EventSource(API_BASE + "/event-stream");
    eventSource.onmessage = (event) => {
        const e: ApiEvent = JSON.parse(event.data) as ApiEvent;
        if (isStateApiEvent(e)) {
            store.dispatch(importStates(e.payload));
        } else if (isConfigApiEvent(e)) {
            store.dispatch(importEditorConfig(e.payload));
        }
        store.dispatch(communicationReceived());
    };
}

function makeStore() {
    const store = configureStore({
        reducer: {
            [configEditorSlice.name]: configEditorSlice.reducer,
            [liveConfigSlice.name]: liveConfigSlice.reducer,
            [systemStatesSlice.name]: systemStatesSlice.reducer,
            [connectivitySlice.name]: connectivitySlice.reducer,
        },
        devTools: true,
    });

    setupEventSource(store);

    return store;
}

export type AppStore = ReturnType<typeof makeStore>;
export type AppState = ReturnType<AppStore["getState"]>;
export type AppThunk<ReturnType = void> = ThunkAction<ReturnType, AppState, unknown, Action>;

export const wrapper = createWrapper<AppStore>(makeStore);
export const useAppSelector: TypedUseSelectorHook<AppState> = useSelector;
