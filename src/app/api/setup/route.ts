import { NextResponse } from 'next/server';
import { saveDbConfig, isDbConfigured, deleteDbConfig } from '@/lib/db-config';
import { resetDbClient } from '@/lib/db';
import * as mariadb from 'mariadb';

export async function DELETE() {
  try {
    deleteDbConfig();
    resetDbClient();
    return NextResponse.json({ 
      success: true, 
      message: 'All configuration files and caches cleared successfully.' 
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: `Failed to clear system configuration: ${error.message}` }, 
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  // STRICT SECURITY: Prevent unauthorized re-configuration if system is already set up
  if (isDbConfigured()) {
    return NextResponse.json(
      { error: 'Security Violation: System is already configured. Access Denied.' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { host, user, password, database, port } = body;

    if (!host || !user || !database) {
      return NextResponse.json(
        { error: 'Missing required database information' },
        { status: 400 }
      );
    }

    const dbPort = parseInt(port) || 3306;

    // 1. Test the connection and check tables
    let connection;
    try {
      connection = await mariadb.createConnection({
        host: host === 'localhost' ? '127.0.0.1' : host,
        user,
        password,
        database,
        port: dbPort,
        connectTimeout: 5000,
      });
      
      // Perform simple connectivity query
      await connection.query('SELECT 1');
      
      // Verify all required tables exist
      const rows = await connection.query(
        "SELECT TABLE_NAME FROM information_schema.tables WHERE table_schema = ?",
        [database]
      );
      
      const existingTables = rows.map((r: any) => r.TABLE_NAME.toLowerCase());
      const requiredTables = [
        'account', 'admin', 'category', 'collection', 'contactmessage', 
        'deal', 'heroslide', 'saveddeal', 'searchhistory', 'session', 
        'setting', 'user', 'verificationtoken', 'affiliateclick', 'realtimetraffic'
      ];
      
      const missingTables = requiredTables.filter(t => !existingTables.includes(t));
      if (missingTables.length > 0) {
        await connection.end();
        return NextResponse.json(
          { error: `Missing required database tables: ${missingTables.join(', ')}. Please import the SQL schema first.` },
          { status: 400 }
        );
      }

      await connection.end();
    } catch (err: any) {
      console.error('Database connection or schema validation failed:', err);
      return NextResponse.json(
        { error: `Connection failed: ${err.message}` },
        { status: 400 }
      );
    }

    // 2. Save the configuration
    const config = {
      host,
      user,
      password,
      database,
      port: dbPort,
    };

    const saved = saveDbConfig(config);
    if (!saved) {
      return NextResponse.json(
        { error: 'Failed to save configuration to filesystem' },
        { status: 500 }
      );
    }

    // 3. Reset the Prisma client so it picks up the new config on next use
    resetDbClient();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Setup API error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred during setup' },
      { status: 500 }
    );
  }
}
