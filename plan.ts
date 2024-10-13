import * as NDJSON from "https://deno.land/x/ndjson@1.1.0/mod.ts";
import {Input, Select, Number} from "jsr:@cliffy/prompt@1.0.0-rc.7";
import * as YAML from "jsr:@std/yaml"
import {DateTime} from "npm:luxon";

////////////////////////////////////////////////////////////////////////////////

function main() {
	planMenu()
}

////////////////////////////////////////////////////////////////////////////////
// TYPES
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
	activity: "sedentary" | "light" | "moderate" | "intense" | "athlete"
	tags?: Array<PersonTag> // tags allow grouping of people
}

type DayName = string // ISO Date string (YYYY-MM-DD)

type MealName = string // Breakfast, Lunch, Dinner, Snack, Brunch, Second Breakfast, Elevensies, etc.
type Meal = {
	dishes: Record<DishName, {
		percentage?: number // percentage of the meal this dish makes up, by calories (specify only this or servings)
		servings?: number // specific number of servings this dish is made of for this meal (specify only this or percentage)
		// people?: PersonName | Array<PersonName> | PersonTag | Array<PersonTag> // who does this dish (in these proportions) apply to (default is everyone in the meal)
	}>
	// TODO: people?: PersonName | Array<PersonName> | PersonTag | Array<PersonTag> // who does this meal (in these proportions) apply to (default is everyone)
}

type DishName = string
type Dish = {
	ingredients: Record<FoodName, { // the ingredients that make up 1 serving of this dish
		unit?: string // how this food is measured ("servings" of this food)
		amount: number // how many units of this food go into 1 serving of the dish
	}>
	// TODO: utensils
	// TODO: instructions
}

type FoodName = string
type Food = {
	name: FoodName
	category: string
	calories: number // in kcal
	water: number // in g
	protein: number // in g
	fat: number // in g
	fiber: number // in g
	carbohydrates: number // in g
	sugar: number // in g
	cholesterol: number // in mg
	servings: Array<Record<string, number>>
	energyDensity: number // kcal/g
}

////////////////////////////////////////////////////////////////////////////////
// DATA
////////////////////////////////////////////////////////////////////////////////

const foods: Array<Food> = await NDJSON.readNdjson("./data/foods.ndjson")
const plan: Plan = {people: {}, days: {}, dishes: {}, foods: {}}//YAML.parse(Deno.readTextFileSync("./plan.yaml"))

////////////////////////////////////////////////////////////////////////////////
// PROMTS
////////////////////////////////////////////////////////////////////////////////

// PLAN

async function planMenu(): Promise<void> {
	const next = await Select.prompt({info: true,
		message: "Plan",
		options: [
			{name: "✅ Done", value: done},
			{name: "👤 People", value: peopleMenu},
			{name: "📆 Days", value: daysMenu},
			{name: "🍽️  Dishes", value: dishesMenu},
		],
	})
	console.clear()
	return next()
}

function done() {
	console.log(YAML.stringify(plan))
}

// PEOPLE

async function peopleMenu(): Promise<void> {
	const next = await Select.prompt({info: true,
		message: "People",
		options: [
			{name: "✅ Done", value: planMenu},
			{name: "➕ New Person", value: newPerson},
			...Object.keys(plan.people).map(person => ({name: `🧍 ${person}`, value: () => personMenu(person)})),
		],
	})
	console.clear()
	return next()
}

async function newPerson(): Promise<void> {
	const name = await Input.prompt("Name")
	plan.people[name] = plan.people[name] ?? {
		age: Math.round(Math.random() * 120),
		sex: ["female", "male"][Math.round(Math.random())] as Person["sex"],
		height: Math.round(Math.random() * 260 + 12),
		weight: Math.round(Math.random() * 635),
		goal: ["lose", "maintain", "gain"][Math.floor(Math.random() * 2)] as Person["goal"],
		activity: ["sedentary", "light", "moderate", "intense", "athlete"][Math.floor(Math.random() * 4)] as Person["activity"],
	}
	console.clear()
	return personMenu(name)
}

