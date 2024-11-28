import {solve, type Model} from "yalps"
import type {Household, Person, Meal, Dish, ISODateString} from "$lib/cache.svelte"
import {type Variable, EQ, TERMS, TERM, SUM, CONST, type LinearEquation} from "$lib/linear-algebra"
import {type Nutrition, targetCalories, targetProtein, nutritionOfDish} from "$lib/nutrition"

////////////////////////////////////////////////////////////////////////////////
// SOLVER
////////////////////////////////////////////////////////////////////////////////

export function calculateHousehold(household: Household): Record<Person["id"], Record<Meal["id"], Record<Dish["id"], number>>> {
	const models = makeModels(household)
	const solution: Record<Person["id"], Record<Meal["id"], Record<Dish["id"], number>>> = {}
	Object.entries(models).forEach(([day, dayModels]) => Object.entries(dayModels).forEach(([person, model]) => solution[Number(person)] = solveModel(model, day, Number(person))))
	return solution
}

function solveModel(model: Model, day: ISODateString, person: number): Record<Meal["id"], Record<Dish["id"], number>> {
	const solution = solve(model, {includeZeroVariables: true})
	if (solution.status == "optimal") {
		const result: Record<Meal["id"], Record<Dish["id"], number>> = {}
		solution.variables.forEach(([variable, value]) => {
			if (variable.startsWith("servings")) {
				const [_, m, d] = variable.split("_"); const meal = Number(m); const dish = Number(d)
				result[meal] ??= {}
				result[meal][dish] = value
			}
		})
		return result
	} else { // "optimal" | "infeasible" | "unbounded" | "timedout" | "cycled"
		console.error(`Failed to solve for day ${day} for person ${person}:`, solution.status)
		// TODO: maybe have a better way to show errors, or to pass them back in through the solution to display on the page
		return {}
	}
}

////////////////////////////////////////////////////////////////////////////////
// MODEL
////////////////////////////////////////////////////////////////////////////////

function makeModels(household: Household): Record<ISODateString, Record<Person["id"], Model>> {
	const models: Record<ISODateString, Record<Person["id"], Model>> = {}
	
	const targetsByPerson: Map<number, Nutrition> = Object.values(household.people).reduce((acc, person) => acc.set(person.id, {
		calories: targetCalories(person.age, person.sex, person.height, person.weight, person.goal, person.activity),
		protein: targetProtein(person.weight, person.activity), // TODO: maybe put these together, all taking a person? or put it in a getter on the cache
	}), new Map())
	const weightsByPerson: Map<number, Nutrition> = Object.values(household.people).reduce((acc, person) => acc.set(person.id, {
		calories: 10, // TODO: add to model & database
		protein: 1, // TODO: add to model & database
	}), new Map())
	
	const days = Map.groupBy(Object.values(household.meals).filter(meal => meal.day), meal => meal.day!)
	days.forEach((mealsOfDay, day) => { // per day
		models[day] = {}
		
		Object.values(household.people).forEach(person => { // per person
			const meals = mealsOfDay.filter(meal => person.visiting ? meal.whitelist.includes(person.id) : !meal.blacklist.includes(person.id)) // get the meals they're a part of
			if (0 < meals.length) { // if they're a part of any meals this day
				
				const model = makeModel(meals, targetsByPerson.get(person.id)!, weightsByPerson.get(person.id)!)
				
				models[day][person.id] = model
			}
		})
	})
	
	return models
}

