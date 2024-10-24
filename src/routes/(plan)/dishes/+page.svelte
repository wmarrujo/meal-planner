<script lang="ts">
	import {supabase} from "$lib/supabase"
	import {page} from "$app/stores"
	import {onMount} from "svelte"
	import * as y from "yup"
	import {superForm, defaults, setMessage, setError} from "sveltekit-superforms"
	import {yup} from "sveltekit-superforms/adapters"
	import {Plus, Trash} from "lucide-svelte"
	
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
		}
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
			.select("food:foods!inner(id, name, by_volume), serving:servings!inner(id, amount_of_unit, unit, modifier), amount")
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
					.insert({name: form.data.name, manager: $page.data.session?.user?.id})
				if (error) setError(form, "Error in inserting dish.")
				else setMessage(form, "Inserted Dish.")
			},
		}), {form: newDishFormData} = newDishForm
	
	////////////////////////////////////////////////////////////////////////////////
	
	let dialogs: Record<number, HTMLDialogElement> = $state({})
</script>

<div class="flex gap-4 p-4">
	{#each dishes as dish (dish.id)}
		<button onclick={() => { dialogs[dish.id].showModal(); populateIngredients(dish) }} class="card glass w-64 shadow-xl">
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
					<h3 class="font-bold py-2">Ingredients</h3>
					{#if dish.ingredients}
						<table class="table table-pin-rows">
							<thead>
								<tr>
									<th>Food</th>
									<th>Amount</th>
									<th></th>
								</tr>
							</thead>
							<tbody>
								{#each dish.ingredients as ingredient (ingredient.food)}
									<tr>
										<th>{ingredient.food}</th>
										<td>{ingredient.amount} {ingredient.serving.unit} {ingredient.serving.modifier}</td>
										<td><button class="btn"><Trash /></button></td>
									</tr>
								{/each}
								<tr>
									<td colspan={2}><button class="btn w-full"><Plus />Add</button></td>
								</tr>
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
			<input type="text" name="name" bind:value={$newDishFormData.name} placeholder="Name" class="input input-bordered">
			<button class="btn" type="submit" disabled={!$newDishFormData.name}><Plus />Add New Dish</button>
		</form>
	</div>
</div>
