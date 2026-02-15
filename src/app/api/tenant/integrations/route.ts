/**
 * Tenant Integrations API
 * 
 * Protected API for managing POS integrations and webhooks.
 * All operations are tenant-scoped via getTenantContext().
 * 
 * GET    /api/tenant/integrations          — List all integrations
 * POST   /api/tenant/integrations          — Create/update integration
 * DELETE /api/tenant/integrations?provider= — Delete integration
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTenantContext } from '@/lib/tenant';
import { TenantError } from '@/lib/tenant-types';
import {
  getIntegrations,
  upsertIntegration,
  deleteIntegration,
  testPosConnection,
  isPosProvider,
} from '@/lib/integrations';
import type { IntegrationProvider, PosProvider } from '@/lib/integrations';

// GET — List all integrations for the tenant
export async function GET() {
  try {
    const tenant = await getTenantContext();
    const integrations = await getIntegrations(tenant.restaurantId);

    return NextResponse.json({ integrations });
  } catch (e) {
    if (e instanceof TenantError) {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST — Create or update an integration
export async function POST(request: NextRequest) {
  try {
    const tenant = await getTenantContext();
    const body = await request.json();

    const { provider, config, name, test_connection } = body as {
      provider: IntegrationProvider;
      config: Record<string, unknown>;
      name?: string;
      test_connection?: boolean;
    };

    if (!provider || !config) {
      return NextResponse.json(
        { error: 'provider and config are required' },
        { status: 400 }
      );
    }

    // Create/update the integration
    const result = await upsertIntegration(
      tenant.restaurantId,
      provider,
      config,
      name
    );

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    // Optionally test the connection
    let connectionTest = null;
    if (test_connection && isPosProvider(provider)) {
      connectionTest = await testPosConnection(
        tenant.restaurantId,
        provider as PosProvider
      );
    }

    return NextResponse.json({
      integration: result.integration,
      connection_test: connectionTest,
    });
  } catch (e) {
    if (e instanceof TenantError) {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE — Remove an integration
export async function DELETE(request: NextRequest) {
  try {
    const tenant = await getTenantContext();
    const { searchParams } = new URL(request.url);
    const provider = searchParams.get('provider') as IntegrationProvider;

    if (!provider) {
      return NextResponse.json(
        { error: 'provider query parameter is required' },
        { status: 400 }
      );
    }

    const result = await deleteIntegration(tenant.restaurantId, provider);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ deleted: true });
  } catch (e) {
    if (e instanceof TenantError) {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
