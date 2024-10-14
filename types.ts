export type Plan = {
	people: Record<PersonName, Person>
	days: Record<DayName, Record<MealName, Meal>>
	dishes: Record<DishName, Dish>
	foods: Record<FoodName, Food>
}

export type PersonName = string
export type PersonTag = string
export type Person = {
	age: number // in years
	sex: "female" | "male" // based on metabolism
	height: number // in cm
	weight: number // in kg
	goal: "lose weight" | "maintain weight" | "gain weight"
	activity: "sedentary" | "light" | "moderate" | "intense" | "athlete"
	tags?: Array<PersonTag> // tags allow grouping of people
}

export type DayName = string // ISO Date string (YYYY-MM-DD)

export type MealName = string // Breakfast, Lunch, Dinner, Snack, Brunch, Second Breakfast, Elevensies, etc.
export type Meal = {
	dishes: Record<DishName, {
		percentage?: number // percentage of the meal this dish makes up, by calories (specify only this or servings)
		servings?: number // specific number of servings this dish is made of for this meal (specify only this or percentage)
		// people?: PersonName | Array<PersonName> | PersonTag | Array<PersonTag> // who does this dish (in these proportions) apply to (default is everyone in the meal)
	}>
	// TODO: people?: PersonName | Array<PersonName> | PersonTag | Array<PersonTag> // who does this meal (in these proportions) apply to (default is everyone)
}

export type DishName = string
export type Dish = {
	ingredients: Record<FoodName, { // the ingredients that make up 1 serving of this dish
		unit?: string // how this food is measured ("servings" of this food)
		amount: number // how many units of this food go into 1 serving of the dish
	}>
	// TODO: utensils
	// TODO: instructions
}

export type FoodName = string
export type Food = {
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
