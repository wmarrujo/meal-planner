import {dishes, foods} from "$lib/cache.svelte"

// Target Calories Equation from: https://healthyeater.com/how-to-calculate-your-macros
// Target Protein Equation from: https://pressbooks.calstate.edu/nutritionandfitness/chapter/7-5-estimating-protein-needs/
// Target Carbohydrates Equation from: https://pressbooks.calstate.edu/nutritionandfitness/chapter/carbohydrate-and-exercise/

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
	const sexAdjustment = 166 * sex - 161
	const restingEnergyExpenditureCalories = weight * 10 + height * 6.25 - age * 5 + sexAdjustment
	const activityMultiplier = 0.175 * activity + 0.85
	const totalEnergyExpenditureCalories = restingEnergyExpenditureCalories * activityMultiplier
	const goalMultiplier = 0.15 * goal + 0.55
	return totalEnergyExpenditureCalories * goalMultiplier
}

export function targetProtein(weight: number, activity: number): number {
	return weight * (-1/3 * activity**2 + 13/30 * activity + 0.8)
}

////////////////////////////////////////////////////////////////////////////////
// NUTRITION
////////////////////////////////////////////////////////////////////////////////

// TODO: do this in a getter in the cache
/** Gets the nutrition in 1 serving of the dish */
export function nutritionOfDish(dish: number): Nutrition {
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
