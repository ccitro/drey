export const API_BASE = "/api";

export async function deleteOverride(thermostat: string, sensor: string): Promise<void> {
    const data = new URLSearchParams();
    data.append("thermostat", thermostat);
    data.append("sensor", sensor);

    await fetch(API_BASE + "/delete-override", {
        method: "POST",
        body: data,
    });
}

export async function setOverride(thermostat: string, sensor: string, temp: number): Promise<void> {
    const data = new URLSearchParams();
    data.append("thermostat", thermostat);
    data.append("sensor", sensor);
    data.append("targetTemp", temp.toString());

    await fetch(API_BASE + "/add-override", {
        method: "POST",
        body: data,
    });
}

export async function saveConfig(newConfigJson: string): Promise<string | null> {
    const data = new URLSearchParams();
    data.append("config_json", newConfigJson);

    try {
        const r = await fetch(API_BASE + "/save-config", {
            method: "POST",
            body: data,
        });
        const isJson = r.headers.get("content-type")?.includes("application/json");
        const responseData = isJson ? await r.json() : null;

        // check for error response
        if (!r.ok) {
            let messages: string[] = [];
            if (responseData?.message) {
                messages.push(responseData.message);
            }
            if (responseData?.errors) {
                messages = [...messages, ...responseData.errors];
            }
            if (messages.length === 0) {
                messages.push(r.statusText);
            }

            return messages.join("\n");
        }

        return null;
    } catch (err) {
        return String(err);
    }
}
