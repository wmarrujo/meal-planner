<script lang="ts">
	import {onMount} from "svelte"
	import {supabase} from "$lib/supabase"
	import {toast} from "svelte-sonner"
	import type {Enums} from "$schema"
	
	////////////////////////////////////////////////////////////////////////////////
	
	type Meal = {
		id: number
		name: string
		day: string
		time: string | null
		amount: number
		percent: boolean | null
		restriction: Enums<"restriction"> | null
		components: Record<number, Component>
	}
	
	type Component = {
		meal: number
		dish: number
		amount: number
	}
	
	let meals: Record<number, Meal> = $state({})
	
	onMount(async () => {
		const {data: mealsData, error: mealsError} = await supabase
			.from("meals")
			.select("id, name, day, time, amount, percent, restriction")
			.neq("day", null)
		if (mealsError) { console.error("Error in getting meals:", mealsError); toast.error("Error in getting meals."); return }
		meals = mealsData.reduce((acc, meal) => {
			acc[meal.id] = {
				id: meal.id,
				name: meal.name,
				day: meal.day!,
				time: meal.time,
				amount: meal.amount,
				percent: meal.percent,
				restriction: meal.restriction,
				components: [],
			}
			return acc
		}, {} as Record<number, Meal>)
		
		const {data: componentsData, error: componentsError} = await supabase
			.from("components")
			.select("meal, dish, amount, unit, restriction")
			.in("meal", mealsData.map(meal => meal.id))
		if (componentsError) { console.error("Error in getting meal components:", componentsError); toast.error("Error in getting components of meals."); return }
		componentsData.forEach(component => meals[component.meal].components[component.dish] = component)
	})
</script>

<div class="flex flex-col">
	
</div>
