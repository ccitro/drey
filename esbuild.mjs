import esbuild from "esbuild";
import { existsSync, readdirSync, unlinkSync } from "fs";
import { join } from "path";

const outdir = "dist";
if (existsSync(outdir)) {
    for (const f of readdirSync(outdir)) {
        unlinkSync(join(outdir, f));
    }
}

esbuild
    .build({
        entryPoints: ["src/drey.ts"],
        bundle: true,
        external: ["./node_modules/*"],
        format: "esm",
        outdir,
        target: "node16",
        sourcemap: process.env.NODE_ENV === 'development',
        platform: "node",
    })
    .then(() => {
        console.log("Build Complete");
    })
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });
