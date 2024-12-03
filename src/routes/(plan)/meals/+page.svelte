<script lang="ts">
	import {getContext, onMount} from "svelte"
	import {supabase} from "$lib/supabase"
	import {toast} from "svelte-sonner"
	import {Plus, Trash2, LockOpen, Equal, ChevronLeft, ChevronRight, EllipsisVertical} from "lucide-svelte"
	import {DateTime} from "luxon"
	import {SvelteSet} from "svelte/reactivity"
	import DishPicker from "./dish-picker.svelte"
	import TimePicker from "./time-picker.svelte"
	import {dishes, type Household, type ISODateString, type ISOTimeString} from "$lib/cache.svelte"
	import {formatDate} from "$lib/utils"
	
	const home = $derived(getContext<{value: Household | undefined}>("home").value) // NOTE: will be defined except right after page load
	
	////////////////////////////////////////////////////////////////////////////////
	
	onMount(() => { if (home) home.solution = undefined })
	
	////////////////////////////////////////////////////////////////////////////////
	
	let days = $state<SvelteSet<ISODateString>>(new SvelteSet([DateTime.now().toISODate()!])) // all the days to show (all at the start of the day), as ISO Dates so they will be equal in the set
	
	$effect(() => { if (home) { Object.values(home.meals).forEach(meal => { if (meal.day) days.add(meal.day) }) } else { days.clear(); days.add(DateTime.now().toISODate()!) }}) // make sure each of the days that a meal is on are in the days list, reset with no home
	
	////////////////////////////////////////////////////////////////////////////////
	// MEAL
	////////////////////////////////////////////////////////////////////////////////
	
	// ADD
	
	const mealNames = ["Breakfast", "Lunch", "Dinner", "Snack", "Brunch", "Linner", "Midnight Snack", "Second Breakfast", "Elevenses", "Luncheon", "Afternoon Tea", "Supper"]
	
	async function addMeal(day: DateTime | null) {
		const {data, error} = await supabase
			.from("meals")
			.insert({
				name: mealNames[Math.floor(Math.random() * mealNames.length)],
				day: day?.toISODate(),
				household: home!.id,
			})
			.select("id, household, name, day, time, amount, percent, restriction")
			.single()
		if (error) { console.error("Error in creating new meal:", error); toast.error("Error in creating new meal"); return }
		home!.meals[data.id] = {...data, date: DateTime.fromISO(data.day!), components: {}, whitelist: [], blacklist: []}
	}
	
	// EDIT
	
	async function setMealName(meal: number, name: string) {
		const {error} = await supabase
			.from("meals")
			.update({name})
			.eq("id", meal)
		if (error) { console.error("Error in setting meal name:", error); toast.error("Error in setting meal name."); return }
		home!.meals[meal].name = name
	}
	
	async function setMealTime(meal: number, time: ISOTimeString) {
		const {error} = await supabase
			.from("meals")
			.update({time})
			.eq("id", meal)
		if (error) { console.error("Error in setting meal time:", error); toast.error("Error in setting meal time."); return }
		home!.meals[meal].time = time
	}
	
	async function toggleMealRestriction(meal: number, existingRestriction: string | null) {
		const newRestriction // ||: unrestricted, =, <=, >= :||
			= !existingRestriction ? "exactly"
				: existingRestriction == "exactly" ? "no_more_than"
					: existingRestriction == "no_more_than" ? "no_less_than"
						: null
		const {error} = await supabase
			.from("meals")
			.update({restriction: newRestriction})
			.eq("id", meal)
		if (error) { console.error("Error in setting meal restriction:", error); toast.error("Error in setting meal restriction."); return }
		home!.meals[meal].restriction = newRestriction
		// TODO: eventually, to protect against people spamming this, add some throttling
	}
	
	async function setMealRestrictionAmount(meal: number, amount: number) {
		const {error} = await supabase
			.from("meals")
			.update({amount})
			.eq("id", meal)
		if (error) { console.error("Error in setting meal restriction amount:", error); toast.error("Error in setting meal restriction amount."); return }
		home!.meals[meal].amount = amount
	}
	
	async function setMealRestrictionPercent(meal: number, percent: boolean) {
		const {error} = await supabase
			.from("meals")
			.update({percent})
			.eq("id", meal)
		if (error) { console.error("Error in setting meal restriction percent:", error); toast.error("Error in setting meal restriction percent."); return }
		home!.meals[meal].percent = percent
		// TODO: eventually, to protect against people spamming this, add some throttling
	}
	
	// REMOVE
	
	async function removeMeal(meal: number) {
		// TODO: add an "are you sure?" check
		// TODO: add a soft-delete
		const {error} = await supabase
			.from("meals")
			.delete()
			.eq("id", meal)
		if (error) { console.error("Error in removing meal:", error); toast.error("Error in removing meal."); return }
		delete home!.meals[meal]
	}
	
	////////////////////////////////////////////////////////////////////////////////
	// COMPONENT
	////////////////////////////////////////////////////////////////////////////////
	
	// ADD
	
	async function addComponent(meal: number, dish: number) {
		const {data, error} = await supabase
			.from("components")
			.insert({meal, dish})
			.select("meal, dish, amount, percent, restriction")
			.single()
		if (error) { console.error("Error in adding meal component:", error); toast.error("Error in adding meal component."); return }
		home!.meals[meal].components[dish] = data
	}
	
	// EDIT
	
	async function toggleComponentRestriction(meal: number, dish: number, existingRestriction: string | null) {
		const newRestriction // ||: unrestricted, =, <=, >= :||
			= !existingRestriction ? "exactly"
				: existingRestriction == "exactly" ? "no_more_than"
					: existingRestriction == "no_more_than" ? "no_less_than"
						: null
		const {error} = await supabase
			.from("components")
			.update({restriction: newRestriction})
			.eq("meal", meal)
			.eq("dish", dish)
		if (error) { console.error("Error in setting meal component restriction:", error); toast.error("Error in setting meal component restriction."); return }
		home!.meals[meal].components[dish].restriction = newRestriction
		// TODO: eventually, to protect against people spamming this, add some throttling
	}
	
	async function setComponentRestrictionAmount(meal: number, dish: number, amount: number) {
		const {error} = await supabase
			.from("components")
			.update({amount})
			.eq("meal", meal)
			.eq("dish", dish)
		if (error) { console.error("Error in setting meal component restriction amount:", error); toast.error("Error in setting meal component restriction amount."); return }
		home!.meals[meal].components[dish].amount = amount
	}
	
	async function toggleComponentRestrictionPercent(meal: number, dish: number, percent: boolean | null) {
		const newPercent // ||: serving, %, kcal :||
			= percent === null ? true : percent ? false : null
		const {error} = await supabase
			.from("components")
			.update({percent: newPercent})
			.eq("meal", meal)
			.eq("dish", dish)
		if (error) { console.error("Error in setting meal component restriction percent:", error); toast.error("Error in setting meal component restriction percent."); return }
		home!.meals[meal].components[dish].percent = newPercent
		// TODO: eventually, to protect against people spamming this, add some throttling
	}
	
	// REMOVE
	
	async function removeComponent(meal: number, dish: number) {
		// TODO: add an "are you sure?" check
		// TODO: add a soft-delete
		const {error} = await supabase
			.from("components")
			.delete()
			.eq("meal", meal)
			.eq("dish", dish)
		if (error) { console.error("Error in removing meal component:", error); toast.error("Error in removing meal component."); return }
		delete home!.meals[meal].components[dish]
	}
