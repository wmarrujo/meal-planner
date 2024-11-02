<script lang="ts">
	import {onMount} from "svelte"
	import {supabase} from "$lib/supabase"
	import {toast} from "svelte-sonner"
	import type {Enums} from "$schema"
	import {Plus, X, LockOpen, Equal, ChevronLeft, ChevronRight} from "lucide-svelte"
	
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
		dish: {
			id: number
			name: string
		}
		amount: number
		percent: boolean | null
		restriction: string | null
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
			.select("meal, dish:dishes!inner(id, name), amount, percent, restriction")
			.in("meal", mealsData.map(meal => meal.id))
		if (componentsError) { console.error("Error in getting meal components:", componentsError); toast.error("Error in getting components of meals."); return }
		componentsData.forEach(component => meals[component.meal].components[component.dish.id] = component)
	})
	
	////////////////////////////////////////////////////////////////////////////////
	
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
	
	////////////////////////////////////////////////////////////////////////////////
	
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
	
	async function toggleComponentRestriction(meal: number, component: number, existingRestriction: string | null) {
		const newRestriction // ||: unrestricted, =, <=, >= :||
			= !existingRestriction ? "exactly"
				: existingRestriction == "exactly" ? "no_more_than"
					: existingRestriction == "no_more_than" ? "no_less_than"
						: null
		const {error} = await supabase
			.from("components")
			.update({restriction: newRestriction})
			.eq("meal", meal)
			.eq("dish", component)
		if (error) { console.error("Error in setting meal component restriction:", error); toast.error("Error in setting meal component restriction."); return }
		meals[meal].components[component].restriction = newRestriction
		// TODO: eventually, to protect against people spamming this, add some throttling
	}
	
	async function setComponentRestrictionAmount(meal: number, component: number, amount: number) {
		const {error} = await supabase
			.from("components")
			.update({amount})
			.eq("meal", meal)
			.eq("dish", component)
		if (error) { console.error("Error in setting meal component restriction amount:", error); toast.error("Error in setting meal component restriction amount."); return }
		meals[meal].components[component].amount = amount
	}
	
	async function toggleComponentRestrictionPercent(meal: number, component: number, percent: boolean | null) {
		const newPercent // ||: serving, %, kcal :||
			= percent === null ? true : percent ? false : null
		const {error} = await supabase
			.from("components")
			.update({percent: newPercent})
			.eq("meal", meal)
			.eq("dish", component)
		if (error) { console.error("Error in setting meal component restriction percent:", error); toast.error("Error in setting meal component restriction percent."); return }
		meals[meal].components[component].percent = newPercent
		// TODO: eventually, to protect against people spamming this, add some throttling
	}
</script>

<main class="flex flex-col">
	{#each days as day (day)}
		<div class="flex border-t overflow-x-scroll">
			<div class="flex border-r p-2 min-w-14 justify-center">
				<span class="[writing-mode:vertical-rl] [scale:-1] text-lg">{formatDate(new Date(day))}</span>
			</div>
			{#each Object.values(meals).filter(meal => meal.day == day).sort((a, b) => (String(a.time)).localeCompare(String(b.time))) as meal (meal.id)}
				<div class="p-2 border-r border-dotted group">
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
						<button class="btn btn-square btn-sm invisible group-hover:visible hover:bg-error"><X /></button>
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
							<button class="btn btn-square btn-sm invisible group-hover/components:visible hover:bg-error"><X /></button>
						{/each}
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
		<div class="min-w-14 border-r p-2 flex justify-center">
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
