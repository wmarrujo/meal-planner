<script lang="ts">
	import {onMount} from "svelte"
	import {supabase} from "$lib/supabase"
	import {toast} from "svelte-sonner"
	import type {Enums} from "$schema"
	import {Plus, LockOpen, Equal, ChevronLeft, ChevronRight} from "lucide-svelte"
	
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
					<div class="flex items-center gap-2">
						<input type="text" value={meal.name} class="input text-xl p-1" />
						<button class="btn btn-square btn-sm">
							{#if meal.restriction == "exactly"}
								<Equal />
							{:else if meal.restriction == "no_less_than"}
								<ChevronLeft />
							{:else if meal.restriction == "no_more_than"}
								<ChevronRight />
							{:else}
								<LockOpen />
							{/if}
						</button>
						<input type="number" value={meal.amount} class="input w-12 input-sm text-lg px-0 text-center {!meal.restriction && "invisible"}" />
						<div class="dropdown w-16 relative {!meal.restriction && "invisible"}">
							<div tabindex={0} role="button" class="btn btn-sm w-16">
								{#if meal.percent}
									%
								{:else}
									kcal
								{/if}
							</div>
							<ul class="dropdown-content bg-base-300 p-2 absolute w-full rounded-b-lg">
								<li class="hover:bg-primary hover:text-primary-content text-center rounded-sm">%</li>
								<li class="hover:bg-primary hover:text-primary-content text-center rounded-sm">kcal</li>
							</ul>
						</div>
					</div>
					<div class="grid">
						
					</div>
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

<style lang="pcss" scoped>
	input[type=number] {
		appearance: textfield;
		-moz-appearance: textfield;
	}
	input[type="number"]::-webkit-inner-spin-button,
	input[type="number"]::-webkit-outer-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}
</style>