</script>

{#if home}
	<main class="flex h-[calc(100vh-4rem)] relative overflow-scroll scroll">
		<div class="flex flex-col">
			{#each [...days].sort().map(d => DateTime.fromISO(d)) as day (day)}
				{#if DateTime.now() < day && !days.has(day.minus({days: 1}).toISODate()!) && !days.has(day.minus({days: 2}).toISODate()!) && !days.has(day.minus({days: 3}).toISODate()!)}
					<div class="flex border-t border-base-content">
						<div class="min-w-14 border-base-content py-1 flex justify-center sticky left-0 bg-base-100">
							<EllipsisVertical class="my-3" />
						</div>
					</div>
				{/if}
				{#if DateTime.now() < day && !days.has(day.minus({days: 1}).toISODate()!) && !days.has(day.minus({days: 2}).toISODate()!)}
					<div class="flex border-t border-base-content">
						<div class="min-w-14 border-r border-base-content py-1 flex justify-center sticky left-0 bg-base-100">
							<button onclick={() => days.add(day.minus({days: 1}).toISODate()!)} class="btn btn-square"><Plus /></button>
						</div>
					</div>
				{/if}
				<div class="flex border-t border-base-content">
					<div class="flex border-r border-base-content p-2 min-w-14 justify-center items-center sticky left-0 bg-base-100">
						<span class="[writing-mode:vertical-rl] [scale:-1] text-lg">{formatDate(day)}</span>
					</div>
					{#each Object.values(home.meals).filter(meal => meal.date?.startOf("day")?.equals(day)).sort((a, b) => a.date!.diff(b.date!, "minutes").as("minutes")) as meal (meal.id)}
						<div class="p-2 border-r border-base-content border-dotted group">
							<div class="flex items-center gap-2 mb-5">
								<input type="text" value={meal.name} onchange={event => setMealName(meal.id, event.currentTarget.value)} class="input text-xl p-1 grow w-32" />
								<TimePicker value={meal.time ?? undefined} onchange={time => setMealTime(meal.id, time)} />
								<button onclick={() => toggleMealRestriction(meal.id, meal.restriction)} class="btn btn-square btn-sm">
									{#if meal.restriction == "exactly"}
										<Equal />
									{:else if meal.restriction == "no_less_than"}
										<ChevronRight />
									{:else if meal.restriction == "no_more_than"}
										<ChevronLeft />
									{:else}
										<LockOpen />
									{/if}
								</button>
								<input type="number" value={meal.amount} onchange={event => setMealRestrictionAmount(meal.id, Number(event.currentTarget.value))} class="input w-12 input-sm text-lg px-0 text-center {!meal.restriction && "invisible"}" />
								<button onclick={() => setMealRestrictionPercent(meal.id, !meal.percent)} class="btn btn-sm w-20 {!meal.restriction && "invisible"}">
									{#if meal.percent}
										%
									{:else}
										kcal
									{/if}
								</button>
								<button onclick={() => removeMeal(meal.id)} class="btn btn-square btn-sm invisible group-hover:visible hover:bg-error"><Trash2 /></button>
							</div>
							<div class="grid grid-cols-[1fr_repeat(4,auto)] group/components gap-2 pl-4">
								{#each Object.values(meal.components) as component (component.dish)}
									{@const dish = dishes[component.dish]}
									<span class="text-lg flex items-center">{dish.name}</span>
									<button onclick={() => toggleComponentRestriction(meal.id, dish.id, component.restriction)} class="btn btn-square btn-sm">
										{#if component.restriction == "exactly"}
											<Equal />
										{:else if component.restriction == "no_less_than"}
											<ChevronRight />
										{:else if component.restriction == "no_more_than"}
											<ChevronLeft />
										{:else}
											<LockOpen />
										{/if}
									</button>
									<input type="number" value={component.amount} onchange={event => setComponentRestrictionAmount(meal.id, dish.id, Number(event.currentTarget.value))} class="input w-12 input-sm text-lg px-0 text-center {!component.restriction && "invisible"}" />
									<button onclick={() => toggleComponentRestrictionPercent(meal.id, dish.id, component.percent)} class="btn btn-sm w-20 {!component.restriction && "invisible"}">
										{#if component.percent === null}
											servings
										{:else if component.percent}
											%
										{:else}
											kcal
										{/if}
									</button>
									<button onclick={() => removeComponent(meal.id, dish.id)} class="btn btn-square btn-sm invisible group-hover/components:visible hover:bg-error"><Trash2 /></button>
								{/each}
							</div>
							<DishPicker class="pt-2" onselect={dish => addComponent(meal.id, dish)} />
						</div>
					{/each}
					<div class="p-2 flex items-start gap-2">
						<button onclick={() => addMeal(day)} class="btn"><Plus /></button>
					</div>
				</div>
				{#if !days.has(day.plus({days: 1}).toISODate()!)}
					<div class="flex border-t border-base-content">
						<div class="min-w-14 border-r border-base-content py-1 flex justify-center sticky left-0 bg-base-100">
							<button onclick={() => days.add(day.plus({days: 1}).toISODate()!)} class="btn btn-square"><Plus /></button>
						</div>
					</div>
				{/if}
				{#if day < DateTime.now() && !days.has(day.plus({days: 1}).toISODate()!) && !days.has(day.plus({days: 2}).toISODate()!) && !days.has(day.plus({days: 3}).toISODate()!)}
					<div class="flex border-t border-base-content">
						<div class="min-w-14 border-base-content py-1 flex justify-center sticky left-0 bg-base-100">
							<EllipsisVertical class="my-3" />
						</div>
					</div>
				{/if}
			{/each}
		</div>
	</main>
{/if}

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
