<script lang="ts">
	import {supabase} from "$lib/supabase"
	import * as y from "yup"
	import {superForm, defaults, setError} from "sveltekit-superforms"
	import {yup} from "sveltekit-superforms/adapters"
	import {Plus, X} from "lucide-svelte"
	import FoodPicker from "./food-picker.svelte"
	import {toast} from "svelte-sonner"
	import {dishes, foods, type Dish} from "$lib/cache.svelte"
	import {getContext, onMount} from "svelte"
	import {type Household} from "$lib/cache.svelte"
	
	const home = $derived(getContext<{value: Household | undefined}>("home").value) // NOTE: will be defined except right after page load
	
	////////////////////////////////////////////////////////////////////////////////
	
	let {data} = $props()
	
	onMount(() => { if (home) home.solution = undefined })
	
	////////////////////////////////////////////////////////////////////////////////
	
	const newDishSchema = y.object({
		name: y.string().required(),
	})
	
	const newDishForm = superForm(defaults(yup(newDishSchema)), {SPA: true, validators: yup(newDishSchema),
			async onUpdate({form}) {
				if (!form.valid) return
				
				const {data, error} = await supabase
					.from("dishes")
					.insert({name: form.data.name})
					.select("id, name, manager")
					.single()
				if (error) { console.error("Error in inserting dish:", error); setError(form, "Error in inserting dish."); toast.error("Failed to insert dish.") }
				else dishes[data.id] = {...data, ingredients: {}}
			},
		}), {form: newDishFormData} = newDishForm
	
	////////////////////////////////////////////////////////////////////////////////
	
	const newIngredientSchema = y.object({
		food: y.number().required(),
	})
	
	const newIngredientForm = superForm(defaults(yup(newIngredientSchema)), {SPA: true, validators: yup(newIngredientSchema),
			async onUpdate({form}) {
				if (!form.valid || !selected) return
				
				const {data, error} = await supabase
					.from("ingredients")
					.insert({
						dish: selected.id,
						food: form.data.food,
						serving: null,
						amount: 0,
					})
					.select("food:foods!inner(id, name, by_volume), serving:servings(id, amount_of_unit, unit, modifier), amount")
					.single()
				if (error) { console.error("Error in inserting ingredient:", error); setError(form, "Error in inserting ingredient."); toast.error("Failed to insert ingredient.") }
				// else selected.ingredients!.push(data) // FIXME: will push the wrong type
			},
		}), {form: newIngredientFormData} = newIngredientForm
	
	async function removeIngredient(dish: number, food: number) {
		const {error} = await supabase
			.from("ingredients")
			.delete()
			.eq("dish", dish)
			.eq("food", food)
		if (error) { console.error("Error deleting data:", error); toast.error("Failed to remove ingredient."); return }
		delete dishes[dish].ingredients[food]
	}
	
	async function setIngredientAmount(dish: number, food: number, amount: number) {
		const {error} = await supabase
			.from("ingredients")
			.update({amount})
			.eq("dish", dish)
			.eq("food", food)
		if (error) { console.error("Error updating ingredient amount:", error); toast.error("Failed to update ingredient amount."); return }
		dishes[dish].ingredients[food].amount = amount
	}
	
	async function setIngredientServing(dish: number, food: number, serving: number | null) {
		const {error} = await supabase
			.from("ingredients")
			.update({serving})
			.eq("dish", dish)
			.eq("food", food)
		if (error) { console.error("Error updating ingredient amount:", error); toast.error("Failed to update ingredient amount."); return }
		dishes[dish].ingredients[food].serving = serving
	}
	
	////////////////////////////////////////////////////////////////////////////////
	
	let selected: Dish | undefined = $state(undefined) // the dish that is currently selected. undefined will show the "add dish" ui
</script>

<main class="flex h-[calc(100vh-4rem)]">
	<div class="flex gap-4 p-4 grow overflow-y-scroll">
		<!-- TODO: make a search bar -->
		{#each Object.values(dishes) as dish (dish.id)}
			<button onclick={() => { selected = dish }} class="card {dish.manager == data.session?.user.id ? "bg-base-300" : "bg-base-200"} text-base-content w-64 shadow-xl h-min">
				<div class="card-body">
					<div class="card-title">
						<h2 class="card-title">{dish.name}</h2>
					</div>
				</div>
			</button>
		{/each}
	</div>
	<div class="relative tablet:w-1/2 laptop:w-1/3 p-4 overflow-y-scroll flex flex-col">
		{#if selected}
			<div class="flex">
				<h2 class="text-4xl font-bold grow">{selected.name}</h2>
				<button onclick={() => selected = undefined} class="btn btn-square btn-sm"><X /></button>
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
													{#if serving?.modifier}<span class="opacity-50">ingredient.serving?.modifier</span>{/if}
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
										<button onclick={() => removeIngredient(selected!.id, food.id)} class="btn btn-sm btn-square hover:bg-error invisible group-hover:visible"><X /></button>
									</td>
								{/if}
							</tr>
						{/each}
						{#if selected.manager == data.session?.user.id}
							<tr>
								<td colspan={3}>
									<div class="flex gap-2">
										<FoodPicker bind:value={$newIngredientFormData.food} name="food" form="new-ingredient-form" class="grow" />
										<button type="submit" class="btn btn-square" form="new-ingredient-form"><Plus /></button>
									</div>
								</td>
							</tr>
						{/if}
					</tbody>
				</table>
				<form id="new-ingredient-form" use:newIngredientForm.enhance></form>
			{:else}
				<div class="flex flex-col gap-2">
					<div class="skeleton w-full h-8"></div>
					<div class="skeleton w-full h-8"></div>
					<div class="skeleton w-full h-8"></div>
					<div class="skeleton w-full h-8"></div>
				</div>
			{/if}
		{:else}
			<form use:newDishForm.enhance class="flex flex-col gap-2 items-center">
				<input type="text" name="name" bind:value={$newDishFormData.name} placeholder="Name" class="input input-bordered">
				<button class="btn" type="submit" disabled={!$newDishFormData.name}><Plus />Add New Dish</button>
			</form>
		{/if}
	</div>
</main>
