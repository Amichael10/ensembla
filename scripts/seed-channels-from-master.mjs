/**
 * Seed channels from naijawood_master.xlsx into Supabase.
 *
 * - Upserts all 173 channels (from Channels sheet)
 * - Sets owner_person_id from Channel_Owners sheet
 * - Deduplicates by channel_url / channel_handle
 *
 * Usage: node scripts/seed-channels-from-master.mjs
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import xlsx from 'xlsx';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const masterPath = path.join(__dirname, '../src/data/naijawood_master.xlsx');
const wb = xlsx.readFile(masterPath);

function readSheet(name) {
  return xlsx.utils.sheet_to_json(wb.Sheets[name] ?? {}) ?? [];
}

// ── Load sheets ──────────────────────────────────────────────────────────────
const masterChannels = readSheet('Channels');
const channelOwners  = readSheet('Channel_Owners');

console.log(`Loaded ${masterChannels.length} channels, ${channelOwners.length} owner links from master.`);

// Build owner map: channel_id → person_id
const ownerMap = new Map();
for (const co of channelOwners) {
  if (co.channel_id && co.person_id) {
    ownerMap.set(String(co.channel_id).trim(), String(co.person_id).trim());
  }
}

// ── Fetch existing channels from DB ─────────────────────────────────────────
const { data: existingChannels } = await supabase
  .from('channels')
  .select('id, name, channel_handle, channel_url');

const existingByHandle = new Map();
const existingById     = new Map();
for (const ch of existingChannels ?? []) {
  if (ch.channel_handle) existingByHandle.set(ch.channel_handle.toLowerCase().replace(/^@/, ''), ch.id);
  if (ch.id) existingById.set(ch.id, true);
}

let inserted = 0, updated = 0, skipped = 0, errors = 0;

for (const ch of masterChannels) {
  const id             = ch.id ? String(ch.id).trim() : null;
  const channelHandle  = ch.channel_handle ? String(ch.channel_handle).trim() : null;
  const normalHandle   = channelHandle?.replace(/^@/, '').toLowerCase();
  const ownerPersonId  = id ? (ownerMap.get(id) || ch.owner_person_id || null) : null;

  const payload = {
    name:             ch.name ? String(ch.name).trim() : null,
    channel_handle:   channelHandle || null,
    channel_url:      ch.channel_url ? String(ch.channel_url).trim() : null,
    description:      ch.description ? String(ch.description).trim() : null,
    category:         ch.category ? String(ch.category).trim() : null,
    subscriber_count: ch.subscriber_count ? Number(ch.subscriber_count) : null,
    thumbnail_url:    ch.thumbnail_url ? String(ch.thumbnail_url).trim() || null : null,
    banner_url:       ch.banner_url ? String(ch.banner_url).trim() || null : null,
    owner_person_id:  ownerPersonId || null,
  };

  if (!payload.name) { skipped++; continue; }

  // Try match by ID first, then handle
  const existsById     = id && existingById.has(id);
  const existsByHandle = normalHandle && existingByHandle.has(normalHandle);

  if (existsById) {
    // Update existing row by ID
    const targetId = id;
    const { error } = await supabase
      .from('channels')
      .update(payload)
      .eq('id', targetId);
    if (error) {
      console.error(`  ✗ Update ${payload.name}: ${error.message}`);
      errors++;
    } else {
      console.log(`  ↻ Updated: ${payload.name}${ownerPersonId ? ' (owner linked)' : ''}`);
      updated++;
    }
  } else if (existsByHandle) {
    // Update existing row by handle
    const targetId = existingByHandle.get(normalHandle);
    const { error } = await supabase
      .from('channels')
      .update(payload)
      .eq('id', targetId);
    if (error) {
      console.error(`  ✗ Update by handle ${payload.name}: ${error.message}`);
      errors++;
    } else {
      console.log(`  ↻ Updated (by handle): ${payload.name}${ownerPersonId ? ' (owner linked)' : ''}`);
      updated++;
    }
  } else {
    // Insert new channel
    const insertPayload = id ? { id, ...payload } : payload;
    const { error } = await supabase.from('channels').insert(insertPayload);
    if (error) {
      if (error.message.includes('duplicate key') || error.code === '23505') {
        skipped++;
      } else {
        console.error(`  ✗ Insert ${payload.name}: ${error.message}`);
        errors++;
      }
    } else {
      console.log(`  + Inserted: ${payload.name}${ownerPersonId ? ' (owner linked)' : ''}`);
      inserted++;
    }
  }
}

console.log(`\n✅ Done. ${inserted} inserted · ${updated} updated · ${skipped} skipped · ${errors} errors`);
