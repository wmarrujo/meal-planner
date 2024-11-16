export const prerender = true // needed in this file for adapter-static to generate correctly
import {supabase} from "$lib/supabase"

////////////////////////////////////////////////////////////////////////////////

export async function load() {
	const {data: {session}, error: sessionError} = await supabase.auth.getSession()
	if (sessionError) console.error("Error in getting session:", sessionError)
	
	return {session}
}
