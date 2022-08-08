import equal from "fast-deep-equal";

// updates a Record object from a redux store, limiting the scope of the mutation where possible
export function selectiveUpdate<T>(o: Record<string, T>, n: Record<string, T>): void {
    for (const key in o) {
        if (!(key in n)) {
            // console.log("Deleting old record: " + key);
            delete o[key];
        }

        if (!equal(o[key], n[key])) {
            const props = Object.keys(n[key]) as (keyof T)[];
            for (const prop of props) {
                if (!equal(o[key][prop], n[key][prop])) {
                    // console.log(`Patching ${key}.${String(prop)} to ${n[key][prop]}`);
                    o[key][prop] = n[key][prop];
                }
            }
        }
    }

    for (const key in n) {
        if (!(key in o)) {
            // console.log("Adding new record: " + key);
            o[key] = n[key];
        }
    }
}
