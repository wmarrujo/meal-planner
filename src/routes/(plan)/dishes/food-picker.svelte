<script lang="ts">
	import {createCombobox} from "svelte-headlessui"
	import {ChevronsUpDown} from "lucide-svelte"
	import {debounce} from "ts-debounce"
	import {supabase} from "$lib/supabase"
	
	////////////////////////////////////////////////////////////////////////////////
	
	type Option = {id: number, name: string}
	
	let {selected = $bindable()}: {selected?: number} = $props()
	
	let options: Array<Option> = $state([])
	
	const combobox = createCombobox({label: "Actions", selected})
	
	function onChange(e: Event) {
		console.log("select", (e as CustomEvent).detail.selected)
	}
	
	const search = debounce(async (search: string) => {
		console.log("new search:", search) // DEBUG
		const {data, error} = await supabase
			.rpc("search_generic_foods_by_name", {search, page_index: 0, page_size: 50})
			.select("id, name, company, brand, sub_brand")
		if (error) { console.error("Error in searching foods by name:", error); return }
		options = data
	}, 200)
</script>

<!-- TODO: put a button in front that shows the name, then when you click it it hides and shows the text input underneath, then when you get out of the text input it shows again -->
<label class="input input-bordered flex items-center gap-2 pr-2">
	<input type="text" value={$combobox.selected?.name} onchange={onChange} oninput={event => search(event.currentTarget.value)} use:combobox.input class="grow" />
	<button use:combobox.button><ChevronsUpDown /></button>
</label>

<!-- FIXME: the css doesn't want to color the background -->
<!-- FIXME: the absolute doesn't escape the dialog container -->
<div class="absolute mt-1 max-h-40 overflow-scroll w-60 p-2 {!$combobox.expanded && "hidden"}">
	<!-- TODO: put in generic vs. branded buttion -->
	<!-- TODO: put in some buttons to say how we're searching. like for the name, or the brand, or any, etc. -->
	<ul use:combobox.items>
		{#each options as option, index (index)}
			<li use:combobox.item={{value: option}} class="bg-slate-400">
				{option.name}
			</li>
		{:else}
			<li class="bg-slate-400">
				No items
			</li>
		{/each}
	</ul>
</div>
