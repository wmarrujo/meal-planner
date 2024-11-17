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
	household: number
	name: string
	sex: number
	height: number
	weight: number
	activity: number
	goal: number
}

export type Meal = {
	id: number
	household: number
	name: string
	date: DateTime
	amount: number
	percent: boolean | null
	restriction: Enums<"restriction"> | null
	components: SvelteMap<number, Component>
}

export type Component = {
	meal: number
	dish: number
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
else householdsData.forEach(household => households.set(household.id, {
	...household,
	people: new SvelteMap(),
	meals: new SvelteMap()
}))

// People
const {data: peopleData, error: peopleError} = await supabase
	.from("people")
	.select("id, household, name, sex, height, weight, activity, goal")
	.order("name")
if (peopleError) { console.error("Error in getting people:", peopleError); toast.error("Error in getting people.") }
else peopleData.forEach(person => households.get(person.household)!.people.set(person.id, person))

// Meals
const {data: mealsData, error: mealsError} = await supabase
	.from("meals")
	.select("id, household, name, day, time, amount, percent, restriction")
if (mealsError) { console.error("Error in getting meals:", mealsError); toast.error("Error in getting meals.") }
else mealsData.forEach(meal => households.get(meal.household)!.meals.set(meal.id, {
	...meal,
	components: new SvelteMap<number, Component>(),
	date: DateTime.fromISO(meal.time ? `${meal.day!}T${meal.time}` : meal.day!),
}))

// Components
const {data: componentsData, error: componentsError} = await supabase
	.from("components")
	.select("meal:meals!inner(id, household), dish, amount, percent, restriction")
if (componentsError) { console.error("Error in getting meal components:", componentsError); toast.error("Error in getting components of meals.") }
else componentsData.forEach(component => households.get(component.meal.household)!.meals.get(component.meal.id)!.components.set(component.dish, {
	...component,
	meal: component.meal.id,
}))

// Dishes
// TODO: implement
