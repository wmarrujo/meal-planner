<script lang="ts">
	import {Plus, Turtle, Rabbit, ChevronsDown, ChevronDown, Minus, ChevronUp, ChevronsUp, Trash2} from "lucide-svelte"
	import {supabase} from "$lib/supabase"
	import {getContext, onMount} from "svelte"
	import {toast} from "svelte-sonner"
	import {type Household} from "$lib/cache.svelte"
	import {targetCalories, targetProtein} from "$lib/nutrition"
	
	const home = $derived(getContext<{value: Household | undefined}>("home").value) // NOTE: will be defined except right after page load
	
	////////////////////////////////////////////////////////////////////////////////
	
	onMount(() => { if (home) home.solution = undefined })
	
	////////////////////////////////////////////////////////////////////////////////
	// PERSON
	////////////////////////////////////////////////////////////////////////////////
	
	// ADD
	
	const bros = ["Brohan", "Brochill", "Broseph von Brohammer", "Brotastic Broski", "Brosicle", "Brofessor Brobody", "Han Brolo", "Broseidon Lord of the Brocean", "Broba Fett", "Brohatma Ghandi", "Brohemian", "Bromosapien", "Broseph Stalin", "Abroham Lincoln", "Brorack Brobama", "Bro Biden", "Broranosaurus rex", "Brohemoth", "Broseph Gordon Levitt", "Brobi-wan Kenobi", "Marco Brolo", "Edgar Allan Bro", "Brozo the Clown", "C-3P Bro", "Frosty the Broman", "G.I. Bro", "Brose Marti", "The Higgs Broson", "Brodo Baggins", "Bilbro Baggins", "Teddy Broosevelt", "Franklin Broosevelt", "Broam Chomsky", "Brozilla", "Napoleon Bronaparte", "Brostradamos", "Quasibrodo", "Jon Bon Brovi", "Brobe Bryant", "Mr. Broboto", "Brolin Powell", "Brofi Annan", "Conan Bro'Brien", "Arnold Brozenegger", "Bro Yun Fat", "Pierce Brosnan", "Samuel Bro Jackson", "Quentin Broantino", "Clive Browen", "Elvis Brosely", "Demi Brovato", "Selena Bromez", "Michael Broson", "Ton Broosendaal", "Broctor Death", "Spiderbro", "Doctor Broctopus", "Bro Nye the Science Guy", "Bromethius", "Bromance", "Broland of Gilead", "Bro Jackson", "Indiana Brones", "Big Lebroski", "Angelina Broli", "Vincent van Bro", "Bromer Simpson", "Bromeo", "Kurt Brobain", "Broald Dahl", "Scarlett Brohansen"] // https://github.com/BSVino/DoubleAction/blame/master/mp/src/game/server/sdk/bots/bot_main.cpp#L92
	
	async function addPerson() {
		const {data, error} = await supabase
			.from("people")
			.insert({
				name: bros[Math.floor(Math.random() * bros.length)],
				age: Math.floor(Math.random() * 140), // 0 <= age < 140
				sex: Math.floor(Math.random() * 2),
				height: Math.floor(Math.random() * 261 + 12), // 12 <= height < 273
				weight: Math.floor(Math.random() * 636), // 0 <= weight < 636
				activity: Math.floor(Math.random() * 5),
				goal: Math.floor(Math.random() * 5 - 2),
				household: home!.id,
			})
			.select("id, household, name, age, sex, height, weight, activity, goal, visiting")
			.single()
		if (error) { console.error("Error in creating new person:", error); toast.error("Error in creating new person."); return }
		home!.people[data.id] = data
	}
	
	// EDIT
	
	async function setName(person: number, name: string) {
		const {error} = await supabase
			.from("people")
			.update({name})
			.eq("id", person)
		if (error) { console.error("Error in setting person name:", error); toast.error("Error in setting name."); return }
		home!.people[person].name = name
	}
	
	async function setAge(person: number, age: number) {
		const {error} = await supabase
			.from("people")
			.update({age})
			.eq("id", person)
		if (error) { console.error("Error in setting person age:", error); toast.error("Error in setting age."); return }
		home!.people[person].age = age
	}
	
	async function setSex(person: number, sex: number) {
		const {error} = await supabase
			.from("people")
			.update({sex})
			.eq("id", person)
		if (error) { console.error("Error in setting person sex:", error); toast.error("Error in setting sex."); return }
		home!.people[person].sex = sex
	}
	
	async function setHeight(person: number, height: number) {
		const {error} = await supabase
			.from("people")
			.update({height})
			.eq("id", person)
		if (error) { console.error("Error in setting person height:", error); toast.error("Error in setting height."); return }
		home!.people[person].height = height
	}
	
	async function setWeight(person: number, weight: number) {
		const {error} = await supabase
			.from("people")
			.update({weight})
			.eq("id", person)
		if (error) { console.error("Error in setting person weight:", error); toast.error("Error in setting weight."); return }
		home!.people[person].weight = weight
	}
	
	async function setActivity(person: number, activity: number) {
		const {error} = await supabase
			.from("people")
			.update({activity})
			.eq("id", person)
		if (error) { console.error("Error in setting person activity:", error); toast.error("Error in setting activity."); return }
		home!.people[person].activity = activity
	}
	
	async function setGoal(person: number, goal: number) {
		const {error} = await supabase
			.from("people")
			.update({goal})
			.eq("id", person)
		if (error) { console.error("Error in setting person goal:", error); toast.error("Error in setting goal."); return }
		home!.people[person].goal = goal
	}
	
	// REMOVE
	
	async function removePerson(person: number) {
		const {error} = await supabase
			.from("people")
			.delete()
			.eq("id", person)
		if (error) { console.error("Error in removing person:", error); toast.error("Error in removing goal."); return }
		delete home!.people[person]
	}
