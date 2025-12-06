import type { SuiEvent } from '@mysten/sui/client';
import { fromB64 } from '@mysten/sui/utils';
import { PACKAGE_ID, PROPOSAL_ID, APP_OPTIONS_FALLBACK, APP_QUESTION_FALLBACK } from '../../config';
import { client, votedEventType } from '../../lib/sui';
import type { ProposalData } from './types';

const hexRegex = /^[0-9a-fA-F]+$/;
const decoder = new TextDecoder();

const decodeBytes = (value: unknown): string => {
  if (typeof value === 'string') {
    const trimmed = value.startsWith('0x') ? value.slice(2) : value;
    const bytes = hexRegex.test(trimmed) ? hexToBytes(trimmed) : fromB64(value);
    return decoder.decode(bytes);
  }
  if (Array.isArray(value)) {
    return decoder.decode(Uint8Array.from(value as number[]));
  }
  return '';
};

const hexToBytes = (hex: string): Uint8Array => {
  const clean = hex.length % 2 === 0 ? hex : `0${hex}`;
  const len = clean.length / 2;
  const out = new Uint8Array(len);
  let i = 0;
  while (i < len) {
    out[i] = parseInt(clean.substr(i * 2, 2), 16);
    i = i + 1;
  }
  return out;
};

const parseCounts = (value: unknown): number[] => {
  if (Array.isArray(value)) {
    return (value as unknown[]).map((v) => Number(v));
  }
  return [];
};

type ProposalFields = {
  question: unknown;
  options: unknown;
  counts: unknown;
  voters: { fields: { id: { id: string } } };
};

export async function fetchProposal(proposalId = PROPOSAL_ID): Promise<ProposalData> {
  const { data } = await client.getObject({
    id: proposalId,
    options: { showContent: true },
  });

  const content = (data as any)?.content;
  const fields = (content as any)?.fields as ProposalFields | undefined;

  if (!content || !fields) {
    return {
      id: proposalId,
      question: APP_QUESTION_FALLBACK,
      options: APP_OPTIONS_FALLBACK,
      counts: new Array(APP_OPTIONS_FALLBACK.length).fill(0),
    };
  }

  const rawOptions = (fields.options as unknown[]) ?? [];
  const options = rawOptions.map(decodeBytes);
  const question = decodeBytes(fields.question);
  const counts = parseCounts(fields.counts);
  const votersTableId = fields.voters?.fields?.id?.id;

  return {
    id: proposalId,
    question: question || APP_QUESTION_FALLBACK,
    options: options.length ? options : APP_OPTIONS_FALLBACK,
    counts: counts.length ? counts : new Array(options.length || APP_OPTIONS_FALLBACK.length).fill(0),
    votersTableId,
  };
}

export async function fetchVotesForProposal(proposalId: string): Promise<SuiEvent[]> {
  if (!PACKAGE_ID) return [];
  const { data } = await client.queryEvents({
    query: { MoveEventType: votedEventType },
    limit: 200,
  });
  return data.filter((evt: SuiEvent) => {
    const fields = (evt.parsedJson ?? {}) as { proposal?: string };
    return fields.proposal === proposalId;
  });
}

export async function hasAddressVoted(proposalId: string, voter: string): Promise<boolean> {
  const events = await fetchVotesForProposal(proposalId);
  return events.some((evt) => {
    const fields = (evt.parsedJson ?? {}) as { proposal?: string; voter?: string };
    return fields.proposal === proposalId && fields.voter?.toLowerCase() === voter.toLowerCase();
  });
}
