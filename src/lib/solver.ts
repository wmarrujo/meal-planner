import {solve, type Model} from "yalps"
import type {Household, Person, Meal, Dish, ISODateString} from "$lib/cache.svelte"
import {type Variable, LinearEquation, LE, sum} from "$lib/linear-algebra"
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
		calories: 1, // TODO: add to model & database
		protein: 1, // TODO: add to model & database
	}), new Map())
	
	// per day
	const days = Map.groupBy(Object.values(household.meals).filter(meal => meal.day), meal => meal.day!)
	days.forEach((mealsOfDay, day) => {
		models[day] = {}
		
		// per person
		Object.values(household.people).forEach(person => {
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
	const nutritonByDish = new Map(meals.flatMap(meal => Object.keys(meal.components)).map(dish => [Number(dish), nutritionOfDish(Number(dish))])) // TODO: maybe pass these in already calculated?
	
	// Variables
	const servings = (meal: number, dish: number) => `servings_${meal}_${dish}` // NOTE: it uses underscores and position to get the ids back out
	const calorieError = "calorie_error"
	const proteinError = "protein_error"
	
	// Snippets
	const totalCalories = sum(meals, meal => sum(Object.keys(meal.components), dish => LE({[servings(meal.id, Number(dish))]: nutritonByDish.get(Number(dish))!.calories})))
	const totalProtein = sum(meals, meal => sum(Object.keys(meal.components), dish => LE({[servings(meal.id, Number(dish))]: nutritonByDish.get(Number(dish))!.protein})))
	
	// Objective
	const objective =
		LE({[calorieError]: 1}).times(weights.calories)
		.plus(LE({[proteinError]: 1}).times(weights.protein))
	
	// Constraints
	const defineCalorieErrorPositive = new LinearEquation(LE({[calorieError]: 1}), ">", totalCalories.minus(targets.calories).times(1 / targets.calories))
	const defineCalorieErrorNegative = new LinearEquation(LE({[calorieError]: 1}), ">", totalCalories.minus(targets.calories).times(-1 / targets.calories))
	const defineProteinErrorPositive = new LinearEquation(LE({[proteinError]: 1}), ">", totalProtein.minus(targets.protein).times(1 / targets.protein))
	const defineProteinErrorNegative = new LinearEquation(LE({[proteinError]: 1}), ">", totalProtein.minus(targets.protein).times(-1 / targets.protein))
	const mustHavePositiveCalories = new LinearEquation(0, "<", totalCalories)
	const mustHavePositiveProtein = new LinearEquation(0, "<", totalProtein)
	// TODO: constraints for locking values
	
	// Model
	
	return {
		direction: "minimize" as const,
		objective: "objective", // the name of the objective expression
		constraints: { // really should be named the constraints' constant-side and equality or inequality
			defineCalorieErrorPositive: defineCalorieErrorPositive.constraint,
			defineCalorieErrorNegative: defineCalorieErrorNegative.constraint,
			defineProteinErrorPositive: defineProteinErrorPositive.constraint,
			defineProteinErrorNegative: defineProteinErrorNegative.constraint,
			mustHavePositiveCalories: mustHavePositiveCalories.constraint,
			mustHavePositiveProtein: mustHavePositiveProtein.constraint,
		},
		variables: transpose({ // really should be named objective expression and terms-side of the constraint equations in standard form
			objective: objective.terms,
			defineCalorieErrorPositive: defineCalorieErrorPositive.variables,
			defineCalorieErrorNegative: defineCalorieErrorNegative.variables,
			defineProteinErrorPositive: defineProteinErrorPositive.variables,
			defineProteinErrorNegative: defineProteinErrorNegative.variables,
			mustHavePositiveCalories: mustHavePositiveCalories.variables,
			mustHavePositiveProtein: mustHavePositiveProtein.variables,
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
