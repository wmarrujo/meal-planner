import {createClient} from "@supabase/supabase-js"
import type {Database} from "$schema"

////////////////////////////////////////////////////////////////////////////////

const SUPABASE_URL = "https://gvqyxuogadefsxbhgwup.supabase.co"
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2cXl4dW9nYWRlZnN4Ymhnd3VwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjkyNjE0MzksImV4cCI6MjA0NDgzNzQzOX0.kgETO-N5cKUDuLWtRBotHgOPoEI4fa81GGyb9rcPH4U"

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY)