<script lang="ts">
	import {supabase} from "$lib/supabase"
	import {onMount} from "svelte"
	import * as y from "yup"
	import {superForm, defaults, setMessage, setError} from "sveltekit-superforms"
	import {yup} from "sveltekit-superforms/adapters"
	import {Plus, Trash, X} from "lucide-svelte"
	import FoodPicker from "./food-picker.svelte"
	import {toast} from "svelte-sonner"
	
	////////////////////////////////////////////////////////////////////////////////
	
	type Dish = {id: number, name: string, ingredients: Array<Ingredient> | null}
	type Ingredient = {
		food: {
			id: number,
			name: string,
			by_volume: boolean,
		}
		serving: {
			id: number,
			amount_of_unit: number,
			unit: string | null,
			modifier: string | null,
		} | null
		amount: number
	}
	
	////////////////////////////////////////////////////////////////////////////////
	
	let dishes: Array<Dish> = $state([])
	
	onMount(async () => {
		const {data: dishesData, error: dishesError} = await supabase
			.from("dishes")
			.select("id, name")
		if (dishesError) { console.error("Error in getting dishes:", dishesError); return }
		
		dishes = dishesData.map(dish => ({
			id: dish.id,
			name: dish.name,
			ingredients: null,
		}))
	})
	
	async function populateIngredients(dish: Dish) {
		const {data, error} = await supabase
			.from("ingredients")
			.select("food:foods!inner(id, name, by_volume), serving:servings(id, amount_of_unit, unit, modifier), amount")
			.eq("dish", dish.id)
		if (error) { console.error("Error in getting dishes:", error); return }
		dish.ingredients = data
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
		dish: y.number().required(),
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
					dishes[form.data.dish].ingredients!.push(data)
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
		const affected = dishes.find(d => d.id == dish)!
		affected.ingredients = affected.ingredients!.filter(ingredient => ingredient.food.id != food)
	}
	
	////////////////////////////////////////////////////////////////////////////////
	
	let selected: Dish | undefined = $state(undefined) // the dish that is currently selected. undefined will show the "add dish" ui
</script>

<main class="flex h-[calc(100vh-4rem)]">
	<div class="flex gap-4 p-4 grow overflow-y-scroll">
		<!-- TODO: make a search bar -->
		{#each dishes as dish (dish.id)}
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
				<button onclick={() => selected = undefined} class="btn btn-square"><X /></button>
			</div>
			
			<!-- TODO: make a place to toggle the dish public vs private -->
			<!-- TODO: make a view that shows the detailed nutritional breakdown -->
			
			<h3 class="text-2xl py-2 self-center">Ingredients</h3>
			{#if selected.ingredients}
				<table class="table table-pin-rows">
					<thead>
						<tr>
							<th>Food</th>
							<th>Amount</th>
							<th></th>
						</tr>
					</thead>
					<tbody>
						{#each selected.ingredients as ingredient (ingredient.food)}
							<tr>
								<th>{ingredient.food.name}</th>
								<td>{ingredient.amount} {ingredient.serving?.unit} {ingredient.serving?.modifier}</td>
								<td><button onclick={() => removeIngredient(selected!.id, ingredient.food.id)} class="btn btn-square hover:bg-error"><Trash /></button></td>
							</tr>
						{/each}
						<tr>
							<th><FoodPicker bind:value={$newIngredientFormData.food} name="food" form="new-ingredient-form" /></th>
							<td></td>
							<td>
								<button type="submit" class="btn btn-square" form="new-ingredient-form"><Plus /></button>
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
