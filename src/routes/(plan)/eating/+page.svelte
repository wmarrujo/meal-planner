<script lang="ts">
	import {getContext, onMount} from "svelte"
	import {dishes} from "$lib/cache.svelte"
	import type {Household, ISODateString, Meal, Dish, Person} from "$lib/cache.svelte"
	import {calculateHousehold} from "$lib/solver"
	import {SvelteMap} from "svelte/reactivity"
	import {formatDate} from "$lib/utils"
	import {DateTime} from "luxon"
	import {EllipsisVertical} from "lucide-svelte"
	
	const home = $derived(getContext<{value: Household | undefined}>("home").value) // NOTE: will be defined except right after page load
	
	////////////////////////////////////////////////////////////////////////////////
	
	let schedule: SvelteMap<ISODateString, SvelteMap<Meal["id"], SvelteMap<Dish["id"], SvelteMap<Person["id"], number>>>> = new SvelteMap()
	
	onMount(() => { if (home) calculateHouseholdIfNeeded(home) })
	$effect(() => { if (home) calculateHouseholdIfNeeded(home) }) // when home updates, calculate the household schedule if needed
	
	$inspect(schedule)
	
	function calculateHouseholdIfNeeded(household: Household) {
		if (!household.solution) { household.solution = calculateHousehold(household) } // calculate if needed
		household!.solution!.forEach((meals, person) => {
			meals.forEach((dishes, meal) => {
				dishes.forEach((serving, dish) => {
					const day = household.meals.get(meal)!.day!
					const scheduleDay = schedule.get(day) ?? new SvelteMap()
					schedule.set(day, scheduleDay)
					const scheduleMeal = scheduleDay.get(meal) ?? new SvelteMap()
					scheduleDay.set(meal, scheduleMeal)
					const scheduleDish = scheduleMeal.get(dish) ?? new SvelteMap()
					scheduleMeal.set(dish, scheduleDish)
					scheduleDish.set(person, serving)
				})
			})
		})
	}
</script>

{#if home?.solution}
	<main class="flex h-[calc(100vh-4rem)] relative overflow-scroll scroll">
		<div class="flex flex-col">
			{#each schedule as [day, meals] (day)}
				{@const date = DateTime.fromISO(day)}
				{#if DateTime.now() < date && !schedule.has(date.minus({days: 1}).toISODate()!)}
					<div class="flex border-t border-base-content">
						<div class="min-w-14 border-base-content py-1 flex justify-center sticky left-0 bg-base-100">
							<EllipsisVertical class="my-3" />
						</div>
					</div>
				{/if}
				<div class="flex border-t border-base-content">
					<div class="flex border-r border-base-content p-2 min-w-14 justify-center items-center sticky left-0 bg-base-100">
						<span class="[writing-mode:vertical-rl] [scale:-1] text-lg">{formatDate(date)}</span>
					</div>
					{#each [...meals].sort(([a, _1], [b, _2]) => home.meals.get(a)!.date.diff(home.meals.get(b)!.date, "minutes").as("minutes")) as [mealId, servingsPerPersonPerDish] (mealId)}
						{@const meal = home.meals.get(mealId)!}
						{@const people = [...servingsPerPersonPerDish.values().flatMap(servingsByPerson => servingsByPerson.keys().map(person => home.people.get(person)!))]}
						<div class="p-2 border-r border-base-content border-dotted group">
							<h2 class="mb-5 text-2xl">{meal.name}</h2>
							<table class="table">
								<thead>
									<tr>
										<th></th>
										{#each people as person (person.id)}
											<th>{person.name}</th>
										{/each}
									</tr>
								</thead>
								<tbody>
									{#each meal.components as [dishId, _] (dishId)}
										{@const servingsPerPerson = servingsPerPersonPerDish.get(dishId)!}
										{@const dish = dishes.get(dishId)!}
										<tr>
											<td>{dish.name}</td>
											{#each people as person (person.id)}
												<td class="text-lg">{servingsPerPerson.get(person.id)!.toFixed(2)}</td>
											{/each}
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					{/each}
				</div>
				{#if date < DateTime.now() && !schedule.has(date.plus({days: 1}).toISODate()!)}
					<div class="flex border-t border-base-content">
						<div class="min-w-14 border-base-content py-1 flex justify-center sticky left-0 bg-base-100">
							<EllipsisVertical class="my-3" />
						</div>
					</div>
				{/if}
			{/each}
		</div>
	</main>
{:else}
	<span>Calculating...</span>
{/if}
