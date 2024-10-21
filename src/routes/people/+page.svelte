<script lang="ts">
	import {Turtle, Rabbit, ChevronsDown, ChevronDown, Minus, ChevronUp, ChevronsUp} from "lucide-svelte"
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

<table class="table table-fixed table-pin-rows table-pin-cols w-fit">
	<thead>
		<tr>
			<th class="w-32">Name</th>
			{#each people as person (person.id)}
				<td class="w-32">
					<input type="text" value={person.name} placeholder="Name" class="w-full input" />
				</td>
			{/each}
			<td class="w-32">
				<button class="btn">Add</button>
			</td>
		</tr>
	</thead>
	<tbody>
		<tr>
			<th>Sex</th>
			{#each people as person (person.id)}
				<td>
					<input type="range" value={person.sex} min={0} max={1} step={0.1} class="bg-pink-400 range [--range-shdw:blue]">
				</td>
			{/each}
		</tr>
		<tr>
			<th>Height</th>
			{#each people as person (person.id)}
				<td>
					<input type="number" value={person.height} class="w-3/4 pr-0 text-lg text-right input input-sm">
					<span class="w-1/4 text-left">cm</span>
				</td>
			{/each}
		</tr>
		<tr>
			<th>Weight</th>
			{#each people as person (person.id)}
				<td>
					<input type="number" value={person.weight} class="w-3/4 pr-0 text-lg text-right input input-sm">
					<span class="w-1/4 text-left">kg</span>
				</td>
			{/each}
		</tr>
		<tr>
			<th>Activity</th>
			{#each people as person (person.id)}
				<td>
					<input type="range" value={person.activity} min={0} max={4} step={1} class="range">
					<div class="flex justify-between w-full px-2 text-xs">
						<Turtle /><Minus /><Minus /><Minus /><Rabbit />
					</div>
				</td>
			{/each}
		</tr>
		<tr>
			<th>Goal</th>
			{#each people as person (person.id)}
				<td>
					<input type="range" value={person.goal} min={-2} max={2} step={1} class="range">
					<div class="flex justify-between w-full px-2 text-xs">
						<ChevronsDown /><ChevronDown /><Minus /><ChevronUp /><ChevronsUp />
					</div>
				</td>
			{/each}
		</tr>
	</tbody>
</table>
