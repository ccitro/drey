/**
 * Parts of this file are based on node-homeassistant
 * https://github.com/mawalu/node-homeassistant
 * Author: mawalu https://github.com/mawalu
 *
 * LICENSE: https://github.com/mawalu/node-homeassistant/blob/af8408a905c6a6e4af19a0a548c1b579041b4271/LICENSE
 *
 * MIT License
 *
 * Copyright (c) 2017 Martin Wagner
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import WebSocket from "ws";

interface StateUpdate<T> {
    entity_id: string;
    old_state: T;
    new_state: T;
}

interface ConfigOptions {
    host: string;
    protocol: string;
    retryTimeout: number;
    timeout: number;
    token: string;
    retryCount: number;
    port: number;
    password: string;
}

interface IncomingMessagePayload {
    id: number;
    type: string;
    success: boolean;
    event: ChangeEvent;
    result: EntityState<unknown, unknown>[];
}

interface OutgoingMessagePayload {
    id?: number;
    domain?: string;
    service?: string;
    service_data?: unknown;
    type?: string;
    access_token?: string;
    api_password?: string;
    subscription?: unknown;
}

type EventCallback = (p: IncomingMessagePayload) => unknown;

interface ChangeEvent {
    data: StateUpdate<EntityState<unknown, unknown>>;
    event_type: unknown;
}

type Listener = (event: unknown, data?: unknown) => void;

const defaultConfig: ConfigOptions = {
    host: "localhost",
    protocol: "ws",
    retryTimeout: 5000,
    timeout: 5000,
    retryCount: -1,
    port: 8123,
    password: "",
    token: "",
};

export class HomeAssistant {
    config: ConfigOptions;
    url = ``;
    retriesLeft = -1;
    promises: Record<number, { callback: EventCallback; timeout: NodeJS.Timer | undefined }> = {};
    states: EntityState<unknown, unknown>[] = [];
    id = 1;
    ws: WebSocket | undefined;
    retry: NodeJS.Timer | undefined | null;
    destroyed = false;
    listeners: Listener[] = [];

    constructor(options: Partial<ConfigOptions>) {
        this.config = Object.assign(defaultConfig, options);
        this.url = `${this.config.protocol}://${this.config.host}:${this.config.port}/api/websocket`;
        this.retriesLeft = this.config.retryCount;
    }

    async connect(): Promise<void> {
        if (this.destroyed) {
            return;
        }

        this.ws = new WebSocket(this.url);
        this.ws.on("message", async (eventData) => {
            const data = JSON.parse(eventData.toString()) as IncomingMessagePayload;
            if (data.type == "auth_required") {
                return this.send({ type: "auth", access_token: this.config.token }, false);
            }

            if (data.type == "auth_ok") {
                this.emit("authenticated");
                this.states = (await this.send({ type: "get_states" })).result;
                return this.subscribe({ callback: this.updateState.bind(this) });
            }

            if (data.type == "auth_invalid") return this.emit("auth_invalid");

            const p = this.promises[data.id];
            p?.timeout && clearTimeout(p.timeout);
            p?.callback?.(data);
        });

        this.ws.on("open", () => {
            this.emit("connected");
            this.retriesLeft = this.config.retryCount;
            this.retry && clearTimeout(this.retry);
            this.retry = null;
        });

        this.ws.on("error", () => {
            this.emit("connection_error");
            this.reconnect();
        });

        this.ws.on("close", () => {
            this.emit("connection_closed");
            this.reconnect();
        });
    }

    destroy(): void {
        try {
            this.emit("destroy");
            this.listeners = [];
            this.destroyed = true;
            this.config.retryCount = 0;
            this.retry && clearInterval(this.retry);
            this.retry = null;
            this.retriesLeft = -1;
            this.promises = [];
            this.states = [];
            this.ws?.close();
            this.ws = undefined;
        } catch (err) {
            console.error("Failed to close websocket", err);
        }
    }

    call = (options: OutgoingMessagePayload) => this.send(Object.assign({ type: "call_service" }, options));
    on = (listener: Listener) => this.listeners.push(listener);
    state<T, U>(entity: string): EntityState<T, U> | null {
        const i = this.findEntity(entity);
        if (i < 0) {
            return null;
        }
        const s = (this.states[i] as unknown as EntityState<T, U>) ?? null;

        // @future remove debug code - findEntity should handle this now
        if (s && s.entity_id !== entity) {
            console.log(JSON.stringify(this.states));
            console.log(JSON.stringify(this.findEntity(entity)));
            console.error(`HA entity mismatch.  Expected ${entity}, got ${JSON.stringify(s)}`);
            return null;
        }

        return s;
    }

    private emit = (event: unknown, data?: unknown) => this.listeners.forEach((l) => l(event, data));
    private findEntity = (id: string) => this.states.findIndex((state) => state.entity_id === id);

    private reconnect(): void {
        if (this.destroyed || this.retry) return;

        this.retry = setInterval(() => {
            if (this.retriesLeft === 0) {
                this.retry && clearTimeout(this.retry);
                throw new Error("home-assistant connection closed");
            } else if (this.retriesLeft > 0) {
                this.retriesLeft--;
            }

            try {
                this.emit("reconnecting");
                void this.connect();
            } catch (error) {
                this.emit("error", error);
            }
        }, this.config.retryTimeout);
    }

    private send(data: OutgoingMessagePayload, addId = true): Promise<IncomingMessagePayload> {
        if (addId) {
            data.id = this.id++;
        }

        return new Promise<IncomingMessagePayload>((resolve, reject) => {
            if (data.id) {
                this.promises[data.id] = {
                    timeout: setTimeout(
                        () => !this.destroyed && reject(new Error("No response received from home-assistant")),
                        this.config.timeout
                    ),
                    callback: resolve,
                };
            }
            this.ws?.send?.(JSON.stringify(data));
        });
    }

    private async subscribe(options: { callback: EventCallback }) {
        const data = await this.send({ type: "subscribe_events" });
        if (!data.success) return Promise.reject(new Error(JSON.stringify(data)));
        this.promises[data.id].callback = options.callback;
        return data;
    }

    private updateState(change: IncomingMessagePayload): void {
        const data = change.event.data;
        if (change.event.event_type !== "state_changed") return;

        const changeIndex = this.findEntity(data.entity_id);
        if (changeIndex === -1) {
            this.states.push(data.new_state);
        } else {
            this.states[changeIndex] = data.new_state;
        }
    }
}