// PERSON

async function personMenu(person: PersonName): Promise<void> {
	const next = await Select.prompt({info: true,
		message: "Person",
		options: [
			{name: "✅ Done", value: peopleMenu},
			Select.separator("---"),
			{name: "👶 Age", value: () => ageInput(person)},
			{name: "👫 Sex", value: () => sexInput(person)},
			{name: "🦒 Height", value: () => heightInput(person)},
			{name: "🐘 Weight", value: () => weightInput(person)},
			{name: "🏆 Goal", value: () => goalInput(person)},
			{name: "🤸 Activity", value: () => activityInput(person)},
			// {name: "🏷️ Tags", value: tagsInput}, // TODO
			Select.separator("---"),
			{name: "🗑️ Delete Person", value: () => { delete plan.people[person]; return peopleMenu() }},
		],
	})
	console.clear()
	return next()
}

async function ageInput(person: PersonName): Promise<void> {
	const age = await Number.prompt("Age (years)")
	if (age < 0 || 140 < age) { console.log("invalid age"); ageInput(person) }
	plan.people[person].age = age
	console.clear()
	return personMenu(person)
}

async function sexInput(person: PersonName): Promise<void> {
	plan.people[person].sex = await Select.prompt({message: "sex", options: ["female", "male"]}) as Person["sex"]
	console.clear()
	return personMenu(person)
}

async function heightInput(person: PersonName): Promise<void> {
	const height = await Number.prompt("Height (cm)")
	if (height < 12 || 272 < height) { console.log("invalid height"); heightInput(person) }
	plan.people[person].height = height
	console.clear()
	return personMenu(person)
}

async function weightInput(person: PersonName): Promise<void> {
	const weight = await Number.prompt("Weight (kg)")
	if (weight < 0 || 635 < weight) { console.log("invalid weight"); weightInput(person) }
	plan.people[person].weight = weight
	console.clear()
	return personMenu(person)
}

async function goalInput(person: PersonName): Promise<void> {
	plan.people[person].goal = await Select.prompt({
		message: "Goal",
		options: [
			{name: "📉 Lose weight", value: "lose"},
			{name: "👉 Maintain weight", value: "maintain"},
			{name: "📈 Gain weight", value: "gain"},
		]}
	) as Person["goal"]
	console.clear()
	return personMenu(person)
}

async function activityInput(person: PersonName): Promise<void> {
	plan.people[person].activity = await Select.prompt({message: "activity", options: [
		{name: "🛋️ Sedentary (little or no exercise)", value: "sedentary"},
		{name: "🚶 Light     (light exercise a few days a week)", value: "light"},
		{name: "🏃 Moderate  (moderate exercise some days a week)", value: "moderate"},
		{name: "🏋️ Intense   (hard exercise most days a week)", value: "very"},
		{name: "🥇 Athlete   (hard exercise and a physical job)", value: "athlete"},
	]}) as Person["activity"]
	console.clear()
	return personMenu(person)
}

// DAYS

async function daysMenu(): Promise<void> {
	const next = await Select.prompt({info: true,
		message: "Days",
		options: [
			{name: "✅ Done", value: planMenu},
			Select.separator("---"),
			...Object.keys(plan.days).map(day => ({name: `📆 ${day}`, value: () => dayMenu(day)})),
			{name: "➕ New Day", value: newDay},
		],
	})
	console.clear()
	return next()
}

async function newDay(): Promise<void> {
	const name = await Input.prompt({info: true,
		message: "Date (yyyy-mm-dd)",
		default: DateTime.now().toISODate(),
		suggestions: [
			DateTime.now().toISODate(),
		],
		list: true,
	})
	const date = DateTime.fromISO(name) // parse the date
	if (!date.isValid) { console.log(date.invalidExplanation); return newDay() }
	const day = date.startOf("day").toISODate()
	plan.days[day] = plan.days[day] ?? {} // add it (but don't overwrite, in case it already exists) and make sure the format is correct even if they got fancy with it
	console.clear()
	return dayMenu(day)
}

