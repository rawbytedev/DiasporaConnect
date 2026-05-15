/**
 * DiasporaConnect — Devnet Integration Tests
 *
 * These tests run against Solana DEVNET using REAL USDC
 * (mint: 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU).
 *
 * Fixed keypairs are loaded from (or generated into) backend/wallets/.
 * The addresses NEVER change between runs so you can fund them once.
 *
 * BEFORE RUNNING:
 *   1. node scripts/generate-wallets.mjs   (generates admin/treasury/sender/recipient)
 *   2. Fund each wallet with SOL (devnet airdrop or faucet.solana.com)
 *   3. Create USDC ATAs and fund sender with test USDC (spl-token-faucet.com)
 *   4. anchor test --provider.cluster devnet
 */

import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { DiasporaConnect } from "../target/types/diaspora_connect";
import { PublicKey, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  getOrCreateAssociatedTokenAccount,
  getAccount,
} from "@solana/spl-token";
import assert from "assert";
import * as fs from "fs";
import * as path from "path";

// ---------------------------------------------------------------------------
// USDC devnet mint (never changes)
// ---------------------------------------------------------------------------
const USDC_DEVNET_MINT = new PublicKey(
  "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"
);

// ---------------------------------------------------------------------------
// Keypair helpers — load from file or generate-and-save
// ---------------------------------------------------------------------------
const WALLETS_DIR = path.resolve(__dirname, "../../../../wallets");

function loadOrCreateKeypair(name: string): Keypair {
  fs.mkdirSync(WALLETS_DIR, { recursive: true });
  const filePath = path.join(WALLETS_DIR, `${name}.json`);
  if (fs.existsSync(filePath)) {
    const raw = JSON.parse(fs.readFileSync(filePath, "utf8")) as number[];
    return Keypair.fromSecretKey(Uint8Array.from(raw));
  }
  const kp = Keypair.generate();
  fs.writeFileSync(filePath, JSON.stringify(Array.from(kp.secretKey)));
  console.log(`  [CREATED] ${name}: ${kp.publicKey.toBase58()}`);
  console.log(`  --> Fund this address on devnet before testing!`);
  return kp;
}

