<script lang="ts">
	import {getContext} from "svelte"
	import {dishes} from "$lib/cache.svelte"
	import type {Household, ISODateString, Meal, Dish, Person} from "$lib/cache.svelte"
	import {calculateHousehold} from "$lib/solver"
	import {SvelteSet} from "svelte/reactivity"
	import {formatDate} from "$lib/utils"
	import {DateTime} from "luxon"
	import {EllipsisVertical} from "lucide-svelte"
	
	const home = $derived(getContext<{value: Household | undefined}>("home").value) // NOTE: will be defined except right after page load
	
	////////////////////////////////////////////////////////////////////////////////
	
	$effect(() => { if (home && !home.solution) home.solution = calculateHousehold(home) }) // calculate solution if needed
	
	let days = $state<SvelteSet<ISODateString>>(new SvelteSet([DateTime.now().toISODate()!])) // all the days to show (all at the start of the day), as ISO Dates so they will be equal in the set
	$effect(() => { if (home) { Object.values(home.meals).forEach(meal => { if (meal.day) days.add(meal.day) }) } else { days.clear(); days.add(DateTime.now().toISODate()!) }}) // make sure each of the days that a meal is on are in the days list, reset with no home
	
	let schedule = $derived.by(() => {
		let temp: Record<ISODateString, Record<Meal["id"], Record<Dish["id"], Record<Person["id"], number>>>> = {}
		if (home && home.solution) {
			Object.entries(home.solution).forEach(([person_, meals]) => { const person = Number(person_)
				Object.entries(meals).forEach(([meal_, dishes]) => { const meal = Number(meal_)
					Object.entries(dishes).forEach(([dish_, serving]) => { const dish = Number(dish_)
						const day = home.meals[meal].day!
						temp[day] ??= {}
						temp[day][meal] ??= {}
						temp[day][meal][dish] ??= {}
						temp[day][meal][dish][person] = serving
					})
				})
			})
		}
		return temp
	})
</script>

{#if home && home.solution}
	<main class="flex h-[calc(100vh-4rem)] relative overflow-scroll scroll">
		<div class="flex flex-col">
			{#each [...days].sort().map(d => DateTime.fromISO(d)) as day (day)}
				{#if DateTime.now().toMillis() < day.toMillis() && !schedule[day.minus({days: 1}).toISODate()!]}
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
					{#each Object.values(home.meals).filter(meal => meal.date?.startOf("day")?.equals(day)).sort((a, b) => a.date!.diff(b.date!, "minutes").as("minutes")) as meal (meal.id)}
						{@const people = Object.values(home.people).filter(person => person.visiting ? meal.whitelist.includes(person.id) : !meal.blacklist.includes(person.id))}
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
									{#each Object.keys(meal.components) as dishId (dishId)}
										{@const dish = dishes[Number(dishId)]}
										<tr>
											<td>{dish.name}</td>
											{#each people as person (person.id)}
												<td class="text-lg">{schedule[day.toISODate()!]?.[meal.id]?.[dish.id]?.[person.id]?.toLocaleString(undefined, {maximumFractionDigits: 2}) ?? 0}</td>
											{/each}
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					{/each}
				</div>
				{#if day.toMillis() < DateTime.now().toMillis() && !schedule[day.plus({days: 1}).toISODate()!]}
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
