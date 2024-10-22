<script lang="ts">
	import {supabase} from "$lib/supabase"
	import {onMount} from "svelte"
	import * as y from "yup"
	import {superForm, defaults, setMessage, setError} from "sveltekit-superforms"
	import {yup} from "sveltekit-superforms/adapters"
	import {Plus} from "lucide-svelte"
	import type {ArrayElement} from "$lib/utils"
	
	////////////////////////////////////////////////////////////////////////////////
	
	type Dish = {id: number, name: string, ingredients: Array<Ingredient>}
	type Ingredient = {
		food: number
		serving: Serving
		amount: number
	}
	type Serving = {
		id: number
		amount: number
		amount_of_unit: number
		unit: string | null
		modifier: string | null
	}
	type Food = {
		id: number
		name: string
		category: string
		company: string
		brand: string
		sub_brand: string
	}
	
	////////////////////////////////////////////////////////////////////////////////
	
	let dishes: Array<Dish> = []
	
	onMount(async () => {
		const {data: dishesData, error: dishesError} = await supabase
			.from("dishes")
			.select("id, name")
		if (dishesError) { console.error("Error in getting dishes:", dishesError); return }
		
		const {data: ingredientsData, error: ingredientsError} = await supabase
			.from("ingredients")
			.select("dish, food, serving:servings!inner(id, amount, amount_of_unit, unit, modifier), amount")
			.in("dish", dishesData.map(dish => dish.id))
		if (ingredientsError) { console.log("Error in getting ingredients:", ingredientsError); return }
		const ingredientsByDish = Object.groupBy(ingredientsData, ingredient => ingredient.dish)
		
		const {data: foodsData, error: foodsError} = await supabase
			.from("foods")
			.select("id, name, category, company, brand, sub_brand, description")
			.in("id", ingredientsData.map(ingredient => ingredient.food))
		if (foodsError) { console.log("Error in getting foods:", foodsError); return }
		const foodsById = foodsData.reduce((acc, food) => { acc[food.id] = food; return acc }, {} as Record<number, ArrayElement<typeof foodsData>>)
		
		dishes = dishesData.map(dish => ({
			id: dish.id,
			name: dish.name,
			ingredients: ingredientsByDish[dish.id] ?? [],
		}))
	})
	
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
				else setMessage(form, "Inserted Dish.")
			},
		}), {form: newDishFormData} = newDishForm
	
	////////////////////////////////////////////////////////////////////////////////
	
	let dialogs: Record<number, HTMLDialogElement> = {}
</script>

<div class="flex gap-4 p-4">
	{#each dishes as dish (dish.id)}
		<button onclick={() => dialogs[dish.id].showModal()} class="card glass w-64 shadow-xl">
			<div class="card-body">
				<div class="card-title">
					<h2 class="card-title">{dish.name}</h2>
				</div>
			</div>
		</button>
		<dialog class="modal" bind:this={dialogs[dish.id]}>
			<div class="modal-box">
				<h2 class="text-lg font-bold">{dish.name}</h2>
				<div>
					<h3>Ingredients</h3>
					<p>How much of each ingredient it takes to make 1 serving of this dish.</p>
					<table class="table table-pin-rows">
						<thead>
							<tr>
								<th>Food</th>
								<th>Servings</th>
								<th>Amount</th>
							</tr>
						</thead>
						<tbody>
							{#each dish.ingredients as ingredient (ingredient.food)}
								<tr>
									<th>{ingredient.food}</th>
									<td></td>
									<td></td>
								</tr>
							{/each}
							<tr>
								<td><Plus />Add</td>
							</tr>
						</tbody>
					</table>
				</div>
				<div class="modal-action">
					<form method="dialog">
						<button class="btn">Close</button>
					</form>
				</div>
			</div>
		</dialog>
	{/each}
	<div class="card glass w-64 shadow-xl">
		<form class="card-body" use:newDishForm.enhance>
			<input type="text" name="name" bind:value={$newDishFormData.name} placeholder="Name" class="input">
			<button class="btn" type="submit"><Plus />Add New Dish</button>
		</form>
	</div>
</div>