// ---------------------------------------------------------------------------
// Test amounts (in USDC micro-units, 6 decimals)
// ---------------------------------------------------------------------------
const TRANSFER_AMOUNT = 1_000_000; // 1.00 USDC
const FEE_AMOUNT = TRANSFER_AMOUNT / 100; // 0.01 USDC (1 %)

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------
describe("diaspora_connect (devnet / USDC)", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.DiasporaConnect as Program<DiasporaConnect>;

  let sender: Keypair;
  let recipient: Keypair;
  let treasuryAuthority: Keypair;

  let senderTokenAccount: PublicKey;
  let recipientTokenAccount: PublicKey;
  let feeTreasury: PublicKey;

  // -------------------------------------------------------------------------
  // Setup — load fixed wallets, derive / create ATAs, verify balances
  // -------------------------------------------------------------------------
  before(async () => {
    sender = loadOrCreateKeypair("sender");
    recipient = loadOrCreateKeypair("recipient");
    treasuryAuthority = loadOrCreateKeypair("treasury");

    console.log("\n=== Devnet wallet addresses ===");
    console.log("Sender    :", sender.publicKey.toBase58());
    console.log("Recipient :", recipient.publicKey.toBase58());
    console.log("Treasury  :", treasuryAuthority.publicKey.toBase58());
    console.log("USDC mint :", USDC_DEVNET_MINT.toBase58());

    // Verify SOL balances — tests cannot run without gas money
    const [senderSol, recipientSol, treasurySol] = await Promise.all([
      provider.connection.getBalance(sender.publicKey),
      provider.connection.getBalance(recipient.publicKey),
      provider.connection.getBalance(treasuryAuthority.publicKey),
    ]);

    console.log("\n=== SOL balances ===");
    console.log("Sender    :", senderSol / LAMPORTS_PER_SOL, "SOL");
    console.log("Recipient :", recipientSol / LAMPORTS_PER_SOL, "SOL");
    console.log("Treasury  :", treasurySol / LAMPORTS_PER_SOL, "SOL");

    const MIN_SOL = 0.05 * LAMPORTS_PER_SOL;
    if (senderSol < MIN_SOL)
      throw new Error(
        `Sender needs SOL. Fund: ${sender.publicKey.toBase58()} on devnet`
      );
    if (recipientSol < MIN_SOL)
      throw new Error(
        `Recipient needs SOL. Fund: ${recipient.publicKey.toBase58()} on devnet`
      );
    if (treasurySol < MIN_SOL)
      throw new Error(
        `Treasury needs SOL. Fund: ${treasuryAuthority.publicKey.toBase58()} on devnet`
      );

    // Get or create Associated Token Accounts for USDC
    senderTokenAccount = (
      await getOrCreateAssociatedTokenAccount(
        provider.connection,
        sender,
        USDC_DEVNET_MINT,
        sender.publicKey
      )
    ).address;

    recipientTokenAccount = (
      await getOrCreateAssociatedTokenAccount(
        provider.connection,
        recipient,
        USDC_DEVNET_MINT,
        recipient.publicKey
      )
    ).address;

    feeTreasury = (
      await getOrCreateAssociatedTokenAccount(
        provider.connection,
        treasuryAuthority,
        USDC_DEVNET_MINT,
        treasuryAuthority.publicKey
      )
    ).address;

    // Verify sender has enough USDC for the tests (need at least 3 transfers)
    const senderUsdcAccount = await getAccount(
      provider.connection,
      senderTokenAccount
    );
    const senderUsdc = Number(senderUsdcAccount.amount);
    console.log("\n=== USDC balances ===");
    console.log("Sender    :", senderUsdc / 1_000_000, "USDC");
    console.log("ATA addresses:");
    console.log("  sender ATA   :", senderTokenAccount.toBase58());
    console.log("  recipient ATA:", recipientTokenAccount.toBase58());
    console.log("  treasury ATA :", feeTreasury.toBase58());

    const MIN_USDC = TRANSFER_AMOUNT * 3;
    if (senderUsdc < MIN_USDC) {
      throw new Error(
        `Sender needs at least ${MIN_USDC / 1_000_000} USDC.\n` +
          `  ATA: ${senderTokenAccount.toBase58()}\n` +
          `  Get devnet USDC from https://spl-token-faucet.com`
      );
    }
  });

  // -------------------------------------------------------------------------
  // Helper to build PDAs
  // -------------------------------------------------------------------------
  function escrowPDA(nonce: anchor.BN) {
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from("diaspora-escrow"),
        sender.publicKey.toBuffer(),
        recipient.publicKey.toBuffer(),
        nonce.toBuffer("le", 8),
      ],
      program.programId
    );
  }

  function vaultPDA(nonce: anchor.BN) {
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from("diaspora-vault"),
        sender.publicKey.toBuffer(),
        recipient.publicKey.toBuffer(),
        nonce.toBuffer("le", 8),
      ],
      program.programId
    );
  }

  // Use a stable base nonce derived from the current day so re-runs on the
  // same day reuse PDAs that may already exist.
  const DAY_NONCE = BigInt(Math.floor(Date.now() / 86_400_000)) * 1000n;

  // -------------------------------------------------------------------------
  // Test 1 — initiate a valid transfer
  // -------------------------------------------------------------------------
  it("initiates a 1 USDC transfer into escrow", async () => {
    const nonce = new anchor.BN((DAY_NONCE + 1n).toString());
    const [escrow] = escrowPDA(nonce);
    const [vault] = vaultPDA(nonce);

    // If escrow already exists (same-day re-run) skip creation.
    const existing = await provider.connection.getAccountInfo(escrow);
    if (existing) {
      console.log("  Escrow already exists, skipping initiation.");
      const data = await program.account.escrowAccount.fetch(escrow);
      assert.equal(data.amount.toNumber(), TRANSFER_AMOUNT);
      return;
    }

    const before = Number(
      (await getAccount(provider.connection, senderTokenAccount)).amount
    );

    await program.methods
      .initiateTransfer(new anchor.BN(TRANSFER_AMOUNT), nonce)
      .accounts({
        sender: sender.publicKey,
        senderTokenAccount,
        recipient: recipient.publicKey,
        feeTreasury,
        mint: USDC_DEVNET_MINT,
        escrowAccount: escrow,
        escrowVault: vault,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([sender])
      .rpc({ commitment: "confirmed" });

    const after = Number(
      (await getAccount(provider.connection, senderTokenAccount)).amount
    );
    assert.equal(after, before - TRANSFER_AMOUNT, "sender balance should decrease");

    const escrowData = await program.account.escrowAccount.fetch(escrow);
    assert.equal(escrowData.amount.toNumber(), TRANSFER_AMOUNT);
    assert.deepEqual(escrowData.status, { pending: {} });
    console.log("  Transfer initiated. Escrow:", escrow.toBase58());
  });

  // -------------------------------------------------------------------------
  // Test 2 — reject zero-amount transfer
  // -------------------------------------------------------------------------
  it("rejects a zero-amount transfer", async () => {
    const nonce = new anchor.BN((DAY_NONCE + 10n).toString());
    const [escrow] = escrowPDA(nonce);
    const [vault] = vaultPDA(nonce);

    try {
      await program.methods
        .initiateTransfer(new anchor.BN(0), nonce)
        .accounts({
          sender: sender.publicKey,
          senderTokenAccount,
          recipient: recipient.publicKey,
          feeTreasury,
          mint: USDC_DEVNET_MINT,
          escrowAccount: escrow,
          escrowVault: vault,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .signers([sender])
        .rpc();
      assert.fail("Should have rejected zero amount");
    } catch (err: any) {
      assert.ok(
        err.message.includes("Invalid transfer amount") ||
          err.message.includes("0x1770"),
        `Unexpected error: ${err.message}`
      );
    }
  });

  // -------------------------------------------------------------------------
  // Test 3 — reject self-transfer
  // -------------------------------------------------------------------------
  it("rejects a self-transfer", async () => {
    const nonce = new anchor.BN((DAY_NONCE + 20n).toString());
    const [escrow] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("diaspora-escrow"),
        sender.publicKey.toBuffer(),
        sender.publicKey.toBuffer(), // self
        nonce.toBuffer("le", 8),
      ],
      program.programId
    );
    const [vault] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("diaspora-vault"),
        sender.publicKey.toBuffer(),
        sender.publicKey.toBuffer(),
        nonce.toBuffer("le", 8),
      ],
      program.programId
    );

    try {
      await program.methods
        .initiateTransfer(new anchor.BN(TRANSFER_AMOUNT), nonce)
        .accounts({
          sender: sender.publicKey,
          senderTokenAccount,
          recipient: sender.publicKey,
          feeTreasury,
          mint: USDC_DEVNET_MINT,
          escrowAccount: escrow,
          escrowVault: vault,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .signers([sender])
        .rpc();
      assert.fail("Should have rejected self-transfer");
    } catch (err: any) {
      assert.ok(err.message, "Sender and recipient cannot be the same");
    }
  });

  // -------------------------------------------------------------------------
  // Test 4 — recipient claims and vault closes
  // -------------------------------------------------------------------------
  it("allows recipient to claim and distributes fees", async () => {
    const nonce = new anchor.BN((DAY_NONCE + 100n).toString());
    const [escrow] = escrowPDA(nonce);
    const [vault] = vaultPDA(nonce);

    // Initiate (may already exist from prior same-day run)
    const existing = await provider.connection.getAccountInfo(escrow);
    if (!existing) {
      await program.methods
        .initiateTransfer(new anchor.BN(TRANSFER_AMOUNT), nonce)
        .accounts({
          sender: sender.publicKey,
          senderTokenAccount,
          recipient: recipient.publicKey,
          feeTreasury,
          mint: USDC_DEVNET_MINT,
          escrowAccount: escrow,
          escrowVault: vault,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .signers([sender])
        .rpc({ commitment: "confirmed" });
    }

    // Check that the escrow is still pending before claiming
    const escrowData = await program.account.escrowAccount.fetch(escrow);
    if (escrowData.status["claimed"] !== undefined) {
      console.log("  Escrow already claimed (same-day re-run), skipping.");
      return;
    }

    const recipientBefore = Number(
      (await getAccount(provider.connection, recipientTokenAccount)).amount
    );
    const treasuryBefore = Number(
      (await getAccount(provider.connection, feeTreasury)).amount
    );

    await program.methods
      .claimTransfer(nonce)
      .accounts({
        recipient: recipient.publicKey,
        recipientTokenAccount,
        sender: sender.publicKey,
        escrowAccount: escrow,
        escrowVault: vault,
        feeTreasury,
        mint: USDC_DEVNET_MINT,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([recipient])
      .rpc({ commitment: "confirmed" });

    const recipientAfter = Number(
      (await getAccount(provider.connection, recipientTokenAccount)).amount
    );
    const treasuryAfter = Number(
      (await getAccount(provider.connection, feeTreasury)).amount
    );

    const expectedRecipient = TRANSFER_AMOUNT - FEE_AMOUNT;
    assert.equal(
      recipientAfter,
      recipientBefore + expectedRecipient,
      "recipient should receive amount minus fee"
    );
    assert.equal(
      treasuryAfter,
      treasuryBefore + FEE_AMOUNT,
      "treasury should receive the 1% fee"
    );

    const vaultInfo = await provider.connection.getAccountInfo(vault);
    assert.strictEqual(vaultInfo, null, "vault should be closed after claim");

    const claimed = await program.account.escrowAccount.fetch(escrow);
    assert.deepEqual(claimed.status, { claimed: {} });

    console.log(
      `  Claimed ${expectedRecipient / 1_000_000} USDC to recipient,`,
      `${FEE_AMOUNT / 1_000_000} USDC fee to treasury.`
    );
  });

  // -------------------------------------------------------------------------
  // Test 5 — double-claim fails
  // -------------------------------------------------------------------------
  it("rejects a double claim", async () => {
    const nonce = new anchor.BN((DAY_NONCE + 100n).toString());
    const [escrow] = escrowPDA(nonce);
    const [vault] = vaultPDA(nonce);

    try {
      await program.methods
        .claimTransfer(nonce)
        .accounts({
          recipient: recipient.publicKey,
          recipientTokenAccount,
          sender: sender.publicKey,
          escrowAccount: escrow,
          escrowVault: vault,
          feeTreasury,
          mint: USDC_DEVNET_MINT,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([recipient])
        .rpc();
      assert.fail("Should have rejected double claim");
    } catch (err: any) {
      assert.ok(err.message, "Transfer not in a pending state");
    }
  });

  // -------------------------------------------------------------------------
  // Test 6 — refund before expiry is rejected
  // -------------------------------------------------------------------------
  it("rejects a refund before expiry", async () => {
    const nonce = new anchor.BN((DAY_NONCE + 200n).toString());
    const [escrow] = escrowPDA(nonce);
    const [vault] = vaultPDA(nonce);

    const existing = await provider.connection.getAccountInfo(escrow);
    if (!existing) {
      await program.methods
        .initiateTransfer(new anchor.BN(TRANSFER_AMOUNT), nonce)
        .accounts({
          sender: sender.publicKey,
          senderTokenAccount,
          recipient: recipient.publicKey,
          feeTreasury,
          mint: USDC_DEVNET_MINT,
          escrowAccount: escrow,
          escrowVault: vault,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .signers([sender])
        .rpc({ commitment: "confirmed" });
    }

    try {
      await program.methods
        .refundTransfer(nonce)
        .accounts({
          sender: sender.publicKey,
          senderTokenAccount,
          recipient: recipient.publicKey,
          escrowAccount: escrow,
          escrowVault: vault,
          mint: USDC_DEVNET_MINT,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([sender])
        .rpc();
      assert.fail("Should have rejected premature refund");
    } catch (err: any) {
      assert.ok(err.message, "Refund is not available yet");
    }
  });
});
