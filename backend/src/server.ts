import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { EnokiClient } from '@mysten/enoki';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { toBase64 } from '@mysten/sui/utils';
import { buildVoteTransaction } from './buildVoteTransaction';

dotenv.config();

const PORT = process.env.PORT || 3001;
const ENOKI_PRIVATE_KEY = process.env.ENOKI_PRIVATE_KEY;
const SUI_NETWORK = (process.env.SUI_NETWORK ?? 'testnet') as 'testnet' | 'mainnet' | 'devnet';
const FULLNODE_URL =
    process.env.FULLNODE_URL && process.env.FULLNODE_URL.trim().length > 0
        ? process.env.FULLNODE_URL
        : getFullnodeUrl(SUI_NETWORK);

if (!ENOKI_PRIVATE_KEY) {
    throw new Error('ENOKI_PRIVATE_KEY must be set in the backend environment');
}

const app = express();
app.use(cors());
app.use(express.json());

const suiClient = new SuiClient({ url: FULLNODE_URL });
const enokiClient = new EnokiClient({ apiKey: ENOKI_PRIVATE_KEY });

app.get('/health', (_req, res) => {
    res.json({ status: 'ok', network: SUI_NETWORK });
});

app.post('/api/sponsor-vote', async (req, res) => {
    try {
        console.log('Received sponsor vote request:', req.body);
        const { sender, packageId, proposalId, choice } = req.body as {
            sender: string;
            packageId: string;
            proposalId: string;
            choice: number;
        };

        if (!sender || !packageId || !proposalId || typeof choice !== 'number') {
            res.status(400).json({ error: 'sender, packageId, proposalId, and choice are required' });
            return;
        }

        const tx = buildVoteTransaction(packageId, proposalId, choice);
        const txBytes = await tx.build({ client: suiClient, onlyTransactionKind: true });

        const sponsored = await enokiClient.createSponsoredTransaction({
            network: SUI_NETWORK,
            transactionKindBytes: toBase64(txBytes),
            sender,
            allowedMoveCallTargets: [`${packageId}::voting::vote`],
            allowedAddresses: [sender],
        });

        res.json({ bytes: sponsored.bytes, digest: sponsored.digest });
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        res.status(500).json({ error: `Failed to sponsor vote transaction: ${message}` });
    }
});

app.post('/api/execute-transaction', async (req, res) => {
    try {
        const { digest, signature } = req.body as { digest: string; signature: string };

        if (!digest || !signature) {
            res.status(400).json({ error: 'digest and signature are required' });
            return;
        }

        const result = await enokiClient.executeSponsoredTransaction({ digest, signature });
        res.json({ result });
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        res.status(500).json({ error: `Failed to execute sponsored transaction: ${message}` });
    }
});

app.listen(PORT, () => {
    console.log(`Sponsor backend listening on port ${PORT}, network ${SUI_NETWORK}`);
});
