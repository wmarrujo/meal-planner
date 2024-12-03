<script lang="ts">
	import {supabase} from "$lib/supabase"
	import * as y from "yup"
	import {superForm, defaults} from "sveltekit-superforms"
	import {yup} from "sveltekit-superforms/adapters"
	import {Plus, X, Trash2, Star, House, CalendarCheck} from "lucide-svelte"
	import FoodPicker from "./food-picker.svelte"
	import {toast} from "svelte-sonner"
	import {dishes, foods} from "$lib/cache.svelte"
	import type {Dish, Food, Serving} from "$lib/cache.svelte"
	import {getContext, onMount} from "svelte"
	import {type Household, addDishesToCache, addFoodToCache, initialized} from "$lib/cache.svelte"
	import {nutritionOfDish} from "$lib/nutrition"
	
	const home = $derived(getContext<{value: Household | undefined}>("home").value) // NOTE: will be defined except right after page load
	
	////////////////////////////////////////////////////////////////////////////////
	
	let {data} = $props()
	
	onMount(() => { if (home) home.solution = undefined })
	
	let selected: Dish | undefined = $state(undefined) // the dish that is currently selected. undefined will show the "add dish" form
	
	////////////////////////////////////////////////////////////////////////////////
	// DISHES
	////////////////////////////////////////////////////////////////////////////////
	
	// INITIALIZE
	
	let preloaded = $state(false)
	$effect(() => { if (initialized.value && home && !preloaded) preloadSomeDishes() })
	
	async function preloadSomeDishes() {
		if (!home) return
		preloaded = true
		const {data, error} = await supabase
			.from("dishes")
			.select("id, manager")
			.in("manager", Object.keys(home.members))
			.limit(30) // "some"
		if (error) { console.error("Error in getting some dishes.", error); return }
		await addDishesToCache(data.map(dish => dish.id))
	}
	
	// ADD
	
	const newDishSchema = y.object({
		name: y.string().required(),
	})
	
	const newDishForm = superForm(defaults(yup(newDishSchema)), {SPA: true, validators: yup(newDishSchema),
			async onUpdate({form}) {
				if (!form.valid) return
				addDish(form.data.name)
			},
		}), {form: newDishFormData} = newDishForm
	
	async function addDish(name: string) {
		const {data, error} = await supabase
			.from("dishes")
			.insert({name})
			.select("id, name, manager")
			.single()
		if (error) { console.error("Error in inserting dish:", error); toast.error("Failed to insert dish."); return }
		dishes[data.id] = {...data, ingredients: {}}
	}
	
	// REMOVE
	
	async function removeDish(dish: Dish["id"]) {
		const {error} = await supabase
			.from("dishes")
			.delete()
			.eq("id", dish)
		if (error) { console.error("Error in removing dish.", error); toast.error("Failed to remove dish."); return }
		delete dishes[dish]
		// TODO: delete it from other places that use it
		// TODO: make the button disabled if they won't be able to
		// TODO: figure out logic of when to delete vs soft-delete
	}
	
	////////////////////////////////////////////////////////////////////////////////
	// INGREDIENTS
	////////////////////////////////////////////////////////////////////////////////
	
	// ADD
	
	async function addIngredient(dish: Dish["id"], food: Food["id"]) {
		const {data, error} = await supabase
			.from("ingredients")
			.insert({
				dish,
				food,
				serving: null,
				amount: 0,
			})
			.select("dish, food, serving, amount")
			.single()
		if (error) { console.error("Error in inserting ingredient:", error); toast.error("Failed to insert ingredient."); return }
		await addFoodToCache(food) // make sure that the food data is pulled in to the caches
		dishes[dish].ingredients[food] = data
	}
	
	// EDIT
	
	async function setIngredientAmount(dish: Dish["id"], food: Food["id"], amount: Serving["id"]) {
		const {error} = await supabase
			.from("ingredients")
			.update({amount})
			.eq("dish", dish)
			.eq("food", food)
		if (error) { console.error("Error updating ingredient amount:", error); toast.error("Failed to update ingredient amount."); return }
		dishes[dish].ingredients[food].amount = amount
	}
	
	async function setIngredientServing(dish: Dish["id"], food: Food["id"], serving: Serving["id"] | null) {
		const {error} = await supabase
			.from("ingredients")
			.update({serving})
			.eq("dish", dish)
			.eq("food", food)
		if (error) { console.error("Error updating ingredient amount:", error); toast.error("Failed to update ingredient amount."); return }
		dishes[dish].ingredients[food].serving = serving
	}
	
	// REMOVE
	
	async function removeIngredient(dish: Dish["id"], food: Food["id"]) {
		const {error} = await supabase
			.from("ingredients")
			.delete()
			.eq("dish", dish)
			.eq("food", food)
		if (error) { console.error("Error deleting data:", error); toast.error("Failed to remove ingredient."); return }
		delete dishes[dish].ingredients[food]
	}
</script>

