<script lang="ts">
	import {getContext} from "svelte"
	import {dishes, foods} from "$lib/cache.svelte"
	import type {Household, ISODateString, Meal, Dish} from "$lib/cache.svelte"
	import {calculateHousehold} from "$lib/solver"
	import {SvelteSet} from "svelte/reactivity"
	import {formatDate} from "$lib/utils"
	import {DateTime} from "luxon"
	
	const home = $derived(getContext<{value: Household | undefined}>("home").value) // NOTE: will be defined except right after page load
	
	////////////////////////////////////////////////////////////////////////////////
	
	$effect(() => { if (home && !home.solution) home.solution = calculateHousehold(home) }) // calculate solution if needed
	
	const meals = $state(new SvelteSet<Meal["id"]>()) // the meals that are selected
	$effect(() => home ? Object.keys(home?.meals).forEach(meal => meals.add(Number(meal))) : meals.clear()) // refresh whenever home is changed
	
	const days = $state<SvelteSet<ISODateString>>(new SvelteSet()) // all the days to show (all at the start of the day), as ISO Dates so they will be equal in the set
	$effect(() => { if (home) { Object.values(home.meals).forEach(meal => { if (meal.day) days.add(meal.day) }) } else { days.clear() }}) // make sure each of the days that a meal is on are in the days list, reset with no home
	
	const servings = $derived.by(() => {
		const temp: Record<Dish["id"], number> = {}
		if (home && home.solution) {
			meals.forEach(meal =>
				Object.values(home.meals[meal].components).forEach(component => {
					temp[component.dish] ??= 0
					temp[component.dish] += Object.keys(home.solution!).reduce((acc, person) => acc + home.solution![Number(person)][meal][component.dish], 0)
				})
			)
		}
		return temp
	})
</script>

{#if home && home.solution}
	<main class="flex gap-4 p-4">
		<div>
			<h1 class="text-2xl border-b border-base-300 w-full mb-2 px-2">Days</h1>
			<div class="flex items-center px-2 gap-2 pb-2 border-b border-base-300 mb-2"><input name="all" type="checkbox" checked={meals.size == Object.keys(home!.meals).length} onclick={event => Object.values(home.meals).forEach(meal => event.currentTarget.checked ? meals.add(meal.id) : meals.delete(meal.id))} class="checkbox">All Meals</div>
			<div class="flex flex-col gap-1">
				{#each [...days].sort() as day (day)}
					{@const mealsInDay = Object.values(home.meals).filter(meal => meal.day == day)}
					<div class="flex flex-col gap-1">
						<div class="flex px-2 gap-2 min-w-52">
							<input name={day} type="checkbox" checked={mealsInDay.every(meal => meals.has(meal.id))} onclick={event => Object.values(home.meals).filter(meal => meal.day == day).forEach(meal => event.currentTarget.checked ? meals.add(meal.id) : meals.delete(meal.id))} class="checkbox" />
							<h2>{formatDate(DateTime.fromISO(day))}</h2>
						</div>
						<div class="pl-4 flex flex-col gap-1">
							{#each mealsInDay.sort((a, b) => a.time!.localeCompare(b.time!)) as meal (meal.id)}
								<div class="flex px-2 gap-2 min-w-52">
									<input name={String(meal.id)} type="checkbox" checked={meals.has(meal.id)} onclick={event => event.currentTarget.checked ? meals.add(meal.id) : meals.delete(meal.id)} class="checkbox" />
									<h2>{meal.name}</h2>
								</div>
							{/each}
						</div>
					</div>
				{/each}
			</div>
		</div>
		<div>
			<h2 class="text-2xl border-b border-base-300 w-full mb-2 px-2">Dishes</h2>
			<div class="flex flex-col">
				{#each Object.entries(servings) as [dish, amount] (dish)}
					<div class="flex gap-2"><div class="w-16 text-right">{amount.toFixed(2)}</div><div>{dishes[Number(dish)].name}</div></div>
				{/each}
			</div>
		</div>
	</main>
{:else}
	<span>Calculating...</span>
{/if}
