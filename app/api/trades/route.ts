import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');

  if (!address) {
    return NextResponse.json({ error: "Missing address" }, { status: 400 });
  }

  if (!supabase) {
    // If Supabase isn't configured, fallback gracefully so local testing still works
    return NextResponse.json({ trades: [] });
  }

  try {
    // 1. Fetch user to get ID
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('wallet_address', address)
      .maybeSingle();

    if (userError) {
      throw userError;
    }

    if (!user) {
      return NextResponse.json({ trades: [] });
    }

    // 2. Fetch trades for the user
    const { data: trades, error: tradesError } = await supabase
      .from('trades')
      .select('*')
      .eq('user_id', user.id)
      .order('executed_at', { ascending: false });

    if (tradesError) {
      throw tradesError;
    }

    return NextResponse.json({ trades: trades || [] });
  } catch (error: any) {
    console.error("Error fetching trades:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!supabase) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { address, pair, side, order_type, amount, price, total_value, tx_hash } = body;

    if (!address || !pair || !side || !order_type || amount === undefined || price === undefined || total_value === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Get or create user
    let { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('wallet_address', address)
      .maybeSingle();

    if (userError) {
      throw userError;
    }

    if (!user) {
      const { data: newUser, error: insertUserError } = await supabase
        .from('users')
        .insert({ wallet_address: address })
        .select('id')
        .single();

      if (insertUserError) {
        throw insertUserError;
      }
      user = newUser;
    }

    // 2. Insert trade record
    const { data: trade, error: tradeError } = await supabase
      .from('trades')
      .insert({
        user_id: user.id,
        pair,
        side,
        order_type,
        amount: parseFloat(amount),
        price: parseFloat(price),
        total_value: parseFloat(total_value),
        tx_hash,
        executed_at: new Date().toISOString()
      })
      .select('*')
      .single();

    if (tradeError) {
      throw tradeError;
    }

    return NextResponse.json({ success: true, trade });
  } catch (error: any) {
    console.error("Error saving trade:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
