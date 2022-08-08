import { createSlice } from "@reduxjs/toolkit";
import { HYDRATE } from "next-redux-wrapper";

interface ConnectivityState {
    connected: boolean;
    lastCommunication: string;
}
const connectivityInitialState: ConnectivityState = {
    connected: false,
    lastCommunication: new Date().toISOString(),
};

export const connectivitySlice = createSlice({
    name: "connectivity",
    initialState: connectivityInitialState,
    reducers: {
        communicationReceived: (state) => {
            state.connected = true;
            state.lastCommunication = new Date().toISOString();
        },
    },

    extraReducers: {
        [HYDRATE]: (state, action) => {
            return {
                ...state,
                ...action.payload.connectivity,
            };
        },
    },
});

export const { communicationReceived } = connectivitySlice.actions;
