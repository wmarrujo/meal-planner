import {supabase} from "$lib/supabase"
import type {Enums} from "$schema"
import {DateTime} from "luxon"
import {toast} from "svelte-sonner"
import {SvelteMap, SvelteSet} from "svelte/reactivity"

////////////////////////////////////////////////////////////////////////////////
// TYPES
////////////////////////////////////////////////////////////////////////////////

export type UUID = string
export type ISODateString = string
export type ISOTimeString = string

export type Household = {
	id: number
	name: string
	head: UUID
	people: SvelteMap<Person["id"], Person>
	meals: SvelteMap<Meal["id"], Meal>
	solution?: Map<Person["id"], Map<Meal["id"], Map<Dish["id"], number>>> // set only when calculated // TODO: make this more reactive, so if anything changes, it recalculates, but only when going to the pages that use the solution
}

export type Person = {
	id: number
	household: Household["id"]
	name: string
	age: number
	sex: number
	height: number
	weight: number
	activity: number
	goal: number
	visiting: boolean // if this person should be in the meals of this household by default
	// TODO: do target priorities by person
}

export type Meal = {
	id: number
	household: Household["id"]
	name: string
	day: ISODateString | null // ISO Date String
	time: ISOTimeString | null // ISO Time String
	date: DateTime // day + time, parsed
	amount: number
	percent: boolean | null
	restriction: Enums<"restriction"> | null
	components: SvelteMap<Dish["id"], Component>
	blacklist: SvelteSet<Person["id"]> // exclude these people from the meal when they otherwise would be (only applies to non-visitors)
	whitelist: SvelteSet<Person["id"]> // include these people in the meal when they otherwise wouldn't be (only applies to visitors)
}

export type Component = {
	meal: Meal["id"]
	dish: Dish["id"]
	amount: number
	percent: boolean | null
	restriction: string | null
}

export type Dish = {
	id: number
	name: string
	ingredients: SvelteMap<Food["id"], Ingredient>
	manager: UUID | null
}

export type Ingredient = {
	food: Food["id"]
	amount: number
	serving: Serving["id"] | null
}

export type Food = {
	id: number
	name: string
	servings: SvelteMap<Serving["id"], Serving> // the serving options available
	by_volume: boolean
	calories: number | null
	protein: number | null
}

export type Serving = {
	id: number
	food: Food["id"]
	amount: number
	amount_of_unit: number
	unit: string | null
	modifier: string | null
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

// load all the household data

// Households
const {data: householdsData, error: householdsError} = await supabase
	.from("households")
	.select("id, name, head")
	.order("name")
if (householdsError) { console.error("Error in getting households:", householdsError); toast.error("Error in getting households.") }
else householdsData.forEach(household => households.set(household.id, {
	...household,
	people: new SvelteMap(),
	meals: new SvelteMap(),
	solution: new SvelteMap(),
}))

// People
const {data: peopleData, error: peopleError} = await supabase
	.from("people")
	.select("id, household, name, age, sex, height, weight, activity, goal, visiting")
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
	components: new SvelteMap(),
	date: DateTime.fromISO(meal.time ? `${meal.day!}T${meal.time}` : meal.day!),
	whitelist: new SvelteSet(), // TODO: add to database
	blacklist: new SvelteSet(), // TODO: add to database
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

// preload the household data with all the components it needs to make calculations

// Dishes
const {data: dishesData, error: dishesError} = await supabase
	.from("dishes")
	.select("id, name, manager")
	.in("id", [...households.values().flatMap(household => household.meals.values().flatMap(meal => meal.components.keys()))])
if (dishesError) { console.error("Error in getting dishes:", dishesError); toast.error("Error in getting dishes.") }
else dishesData.forEach(dish => dishes.set(dish.id, {
	...dish,
	ingredients: new SvelteMap()
}))

// Ingredients
const {data: ingredientsData, error: ingredientsError} = await supabase
	.from("ingredients")
	.select("dish, food, serving, amount")
	.in("dish", [...dishes.keys()])
if (ingredientsError) { console.error("Error in getting ingredients:", ingredientsError); toast.error("Error in getting ingredients.") }
else ingredientsData.forEach(ingredient => dishes.get(ingredient.dish)!.ingredients.set(ingredient.food, ingredient))

// Foods
const {data: foodsData, error: foodsError} = await supabase
	.from("foods")
	.select("id, name, by_volume, calories, protein")
	.in("id", [...dishes.values().flatMap(dish => dish.ingredients.keys())])
if (foodsError) { console.error("Error in getting foods:", foodsError); toast.error("Error in getting foods.") }
else foodsData.forEach(food => foods.set(food.id, {
	...food,
	servings: new SvelteMap()
}))

// Servings
const {data: servingsData, error: servingsError} = await supabase
	.from("servings")
	.select("food, id, amount, amount_of_unit, unit, modifier")
	.in("food", [...foods.keys()])
if (servingsError) { console.error("Error populating servings:", servingsError) }
else servingsData.forEach(serving => foods.get(serving.food)!.servings.set(serving.id, serving))