function makeModel(meals: Array<Meal>, targets: Nutrition, weights: Nutrition): Model {
	const nutritionByDish = meals.reduce((acc, meal) => Object.values(meal.components).reduce((a, component) => { a[component.dish] = nutritionOfDish(component.dish); return a }, acc), {} as Record<Dish["id"], Nutrition>) // TODO: maybe pass these in already calculated?
	
	// TERMIABLES
	
	const servings = (meal: number, dish: number) => `servings_${meal}_${dish}` // NOTE: it uses underscores and position to get the ids back out
	const calorieError = "calorie_error"
	const proteinError = "protein_error"
	
	// Snippets
	
	const totalCalories = SUM(meals, meal => SUM(Object.values(meal.components), component => TERM(servings(meal.id, component.dish), nutritionByDish[component.dish].calories)))
	const totalProtein = SUM(meals, meal => SUM(Object.values(meal.components), component => TERM(servings(meal.id, component.dish), nutritionByDish[component.dish].protein)))
	
	// OBJECTIVE
	
	const objective = TERMS({[calorieError]: weights.calories, [proteinError]: weights.protein})
	
	// CONSTRAINTS
	
	// define error variables
	const defineErrors = {
		defineCalorieErrorPositive: EQ(TERM(calorieError), ">", totalCalories.minus(targets.calories).times(1 / targets.calories)),
		defineCalorieErrorNegative: EQ(TERM(calorieError), ">", totalCalories.minus(targets.calories).times(-1 / targets.calories)),
		defineProteinErrorPositive: EQ(TERM(proteinError), ">", totalProtein.minus(targets.protein).times(1 / targets.protein)),
		defineProteinErrorNegative: EQ(TERM(proteinError), ">", totalProtein.minus(targets.protein).times(-1 / targets.protein)),
	}
	
	// sanity checks
	const mustHavePositiveServings: Record<string, LinearEquation> = {}
	for (const meal of meals) {
		for (const component of Object.values(meal.components)) {
			mustHavePositiveServings[`noNegatives_${meal.id}_${component.dish}`] = EQ(0, "<", TERM(servings(meal.id, component.dish)))
		}
	}
	
	// restrict servings for dishes that are explicitly restricted
	const restrictServingsForDishesThatAreExplicitlyRestricted: Record<string, LinearEquation> = {}
	for (const meal of meals) { // for each meal
		for (const component of Object.values(meal.components)) { // for each dish
			const eq = component.restriction == "exactly" ? "=" : component.restriction == "no_less_than" ? ">" : "<"
			if (component.restriction) { restrictServingsForDishesThatAreExplicitlyRestricted[`restrictServingsForDishesThatAreExplicitlyRestricted_${meal.id}_${component.dish}`] =
				component.percent === true ?        EQ(TERM(servings(meal.id, component.dish), nutritionByDish[component.dish].calories), eq, SUM(Object.values(meal.components), c => TERM(servings(meal.id, c.dish), nutritionByDish[c.dish].calories)).times(component.amount / 100)) // if there is a percentage restriction
				: component.percent === false ?     EQ(TERM(servings(meal.id, component.dish), nutritionByDish[component.dish].calories), eq, CONST(component.amount)) // if there is a calorie restriction
				: /*(component.percent === null)*/  EQ(TERM(servings(meal.id, component.dish)), eq, CONST(component.amount)) // if there is a serving restriction
		}}
	}
	
	// restrict servings for meals that are explicitly restricted
	const restrictServingsForMealsThatAreExplicitlyRestricted: Record<string, LinearEquation> = {}
	for (const meal of meals) { // for each meal
		const eq = meal.restriction == "exactly" ? "=" : meal.restriction == "no_less_than" ? ">" : "<"
		if (meal.restriction) { restrictServingsForMealsThatAreExplicitlyRestricted[`restrictServingsForMealsThatAreExplicitlyRestricted_${meal.id}`] = meal.percent
			? EQ(SUM(Object.values(meal.components), component => TERM(servings(meal.id, component.dish), nutritionByDish[component.dish].calories)), eq, SUM(meals, m => SUM(Object.values(m.components), c => TERM(servings(m.id, c.dish), nutritionByDish[c.dish].calories))).times(meal.amount / 100)) // if there is a percentage restriction
			: EQ(SUM(Object.values(meal.components), component => TERM(servings(meal.id, component.dish), nutritionByDish[component.dish].calories)), eq, CONST(meal.amount)) // if there is a calorie restriction
	}}
	
	// Model
	
	// debug logs
	// console.log("----")
	// Object.entries(defineErrors).forEach(([key, equation]) => console.log(`define errors -> ${key} -> ${equation}`))
	// Object.entries(mustHavePositiveServings).forEach(([key, equation]) => console.log(`mustHavePositiveServings -> ${key} -> ${equation}`))
	// Object.entries(restrictServingsForDishesThatAreExplicitlyRestricted).forEach(([key, equation]) => console.log(`restrictServingsForDishesThatAreExplicitlyRestricted -> ${key} -> ${equation}`))
	// Object.entries(restrictServingsForMealsThatAreExplicitlyRestricted).forEach(([key, equation]) => console.log(`restrictServingsForMealsThatAreExplicitlyRestricted -> ${key} -> ${equation}`))
	
	return {
		direction: "minimize" as const,
		objective: "objective", // the name of the objective expression
		constraints: { // really should be named the constraints' constant-side and equality or inequality
			...Object.entries(defineErrors).reduce((acc, [name, equation]) => { acc[name] = equation.constraint; return acc }, {} as Record<string, LinearEquation["constraint"]>),
			...Object.entries(mustHavePositiveServings).reduce((acc, [name, equation]) => { acc[name] = equation.constraint; return acc }, {} as Record<string, LinearEquation["constraint"]>),
			...Object.entries(restrictServingsForDishesThatAreExplicitlyRestricted).reduce((acc, [name, equation]) => { acc[name] = equation.constraint; return acc }, {} as Record<string, LinearEquation["constraint"]>),
			...Object.entries(restrictServingsForMealsThatAreExplicitlyRestricted).reduce((acc, [name, equation]) => { acc[name] = equation.constraint; return acc }, {} as Record<string, LinearEquation["constraint"]>),
		},
		variables: transpose({ // really should be named objective expression and terms-side of the constraint equations in standard form
			objective: objective.terms,
			...Object.entries(defineErrors).reduce((acc, [name, equation]) => { acc[name] = equation.variables; return acc }, {} as Record<string, LinearEquation["variables"]>),
			...Object.entries(mustHavePositiveServings).reduce((acc, [name, equation]) => { acc[name] = equation.variables; return acc }, {} as Record<string, LinearEquation["variables"]>),
			...Object.entries(restrictServingsForDishesThatAreExplicitlyRestricted).reduce((acc, [name, equation]) => { acc[name] = equation.variables; return acc }, {} as Record<string, LinearEquation["variables"]>),
			...Object.entries(restrictServingsForMealsThatAreExplicitlyRestricted).reduce((acc, [name, equation]) => { acc[name] = equation.variables; return acc }, {} as Record<string, LinearEquation["variables"]>),
		}),
	}
}

// transpose helper to rearrange it into the form required by YALPS
function transpose(expressions: Record<string, Map<Variable, number>>): Record<Variable, Record<string, number>> {
	let temp: Record<Variable, Record<string, number>> = {}
	Object.entries(expressions).forEach(([name, expression]) => {
		expression.forEach((value, variable) => {
			temp[variable] ??= {}
			temp[variable][name] = value
		})
	})
	return temp
}