{#if home}
	<main class="flex max-w-full">
		<div class="tablet:w-1/2 laptop:w-2/3 flex flex-col">
			<!--
			<div class="w-full flex p-4 gap-2">
				<input type="text" placeholder="Search" class="input input-bordered">
			</div>
			-->
			<div class="flex gap-4 p-4 flex-wrap overflow-y-scroll">
				{#each Object.values(dishes) as dish (dish.id)}
					<button onclick={() => { selected = dish }} class="card bg-base-200 text-base-content w-64 shadow-xl h-min">
						<div class="card-body">
							<div class="card-title">
								<h2 class="card-title">{dish.name}</h2>
							</div>
							<div class="flex">
								{#if dish.manager == data.session?.user.id}
									<Star />
								{:else if Object.keys(home.members).includes(dish.manager ?? "")}
									<House />
								{/if}
								{#if Object.values(home.meals).flatMap(meal => Object.keys(meal.components).map(Number)).includes(dish.id)}
									<CalendarCheck />
								{/if}
							</div>
						</div>
					</button>
				{/each}
			</div>
		</div>
		<div class="relative tablet:w-1/2 laptop:w-1/3 p-4 overflow-y-scroll flex flex-col gap-2 border-l border-base-300">
			{#if selected}
				{@const nutrition = nutritionOfDish(selected.id)}
				<div class="flex">
					<h2 class="text-4xl font-bold grow">{selected.name}</h2>
					<button onclick={() => selected = undefined} class="btn btn-square btn-sm"><X /></button>
				</div>
				<div>
					<div class="flex"><div class="w-20 text-right">calories:</div><div class="w-16 text-right">{nutrition.calories.toLocaleString(undefined, {maximumFractionDigits: 2})}</div><div class="w-16 pl-1 opacity-60 text-left">kcal</div></div>
					<div class="flex"><div class="w-20 text-right">protein:</div><div class="w-16 text-right">{nutrition.protein.toLocaleString(undefined, {maximumFractionDigits: 2})}</div><div class="w-16 pl-1 opacity-60 text-left">g</div></div>
				</div>
				
				<!-- TODO: make a place to toggle the dish public vs private -->
				<!-- TODO: make a view that shows the detailed nutritional breakdown -->
				
				<h3 class="text-2xl py-2 self-center">Ingredients</h3>
				{#if selected.ingredients}
					<table class="table table-pin-rows w-full">
						<thead>
							<tr>
								<th class="px-1">Food</th>
								<th class="px-1 text-center">Amount</th>
								<th class="px-1"></th>
							</tr>
						</thead>
						<tbody>
							{#each Object.values(selected.ingredients) as ingredient (ingredient.food)}
								{@const food = foods[ingredient.food]}
								{@const serving = ingredient.serving ? food.servings[ingredient.serving] : undefined}
								<tr class="group">
									<th class="p-1">
										<span class="grow">{food.name}</span>
									</th>
									<td class="text-nowrap p-1">
										<div class="flex items-center">
											{#if selected.manager == data.session?.user.id}
												<input type="number" value={ingredient.amount} onchange={event => setIngredientAmount(selected!.id, food.id, Number(event.currentTarget.value))} class="input px-0 text-center text-lg w-12">
											{:else}
												<span class="text-center align-middle text-lg w-12">{ingredient.amount}</span>
											{/if}
											<div class="dropdown">
												{#if selected.manager == data.session?.user.id}
													<div role="button" tabindex={0} class="btn btn-ghost outline-none flex flex-nowrap">
														<span>{serving ? serving.unit : (food.by_volume ? "ml" : "g")}</span>
														{#if serving?.modifier}<span class="opacity-50">{serving?.modifier}</span>{/if}
													</div>
													<ul class="dropdown-content menu bg-base-300 z-10 w-full rounded-b-lg p-0">
														<li><button onclick={() => setIngredientServing(selected!.id, food.id, null)}>{food.by_volume ? "ml" : "g"}</button></li>
														{#each Object.values(food.servings) as serving (serving.id)}
															<li><button onclick={() => setIngredientServing(selected!.id, food.id, serving.id)}>{serving.unit}</button></li>
														{/each}
													</ul>
												{:else}
													<span>{food.by_volume ? "ml" : "g"}</span>
												{/if}
											</div>
										</div>
									</td>
									{#if selected.manager == data.session?.user.id}
										<td class="p-1">
											<button onclick={() => removeIngredient(selected!.id, food.id)} class="btn btn-sm btn-square hover:bg-error invisible group-hover:visible"><Trash2 /></button>
										</td>
									{/if}
								</tr>
							{/each}
							{#if selected && selected.manager == data.session?.user.id}
								<tr>
									<td colspan={3}>
										<FoodPicker onselect={food => addIngredient(selected!.id, food)} />
									</td>
								</tr>
							{/if}
						</tbody>
					</table>
				{:else}
					<div class="flex flex-col gap-2">
						<div class="skeleton w-full h-8"></div>
						<div class="skeleton w-full h-8"></div>
						<div class="skeleton w-full h-8"></div>
						<div class="skeleton w-full h-8"></div>
					</div>
				{/if}
				<div class="flex flex-col items-center gap-2 py-4 mt-4 w-full border-t border-base-300">
					<h2 class="text-error">Danger Zone:</h2>
					<button onclick={() => removeDish(selected!.id)} class="btn btn-error"><Trash2 />Delete</button>
				</div>
			{:else}
				<form use:newDishForm.enhance class="flex flex-col gap-2 items-center">
					<input type="text" name="name" bind:value={$newDishFormData.name} placeholder="Name" class="input input-bordered">
					<button class="btn" type="submit" disabled={!$newDishFormData.name}><Plus />Add New Dish</button>
				</form>
			{/if}
		</div>
	</main>
{/if}
