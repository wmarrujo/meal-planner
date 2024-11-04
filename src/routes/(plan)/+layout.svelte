<script lang="ts">
	import {base} from "$app/paths"
	import {page} from "$app/stores"
	import {logOut} from "$lib/supabase"
	import {onMount, setContext} from "svelte"
	import {supabase} from "$lib/supabase"
	import {Pencil, Plus} from "lucide-svelte"
	import {toast} from "svelte-sonner"
	
	////////////////////////////////////////////////////////////////////////////////
	
	let {children} = $props()
	
	type Household = {
		id: number
		name: string
	}
	
	let households: Record<number, Household> = $state({})
	let selected: number | undefined = $state()
	// svelte-ignore state_referenced_locally
	setContext("household", selected)
	
	onMount(async () => {
		const {data, error} = await supabase
			.from("households")
			.select("id, name")
			.order("name")
		if (error) { console.error("Error in getting households:", error); toast.error("Error in getting households."); return }
		households = data.reduce((acc, p) => { acc[p.id] = p; return acc }, {} as Record<number, Household>)
	})
	
	////////////////////////////////////////////////////////////////////////////////
	
	const names = ["Mi Casa", "Hogwartz", "The White House", "Buckingham Palace"]
	
	async function addHousehold() {
		const {data, error} = await supabase
			.from("households")
			.insert({name: names[Math.floor(Math.random() * names.length)]})
		if (error) { console.error("Error in setting household name:", error); toast.error("Error in setting household name."); return }
		// households[data.id] = data
		// FIXME: we can't get the household back unless we're a member
		// TODO: add me as a member of the household
	}
	
	async function setHouseholdName(household: number, name: string) {
		const {error} = await supabase
			.from("households")
			.update({name})
			.eq("id", household)
		if (error) { console.error("Error in setting household name:", error); toast.error("Error in setting household name."); return }
		households[household].name = name
		edit = false
	}
	
	let edit = $state(false)
</script>

<div>
	<nav class="gap-2 navbar group">
		<h1><a href="{base}/" class="btn btn-ghost">Meal-Planner</a></h1>
		<ul class="flex gap-2">
			<li><a href="{base}/people" class="btn btn-ghost {$page.route.id?.startsWith("/people") && "underline"}">People</a></li>
			<li><a href="{base}/dishes" class="btn btn-ghost {$page.route.id?.startsWith("/dishes") && "underline"}">Dishes</a></li>
			<li><a href="{base}/meals" class="btn btn-ghost {$page.route.id?.startsWith("/meals") && "underline"}">Meals</a></li>
		</ul>
		<div class="grow"></div>
		<button class="btn btn-square invisible {selected && "group-hover:visible"} {edit && "invisible"}" onclick={() => edit = true}><Pencil /></button>
		<div class="dropdown">
			<div tabindex="0" role="button" class="btn m-1">{selected ? households[selected]?.name : "No households available"}</div>
			<ul class="dropdown-content menu bg-base-200 rounded-box z-[1] w-52 p-2 shadow">
				{#each Object.values(households) as household (household.id)}
					<li class="flex flex-nowrap">
						<button onclick={() => selected = household.id} class="btn">{household.name}</button>
					</li>
				{/each}
				<span class="h-[1px] bg-slate-500 my-1"></span>
				<li><button class="btn" onclick={() => addHousehold()}><Plus />Add</button></li>
			</ul>
		</div>
		{#if $page.data.session?.user}
			<button onclick={logOut} class="btn btn-ghost">Log Out</button>
		{:else}
			<a href="{base}/signup" class="btn btn-ghost">Sign Up</a>
		{/if}
	</nav>
	<input
		value={selected ? households[selected].name : ""}
		onchange={event => selected ? setHouseholdName(selected, event.currentTarget.value) : toast.warning("You must select a household")}
		class="input input-bordered text-2xl {edit ? "visible" : "hidden"}"
	/>
	{@render children()}
</div>
