import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { MySplToken } from "../target/types/my_spl_token";
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress, createAssociatedTokenAccountInstruction } from "@solana/spl-token";

describe("my-spl-token", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.MySplToken as Program<MySplToken>;

  const mintKeypair = anchor.web3.Keypair.generate();

  it("Initialize the mint", async () => {
    await program.methods
      .initializeMint(6)
      .accounts({
        mint: mintKeypair.publicKey,
        authority: provider.wallet.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([mintKeypair])
      .rpc();

    console.log("✅ Mint created:", mintKeypair.publicKey.toBase58());
  });

  it("Mint tokens", async () => {
    const associatedTokenAccount = await getAssociatedTokenAddress(
      mintKeypair.publicKey,
      provider.wallet.publicKey
    );

    const tx = new anchor.web3.Transaction().add(
      createAssociatedTokenAccountInstruction(
        provider.wallet.publicKey,
        associatedTokenAccount,
        provider.wallet.publicKey,
        mintKeypair.publicKey
      )
    );
    await provider.sendAndConfirm(tx);

    await program.methods
      .mintTokens(new anchor.BN(1_000_000_000)) // 1000 tokens si 6 décimales
      .accounts({
        mint: mintKeypair.publicKey,
        destination: associatedTokenAccount,
        authority: provider.wallet.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    console.log("✅ Tokens minted!");
  });
});
