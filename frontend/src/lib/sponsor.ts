interface SponsorVoteRequest {
  sender: string;
  packageId: string;
  proposalId: string;
  choice: number;
}

interface SponsorVoteResponse {
  bytes: string;
  digest: string;
}

interface ExecuteRequest {
  digest: string;
  signature: string;
}

function assertBackendUrl(url: string) {
  if (!url) {
    throw new Error('Backend URL is not configured.');
  }
}

async function postJson<TPayload, TResult>(url: string, payload: TPayload): Promise<TResult> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const message = await res.text();
    throw new Error(`Backend call failed (${res.status}): ${message}`);
  }

  return res.json() as Promise<TResult>;
}

export async function requestSponsoredVote(backendUrl: string, body: SponsorVoteRequest) {
  assertBackendUrl(backendUrl);
  return postJson<SponsorVoteRequest, SponsorVoteResponse>(`${backendUrl}/api/sponsor-vote`, body);
}

export async function executeSponsoredTransaction(backendUrl: string, body: ExecuteRequest) {
  assertBackendUrl(backendUrl);
  return postJson<ExecuteRequest, { result: unknown }>(`${backendUrl}/api/execute-transaction`, body);
}
