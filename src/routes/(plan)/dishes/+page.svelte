<script lang="ts">
	import {supabase} from "$lib/supabase"
	import {onMount} from "svelte"
	import * as y from "yup"
	import {superForm, defaults, setMessage, setError} from "sveltekit-superforms"
	import {yup} from "sveltekit-superforms/adapters"
	import {Plus, X} from "lucide-svelte"
	import FoodPicker from "./food-picker.svelte"
	import {toast} from "svelte-sonner"
	
	////////////////////////////////////////////////////////////////////////////////
	
	type Dish = {id: number, name: string, ingredients: Array<Ingredient> | null}
	type Ingredient = {
		food: {
			id: number
			name: string
			by_volume: boolean
		}
		amount: number
		serving: {
			id: number
			amount_of_unit: number
			unit: string | null
			modifier: string | null
		} | null
		servingOptions?: Array<{
			id: number
			amount_of_unit: number
			unit: string | null
			modifier: string | null
		}>
	}
	
	////////////////////////////////////////////////////////////////////////////////
	
	let dishes: Record<number, Dish> = $state({})
	
	onMount(async () => {
		const {data: dishesData, error: dishesError} = await supabase
			.from("dishes")
			.select("id, name")
		if (dishesError) { console.error("Error in getting dishes:", dishesError); return }
		
		dishes = dishesData.reduce((acc, dish) => {
			acc[dish.id] = {
				id: dish.id,
				name: dish.name,
				ingredients: null,
			}
			return acc
		}, {} as Record<number, Dish>)
	})
	
	async function populateIngredients(dish: Dish) {
		const {data: ingredientsData, error: ingredientsError} = await supabase
			.from("ingredients")
			.select("food:foods!inner(id, name, by_volume), serving:servings(id, amount_of_unit, unit, modifier), amount")
			.eq("dish", dish.id)
		if (ingredientsError) { console.error("Error in getting dishes:", ingredientsError); return }
		dish.ingredients = ingredientsData
		
		const {data: servingsData, error: servingsError} = await supabase
			.from("servings")
			.select("food, id, amount_of_unit, unit, modifier")
			.in("food", ingredientsData.map(ingredient => ingredient.food.id))
		if (servingsError) { console.error("Error populating servings:", servingsError) }
		dish.ingredients.forEach(ingredient => ingredient.servingOptions = (servingsData ?? []).filter(serving => serving.food == ingredient.food.id))
	}
	
	////////////////////////////////////////////////////////////////////////////////
	
	const newDishSchema = y.object({
		name: y.string().required(),
	})
	
	const newDishForm = superForm(defaults(yup(newDishSchema)), {SPA: true, validators: yup(newDishSchema),
			async onUpdate({form}) {
				if (!form.valid) return
				
				const {error} = await supabase
					.from("dishes")
					.insert({name: form.data.name})
				if (error) setError(form, "Error in inserting dish.")
				else setMessage(form, "Inserted dish.")
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
				else {
					setMessage(form, "Inserted ingredient.")
					selected.ingredients!.push(data)
				}
			},
		}), {form: newIngredientFormData} = newIngredientForm
	
	async function removeIngredient(dish: number, food: number) {
		const {error} = await supabase
			.from("ingredients")
			.delete()
			.eq("dish", dish)
			.eq("food", food)
		if (error) { console.error("Error deleting data:", error); toast.error("Failed to remove ingredient."); return }
		dishes[dish].ingredients = dishes[dish].ingredients!.filter(ingredient => ingredient.food.id != food)
	}
	
	async function setIngredientAmount(dish: number, food: number, amount: number) {
		const {error} = await supabase
			.from("ingredients")
			.update({amount})
			.eq("dish", dish)
			.eq("food", food)
		if (error) { console.error("Error updating ingredient amount:", error); toast.error("Failed to update ingredient amount."); return }
		dishes[dish].ingredients!.find(ingredient => ingredient.food.id == food)!.amount = amount
	}
	
	// TODO: make it reactive
	async function setIngredientServing(dish: number, food: number, serving: number | null) {
		const {error} = await supabase
			.from("ingredients")
			.update({serving})
			.eq("dish", dish)
			.eq("food", food)
		if (error) { console.error("Error updating ingredient amount:", error); toast.error("Failed to update ingredient amount."); return }
		dishes[dish].ingredients!.find(ingredient => ingredient.food.id == food)!.serving =
			serving ? ((dishes[dish].ingredients!.find(ingredient => ingredient.food.id == food)!.servingOptions ?? []).find(s => s.id = serving) ?? null) : null
	}
	
	////////////////////////////////////////////////////////////////////////////////
	
	let selected: Dish | undefined = $state(undefined) // the dish that is currently selected. undefined will show the "add dish" ui
</script>

<main class="flex h-[calc(100vh-4rem)]">
	<div class="flex gap-4 p-4 grow overflow-y-scroll">
		<!-- TODO: make a search bar -->
		{#each Object.values(dishes) as dish (dish.id)}
			<button onclick={() => { selected = dish; populateIngredients(dish) }} class="card bg-base-300 text-base-content w-64 shadow-xl h-min">
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
						{#each selected.ingredients as ingredient (ingredient.food)}
							<tr class="group">
								<th class="p-1">
									<span class="grow">{ingredient.food.name}</span>
								</th>
								<td class="text-nowrap p-1">
									<div class="flex">
										<input type="number" value={ingredient.amount} onchange={event => setIngredientAmount(selected!.id, ingredient.food.id, Number(event.currentTarget.value))} class="input px-0 text-center text-lg w-12">
										<div class="dropdown">
											<div role="button" tabindex={0} class="btn btn-ghost outline-none flex flex-nowrap">
												<span>{ingredient.serving ? ingredient.serving.unit : (ingredient.food.by_volume ? "ml" : "g")}</span>
												{#if ingredient.serving?.modifier}<span class="opacity-50">ingredient.serving?.modifier</span>{/if}
											</div>
											<ul class="dropdown-content menu bg-base-300 z-10 w-full rounded-b-lg p-0">
												<li><button onclick={() => setIngredientServing(selected!.id, ingredient.food.id, null)}>{ingredient.food.by_volume ? "ml" : "g"}</button></li>
												{#each ingredient.servingOptions ?? [] as serving (serving.id)}
													<li><button onclick={() => setIngredientServing(selected!.id, ingredient.food.id, serving.id)}>{serving.unit}</button></li>
												{/each}
											</ul>
										</div>
									</div>
								</td>
								<td class="p-1">
									<button onclick={() => removeIngredient(selected!.id, ingredient.food.id)} class="btn btn-sm btn-square hover:bg-error invisible group-hover:visible"><X /></button>
								</td>
							</tr>
						{/each}
						<tr>
							<td colspan={3}>
								<div class="flex gap-2">
									<FoodPicker bind:value={$newIngredientFormData.food} name="food" form="new-ingredient-form" class="grow" />
									<button type="submit" class="btn btn-square" form="new-ingredient-form"><Plus /></button>
								</div>
							</td>
						</tr>
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
