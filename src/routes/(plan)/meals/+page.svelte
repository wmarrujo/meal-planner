<script lang="ts">
	import {onMount} from "svelte"
	import {supabase} from "$lib/supabase"
	import {toast} from "svelte-sonner"
	import type {Enums} from "$schema"
	import {Plus} from "lucide-svelte"
	
	////////////////////////////////////////////////////////////////////////////////
	
	type Meal = {
		id: number
		name: string
		day: string // the ISO date string
		time: string | null // the ISO time string
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
	let days = $derived([...new Set(Object.values(meals).map(meal => meal.day))].sort())
	
	onMount(async () => {
		const {data: mealsData, error: mealsError} = await supabase
			.from("meals")
			.select("id, name, day, time, amount, percent, restriction")
			.not("day", "is", null)
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
	
	function formatDate(date: Date): string {
		const now = new Date()
		if (date.getFullYear() == now.getFullYear()) {
			return date.toDateString()
			// TODO: for near dates, say "yesterday", "today", "tomorrow"
			// TODO: for near dates say "last monday", "next tuesday", etc.
			// TODO: for starts of months, say "Oct 1", "Nov 1" in addition to near dates
			// TODO: for other dates within the year, just say "Fri Nov 23", "Tue Apr 15"
		} else {
			return date.toDateString()
		}
	}
</script>

<main class="flex flex-col">
	{#each days as day (day)}
		<div class="flex border-t">
			<div class="flex border-r p-2 w-14 justify-center">
				<span class="[writing-mode:vertical-rl] [scale:-1] text-lg">{formatDate(new Date(day))}</span>
			</div>
			{#each Object.values(meals).filter(meal => meal.day == day).sort((a, b) => (String(a.time)).localeCompare(String(b.time))) as meal (meal.id)}
				<div class="p-2 border-r border-dotted">
					{meal.name}
				</div>
			{/each}
			<div class="p-2 flex items-center">
				<!-- TODO: input name -->
				<button class="btn"><Plus />Add Meal</button>
			</div>
		</div>
	{/each}
	<div class="flex border-t">
		<div class="w-14 border-r p-2 flex justify-center">
			<button class="btn btn-square btn-sm"><Plus /></button>
		</div>
	</div>
</main>
