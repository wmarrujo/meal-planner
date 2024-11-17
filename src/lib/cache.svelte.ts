import {supabase} from "$lib/supabase"
import type {Enums} from "$schema"
import {DateTime} from "luxon"
import {toast} from "svelte-sonner"
import {SvelteMap} from "svelte/reactivity"
import {setContext} from "svelte"

////////////////////////////////////////////////////////////////////////////////
// TYPES
////////////////////////////////////////////////////////////////////////////////

export type Household = {
	id: number
	name: string
	head: string
	people: SvelteMap<number, Person>
	meals: SvelteMap<number, Meal>
}

export type Person = {
	id: number
	name: string
	sex: number
	height: number
	weight: number
	activity: number
	goal: number
	household: number
}

export type Meal = {
	id: number
	name: string
	date: DateTime
	amount: number
	percent: boolean | null
	restriction: Enums<"restriction"> | null
	components: SvelteMap<number, Component>
}

export type Component = {
	meal: number
	dish: number // dish reference
	amount: number
	percent: boolean | null
	restriction: string | null
}

export type Dish = {
	id: number
	name: string
	ingredients: Array<Ingredient> | null
	manager: string | null
}

export type Ingredient = {
	food: number
	amount: number
	serving: Serving | null
	servingOptions?: Array<Serving>
}

export type Serving = {
	id: number
	amount_of_unit: number
	unit: string | null
	modifier: string | null
}

export type Food = {
	id: number
	name: string
	by_volume: boolean
	calories: number
	protein: number
}

////////////////////////////////////////////////////////////////////////////////
// CACHES
////////////////////////////////////////////////////////////////////////////////

export const households: SvelteMap<number, Household> = $state(new SvelteMap())
export const dishes: SvelteMap<number, Dish> = $state(new SvelteMap())
export const foods: SvelteMap<number, Food> = $state(new SvelteMap())

////////////////////////////////////////////////////////////////////////////////
// INITIALIZATION
////////////////////////////////////////////////////////////////////////////////

// Households
const {data: householdsData, error: householdsError} = await supabase
	.from("households")
	.select("id, name, head")
	.order("name")
if (householdsError) { console.error("Error in getting households:", householdsError); toast.error("Error in getting households.") }
else householdsData.forEach(household => households.set(household.id, {...household, people: new SvelteMap(), meals: new SvelteMap()}))

// People
const {data: peopleData, error: peopleError} = await supabase
	.from("people")
	.select("id, name, sex, height, weight, activity, goal, household")
	.order("name")
if (peopleError) { console.error("Error in getting people:", peopleError); toast.error("Error in getting people.") }
else peopleData.forEach(person => households.get(person.household)!.people.set(person.id, person))

// Meals
// TODO: fill the meals
