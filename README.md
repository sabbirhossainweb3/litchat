# LitChat — LitVM LiteForge Messaging dApp

A premium dark/purple React + Vite starter for wallet-to-wallet public on-chain messaging on LitVM LiteForge (chain ID 4441).

## Important privacy warning
This sample stores the message text directly in public contract storage and emits it in a public event. Messages are public, permanent, and cannot be deleted. **Do not use this for private or sensitive messages.** For private messaging, implement audited end-to-end encryption and off-chain storage before production.

## 1. Requirements
- Node.js 20+ recommended
- MetaMask
- LitVM LiteForge testnet zkLTC for gas

Network settings from the LitVM docs:
- Network: `LitVM LiteForge`
- Chain ID: `4441` (`0x1159`)
- RPC: `https://liteforge.rpc.caldera.xyz/http`
- Currency: `zkLTC`
- Explorer: `https://liteforge.explorer.caldera.xyz`

Official guide: https://docs.litvm.com/get-started-on-testnet/add-to-wallet

## 2. Deploy the contract (Remix)
1. Open https://remix.ethereum.org/.
2. Create `LitChat.sol` and paste `contracts/LitChat.sol` into it.
3. In Solidity Compiler, choose compiler `0.8.24` or compatible `0.8.x`, compile.
4. In Deploy & Run Transactions, choose `Injected Provider - MetaMask`.
5. Switch MetaMask to LitVM LiteForge (chain ID 4441) and ensure you have testnet zkLTC for gas.
6. Select `LitChat`, click Deploy, and confirm in MetaMask.
7. Copy the newly deployed contract address. The old PulsePredict betting contract is not the messaging contract.

## 3. Configure and run the website
```bash
npm install
cp .env.example .env
```
Edit `.env` and set the deployed address:
```env
VITE_LITCHAT_CONTRACT_ADDRESS=0xYourNewDeployedLitChatAddress
```
Then run:
```bash
npm run dev
```
Open the local URL shown by Vite. Connect MetaMask, approve the network switch, and test with non-sensitive messages.

## 4. Deploy on Vercel
1. Upload this project to a new GitHub repository.
2. Import that repository into Vercel.
3. Set Build Command to `npm run build` and Output Directory to `dist` (Vercel should detect Vite automatically).
4. In Vercel Project Settings → Environment Variables, add `VITE_LITCHAT_CONTRACT_ADDRESS` with the deployed LitChat contract address.
5. Redeploy after adding the environment variable.

Do not add private keys or seed phrases to `.env`, GitHub, or Vercel. The app uses the user's browser wallet; no private key is needed in the website.

## Features
- Responsive premium black/purple UI
- MetaMask connect and network switch to chain ID 4441
- Send message to an EVM wallet address
- Read inbox/sent message IDs and retrieve message content from contract
- Explorer links and transaction confirmation feedback

## Limitations before production
- The contract's inbox/sent arrays grow without bound. The UI fetches only the latest 60 IDs for display, but contract calls return the full array. For a larger app, use event indexing / a subgraph or paginated contract design.
- Public content is not encrypted.
- This is a starter implementation, not audited. Test on testnet before real use.
- This app does not automatically deploy contracts or change your existing Vercel site; deploy the new contract and configure the frontend address first.
