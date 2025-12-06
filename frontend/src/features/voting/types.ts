export type ProposalData = {
  id: string;
  question: string;
  options: string[];
  counts: number[];
  votersTableId?: string;
};

export type VoteResult = {
  digest: string;
};
