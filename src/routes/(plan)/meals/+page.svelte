<script lang="ts">
	import {onMount, getContext} from "svelte"
	import {supabase} from "$lib/supabase"
	import {toast} from "svelte-sonner"
	import type {Enums} from "$schema"
	import {Plus, X, LockOpen, Equal, ChevronLeft, ChevronRight, EllipsisVertical} from "lucide-svelte"
	import {DateTime} from "luxon"
	import {SvelteSet} from "svelte/reactivity"
	import DishPicker from "./dish-picker.svelte"
	
	////////////////////////////////////////////////////////////////////////////////
	
	type Meal = {
		id: number
		name: string
		date: DateTime
		amount: number
		percent: boolean | null
		restriction: Enums<"restriction"> | null
		components: Record<number, Component>
	}
	
	type Component = {
		meal: number
		dish: {
			id: number
			name: string
		}
		amount: number
		percent: boolean | null
		restriction: string | null
	}
	
	////////////////////////////////////////////////////////////////////////////////
	
	const home = $derived(getContext<{value: number | undefined}>("home").value) // NOTE: because it's inside a guard that makes sure you only see the contents of this page when household is true (from layout), it will be defined whenever you can see anything (just not on mount)
	
	let days = $state<SvelteSet<string>>(new SvelteSet([DateTime.now().toISODate()!])) // all the days to show (all at the start of the day), as ISO Dates so they will be equal in the set
	
	let meals: Record<number, Meal> = $state({})
	$effect(() => Object.values(meals).forEach(meal => days.add(meal.date.toISODate()!))) // make sure each of the days that a meal is on are in the days list
	
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
				date: DateTime.fromISO(meal.time ? `${meal.day!}T${meal.time}` : meal.day!),
				amount: meal.amount,
				percent: meal.percent,
				restriction: meal.restriction,
				components: [],
			}
			return acc
		}, {} as Record<number, Meal>)
		
		const {data: componentsData, error: componentsError} = await supabase
			.from("components")
			.select("meal, dish:dishes!inner(id, name), amount, percent, restriction")
			.in("meal", mealsData.map(meal => meal.id))
		if (componentsError) { console.error("Error in getting meal components:", componentsError); toast.error("Error in getting components of meals."); return }
		componentsData.forEach(component => meals[component.meal].components[component.dish.id] = component)
	})
	
	////////////////////////////////////////////////////////////////////////////////
	// DATE
	////////////////////////////////////////////////////////////////////////////////
	
	function formatDate(date: DateTime): string {
		const now = DateTime.now().startOf("day")
		const monthStartIfNeeded = date.equals(date.startOf("month")) ? ", " + date.toLocaleString({month: "short", day: "numeric"}) : ""
		
		if (date.year == now.year) {
			// for near dates, say "yesterday", "today", "tomorrow"
			if (date.equals(now.minus({days: 1}))) return "Yesterday" + monthStartIfNeeded
			if (date.equals(now)) return "Today" + monthStartIfNeeded
			if (date.equals(now.plus({days: 1}))) return "Tomorrow" + monthStartIfNeeded
			// for near dates say "last monday", "next tuesday", etc.
			if (-7 <= date.diff(now).as("days") && date.diff(now).as("days") < 0) return "Last " + date.toLocaleString({weekday: "long"}) + monthStartIfNeeded
			if (0 <= date.diff(now).as("days") && date.diff(now).as("days") < 7) return date.toLocaleString({weekday: "long"}) + monthStartIfNeeded
			if (7 <= date.diff(now).as("days") && date.diff(now).as("days") < 14) return "Next " + date.toLocaleString({weekday: "long"}) + monthStartIfNeeded
			// for other dates within the year, just say "Fri Nov 23", "Tue Apr 15"
			return date.toLocaleString({weekday: "short", month: "short", day: "numeric"})
		}
		return date.toLocaleString({weekday: "short", year: "numeric", month: "short", day: "numeric"})
	}
	
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
				household: home!,
			})
			.select("id, name, day, time, amount, percent, restriction")
			.single()
		if (error) { console.error("Error in creating new meal:", error); toast.error("Error in creating new meal"); return }
		meals[data.id] = {...data, date: DateTime.fromISO(data.day!), components: []}
	}
	
	// EDIT
	
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
		meals[meal].restriction = newRestriction
		// TODO: eventually, to protect against people spamming this, add some throttling
	}
	
	async function setMealRestrictionAmount(meal: number, amount: number) {
		const {error} = await supabase
			.from("meals")
			.update({amount})
			.eq("id", meal)
		if (error) { console.error("Error in setting meal restriction amount:", error); toast.error("Error in setting meal restriction amount."); return }
		meals[meal].amount = amount
	}
	
	async function setMealRestrictionPercent(meal: number, percent: boolean) {
		const {error} = await supabase
			.from("meals")
			.update({percent})
			.eq("id", meal)
		if (error) { console.error("Error in setting meal restriction percent:", error); toast.error("Error in setting meal restriction percent."); return }
		meals[meal].percent = percent
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
		delete meals[meal]
	}
	
	////////////////////////////////////////////////////////////////////////////////
	// COMPONENT
	////////////////////////////////////////////////////////////////////////////////
	
	// ADD
	
	async function addComponent(meal: number, dish: number) {
		const {data, error} = await supabase
			.from("components")
			.insert({meal, dish})
			.select("meal, dish:dishes!inner(id, name), amount, percent, restriction")
			.single()
		if (error) { console.error("Error in adding meal component:", error); toast.error("Error in adding meal component."); return }
		meals[meal].components[dish] = data
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
		meals[meal].components[dish].restriction = newRestriction
		// TODO: eventually, to protect against people spamming this, add some throttling
	}
	
	async function setComponentRestrictionAmount(meal: number, dish: number, amount: number) {
		const {error} = await supabase
			.from("components")
			.update({amount})
			.eq("meal", meal)
			.eq("dish", dish)
		if (error) { console.error("Error in setting meal component restriction amount:", error); toast.error("Error in setting meal component restriction amount."); return }
		meals[meal].components[dish].amount = amount
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
		meals[meal].components[dish].percent = newPercent
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
		delete meals[meal].components[dish]
	}
