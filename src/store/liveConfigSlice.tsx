import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { HYDRATE } from "next-redux-wrapper";

const liveConfigInitialState: { dreyConfig: DreyConfig } = {
    dreyConfig: {
        version: 1,
        ha_host: "",
        ha_key: "",
        external_sensor: "",
        tz: "UTC",
        configs: [],
    },
};

export const liveConfigSlice = createSlice({
    name: "liveConfig",
    initialState: liveConfigInitialState,
    reducers: {
        importLiveConfig: (state, { payload }: PayloadAction<DreyConfig>) => {
            state.dreyConfig = payload;
        },
    },

    extraReducers: {
        [HYDRATE]: (state, action) => {
            return {
                ...state,
                ...action.payload.liveConfig,
            };
        },
    },
});

export const { importLiveConfig } = liveConfigSlice.actions;
