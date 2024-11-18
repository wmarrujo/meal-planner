import {solve, type Model} from "yalps"
import type {Household, Meal} from "$lib/cache.svelte"

// Target Calories Equation from: https://healthyeater.com/how-to-calculate-your-macros
// Target Protein Equation from: https://pressbooks.calstate.edu/nutritionandfitness/chapter/7-5-estimating-protein-needs/
// Target Carbohydrates Equation from: https://pressbooks.calstate.edu/nutritionandfitness/chapter/carbohydrate-and-exercise/

////////////////////////////////////////////////////////////////////////////////
// TARGETS
////////////////////////////////////////////////////////////////////////////////

type Targets = {
	calories: number
	protein: number
}

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

export function makeModels(household: Household): Map<number, Map<number, Model>> { // Map<Day, Map<Person.id, Model>> // DEBUG: remove the export
	const models = new Map()
	
	const targets: Map<number, Targets> = household.people.values().reduce((acc, person) => acc.set(person.id, {
		calories: targetCalories(person.age, person.sex, person.height, person.weight, person.goal, person.activity),
		protein: targetProtein(person.weight, person.activity),
	}), new Map())
	
	const days = Map.groupBy(household.meals.values().filter(meal => meal.day), meal => meal.day!)
	days.forEach((mealsOfDay, day) => {
		models.set(day, new Map())
		household.people.forEach(person => {
			const meals = mealsOfDay.filter(meal => person.visiting ? meal.whitelist.has(person.id) : !meal.blacklist.has(person.id))
			
			if (0 < meals.length) { // if they're a part of any meals this day
				const model = makeModel(meals, targets.get(person.id)!)
				
				models.get(day).set(person.id, model)
			}
		})
	})
	
	return models
}

function makeModel(meals: Array<Meal>, targets: Targets): Model {
	// TODO: implement
	const objective = sum(meals, meal => sum(meal.components.values(), component => LE({[`${meal.id}-${component.dish}`]: 0}))) // TODO: calculate calories for 1 serving of the dish
	
	return {
		direction: "maximize" as const,
		objective: "profit",
		constraints: {
			wood: {max: 300},
			labor: {max: 110},
			storage: {max: 400},
		},
		variables: {
			table: {wood: 30, labor: 5, profit: 1200, storage: 30},
			dresser: {wood: 20, labor: 10, profit: 1600, storage: 50},
		},
	}
}

////////////////////////////////////////////////////////////////////////////////

type Variable = string

class LinearExpression {
	constant: number = 0
	terms: Map<Variable, number> = new Map()
	
	plus(expression: LinearExpression | number) {
		const temp = new LinearExpression()
		if (typeof expression === "number") {
			temp.constant = this.constant + expression
		} else {
			temp.constant = this.constant + expression.constant
			temp.terms = new Map(this.terms) // make a copy of the left's terms
			expression.terms.forEach((value, key) => temp.terms.set(key, temp.terms.get(key) ?? 0 + value)) // add on the right's values by term
		}
		return temp
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
	
	// simplified() // TODO: turn into standard form (constant on one side, terms on the other)
}

// BUILDERS

function LE(expression: Record<Variable, number> | number): LinearExpression {
	const temp = new LinearExpression()
	if (typeof expression === "number") temp.constant = expression
	else Object.entries(expression).forEach(([variable, value]) => temp.terms.set(variable, value))
	return temp
}

function sum<T>(set: Iterable<T>, linearize: (value: T) => LinearExpression | number): LinearExpression {
	const temp = new LinearExpression()
	for (const t of set) { temp.plus(linearize(t)) }
	return temp
}
