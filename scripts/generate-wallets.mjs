#!/usr/bin/env node
/**
 * DiasporaConnect — Solana Wallet Generator
 *
 * Generates persistent admin and treasury keypairs for the backend.
 * Keypairs are saved to backend/wallets/ as JSON (Solana CLI format).
 * Run once, fund the addresses, then set the env vars shown at the end.
 *
 * Usage:  node scripts/generate-wallets.mjs
 */

import { Keypair } from "@solana/web3.js";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const WALLETS_DIR = resolve(__dirname, "../backend/wallets");

function loadOrCreate(name) {
  const filePath = resolve(WALLETS_DIR, `${name}.json`);
  if (existsSync(filePath)) {
    const raw = JSON.parse(readFileSync(filePath, "utf8"));
    const kp = Keypair.fromSecretKey(Uint8Array.from(raw));
    console.log(`  [LOADED]   ${name}: ${kp.publicKey.toBase58()}`);
    return kp;
  }
  const kp = Keypair.generate();
  writeFileSync(filePath, JSON.stringify(Array.from(kp.secretKey)), "utf8");
  console.log(`  [CREATED]  ${name}: ${kp.publicKey.toBase58()}`);
  return kp;
}

function toBase58PrivKey(kp) {
  const bs58Chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let num = 0n;
  for (const byte of kp.secretKey) {
    num = num * 256n + BigInt(byte);
  }
  let encoded = "";
  const base = 58n;
  while (num > 0n) {
    encoded = bs58Chars[Number(num % base)] + encoded;
    num /= base;
  }
  for (const byte of kp.secretKey) {
    if (byte === 0) encoded = "1" + encoded;
    else break;
  }
  return encoded;
}

mkdirSync(WALLETS_DIR, { recursive: true });

console.log("\n=== DiasporaConnect Wallet Generator ===\n");
console.log("Wallet files stored in: backend/wallets/\n");

const admin = loadOrCreate("admin");
const treasury = loadOrCreate("treasury");

console.log("\n─────────────────────────────────────────────────");
console.log("Public Keys (share these — safe to expose)");
console.log("─────────────────────────────────────────────────");
console.log(`ADMIN_PUBLIC_KEY    = ${admin.publicKey.toBase58()}`);
console.log(`TREASURY_PUBLIC_KEY = ${treasury.publicKey.toBase58()}`);

console.log("\n─────────────────────────────────────────────────");
console.log("Environment Variables (add to Replit Secrets)");
console.log("─────────────────────────────────────────────────");
console.log(`ADMIN_PRIVATE_KEY   = ${toBase58PrivKey(admin)}`);
console.log(`TREASURY_PUBLIC_KEY = ${treasury.publicKey.toBase58()}`);
console.log(`USDC_MINT_ADDRESS   = 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU`);
console.log(`SOLANA_RPC_URL      = https://api.devnet.solana.com`);
console.log(`SOLANA_PROGRAM_ID   = 5GHE14Zmpq5yNwpvHR2ZLaTcSckp6QogCRNm43M3Z9BT`);

console.log("\n─────────────────────────────────────────────────");
console.log("NEXT STEPS — Fund these wallets on Devnet");
console.log("─────────────────────────────────────────────────");
console.log(`1. Fund ADMIN wallet with SOL (for transaction fees):`);
console.log(`   solana airdrop 2 ${admin.publicKey.toBase58()} --url devnet`);
console.log(`   OR use https://faucet.solana.com\n`);
console.log(`2. Create USDC token account for Treasury and fund it:`);
console.log(`   spl-token create-account 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU \\`);
console.log(`     --owner ${treasury.publicKey.toBase58()} --url devnet`);
console.log(`   Then get devnet USDC from https://spl-token-faucet.com\n`);
console.log(`3. Update lib.rs TREASURY_AUTHORITY = "${treasury.publicKey.toBase58()}"`);
console.log(`   Then rebuild and redeploy the Anchor program.\n`);
console.log(`4. Set the env vars above in Replit Secrets, then restart Backend API.\n`);
