import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic' // questo forza Next.js a non cachare la route
export const revalidate = 0 // questo disabilita il caching statico

export async function GET(request: Request) {
  const requestTime = new Date().toISOString()
  console.log('🎯 API: Nuova richiesta ricevuta', {
    timestamp: requestTime,
    url: request.url,
    headers: Object.fromEntries(request.headers.entries())
  })
  
  try {
    console.log('🔌 API: Inizializzazione connessione Supabase...')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    console.log('📡 API: Esecuzione query Supabase...')
    const startQuery = Date.now()
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('Date', { ascending: false })
      .limit(100)
    const queryTime = Date.now() - startQuery

    if (error) {
      console.error('❌ API: Errore Supabase:', {
        error,
        timestamp: new Date().toISOString()
      })
      throw error
    }

    console.log('✨ API: Dati recuperati:', {
      numeroTransazioni: data?.length,
      ultimaTransazione: data?.[0]?.Date,
      primaTransazione: data?.[data.length-1]?.Date,
      tempoQuery: `${queryTime}ms`,
      esempioDati: data?.[0] // mostra la struttura del primo record
    })

    const headers = {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'X-Response-Time': queryTime.toString(),
      'X-Request-Time': requestTime
    }

    console.log('📤 API: Invio risposta:', {
      timestamp: new Date().toISOString(),
      headers
    })

    return NextResponse.json(data, { headers })

  } catch (error) {
    console.error('🔥 API: Errore critico:', {
      error,
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    })
    return NextResponse.json(
      { error: 'Internal Server Error' }, 
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
        }
      }
    )
  }
} 