// DAY

async function dayMenu(day: DayName): Promise<void> {
	const next = await Select.prompt({info: true,
		message: day,
		options: [
			{name: "✅ Done", value: daysMenu},
			Select.separator("---"),
			{name: "➕ New Meal", value: () => newMeal(day)},
			...Object.keys(plan.days[day]).map(meal => ({name: `🕐 ${meal}`, value: () => mealMenu(day, meal)})),
			Select.separator("---"),
			{name: "🗑️ Delete Day", value: () => { delete plan.days[day]; return daysMenu() }},
		],
	})
	console.clear()
	return next()
}

async function newMeal(day: DayName): Promise<void> {
	const name = await Input.prompt({info: true,
		message: "Meal Name",
		suggestions: [
			"Breakfast",
			"Lunch",
			"Dinner",
			"Snack",
		],
		list: true,
	})
	plan.days[day][name] = plan.days[day][name] ?? {dishes: []}
	console.clear()
	return mealMenu(day, name)
}

// MEAL

async function mealMenu(day: DayName, meal: MealName): Promise<void> {
	const next = await Select.prompt({info: true,
		message: meal,
		options: [
			{name: "✅ Done", value: () => dayMenu(day)},
			Select.separator("---"),
			...Object.keys(plan.days[day][meal].dishes).map(dish => ({name: `🍽️  ${dish}`, value: () => dishMenu(day, meal)})),
			{name: "➕ Add Dish", value: () => addDishInMeal(day, meal)},
			Select.separator("---"),
			{name: "🗑️ Delete Meal", value: () => { delete plan.days[day][meal]; return dayMenu(day) }},
		],
	})
	console.clear()
	return next()
}

async function addDishInMeal(day: DayName, meal: MealName): Promise<void> {
	const dish = await Select.prompt({info: true,
		message: "Select Dish",
		search: true,
		options: [
			{name: "❌ Cancel", value: null},
			Select.separator("---"),
			...Object.keys(plan.dishes).map(dish => ({name: `🍽️ ${dish}`, value: dish}))
		],
	})
	if (dish) plan.days[day][meal].dishes[dish] = {}
	console.clear()
	return mealMenu(day, meal)
}

// DISH IN MEAL

async function dishInMealMenu(day: DayName, meal: MealName, dish: DishName): Promise<void> {
	const next = await Select.prompt({info: true,
		message: dish,
		options: [
			{name: "✅ Done", value: () => mealMenu(day, meal)},
			{name: "💯 Set Percentage", value: () => setDishInMealCaloriePercentage(day, meal, dish)},
			{name: "🍰 Set Servings", value: () => setDishInMealServings(day, meal, dish)},
			// TODO: people
		],
	})
	console.clear()
	return next()
}

async function setDishInMealCaloriePercentage(day: DayName, meal: MealName, dish: DishName): Promise<void> {
	const percentage = await Number.prompt("Percentage of Meal (by Calories) (0 will unset)")
	if (percentage < 0 || 100 < percentage) { console.log("invalid percentage"); setDishInMealCaloriePercentage(day, meal, dish) }
	if (percentage == 0) delete plan.days[day][meal].dishes[dish].percentage
	else plan.days[day][meal].dishes[dish].percentage = percentage
	// TODO: warn them if their percentages go over 100%
	console.clear()
	return dishInMealMenu(day, meal, dish)
}

