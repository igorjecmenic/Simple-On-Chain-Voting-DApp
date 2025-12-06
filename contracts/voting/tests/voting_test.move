module voting::voting_test;

use voting::voting;

#[test]
fun vote_increments_counts() {
    let mut ctx = tx_context::dummy();
    let mut proposal = voting::create(
        b"Which feature ships next?",
        vector[b"Option A", b"Option B", b"Option C"],
        &mut ctx,
    );
    assert!(voting::options_len(&proposal) == 3, 0);

    voting::vote(&mut proposal, 1, &mut ctx);

    let counts = voting::counts(&proposal);
    assert!(*vector::borrow(counts, 1) == 1, 1);
    assert!(*vector::borrow(counts, 0) == 0, 2);

    voting::destroy_for_testing(proposal);
}

#[test, expected_failure(abort_code = voting::EAlreadyVoted)]
fun double_vote_aborts() {
    let mut ctx = tx_context::dummy();
    let mut proposal = voting::create(
        b"Only one vote per address",
        vector[b"Yes", b"No"],
        &mut ctx,
    );
    voting::vote(&mut proposal, 0, &mut ctx);
    voting::vote(&mut proposal, 1, &mut ctx);

    voting::destroy_for_testing(proposal);
}

#[test, expected_failure(abort_code = voting::EInvalidChoice)]
fun invalid_choice_aborts() {
    let mut ctx = tx_context::dummy();
    let mut proposal = voting::create(b"Pick", vector[b"X", b"Y"], &mut ctx);
    voting::vote(&mut proposal, 5, &mut ctx);

    voting::destroy_for_testing(proposal);
}
