import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: Request) {
  const url = new URL(request.url)
  const searchUsername = url.searchParams.get('search')
  const noLimit = url.searchParams.get('noLimit') === 'true'

  try {
    let { data: users, error } = await supabase
      .from('user_balance')
      .select('username, balance')
      .order('balance', { ascending: false })

    if (error) throw error

    if (searchUsername) {
      // Cerca l'utente
      const { data: existingUser, error: searchError } = await supabase
        .from('user_balance')
        .select('username, balance')
        .eq('username', searchUsername.toLowerCase())
        .single()

      if (!existingUser) {
        // Crea nuovo utente con 1000 BP
        const { data: newUser, error: insertError } = await supabase
          .from('user_balance')
          .insert([
            { username: searchUsername.toLowerCase(), balance: 1000 }
          ])
          .select()
          .single()

        if (newUser) {
          users = [newUser, ...(users || [])]
        }
      }
    }

    return Response.json(noLimit ? users : users?.slice(0, 100) || [])
  } catch (error) {
    return Response.json({ error: 'Error fetching top 100' }, { status: 500 })
  }
} 