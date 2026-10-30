// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title FreelanceMilestoneEscrow
 * @notice Multi-milestone escrow smart contract for freelance agreements.
 * @dev Enforces explicit state machines, role-based access control, pull-over-push
 *      withdrawal accounting, basis-point dispute resolution, and invariant preservation:
 *      address(this).balance == totalReserved + sum(withdrawable[user])
 */
contract FreelanceMilestoneEscrow is ReentrancyGuard {
    // --- State Machine Enums ---
    enum AgreementState {
        Unfunded,
        Active,
        Completed,
        Cancelled
    }

    enum MilestoneState {
        Pending,
        Submitted,
        Released,
        Disputed,
        Resolved,
        Refunded
    }

    // --- Data Structures ---
    struct Milestone {
        string title;
        uint256 amount;
        uint256 deadline;
        MilestoneState state;
        string submissionNote;
        uint256 freelancerShare;
        uint256 clientRefund;
    }

    // --- Immutables & Roles ---
    address public immutable client;
    address public immutable freelancer;
    address public immutable arbitrator;
    string public title;

    // --- Agreement State ---
    AgreementState public agreementState;
    uint256 public totalRequired;
    uint256 public totalReserved;
    uint256 public totalCredited;
    uint256 public totalWithdrawn;

    // Pull-over-push withdrawal balances
    mapping(address => uint256) public withdrawable;

    // Milestones storage
    Milestone[] private milestones;

    // --- Events ---
    event AgreementCreated(
        address indexed escrowAddress,
        address indexed client,
        address indexed freelancer,
        address arbitrator,
        string title,
        uint256 totalAmount,
        uint256 milestoneCount
    );

    event FundingReceived(
        address indexed client,
        uint256 amount,
        uint256 timestamp
    );

    event MilestoneSubmitted(
        uint256 indexed index,
        string note,
        uint256 timestamp
    );

    event MilestoneReleased(
        uint256 indexed index,
        uint256 amount,
        address indexed freelancer,
        uint256 timestamp
    );

    event DisputeRaised(
        uint256 indexed index,
        address indexed raisedBy,
        uint256 timestamp
    );

    event DisputeResolved(
        uint256 indexed index,
        address indexed arbitrator,
        uint256 freelancerShareBps,
        uint256 freelancerAmount,
        uint256 clientRefundAmount,
        uint256 timestamp
    );

    event MilestoneRefunded(
        uint256 indexed index,
        uint256 amount,
        address indexed client,
        uint256 timestamp
    );

    event Withdrawal(
        address indexed recipient,
        uint256 amount,
        uint256 timestamp
    );

    event AgreementCompleted(uint256 timestamp);

    // --- Modifiers ---
    modifier onlyClient() {
        require(msg.sender == client, "FreelanceMilestoneEscrow: caller is not client");
        _;
    }

    modifier onlyFreelancer() {
        require(msg.sender == freelancer, "FreelanceMilestoneEscrow: caller is not freelancer");
        _;
    }

    modifier onlyArbitrator() {
        require(msg.sender == arbitrator, "FreelanceMilestoneEscrow: caller is not arbitrator");
        _;
    }

    modifier onlyParticipant() {
        require(
            msg.sender == client || msg.sender == freelancer,
            "FreelanceMilestoneEscrow: caller is not client or freelancer"
        );
        _;
    }

    modifier inAgreementState(AgreementState expected) {
        require(agreementState == expected, "FreelanceMilestoneEscrow: invalid agreement state");
        _;
    }

    /**
     * @notice Constructor initializes the escrow agreement and milestone parameters.
     * @param _client Address of the client depositing funds.
     * @param _freelancer Address of the freelancer performing milestones.
     * @param _arbitrator Address of designated arbitrator for disputes.
     * @param _title Title of the freelance agreement.
     * @param _milestoneTitles Array of milestone title strings.
     * @param _milestoneAmounts Array of milestone amounts in wei.
     * @param _milestoneDeadlines Array of Unix deadline timestamps.
     */
    constructor(
        address _client,
        address _freelancer,
        address _arbitrator,
        string memory _title,
        string[] memory _milestoneTitles,
        uint256[] memory _milestoneAmounts,
        uint256[] memory _milestoneDeadlines
    ) {
        require(_client != address(0), "FreelanceMilestoneEscrow: client cannot be zero address");
        require(_freelancer != address(0), "FreelanceMilestoneEscrow: freelancer cannot be zero address");
        require(_arbitrator != address(0), "FreelanceMilestoneEscrow: arbitrator cannot be zero address");

        // Distinct roles requirement
        require(_client != _freelancer, "FreelanceMilestoneEscrow: client and freelancer must differ");
        require(_client != _arbitrator, "FreelanceMilestoneEscrow: client and arbitrator must differ");
        require(_freelancer != _arbitrator, "FreelanceMilestoneEscrow: freelancer and arbitrator must differ");

        uint256 count = _milestoneTitles.length;
        require(count > 0, "FreelanceMilestoneEscrow: must have at least one milestone");
        require(count <= 10, "FreelanceMilestoneEscrow: milestone count exceeds max 10");
        require(
            _milestoneAmounts.length == count && _milestoneDeadlines.length == count,
            "FreelanceMilestoneEscrow: array lengths mismatch"
        );

        client = _client;
        freelancer = _freelancer;
        arbitrator = _arbitrator;
        title = _title;
        agreementState = AgreementState.Unfunded;

        uint256 sum = 0;
        for (uint256 i = 0; i < count; i++) {
            require(_milestoneAmounts[i] > 0, "FreelanceMilestoneEscrow: milestone amount must be > 0");
            require(
                _milestoneDeadlines[i] > block.timestamp,
                "FreelanceMilestoneEscrow: deadline must be in future"
            );

            milestones.push(
                Milestone({
                    title: _milestoneTitles[i],
                    amount: _milestoneAmounts[i],
                    deadline: _milestoneDeadlines[i],
                    state: MilestoneState.Pending,
                    submissionNote: "",
                    freelancerShare: 0,
                    clientRefund: 0
                })
            );

            sum += _milestoneAmounts[i];
        }

        totalRequired = sum;
    }

    /**
     * @notice Funds the agreement with exact total milestone sum.
     */
    function fundAgreement() external payable onlyClient inAgreementState(AgreementState.Unfunded) {
        require(msg.value == totalRequired, "FreelanceMilestoneEscrow: funding amount must exactly match totalRequired");

        agreementState = AgreementState.Active;
        totalReserved = msg.value;

        emit FundingReceived(msg.sender, msg.value, block.timestamp);
    }

    /**
     * @notice Freelancer submits work for a pending milestone.
     */
    function submitMilestone(uint256 index, string calldata note)
        external
        onlyFreelancer
        inAgreementState(AgreementState.Active)
    {
        require(index < milestones.length, "FreelanceMilestoneEscrow: invalid milestone index");
        Milestone storage m = milestones[index];
        require(m.state == MilestoneState.Pending, "FreelanceMilestoneEscrow: milestone not in Pending state");
        require(block.timestamp <= m.deadline, "FreelanceMilestoneEscrow: submission deadline passed");
        require(bytes(note).length <= 256, "FreelanceMilestoneEscrow: submission note exceeds 256 chars");

        m.state = MilestoneState.Submitted;
        m.submissionNote = note;

        emit MilestoneSubmitted(index, note, block.timestamp);
    }

    /**
     * @notice Client approves a submitted milestone, crediting the freelancer's withdrawable balance.
     * @dev Pull-over-push model: does NOT transfer ETH directly, increments withdrawable[freelancer].
     */
    function approveMilestone(uint256 index)
        external
        onlyClient
        inAgreementState(AgreementState.Active)
    {
        require(index < milestones.length, "FreelanceMilestoneEscrow: invalid milestone index");
        Milestone storage m = milestones[index];
        require(m.state == MilestoneState.Submitted, "FreelanceMilestoneEscrow: milestone not in Submitted state");

        // Checks-Effects
        m.state = MilestoneState.Released;
        m.freelancerShare = m.amount;
        m.clientRefund = 0;

        totalReserved -= m.amount;
        withdrawable[freelancer] += m.amount;
        totalCredited += m.amount;

        emit MilestoneReleased(index, m.amount, freelancer, block.timestamp);

        _checkAndSetCompletion();
    }

    /**
     * @notice Client can raise a dispute on a submitted milestone to escalate to the arbitrator.
     */
    function raiseDispute(uint256 index)
        external
        onlyClient
        inAgreementState(AgreementState.Active)
    {
        require(index < milestones.length, "FreelanceMilestoneEscrow: invalid milestone index");
        Milestone storage m = milestones[index];
        require(m.state == MilestoneState.Submitted, "FreelanceMilestoneEscrow: can only dispute Submitted milestone");

        m.state = MilestoneState.Disputed;

        emit DisputeRaised(index, msg.sender, block.timestamp);
    }

    /**
     * @notice Arbitrator allocates disputed milestone amount between freelancer and client in basis points.
     * @param index Milestone index.
     * @param freelancerShareBps Share allocated to freelancer in basis points (0 to 10,000).
     */
    function resolveDispute(uint256 index, uint256 freelancerShareBps)
        external
        onlyArbitrator
        inAgreementState(AgreementState.Active)
    {
        require(index < milestones.length, "FreelanceMilestoneEscrow: invalid milestone index");
        require(freelancerShareBps <= 10000, "FreelanceMilestoneEscrow: basis points must be <= 10000");

        Milestone storage m = milestones[index];
        require(m.state == MilestoneState.Disputed, "FreelanceMilestoneEscrow: milestone is not in Disputed state");

        // Integer arithmetic with remainder assigned to client to avoid rounding loss
        uint256 fShare = (m.amount * freelancerShareBps) / 10000;
        uint256 cRefund = m.amount - fShare;

        m.state = MilestoneState.Resolved;
        m.freelancerShare = fShare;
        m.clientRefund = cRefund;

        totalReserved -= m.amount;

        if (fShare > 0) {
            withdrawable[freelancer] += fShare;
            totalCredited += fShare;
        }
        if (cRefund > 0) {
            withdrawable[client] += cRefund;
            totalCredited += cRefund;
        }

        emit DisputeResolved(index, msg.sender, freelancerShareBps, fShare, cRefund, block.timestamp);

        _checkAndSetCompletion();
    }

    /**
     * @notice Client cancels an eligible unstarted (Pending) milestone and receives a withdrawable refund.
     */
    function refundMilestone(uint256 index)
        external
        onlyClient
        inAgreementState(AgreementState.Active)
    {
        require(index < milestones.length, "FreelanceMilestoneEscrow: invalid milestone index");
        Milestone storage m = milestones[index];
        require(m.state == MilestoneState.Pending, "FreelanceMilestoneEscrow: can only refund Pending milestone");

        m.state = MilestoneState.Refunded;
        m.freelancerShare = 0;
        m.clientRefund = m.amount;

        totalReserved -= m.amount;
        withdrawable[client] += m.amount;
        totalCredited += m.amount;

        emit MilestoneRefunded(index, m.amount, client, block.timestamp);

        _checkAndSetCompletion();
    }

    /**
     * @notice Participant withdraws their credited balance.
     * @dev Checks-Effects-Interactions pattern with ReentrancyGuard.
     */
    function withdraw() external nonReentrant {
        uint256 amount = withdrawable[msg.sender];
        require(amount > 0, "FreelanceMilestoneEscrow: no withdrawable balance");

        // Effects before interaction
        withdrawable[msg.sender] = 0;
        totalWithdrawn += amount;

        // Interaction
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "FreelanceMilestoneEscrow: withdrawal transfer failed");

        emit Withdrawal(msg.sender, amount, block.timestamp);
    }

    /**
     * @dev Internal check to transition agreement to Completed when all milestones reach terminal state.
     */
    function _checkAndSetCompletion() internal {
        if (totalReserved == 0) {
            bool allTerminal = true;
            for (uint256 i = 0; i < milestones.length; i++) {
                MilestoneState s = milestones[i].state;
                if (
                    s != MilestoneState.Released &&
                    s != MilestoneState.Resolved &&
                    s != MilestoneState.Refunded
                ) {
                    allTerminal = false;
                    break;
                }
            }
            if (allTerminal) {
                agreementState = AgreementState.Completed;
                emit AgreementCompleted(block.timestamp);
            }
        }
    }

    // --- View Functions ---

    function getMilestonesCount() external view returns (uint256) {
        return milestones.length;
    }

    function getMilestone(uint256 index)
        external
        view
        returns (
            string memory title_,
            uint256 amount_,
            uint256 deadline_,
            MilestoneState state_,
            string memory submissionNote_,
            uint256 freelancerShare_,
            uint256 clientRefund_
        )
    {
        require(index < milestones.length, "FreelanceMilestoneEscrow: invalid milestone index");
        Milestone storage m = milestones[index];
        return (
            m.title,
            m.amount,
            m.deadline,
            m.state,
            m.submissionNote,
            m.freelancerShare,
            m.clientRefund
        );
    }

    /**
     * @notice Verifies the core financial invariant:
     * address(this).balance == totalReserved + withdrawable[client] + withdrawable[freelancer]
     */
    function verifyAccountingInvariant() external view returns (bool isHolding, uint256 currentBalance, uint256 liabilities) {
        currentBalance = address(this).balance;
        liabilities = totalReserved + withdrawable[client] + withdrawable[freelancer];
        isHolding = (currentBalance == liabilities);
    }

    receive() external payable {
        revert("FreelanceMilestoneEscrow: direct deposits not accepted");
    }
}
