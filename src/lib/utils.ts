/** Wrap this around a type to get the evaluated types, not the way to build the types that typescript likes to show you */
export type Debug<T> = T extends Function ? T : {[K in keyof T]: T[K]} // eslint-disable-line @typescript-eslint/no-unsafe-function-type

export type ArrayElement<ArrayType extends readonly unknown[]> = ArrayType extends readonly (infer ElementType)[] ? ElementType : never

export type PartialBy<T, K extends keyof T> = Omit<T, K> & Pick<Partial<T>, K>
export type PartialNullBy<T, E extends keyof T> = {[K in keyof T]: K extends E ? (T[K] | null) : T[K]}
