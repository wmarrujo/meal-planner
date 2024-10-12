import * as NDJSON from "https://deno.land/x/ndjson@1.1.0/mod.ts";
import {Input, Select, Number} from "jsr:@cliffy/prompt@1.0.0-rc.7";
// import * as YAML from "jsr:@std/yaml"
import {DateTime} from "npm:ts-luxon@5.0.6";

////////////////////////////////////////////////////////////////////////////////


////////////////////////////////////////////////////////////////////////////////
// DATA
////////////////////////////////////////////////////////////////////////////////

type Plan = {
	people: Record<PersonName, Person>
	days: Record<DayName, Record<MealName, Meal>>
	dishes: Record<DishName, Dish>
	foods: Record<FoodName, Food>
}

type PersonName = string
type PersonTag = string
type Person = {
	age: number // in years
	sex: "female" | "male" // based on metabolism
	height: number // in cm
	weight: number // in kg
	goal: "lose" | "maintain" | "gain"
	activity: "sedentary" | "light" | "moderate" | "very" | "athlete"
	tag?: PersonTag // tags allow grouping of people
	tags?: Array<PersonTag>
}

type DayName = string // ISO Date string (YYYY-MM-DD)

type MealName = string // Breakfast, Lunch, Dinner, Snack, Brunch, Second Breakfast, Elevensies, etc.
type Meal = {
	dishes: Array<DishName>
	people?: PersonTag | Array<PersonTag> // not including this implies all people
}

type DishName = string
type Dish = {
	ingredients: Ingredient
	// TODO: utensils
	// TODO: instructions
}

type Ingredient = {
	food: FoodName
	serving?: number // the serving unit (defaults to grams)
	amount: number // the number of servings
}

type FoodName = string
type Food = {
	name: FoodName
	category: string
	calories: number
	water: number
	protein: number
	fat: number
	fiber: number
	carbohydrates: number
	sugar: number
	cholesterol: number
	servings: Array<Record<string, number>>
	energyDensity: number
}

const nutrition: Array<Food> = await NDJSON.readNdjson("./data/nutrition.ndjson")
const plan: Plan = {people: {}, days: {}, dishes: {}, foods: {}}//YAML.parse(Deno.readTextFileSync("./plan.yaml"))

////////////////////////////////////////////////////////////////////////////////
// PROMTS
////////////////////////////////////////////////////////////////////////////////

/*
what do you want to do:
- plan
- calculate

plan: (add or edit days)
- done / cancel
- ...edit existing days
- new day
- remove day

day:
- done / cancel
- ...edit existing meals
- new meal
- remove meal
- duplicate day

meal:
- done / cancel
- ...edit existing dishes
- add dish
- remove dish
- set meal calorie percentage
- set meal calorie amount
- duplicate meal from different day

dish:
- done / cancel
- ...edit existing ingredients
- add ingredient
- set dish calorie percentage
- set dish calorie amount
*/

// async function planMenu() {
// 	await Select.prompt({
// 		message: "Plan",
// 		info: true,
// 		options: [
// 			"save",
// 			...(plan.days ?? []),
			
// 			"exit without saving",
// 		]
// 	})
// }

// async function selectDay(): Promise<DateTime> {
// 	return await Input.prompt({
// 		message: "Which day do you want to plan?",
// 		info: true,
// 		default: "today",
// 		suggestions: [
// 			"today",
// 			"tomorrow",
// 		]
// 	})
// }

// async function selectFood(): Promise<Food> {
// 	return await Select.prompt({
// 		message: "Select a food:",
// 		info: true,
// 		search: true,
// 		options: nutrition.map(n => ({name: n.name, value: n})),
// 	})
// }

// async function selectServings(food: Food): Promise<{unit: string, servings: number}> {
// 	const unit = await Select.prompt({
// 		message: "Select a serving:",
// 		info: true,
// 		search: true,
// 		options: ["1 g", ...Object.keys(food.servings)]
// 	})
// 	const servings = await Number.prompt("How many servings?")
// 	return {unit, servings}
// }

// TODO: show a table of the current level's data right above the prompt
