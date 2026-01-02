import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Aggiungi log per le variabili d'ambiente
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('Service Role Key exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);

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

export async function GET() {
  console.log('Burned route - Starting GET request');
  
  try {
    console.log('Burned route - Attempting to fetch data from Supabase...');
    
    const { data, error } = await supabaseAdmin
      .from('burned')
      .select('id, total_burned, total_burned_usd')
    
    // Log dettagliato dell'errore se presente
    if (error) {
      console.error('Burned route - Supabase error:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      })
      return NextResponse.json({ 
        error: error.message,
        details: {
          code: error.code,
          details: error.details,
          hint: error.hint
        }
      }, { status: 400 })
    }

    // Log dei dati se la query ha successo
    console.log('Burned route - Raw data:', data);

    if (!data || data.length === 0) {
      console.log('Burned route - No data found');
      return NextResponse.json({ error: 'No data found' }, { status: 404 })
    }

    // Prendiamo il primo record
    const record = data[0]
    const response = {
      amount: record.total_burned.toFixed(2),
      usdAmount: record.total_burned_usd ? record.total_burned_usd.toFixed(2) : "0.00"
    }

    console.log('Burned route - Processed response:', response);
    return NextResponse.json(response)

  } catch (e: any) {
    console.error('Burned route - Unexpected error:', {
      error: e,
      message: e.message,
      stack: e.stack
    });
    return NextResponse.json({ 
      error: 'Unexpected error',
      details: e.message
    }, { status: 500 })
  }
} 
