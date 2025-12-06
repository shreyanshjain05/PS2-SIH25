import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

export async function POST(request: Request) {
  try {
    const { site_id } = await request.json();
    
    // Default to site_1 if not specified or file doesn't exist
    const siteId = site_id || 'site_1';
    
    // webdev is at /Users/meet/PS2-SIH25/webdev
    // Data is at /Users/meet/PS2-SIH25/Data_SIH_2025 2
    // process.cwd() in Next.js is usually the project root (webdev)
    
    const dataDir = path.resolve(process.cwd(), '..', 'ML', 'Data_SIH_2025 2');
    const filePath = path.join(dataDir, `${siteId}_unseen_input_data.csv`);

    if (!fs.existsSync(filePath)) {
        return NextResponse.json({ error: `Data file not found for ${siteId} at ${filePath}` }, { status: 404 });
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      cast: (value, context) => {
        if (value === '') return null;
        return value;
      }
    });

    return NextResponse.json({ data: records });
    
  } catch (error) {
    console.error('Error reading sample data:', error);
    return NextResponse.json({ error: 'Failed to read sample data' }, { status: 500 });
  }
}
