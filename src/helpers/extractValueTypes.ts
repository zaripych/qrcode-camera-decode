export type ExtractValueTypes<T> = T extends ReadonlyArray<infer U> ? U : never;
