import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Log delle variabili d'ambiente
console.log('=== VOLUME ROUTE INITIALIZATION ===');
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
  console.log('=== VOLUME ROUTE GET REQUEST ===');
  console.log('Timestamp:', new Date().toISOString());
  
  try {
    console.log('Executing Supabase volume query...');
    const { data, error } = await supabaseAdmin
      .from('transaction_volume')
      .select('total_volume, volume_24h')
      .single();

    console.log('Volume query completed');
    console.log('Volume raw data:', data);
    console.log('Volume error:', error);

    if (error) {
      console.error('Supabase Volume Error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.log('Executing rate query...');
    const { data: rateData, error: rateError } = await supabaseAdmin
      .from('borx_usdt_rate')
      .select('rate')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    console.log('Rate query completed');
    console.log('Rate raw data:', rateData);
    console.log('Rate error:', rateError);

    if (rateError) {
      console.error('Supabase Rate Error:', rateError);
      return NextResponse.json({ error: rateError.message }, { status: 400 });
    }

    const rate = rateData?.rate || 0;
    const usdAmount = data.total_volume * rate;
    const usdAmount24h = data.volume_24h * rate;

    const response = {
      amount: Number(data.total_volume).toFixed(2),
      usdAmount: Number(usdAmount).toFixed(2),
      amount24h: Number(data.volume_24h).toFixed(2),
      usdAmount24h: Number(usdAmount24h).toFixed(2)
    };

    console.log('Final response:', response);
    return NextResponse.json(response);

  } catch (err) {
    console.error('Volume route error:', err);
    return NextResponse.json({ 
      error: 'Unexpected error',
      details: err instanceof Error ? err.message : 'Unknown error'
    }, { status: 500 });
  }
} 