</script>

<table class="table table-fixed table-pin-rows table-pin-cols w-fit [&>*>tr>td]:border-x [&>*>tr>td]:border-base-200  [&>tbody>tr]:border-y-0">
	<thead>
		<tr>
			<th class="w-24 text-right text-base">Name</th>
			{#each Object.values(home!.people) as person (person.id)}
				<td class="w-40 group">
					<div class="flex items-center gap-2">
						<input type="text" value={person.name} onchange={event => setName(person.id, event.currentTarget.value)} placeholder="Name" class="w-full input p-0" />
						<button class="btn btn-square btn-sm hidden group-hover:flex hover:btn-error" onclick={() => removePerson(person.id)}><Trash2 /></button>
					</div>
				</td>
			{/each}
			<td class="w-32">
				<button class="btn" onclick={() => addPerson()}><Plus />Add</button>
			</td>
		</tr>
	</thead>
	<tbody>
		<tr>
			<th class="text-right">Age</th>
			{#each Object.values(home!.people) as person (person.id)}
				<td>
					<input type="number" value={person.age} onchange={event => setAge(person.id, Number(event.currentTarget.value))} class="w-2/3 pr-0 text-lg text-right input input-sm">
					<span class="w-1/3 text-left">yrs</span>
				</td>
			{/each}
			<td></td>
		</tr>
		<tr>
			<th class="text-right">Sex</th>
			{#each Object.values(home!.people) as person (person.id)}
				<td>
					<div class="flex items-center">
						<span class="text-lg pr-1" title="Female">♀</span>
						<input type="range" value={person.sex} min={0} max={1} step={0.1} onchange={event => setSex(person.id, Number(event.currentTarget.value))} class="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer">
						<span class="text-lg pl-1" title="Male">♂</span>
					</div>
				</td>
			{/each}
			<td></td>
		</tr>
		<tr>
			<th class="text-right">Height</th>
			{#each Object.values(home!.people) as person (person.id)}
				<td>
					<input type="number" value={person.height} onchange={event => setHeight(person.id, Number(event.currentTarget.value))} class="w-2/3 pr-0 text-lg text-right input input-sm">
					<span class="w-1/3 text-left">cm</span>
				</td>
			{/each}
			<td></td>
		</tr>
		<tr>
			<th class="text-right">Weight</th>
			{#each Object.values(home!.people) as person (person.id)}
				<td>
					<input type="number" value={person.weight} onchange={event => setWeight(person.id, Number(event.currentTarget.value))} class="w-2/3 pr-0 text-lg text-right input input-sm">
					<span class="w-1/3 text-left">kg</span>
				</td>
			{/each}
			<td></td>
		</tr>
		<tr>
			<th class="text-right">Activity</th>
			{#each Object.values(home!.people) as person (person.id)}
				<td>
					<input type="range" value={person.activity} min={0} max={4} step={1} onchange={event => setActivity(person.id, Number(event.currentTarget.value))} class="range">
					<div class="flex justify-between w-full px-2 text-xs">
						<Turtle /><Minus /><Minus /><Minus /><Rabbit />
					</div>
				</td>
			{/each}
			<td></td>
		</tr>
		<tr>
			<th class="text-right">Goal</th>
			{#each Object.values(home!.people) as person (person.id)}
				<td>
					<input type="range" value={person.goal} min={-2} max={2} step={1} onchange={event => setGoal(person.id, Number(event.currentTarget.value))} class="range">
					<div class="flex justify-between w-full px-2 text-xs">
						<ChevronsDown /><ChevronDown /><Minus /><ChevronUp /><ChevronsUp />
					</div>
				</td>
			{/each}
			<td></td>
		</tr>
		<tr>
			<th class="text-right">Daily Nutrition</th>
			{#each Object.values(home!.people) as person (person.id)}
				<td>
					<div class="flex flex-col">
						<div class="flex flex-nowrap"><div class="grow">calories:</div><div class="text-right">{targetCalories(person.age, person.sex, person.height, person.weight, person.goal, person.activity).toFixed(0)}</div><div class="opacity-60 w-7 pl-1">kcal</div></div>
						<div class="flex flex-nowrap"><div class="grow">protein:</div><div class="text-right">{targetProtein(person.weight, person.activity).toFixed(0)}</div><div class="opacity-60 w-7 pl-1">g</div></div>
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
