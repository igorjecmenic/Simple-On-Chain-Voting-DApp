module voting::voting;

use sui::event;
use sui::table::{Self, Table};

///use sui::vector;

const EInvalidChoice: u64 = 1;
const EAlreadyVoted: u64 = 2;
const ENoOptions: u64 = 3;

/// Stores one proposal with options and vote counts.
public struct Proposal has key {
    id: object::UID,
    question: vector<u8>,
    options: vector<vector<u8>>,
    counts: vector<u64>,
    voters: Table<address, bool>,
}

/// Emitted when a proposal is created.
public struct ProposalCreated has copy, drop, store {
    proposal: address,
    options: u64,
}

/// Emitted on each vote.
public struct Voted has copy, drop, store {
    proposal: address,
    voter: address,
    choice: u64,
}

/// Creates a proposal with the provided question and options.
/// Requires at least two options to be meaningful.
public fun create(
    question: vector<u8>,
    options: vector<vector<u8>>,
    ctx: &mut tx_context::TxContext,
): Proposal {
    let option_len = vector::length(&options);
    if (option_len < 2) {
        abort ENoOptions
    };
    let mut counts = vector::empty<u64>();
    let mut i = 0;
    while (i < option_len) {
        vector::push_back(&mut counts, 0);
        i = i + 1;
    };
    let voters = table::new<address, bool>(ctx);
    let proposal = Proposal {
        id: object::new(ctx),
        question,
        options,
        counts,
        voters,
    };

    let proposal_addr = object::uid_to_address(&proposal.id);
    event::emit(ProposalCreated { proposal: proposal_addr, options: option_len });
    proposal
}

/// Convenience entry to create and immediately share a proposal so anyone can vote.
#[allow(lint(public_entry))]
public entry fun create_shared(
    question: vector<u8>,
    options: vector<vector<u8>>,
    ctx: &mut tx_context::TxContext,
) {
    let proposal = create(question, options, ctx);
    transfer::share_object(proposal);
}

/// Casts a vote for the given choice index.
/// Enforces one vote per address and validates choice boundaries.
#[allow(lint(public_entry))]
public entry fun vote(proposal: &mut Proposal, choice: u64, ctx: &mut tx_context::TxContext) {
    let sender = tx_context::sender(ctx);
    if (table::contains(&proposal.voters, sender)) {
        abort EAlreadyVoted
    };
    let total_options = vector::length(&proposal.counts);
    if (choice >= total_options) {
        abort EInvalidChoice
    };
    let count_ref = vector::borrow_mut(&mut proposal.counts, choice);
    *count_ref = *count_ref + 1;

    table::add(&mut proposal.voters, sender, true);
    let proposal_addr = object::uid_to_address(&proposal.id);
    event::emit(Voted { proposal: proposal_addr, voter: sender, choice: choice });
}

/// Returns the number of options.
public fun options_len(proposal: &Proposal): u64 {
    vector::length(&proposal.options)
}

/// View helper exposing counts.
public fun counts(proposal: &Proposal): &vector<u64> {
    &proposal.counts
}

/// View helper exposing option labels.
public fun options(proposal: &Proposal): &vector<vector<u8>> {
    &proposal.options
}

#[test_only]
public fun destroy_for_testing(proposal: Proposal) {
    let Proposal { id, question: _, options: _, counts: _, voters } = proposal;
    table::drop(voters);
    object::delete(id);
}
