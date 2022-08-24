export interface Inspector {
    pending();
    fulfilled(value);
    rejected(error);
}

export type InspectorFactory = (name: string) => Inspector;

export interface Variable {
    delete();
    define(name: string | null, inputs: string[], definition: any);
}

export interface Module {
    variable(inspector?: InspectorFactory): Variable;
    derive(specifiers: string[], source: any);
    import(name: string, alias: string, mod: Module): Variable;
}

export interface Runtime {
    module(define?, inspector?: InspectorFactory): Module;
    dispose(): void;
}

