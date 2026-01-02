import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Log delle variabili d'ambiente
console.log('=== TREASURY ROUTE INITIALIZATION ===');
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

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  console.log('=== TREASURY ROUTE GET REQUEST ===');
  console.log('Timestamp:', new Date().toISOString());
  
  try {
    console.log('Executing Supabase query...');
    
    const { data, error } = await supabaseAdmin
      .from('treasury')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);
    
    console.log('Query completed');
    console.log('Raw data:', data);
    console.log('Error:', error);

    if (error) {
      console.error('Supabase Error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (!data || data.length === 0) {
      console.log('No data found');
      return NextResponse.json({ error: 'No data found' }, { status: 404 });
    }

    const record = data[0];
    
    // Verifica che i campi esistano prima di chiamare toFixed
    if (typeof record.total_fees === 'undefined') {
      console.error('total_fees is undefined in record:', record);
      return NextResponse.json({ error: 'Invalid data structure' }, { status: 500 });
    }

    const response = {
      amount: Number(record.total_fees).toFixed(2),
      usdAmount: record.total_fees_usd ? Number(record.total_fees_usd).toFixed(2) : "0.00"
    };

    console.log('Final response:', response);
    return NextResponse.json(response);

  } catch (err) {
    console.error('Treasury route error:', err);
    return NextResponse.json({ 
      error: 'Unexpected error',
      details: err instanceof Error ? err.message : 'Unknown error'
    }, { status: 500 });
  }
} 
