import ts from "typescript";
import { createDefaultMapFromNodeModules, createFSBackedSystem, createSystem, createVirtualCompilerHost, createVirtualTypeScriptEnvironment } from "@typescript/vfs";

const compilerOptions: ts.CompilerOptions = {};
const fsMap = createDefaultMapFromNodeModules(compilerOptions, ts);

const system = createSystem(fsMap);
export const env = createVirtualTypeScriptEnvironment(system, [], ts, { allowJs: true, sourceMap: true });
export const ACTIVE_FILE = "tmp.js";
env.createFile(ACTIVE_FILE, " ");

