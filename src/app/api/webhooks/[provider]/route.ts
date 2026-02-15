/**
 * Inbound Webhook Receiver
 * 
 * POST /api/webhooks/:provider?restaurant_id=xxx
 * 
 * Receives webhooks from external POS systems (Toast, Square, Clover)
 * and routes them to the appropriate handler.
 * 
 * Security: Validates restaurant_id exists and integration is active.
 * Each POS provider has its own signature verification in the handler.
 */

import { NextRequest, NextResponse } from 'next/server';
import { processInboundWebhook } from '@/lib/integrations';

export async function POST(
  request: NextRequest,
  { params }: { params: { provider: string } }
) {
  const { provider } = params;
  const { searchParams } = new URL(request.url);
  const restaurantId = searchParams.get('restaurant_id');

  if (!restaurantId) {
    return NextResponse.json(
      { error: 'restaurant_id query parameter is required' },
      { status: 400 }
    );
  }

  // Valid providers
  const validProviders = ['pos_toast', 'pos_square', 'pos_clover'];
  if (!validProviders.includes(provider)) {
    return NextResponse.json(
      { error: `Unknown provider: ${provider}` },
      { status: 400 }
    );
  }

  try {
    const body = await request.text();
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });

    const result = await processInboundWebhook(provider, restaurantId, headers, body);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error(`[WEBHOOK] Error processing ${provider} webhook:`, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
