import {solve, type Model} from "yalps"
import {dishes, foods} from "$lib/cache.svelte"
import type {Household, Person, Meal} from "$lib/cache.svelte"

// Target Calories Equation from: https://healthyeater.com/how-to-calculate-your-macros
// Target Protein Equation from: https://pressbooks.calstate.edu/nutritionandfitness/chapter/7-5-estimating-protein-needs/
// Target Carbohydrates Equation from: https://pressbooks.calstate.edu/nutritionandfitness/chapter/carbohydrate-and-exercise/

////////////////////////////////////////////////////////////////////////////////
// TARGETS
////////////////////////////////////////////////////////////////////////////////


function targetCalories(age: number, sex: number, height: number, weight: number, goal: number, activity: number): number {
	const sexAdjustment = 166 * sex - 161
	const restingEnergyExpenditureCalories = weight * 10 + height * 6.25 - age * 5 + sexAdjustment
	const activityMultiplier = 0.175 * activity + 0.85
	const totalEnergyExpenditureCalories = restingEnergyExpenditureCalories * activityMultiplier
	const goalMultiplier = 0.15 * goal + 0.55
	return totalEnergyExpenditureCalories * goalMultiplier
}

function targetProtein(weight: number, activity: number): number {
	return weight * (-1/3 * activity**2 + 13/30 * activity + 0.8)
}

////////////////////////////////////////////////////////////////////////////////
// MODEL
////////////////////////////////////////////////////////////////////////////////

type Nutrition = {
	calories: number
	protein: number
}

export function makeModels(household: Household): Map<number, Map<number, Model>> { // Map<Day, Map<Person.id, Model>> // DEBUG: remove the export
	const models = new Map()
	
	const targetsByPerson: Map<number, Nutrition> = household.people.values().reduce((acc, person) => acc.set(person.id, {
		calories: targetCalories(person.age, person.sex, person.height, person.weight, person.goal, person.activity),
		protein: targetProtein(person.weight, person.activity),
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
	const s = (meal: number, dish: number) => `s_${meal}_${dish}`
	
	// Objective
	const objective =
		sum(meals, meal => sum(meal.components.keys(), dish => LE({[s(meal.id, dish)]: nutritonByDish.get(dish)!.calories * weights.calories / targets.calories}))).minus(1)
		.plus(sum(meals, meal => sum(meal.components.keys(), dish => LE({[s(meal.id, dish)]: nutritonByDish.get(dish)!.protein * weights.protein / targets.protein})))).minus(1)
	
	// Constraints
	// TODO: constraints
	
	// Model
	const variables = transpose({objective: objective.terms})
	return {
		direction: "maximize" as const,
		objective: "objective", // the name of the objective expression
		constraints: { // really should be named the constraints' constant-side and equality or inequality
			// TODO: constraints
		},
		variables, // really should be named objective expression and terms-side of the constraint equations in standard form
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

////////////////////////////////////////////////////////////////////////////////
// CALCULATIONS
////////////////////////////////////////////////////////////////////////////////

// TODO: do this in a getter in the cache
/** Gets the nutrition in 1 serving of the dish */
function nutritionOfDish(dish: number): Nutrition {
	const ingredients = dishes.get(dish)!.ingredients
	return ingredients.values().reduce((total, ingredient) => {
		const food = foods.get(ingredient.food)! // get the food
		const multiplier = (ingredient.serving ? food.servings.get(ingredient.serving)?.amount : undefined) ?? 1 // get the multiplier given by the chosen serving
		const amount = ingredient.amount * multiplier // get the amount of this ingredient in this dish (of g or ml)
		
		return {
			calories: total.calories + (food.calories ?? 0) * amount,
			protein: total.protein + (food.protein ?? 0) * amount,
		}
	}, {calories: 0, protein: 0})
}

////////////////////////////////////////////////////////////////////////////////
// LINEAR ALGEBRA
////////////////////////////////////////////////////////////////////////////////

type Variable = string

class LinearExpression {
	constant: number = 0
	terms: Map<Variable, number> = new Map()
	
	plus(expression: LinearExpression | number) {
		const temp = new LinearExpression()
		temp.terms = new Map(this.terms) // work with a copy of the left's terms
		if (typeof expression === "number") {
			temp.constant = this.constant + expression
		} else {
			temp.constant = this.constant + expression.constant
			expression.terms.forEach((value, variable) => temp.terms.set(variable, (temp.terms.get(variable) ?? 0) + value)) // add on the right's values by term
		}
		return temp
	}
	
	minus(expression: LinearExpression | number) {
		const temp = new LinearExpression()
		temp.terms = new Map(this.terms) // work with a copy of the left's terms
		if (typeof expression === "number") {
			temp.constant = this.constant - expression
		} else {
			temp.constant = this.constant - expression.constant
			expression.terms.forEach((value, variable) => temp.terms.set(variable, (temp.terms.get(variable) ?? 0) - value)) // subtract the right's values by term
		}
		return temp
	}
	
	times(scalar: number) {
		const temp = new LinearExpression()
		temp.constant = this.constant * scalar
		this.terms.forEach((value, variable) => temp.terms.set(variable, value * scalar))
	}
}

class LinearEquation {
	left: LinearExpression
	evaluator: "=" | "<" | ">"
	right: LinearExpression
	
	constructor(left: LinearExpression | number, evaluator: "=" | "<" | ">", right: LinearExpression | number) {
		this.evaluator = evaluator
		if (typeof left === "number") { const e = new LinearExpression(); e.constant = left; this.left = e } else { this.left = left }
		if (typeof right === "number") { const e = new LinearExpression(); e.constant = right; this.right = e } else { this.right = right }
	}
	
	toYALPSForm(): {constant: number, terms: Map<Variable, number>, evaluator: "equal" | "min" | "max"} { // turn into standard form (constant on one side, terms on the other)
		// turn: A + (Bx+Cy) = D + (Ex+Fy)
		// into: A - D = (Ex+Fy) - (Bx+Cy)
		const constant = this.left.constant - this.right.constant // subtract the right from the left, set that as the new left
		const terms = new Map(this.right.terms)
		this.left.terms.forEach((value, variable) => terms.set(variable, (terms.get(variable) ?? 0) - value)) // subtract the left from the right, set that as the new right
		return {constant, terms, evaluator: this.evaluator == "=" ? "equal" : this.evaluator == "<" ? "min" : "max"}
	}
}

// BUILDERS

function LE(expression: Record<Variable, number> | number): LinearExpression {
	const temp = new LinearExpression()
	if (typeof expression === "number") temp.constant = expression
	else Object.entries(expression).forEach(([variable, value]) => temp.terms.set(variable, value))
	return temp
}

function sum<T>(iterable: Iterable<T>, linearize: (item: T) => LinearExpression | number): LinearExpression {
	let temp = new LinearExpression()
	for (const t of iterable) { temp = temp.plus(linearize(t)) }
	return temp
}
