<script lang="ts">
	import {Plus, Turtle, Rabbit, ChevronsDown, ChevronDown, Minus, ChevronUp, ChevronsUp} from "lucide-svelte"
	import {supabase} from "$lib/supabase"
	import {onMount} from "svelte"
	
	////////////////////////////////////////////////////////////////////////////////
	
	let people: Awaited<ReturnType<typeof getPeople>> = []
	
	async function getPeople() {
		const {data, error} = await supabase
			.from("people")
			.select("id, name, sex, height, weight, activity, goal")
			.order("name")
		if (error) { console.error("Error in getting people:", error); return [] }
		return data
	}
	
	onMount(async () => {
		people = await getPeople()
	})
</script>

<table class="table table-fixed table-pin-rows table-pin-cols w-fit [&>*>tr>td]:border-x [&>*>tr>td]:border-base-200  [&>tbody>tr]:border-y-0">
	<thead>
		<tr>
			<th class="w-24 text-right text-base">Name</th>
			{#each people as person (person.id)}
				<td class="w-32">
					<input type="text" value={person.name} placeholder="Name" class="w-full input" />
				</td>
			{/each}
			<td class="w-32">
				<button class="btn"><Plus />Add</button>
			</td>
		</tr>
	</thead>
	<tbody>
		<tr>
			<th class="text-right">Sex</th>
			{#each people as person (person.id)}
				<td>
					<input type="range" value={person.sex} min={0} max={1} step={0.1} class="bg-pink-400 range [--range-shdw:blue]">
				</td>
			{/each}
			<td></td>
		</tr>
		<tr>
			<th class="text-right">Height</th>
			{#each people as person (person.id)}
				<td>
					<input type="number" value={person.height} class="w-2/3 pr-0 text-lg text-right input input-sm">
					<span class="w-1/3 text-left">cm</span>
				</td>
			{/each}
			<td></td>
		</tr>
		<tr>
			<th class="text-right">Weight</th>
			{#each people as person (person.id)}
				<td>
					<input type="number" value={person.weight} class="w-2/3 pr-0 text-lg text-right input input-sm">
					<span class="w-1/3 text-left">kg</span>
				</td>
			{/each}
			<td></td>
		</tr>
		<tr>
			<th class="text-right">Activity</th>
			{#each people as person (person.id)}
				<td>
					<input type="range" value={person.activity} min={0} max={4} step={1} class="range">
					<div class="flex justify-between w-full px-2 text-xs">
						<Turtle /><Minus /><Minus /><Minus /><Rabbit />
					</div>
				</td>
			{/each}
			<td></td>
		</tr>
		<tr>
			<th class="text-right">Goal</th>
			{#each people as person (person.id)}
				<td>
					<input type="range" value={person.goal} min={-2} max={2} step={1} class="range">
					<div class="flex justify-between w-full px-2 text-xs">
						<ChevronsDown /><ChevronDown /><Minus /><ChevronUp /><ChevronsUp />
					</div>
				</td>
			{/each}
			<td></td>
		</tr>
	</tbody>
</table>

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
