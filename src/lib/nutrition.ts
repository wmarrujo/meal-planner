import {dishes, foods} from "$lib/cache.svelte"

////////////////////////////////////////////////////////////////////////////////
// TYPE
////////////////////////////////////////////////////////////////////////////////

export type Nutrition = {
	calories: number
	protein: number
}

////////////////////////////////////////////////////////////////////////////////
// TARGETS
////////////////////////////////////////////////////////////////////////////////

export function targetCalories(age: number, sex: number, height: number, weight: number, goal: number, activity: number): number {
	// equation from: https://healthyeater.com/how-to-calculate-your-macros
	const sexAdjustment = 166 * sex - 161
	const restingEnergyExpenditureCalories = 10 * weight + 6.25 * height - 5 * age + sexAdjustment
	const activityMultiplier = 0.13125 * activity + 1.2
	const totalEnergyExpenditureCalories = restingEnergyExpenditureCalories * activityMultiplier
	const goalMultiplier = 0.2 * goal + 1
	return totalEnergyExpenditureCalories * goalMultiplier
}

export function targetProtein(weight: number, activity: number): number {
	// equation from: https://pressbooks.calstate.edu/nutritionandfitness/chapter/7-5-estimating-protein-needs/
	return weight * (0.05 * activity**2 + 0.1 * activity + 0.8)
}

// TODO: target carbohydrates equation from: https://pressbooks.calstate.edu/nutritionandfitness/chapter/carbohydrate-and-exercise/

////////////////////////////////////////////////////////////////////////////////
// NUTRITION
////////////////////////////////////////////////////////////////////////////////

// TODO: do this in a getter in the cache
/** Gets the nutrition in 1 serving of the dish */
export function nutritionOfDish(dish: number): Nutrition {
	const ingredients = dishes[dish].ingredients
	return Object.values(ingredients).reduce((total, ingredient) => {
		const food = foods[ingredient.food] // get the food
		const multiplier = (ingredient.serving ? food.servings[ingredient.serving]?.amount : undefined) ?? 1 // get the multiplier given by the chosen serving
		const amount = ingredient.amount * multiplier // get the amount of this ingredient in this dish (of g or ml)
		
		return {
			calories: total.calories + (food.calories ?? 0) * amount,
			protein: total.protein + (food.protein ?? 0) * amount,
		}
	}, {calories: 0, protein: 0})
}