</script>

<main class="flex h-[calc(100vh-4rem)] relative overflow-scroll scroll">
	<div class="flex flex-col">
		{#each [...days].map(d => DateTime.fromISO(d)) as day (day)}
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
				{#each Object.values(meals).filter(meal => meal.date.startOf("day").equals(day)).sort((a, b) => a.date.diff(b.date, "minutes").as("minutes")) as meal (meal.id)}
					<div class="p-2 border-r border-base-content border-dotted group">
						<div class="flex items-center gap-2 mb-5">
							<input type="text" value={meal.name} class="input text-xl p-1" />
							<button onclick={() => toggleMealRestriction(meal.id, meal.restriction)} class="btn btn-square btn-sm">
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
							<input type="number" value={meal.amount} onchange={event => setMealRestrictionAmount(meal.id, Number(event.currentTarget.value))} class="input w-12 input-sm text-lg px-0 text-center {!meal.restriction && "invisible"}" />
							<button onclick={() => setMealRestrictionPercent(meal.id, !meal.percent)} class="btn btn-sm w-20 {!meal.restriction && "invisible"}">
								{#if meal.percent}
									%
								{:else}
									kcal
								{/if}
							</button>
							<button onclick={() => removeMeal(meal.id)} class="btn btn-square btn-sm invisible group-hover:visible hover:bg-error"><X /></button>
						</div>
						<div class="grid grid-cols-[1fr_repeat(4,auto)] group/components gap-2 pl-4">
							{#each Object.values(meal.components) as component (component.dish)}
								<span class="text-lg flex items-center">{component.dish.name}</span>
								<button onclick={() => toggleComponentRestriction(meal.id, component.dish.id, component.restriction)} class="btn btn-square btn-sm">
									{#if component.restriction == "exactly"}
										<Equal />
									{:else if component.restriction == "no_less_than"}
										<ChevronLeft />
									{:else if component.restriction == "no_more_than"}
										<ChevronRight />
									{:else}
										<LockOpen />
									{/if}
								</button>
								<input type="number" value={component.amount} onchange={event => setComponentRestrictionAmount(meal.id, component.dish.id, Number(event.currentTarget.value))} class="input w-12 input-sm text-lg px-0 text-center {!component.restriction && "invisible"}" />
								<button onclick={() => toggleComponentRestrictionPercent(meal.id, component.dish.id, component.percent)} class="btn btn-sm w-20 {!component.restriction && "invisible"}">
									{#if component.percent === null}
										servings
									{:else if component.percent}
										%
									{:else}
										kcal
									{/if}
								</button>
								<button onclick={() => removeComponent(meal.id, component.dish.id)} class="btn btn-square btn-sm invisible group-hover/components:visible hover:bg-error"><X /></button>
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
