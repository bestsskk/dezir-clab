import { NextResponse } from 'next/server';
import net from 'net';
import dns from 'dns';

export const dynamic = 'force-dynamic';

function testTcpPort(host: string, port: number, timeoutMs = 2000): Promise<{ reachable: boolean; latencyMs?: number; error?: string }> {
  return new Promise((resolve) => {
    const start = Date.now();
    const socket = new net.Socket();
    let isResolved = false;

    socket.setTimeout(timeoutMs);

    socket.connect(port, host, () => {
      if (!isResolved) {
        isResolved = true;
        const latencyMs = Date.now() - start;
        socket.destroy();
        resolve({ reachable: true, latencyMs });
      }
    });

    socket.on('timeout', () => {
      if (!isResolved) {
        isResolved = true;
        socket.destroy();
        resolve({ reachable: false, error: `Connection timed out after ${timeoutMs}ms (Firewall blocking outgoing port ${port})` });
      }
    });

    socket.on('error', (err) => {
      if (!isResolved) {
        isResolved = true;
        socket.destroy();
        resolve({ reachable: false, error: err.message });
      }
    });
  });
}

function resolveDns(host: string): Promise<{ resolved: boolean; ip?: string; error?: string }> {
  return new Promise((resolve) => {
    dns.lookup(host, (err, address) => {
      if (err) {
        resolve({ resolved: false, error: err.message });
      } else {
        resolve({ resolved: true, ip: address });
      }
    });
  });
}

export async function GET() {
  const supabaseHost = 'aws-0-ap-southeast-1.pooler.supabase.com';

  const dnsResult = await resolveDns(supabaseHost);
  const port6543 = await testTcpPort(supabaseHost, 6543, 2000);
  const port5432 = await testTcpPort(supabaseHost, 5432, 2000);
  const port443 = await testTcpPort(supabaseHost, 443, 2000);

  return NextResponse.json({
    diagnostics: {
      supabaseHost,
      dns: dnsResult,
      networkPorts: {
        port6543_pooler: port6543,
        port5432_direct: port5432,
        port443_https: port443,
      },
      analysis:
        !port6543.reachable && !port5432.reachable
          ? 'CRITICAL: Your cPanel host (Ninzahost) firewall is blocking outgoing TCP ports 6543 & 5432. Switching to local SQLite or Supabase HTTPS API is required.'
          : 'Network connectivity to Supabase ports is open.',
    },
  });
}
