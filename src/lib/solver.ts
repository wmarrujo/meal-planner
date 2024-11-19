import {solve, type Model} from "yalps"
import type {Household, Person, Meal, Dish} from "$lib/cache.svelte"
import {type Variable, LinearEquation, LE, sum} from "$lib/linear-algebra"
import {type Nutrition, targetCalories, targetProtein, nutritionOfDish} from "$lib/nutrition"

////////////////////////////////////////////////////////////////////////////////
// SOLVER
////////////////////////////////////////////////////////////////////////////////

export function calculateHousehold(household: Household): Map<Person["id"], Map<Meal["id"], Map<Dish["id"], number>>> {
	const models = makeModels(household)
	const solution = new Map()
	models.forEach((dayModels, day) => dayModels.forEach((model, person) => solution.set(person, solveModel(model, day, person))))
	return solution
}

export function solveModel(model: Model, day: string, person: number): Map<Meal["id"], Map<Dish["id"], number>> {
	const solution = solve(model, {includeZeroVariables: true})
	if (solution.status == "optimal") {
		const result = new Map()
		solution.variables.forEach(([variable, value]) => {
			if (variable.startsWith("servings")) {
				const [_, meal, dish] = variable.split("_")
				result.set(meal, result.get(meal) ?? new Map())
				result.get(meal)!.set(dish, value)
			}
		})
		return result
	} else { // "optimal" | "infeasible" | "unbounded" | "timedout" | "cycled"
		console.error(`Failed to solve for day ${day} for person ${person}:`, solution.status)
		// TODO: maybe have a better way to show errors, or to pass them back in through the solution to display on the page
		return new Map()
	}
}

////////////////////////////////////////////////////////////////////////////////
// MODEL
////////////////////////////////////////////////////////////////////////////////

// DEBUG: remove the export
export function makeModels(household: Household): Map<string, Map<Person["id"], Model>> {
	const models = new Map()
	
	const targetsByPerson: Map<number, Nutrition> = household.people.values().reduce((acc, person) => acc.set(person.id, {
		calories: targetCalories(person.age, person.sex, person.height, person.weight, person.goal, person.activity),
		protein: targetProtein(person.weight, person.activity), // TODO: maybe put these together, all taking a person? or put it in a getter on the cache
	}), new Map())
	const weightsByPerson: Map<number, Nutrition> = household.people.values().reduce((acc, person) => acc.set(person.id, {
		calories: 1, // TODO: add to model & database
		protein: 1, // TODO: add to model & database
	}), new Map())
	
	// per day
	const days = Map.groupBy(household.meals.values().filter(meal => meal.day), meal => meal.day!)
	days.forEach((mealsOfDay, day) => {
		models.set(day, new Map())
		
		// per person
		household.people.forEach(person => {
			const meals = mealsOfDay.filter(meal => person.visiting ? meal.whitelist.has(person.id) : !meal.blacklist.has(person.id)) // get the meals they're a part of
			if (0 < meals.length) { // if they're a part of any meals this day
				
				const model = makeModel(meals, targetsByPerson.get(person.id)!, weightsByPerson.get(person.id)!)
				
				models.get(day).set(person.id, model)
			}
		})
	})
	
	return models
}

function makeModel(meals: Array<Meal>, targets: Nutrition, weights: Nutrition): Model {
	const nutritonByDish = new Map(meals.flatMap(meal => [...meal.components.keys()]).map(dish => [dish, nutritionOfDish(dish)])) // TODO: maybe pass these in already calculated?
	
	// Variables
	const servings = (meal: number, dish: number) => `servings_${meal}_${dish}` // NOTE: it uses underscores and position to get the ids back out
	const calorieError = "calorie_error"
	const proteinError = "protein_error"
	
	// Snippets
	const totalCalories = sum(meals, meal => sum(meal.components.keys(), dish => LE({[servings(meal.id, dish)]: nutritonByDish.get(dish)!.calories})))
	const totalProtein = sum(meals, meal => sum(meal.components.keys(), dish => LE({[servings(meal.id, dish)]: nutritonByDish.get(dish)!.protein})))
	
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
			temp[variable] = temp[variable] ?? {}
			temp[variable][name] = value
		})
	})
	return temp
}
