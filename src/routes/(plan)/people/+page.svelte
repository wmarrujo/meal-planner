<script lang="ts">
	import {Plus, Turtle, Rabbit, ChevronsDown, ChevronDown, Minus, ChevronUp, ChevronsUp} from "lucide-svelte"
	import {supabase} from "$lib/supabase"
	import {getContext} from "svelte"
	import {toast} from "svelte-sonner"
	
	////////////////////////////////////////////////////////////////////////////////
	
	type Person = {
		id: number
		name: string
		sex: number
		height: number
		weight: number
		activity: number
		goal: number
	}
	
	let people: Record<number, Person> = $state({})
	const home = $derived(getContext<{value: number | undefined}>("home")?.value) // NOTE: because it's inside a guard that makes sure you only see the contents of this page when household is true (from layout), it will be defined whenever you can see anything (just not on mount)
	
	$effect(() => {
		if (home) {
			supabase
				.from("people")
				.select("id, name, sex, height, weight, activity, goal")
				.eq("household", home)
				.order("name")
				.then(({data, error}) => {
					if (error) { console.error("Error in getting people:", error); toast.error("Error in getting people."); return }
					people = data.reduce((acc, p) => { acc[p.id] = p; return acc }, {} as Record<number, Person>)
				})
		}
	})
	
	////////////////////////////////////////////////////////////////////////////////
	
	async function setName(person: number, name: string) {
		const {error} = await supabase
			.from("people")
			.update({name})
			.eq("id", person)
		if (error) { console.error("Error in setting person name:", error); toast.error("Error in setting name."); return }
		people[person].name = name
	}
	
	async function setSex(person: number, sex: number) {
		const {error} = await supabase
			.from("people")
			.update({sex})
			.eq("id", person)
		if (error) { console.error("Error in setting person sex:", error); toast.error("Error in setting sex."); return }
		people[person].sex = sex
	}
	
	async function setHeight(person: number, height: number) {
		const {error} = await supabase
			.from("people")
			.update({height})
			.eq("id", person)
		if (error) { console.error("Error in setting person height:", error); toast.error("Error in setting height."); return }
		people[person].height = height
	}
	
	async function setWeight(person: number, weight: number) {
		const {error} = await supabase
			.from("people")
			.update({weight})
			.eq("id", person)
		if (error) { console.error("Error in setting person weight:", error); toast.error("Error in setting weight."); return }
		people[person].weight = weight
	}
	
	async function setActivity(person: number, activity: number) {
		const {error} = await supabase
			.from("people")
			.update({activity})
			.eq("id", person)
		if (error) { console.error("Error in setting person activity:", error); toast.error("Error in setting activity."); return }
		people[person].activity = activity
	}
	
	async function setGoal(person: number, goal: number) {
		const {error} = await supabase
			.from("people")
			.update({goal})
			.eq("id", person)
		if (error) { console.error("Error in setting person goal:", error); toast.error("Error in setting goal."); return }
		people[person].goal = goal
	}
	
	////////////////////////////////////////////////////////////////////////////////
	
	const bros = ["Brohan", "Brochill", "Broseph von Brohammer", "Brotastic Broski", "Brosicle", "Brofessor Brobody", "Han Brolo", "Broseidon Lord of the Brocean", "Broba Fett", "Brohatma Ghandi", "Brohemian", "Bromosapien", "Broseph Stalin", "Abroham Lincoln", "Brorack Brobama", "Bro Biden", "Broranosaurus rex", "Brohemoth", "Broseph Gordon Levitt", "Brobi-wan Kenobi", "Marco Brolo", "Edgar Allan Bro", "Brozo the Clown", "C-3P Bro", "Frosty the Broman", "G.I. Bro", "Brose Marti", "The Higgs Broson", "Brodo Baggins", "Bilbro Baggins", "Teddy Broosevelt", "Franklin Broosevelt", "Broam Chomsky", "Brozilla", "Napoleon Bronaparte", "Brostradamos", "Quasibrodo", "Jon Bon Brovi", "Brobe Bryant", "Mr. Broboto", "Brolin Powell", "Brofi Annan", "Conan Bro'Brien", "Arnold Brozenegger", "Bro Yun Fat", "Pierce Brosnan", "Samuel Bro Jackson", "Quentin Broantino", "Clive Browen", "Elvis Brosely", "Demi Brovato", "Selena Bromez", "Michael Broson", "Ton Broosendaal", "Broctor Death", "Spiderbro", "Doctor Broctopus", "Bro Nye the Science Guy", "Bromethius", "Bromance", "Broland of Gilead", "Bro Jackson", "Indiana Brones", "Big Lebroski", "Angelina Broli", "Vincent van Bro", "Bromer Simpson", "Bromeo", "Kurt Brobain", "Broald Dahl", "Scarlett Brohansen"] // https://github.com/BSVino/DoubleAction/blame/master/mp/src/game/server/sdk/bots/bot_main.cpp#L92
	
	async function addPerson() {
		const {data, error} = await supabase
			.from("people")
			.insert({
				name: bros[Math.floor(Math.random() * bros.length)],
				sex: Math.floor(Math.random() * 2),
				height: Math.floor(Math.random() * 261 + 12), // 12 <= height < 273
				weight: Math.floor(Math.random() * 636), // 0 <= weight < 636
				activity: Math.floor(Math.random() * 5),
				goal: Math.floor(Math.random() * 5 - 2),
				household: home,
			})
			.select("id, name, sex, height, weight, activity, goal")
			.single()
			// FIXME: adding this person won't work because we need to make households & stuff first
		if (error) { console.error("Error in creating new person:", error); toast.error("Error in creating new person."); return }
		people[data.id] = data
	}
</script>

<table class="table table-fixed table-pin-rows table-pin-cols w-fit [&>*>tr>td]:border-x [&>*>tr>td]:border-base-200  [&>tbody>tr]:border-y-0">
	<thead>
		<tr>
			<th class="w-24 text-right text-base">Name</th>
			{#each Object.values(people) as person (person.id)}
				<td class="w-32">
					<input type="text" value={person.name} onchange={event => setName(person.id, event.currentTarget.value)} placeholder="Name" class="w-full input" />
				</td>
			{/each}
			<td class="w-32">
				<button class="btn" onclick={() => addPerson()}><Plus />Add</button>
			</td>
		</tr>
	</thead>
	<tbody>
		<tr>
			<th class="text-right">Sex</th>
			{#each Object.values(people) as person (person.id)}
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
			{#each Object.values(people) as person (person.id)}
				<td>
					<input type="number" value={person.height} onchange={event => setHeight(person.id, Number(event.currentTarget.value))} class="w-2/3 pr-0 text-lg text-right input input-sm">
					<span class="w-1/3 text-left">cm</span>
				</td>
			{/each}
			<td></td>
		</tr>
		<tr>
			<th class="text-right">Weight</th>
			{#each Object.values(people) as person (person.id)}
				<td>
					<input type="number" value={person.weight} onchange={event => setWeight(person.id, Number(event.currentTarget.value))} class="w-2/3 pr-0 text-lg text-right input input-sm">
					<span class="w-1/3 text-left">kg</span>
				</td>
			{/each}
			<td></td>
		</tr>
		<tr>
			<th class="text-right">Activity</th>
			{#each Object.values(people) as person (person.id)}
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
			{#each Object.values(people) as person (person.id)}
				<td>
					<input type="range" value={person.goal} min={-2} max={2} step={1} onchange={event => setGoal(person.id, Number(event.currentTarget.value))} class="range">
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
