import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST(request: Request) {
  try {
    const { username } = await request.json()
    
    console.log('Searching for username:', username) // Debug log

    // Cerca l'utente esistente
    let { data: existingUser, error: queryError } = await supabaseAdmin
      .from('user_balance')
      .select('username, balance, updated_at')
      .eq('username', username)
      .single()

    console.log('Search result:', { existingUser, queryError }) // Debug log

    // Se l'utente non esiste (PGRST116 è il codice per "nessun risultato")
    if (queryError && queryError.code === 'PGRST116') {
      console.log('User not found, creating new user') // Debug log
      
      // Crea nuovo utente con balance 1000
      const { data: newUser, error: insertError } = await supabaseAdmin
        .from('user_balance')
        .insert([{ 
          username: username, 
          balance: 1000,
          updated_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (insertError) {
        console.error('Insert error:', insertError) // Debug log
        return NextResponse.json({ error: 'Errore nella creazione utente' }, { status: 500 })
      }

      return NextResponse.json({
        username: newUser.username,
        balance: newUser.balance,
        updated_at: newUser.updated_at
      })
    }

    if (queryError) {
      console.error('Query error:', queryError) // Debug log
      return NextResponse.json({ error: 'Errore nella ricerca utente' }, { status: 500 })
    }

    // Utente trovato, verifica se esiste
    if (!existingUser) {
      return NextResponse.json({ error: 'Utente non trovato' }, { status: 404 })
    }

    // Restituisce i dati dell'utente
    return NextResponse.json({
      username: existingUser.username,
      balance: existingUser.balance,
      updated_at: existingUser.updated_at
    })

  } catch (error) {
    console.error('General error:', error) // Debug log
    return NextResponse.json({ error: 'Errore del server' }, { status: 500 })
  }
} 