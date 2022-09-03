import * as os from "os";
import * as path from "path";
import { Disposable, FileType, TextDocument, Uri, workspace } from "vscode";
import { random } from "./math";

const fs = workspace.fs;

export const dirname = (fsPath: string): string => {
    return path.dirname(fsPath);
};

export const leafname = (fsPath: string): string => {
    const basename = path.basename(fsPath);
    const ext = path.extname(basename);
    return basename.substring(0, basename.length - ext.length);
};

export const exists = async (fsPath: string): Promise<boolean> => {
    try {
        await fs.stat(Uri.file(fsPath));
        return true;
    } catch (e) {
        return false;
    }
};

export function readFile(fsPath: string, encoding: string = "utf-8"): Thenable<string> {
    return fs.readFile(Uri.file(fsPath)).then(_content => {
        return new TextDecoder(encoding).decode(_content);
    });
}

export function writeFile(fsPath: string, _content: string): Thenable<void> {
    const content = new TextEncoder().encode(_content);
    return fs.writeFile(Uri.file(fsPath), content);
}

export function deleteFile(fsPath: string): Thenable<void> {
    return fs.delete(Uri.file(fsPath));
}

export function createDirectory(fsPath: string): Thenable<void> {
    return fs.createDirectory(Uri.file(fsPath));
}

export function readDirectory(fsPath: string): Thenable<[string, FileType][]> {
    return fs.readDirectory(Uri.file(fsPath));
}

//  ECL Helpers  ---
export const isHidden = (source: string) => source.indexOf(".") === 0;

export async function isDirectory(fsPath: string): Promise<boolean> {
    return fs.stat(Uri.file(fsPath)).then(stat => {
        return isTypeDirectory(stat.type);
    });
}

export const isTypeDirectory = (type: FileType): boolean => !!(type & FileType.Directory);

export const isEcl = (source: string) => path.extname(source).toLowerCase() === ".ecl";

export const modAttrs = async (source: string) => {
    return (await fs.readDirectory(Uri.file(source)))
        .filter(([name, type]) => {
            return !isHidden(name);
        }).map(([name, type]) => {
            return [path.join(source, name), type] as [string, FileType];
        }).filter(([fsPath, type]) => {
            return isTypeDirectory(type) || isEcl(fsPath);
        })
        ;
};

//  TempDocument Helpers  ---
export interface DisposableFile extends Disposable {
    uri: Uri;
}

export async function writeTempFile({
    folder = os.tmpdir(),
    prefix = "file",
    ext = "tmp",
    content = "",
}): Promise<DisposableFile> {
    while (true) {
        const tmpPath = path.join(folder, `${prefix}-${random(100000, 999999)}.${ext}`);
        if (!await exists(tmpPath)) {
            await writeFile(tmpPath, content);
            return {
                uri: Uri.file(tmpPath),
                dispose: () => deleteFile(tmpPath)
            };
        }
    }
}

export async function eclTempFile(document: TextDocument): Promise<DisposableFile> {
    let tmpFile: DisposableFile = {
        uri: document.uri,
        dispose: () => { }
    };
    if (document.isUntitled) {
        tmpFile = await writeTempFile({ prefix: leafname(document.fileName), content: document.getText(), folder: workspace.workspaceFolders && workspace.workspaceFolders[0]?.uri?.fsPath, ext: "ecl" });
    } else if (document.isDirty) {
        tmpFile = await writeTempFile({ prefix: leafname(document.fileName), content: document.getText(), folder: dirname(document.fileName), ext: "ecl" });
    }
    return tmpFile;
}
