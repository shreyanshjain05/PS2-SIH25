import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

export async function POST(request: Request) {
  try {
    const { site_id } = await request.json();
    
    // Default to site_1 if not specified
    let siteIdRaw = site_id ? String(site_id) : '1';
    
    // Normalize site ID:
    // 1. Remove .0 suffix if present (e.g., "1.0" -> "1")
    if (siteIdRaw.endsWith('.0')) {
        siteIdRaw = siteIdRaw.slice(0, -2);
    }
    
    // 2. Add 'site_' prefix if not present
    const siteId = siteIdRaw.startsWith('site_') ? siteIdRaw : `site_${siteIdRaw}`;
    
    // webdev is at /Users/meet/PS2-SIH25/webdev
    // Data is at /Users/meet/PS2-SIH25/Data_SIH_2025 2
    // process.cwd() in Next.js is usually the project root (webdev)
    
    // Use environment variable for data path (Docker) or fallback to relative path (Local)
    const dataDir = process.env.ML_DATA_PATH || path.resolve(process.cwd(), '..', 'ML', 'Data_SIH_2025 2');
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

    // OPTIMIZATION: Limit to last 500 records to ensure fast forecast response
    // The full dataset contains ~10k records which takes ~2 mins to forecast recursively.
    const limitedRecords = records.slice(-500);

    return NextResponse.json({ data: limitedRecords });
    
  } catch (error) {
    console.error('Error reading sample data:', error);
    return NextResponse.json({ error: 'Failed to read sample data' }, { status: 500 });
  }
}
