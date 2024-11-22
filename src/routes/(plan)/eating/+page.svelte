<script lang="ts">
	import {getContext, onMount} from "svelte"
	import {dishes} from "$lib/cache.svelte"
	import type {Household, ISODateString, Meal, Dish, Person} from "$lib/cache.svelte"
	import {calculateHousehold} from "$lib/solver"
	import {SvelteMap, SvelteSet} from "svelte/reactivity"
	import {formatDate} from "$lib/utils"
	import {DateTime} from "luxon"
	import {EllipsisVertical} from "lucide-svelte"
	
	const home = $derived(getContext<{value: Household | undefined}>("home").value) // NOTE: will be defined except right after page load
	
	////////////////////////////////////////////////////////////////////////////////
	
	let days = $state<SvelteSet<ISODateString>>(new SvelteSet([DateTime.now().toISODate()!])) // all the days to show (all at the start of the day), as ISO Dates so they will be equal in the set
	$effect(() => { if (home) { home.meals.values().forEach(meal => days.add(meal.date.toISODate()!)) } else { days.clear(); days.add(DateTime.now().toISODate()!) }}) // make sure each of the days that a meal is on are in the days list, reset with no home
	
	let schedule: SvelteMap<ISODateString, SvelteMap<Meal["id"], SvelteMap<Dish["id"], SvelteMap<Person["id"], number>>>> = new SvelteMap()
	$effect(() => { if (home) calculateHouseholdIfNeeded(home) }) // when home updates, calculate the household schedule if needed
	
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

{#if home && home.solution}
	<main class="flex h-[calc(100vh-4rem)] relative overflow-scroll scroll">
		<div class="flex flex-col">
			{#each [...days].sort().map(d => DateTime.fromISO(d)) as day (day)}
				{#if DateTime.now() < day && !schedule.has(day.minus({days: 1}).toISODate()!)}
					<div class="flex border-t border-base-content">
						<div class="min-w-14 border-base-content py-1 flex justify-center sticky left-0 bg-base-100">
							<EllipsisVertical class="my-3" />
						</div>
					</div>
				{/if}
				<div class="flex border-t border-base-content">
					<div class="flex border-r border-base-content p-2 min-w-14 justify-center items-center sticky left-0 bg-base-100">
						<span class="[writing-mode:vertical-rl] [scale:-1] text-lg">{formatDate(day)}</span>
					</div>
					{#each [...home.meals.values().filter(meal => meal.date.startOf("day").equals(day))].sort((a, b) => a.date.diff(b.date, "minutes").as("minutes")) as meal (meal.id)}
						{@const people = [...home.people.values()].filter(person => person.visiting ? meal.whitelist.has(person.id) : !meal.blacklist.has(person.id))}
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
									{#each meal.components as [dishId, _component] (dishId)}
										{@const dish = dishes.get(dishId)!}
										<tr>
											<td>{dish.name}</td>
											{#each people as person (person.id)}
												<td class="text-lg">{schedule.get(day.toISODate()!)?.get(meal.id)?.get(dish.id)?.get(person.id)?.toFixed(2) ?? 0}</td>
											{/each}
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					{/each}
				</div>
				{#if day < DateTime.now() && !schedule.has(day.plus({days: 1}).toISODate()!)}
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