async function setDishInMealServings(day: DayName, meal: MealName, dish: DishName): Promise<void> {
	const servings = await Number.prompt("Servings (0 will unset)")
	if (servings < 0) { console.log("invalid servings"); setDishInMealServings(day, meal, dish) }
	if (servings == 0) delete plan.days[day][meal].dishes[dish].servings
	else plan.days[day][meal].dishes[dish].servings = servings
	console.clear()
	return dishInMealMenu(day, meal, dish)
}

// DISHES

async function dishesMenu(): Promise<void> {
	const next = await Select.prompt({info: true,
		message: "Dishes",
		search: true,
		options: [
			{name: "✅ Done", value: planMenu},
			{name: "➕ New Dish", value: newDish},
			Select.separator("---"),
			...Object.keys(plan.dishes).map(dish => ({name: `🍽️ ${dish}`, value: dishMenu})),
		],
	})
	console.clear()
	return next()
}

// FIXME: link back to day & meal
async function newDish(day?: DayName, meal?: MealName): Promise<void> {
	const dish = await Input.prompt("Name")
	plan.dishes[dish] = {ingredients: {}}
	console.clear()
	return dishMenu(dish)
}

// DISH

// FIXME: do the linking back to the meals in the days when we want to edit the dishes - maybe do it by a system of globals so it doesn't need to be passed everywhere
async function dishMenu(dish: DishName, day?: DayName, meal?: MealName): Promise<void> {
	// manage ingredients
	const next = await Select.prompt({info: true,
		message: dish,
		options: [
			{name: "✅ Done", value: dishesMenu},
			Select.separator("---"),
			...Object.keys(plan.dishes[dish].ingredients).map(food => ({name: food, value: () => ingredientMenu(dish, food)})),
			{name: "➕ Add Ingredient", value: () => addIngredient(dish)},
		],
	})
	console.clear()
	return next()
}

async function addIngredient(dish: DishName): Promise<void> {
	const food = await Select.prompt({info: true,
		message: "Select an Ingredient",
		search: true,
		options: [
			{name: "❌ Cancel", value: null},
			Select.separator("---"),
			...foods.map(food => ({name: food.name, value: food.name})),
		],
	})
	if (food) plan.dishes[dish].ingredients[food] = {amount: 0}
	console.clear()
	return dishMenu(dish)
}

// INGREDIENT IN DISH

// TODO: make the setting of units and amounts less bad, maybe just do it all at once in one flow (and put it in the add part)
async function ingredientMenu(dish: DishName, food: FoodName): Promise<void> {
	const next = await Select.prompt({info: true,
		message: `${food} in ${dish}`,
		options: [
			{name: "✅ Done", value: () => dishMenu(dish)},
			{name: "🍰 Set Unit", value: () => setIngredientUnit(dish, food)},
			{name: "🔢 Set Amount", value: () => setIngredientAmount(dish, food)},
			{name: "🗑️ Delete Ingredient", value: () => { delete plan.dishes[dish].ingredients[food] }},
		],
	})
	console.clear()
	return next()
}

async function setIngredientUnit(dish: DishName, food: FoodName): Promise<void> {
	const unit = await Select.prompt({info: true,
		message: `Unit of ${food} in ${dish}`,
		options: [
			{name: "grams", value: undefined},
			...Object.keys(foods.find(f => f.name == food)!.servings).map(serving => ({name: serving, value: serving})),
		],
	})
	plan.dishes[dish].ingredients[food].unit = unit
	console.clear()
	return ingredientMenu(dish, food)
}

async function setIngredientAmount(dish: DishName, food: FoodName): Promise<void> {
	const amount = await Number.prompt(`Amount of ${food} in ${dish} by ${plan.dishes[dish].ingredients[food].unit ?? "grams"}`)
	if (amount < 0) { console.log("invalid amount"); setIngredientAmount(dish, food) }
	plan.dishes[dish].ingredients[food].amount = amount
	console.clear()
	return ingredientMenu(dish, food)
}

// TODO: show a table of the current level's data right above the prompt

////////////////////////////////////////////////////////////////////////////////

main()
