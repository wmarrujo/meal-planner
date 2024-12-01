import {DateTime} from "luxon"

////////////////////////////////////////////////////////////////////////////////

/** Wrap this around a type to get the evaluated types, not the way to build the types that typescript likes to show you */
export type Debug<T> = T extends Function ? T : {[K in keyof T]: T[K]} // eslint-disable-line @typescript-eslint/no-unsafe-function-type

export type ArrayElement<ArrayType extends readonly unknown[]> = ArrayType extends readonly (infer ElementType)[] ? ElementType : never

export type PartialBy<T, K extends keyof T> = Omit<T, K> & Pick<Partial<T>, K>
export type PartialNullBy<T, E extends keyof T> = {[K in keyof T]: K extends E ? (T[K] | null) : T[K]}

////////////////////////////////////////////////////////////////////////////////
// DATE
////////////////////////////////////////////////////////////////////////////////

export function formatDate(date: DateTime): string {
	if (!date.isValid) throw new Error("Invalid Date")
	
	const now = DateTime.now().startOf("day")
	const monthStartIfNeeded = date.equals(date.startOf("month")) ? ", " + date.toLocaleString({month: "short", day: "numeric"}) : ""
	
	if (date.year == now.year) {
		// for near dates, say "yesterday", "today", "tomorrow"
		if (date.equals(now.minus({days: 1}))) return "Yesterday" + monthStartIfNeeded
		if (date.equals(now)) return "Today" + monthStartIfNeeded
		if (date.equals(now.plus({days: 1}))) return "Tomorrow" + monthStartIfNeeded
		// for near dates say "last monday", "next tuesday", etc.
		if (-7 <= date.diff(now).as("days") && date.diff(now).as("days") < 0) return "Last " + date.toLocaleString({weekday: "long"}) + monthStartIfNeeded
		if (0 <= date.diff(now).as("days") && date.diff(now).as("days") < 7) return date.toLocaleString({weekday: "long"}) + monthStartIfNeeded
		if (7 <= date.diff(now).as("days") && date.diff(now).as("days") < 14) return "Next " + date.toLocaleString({weekday: "long"}) + monthStartIfNeeded
		// for other dates within the year, just say "Fri Nov 23", "Tue Apr 15"
		return date.toLocaleString({weekday: "short", month: "short", day: "numeric"})
	}
	return date.toLocaleString({weekday: "short", year: "numeric", month: "short", day: "numeric"})
}
