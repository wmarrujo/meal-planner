import {solve, type Model} from "yalps"

// Target Calories Equation from: https://healthyeater.com/how-to-calculate-your-macros
// Target Protein Equation from: https://pressbooks.calstate.edu/nutritionandfitness/chapter/7-5-estimating-protein-needs/
// Target Carbohydrates Equation from: https://pressbooks.calstate.edu/nutritionandfitness/chapter/carbohydrate-and-exercise/

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

function model(): Model {
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
