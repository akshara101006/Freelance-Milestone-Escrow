// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "./FreelanceMilestoneEscrow.sol";

/**
 * @title EscrowFactory
 * @notice Factory for deploying and tracking independent FreelanceMilestoneEscrow instances.
 * @dev Does NOT hold escrow funds and has no backdoor withdrawal permissions.
 */
contract EscrowFactory {
    struct AgreementInfo {
        address escrowAddress;
        address client;
        address freelancer;
        address arbitrator;
        string title;
        uint256 totalAmount;
        uint256 createdAt;
    }

    address[] public allEscrows;
    mapping(address => address[]) private clientEscrows;
    mapping(address => address[]) private freelancerEscrows;
    mapping(address => AgreementInfo) public escrowDetails;

    event AgreementCreated(
        address indexed escrowAddress,
        address indexed client,
        address indexed freelancer,
        address arbitrator,
        string title,
        uint256 totalAmount,
        uint256 milestoneCount,
        uint256 timestamp
    );

    /**
     * @notice Deploys a new FreelanceMilestoneEscrow contract instance.
     */
    function createAgreement(
        address _freelancer,
        address _arbitrator,
        string memory _title,
        string[] memory _milestoneTitles,
        uint256[] memory _milestoneAmounts,
        uint256[] memory _milestoneDeadlines
    ) external returns (address escrowAddress) {
        FreelanceMilestoneEscrow escrow = new FreelanceMilestoneEscrow(
            msg.sender,
            _freelancer,
            _arbitrator,
            _title,
            _milestoneTitles,
            _milestoneAmounts,
            _milestoneDeadlines
        );

        escrowAddress = address(escrow);
        allEscrows.push(escrowAddress);
        clientEscrows[msg.sender].push(escrowAddress);
        freelancerEscrows[_freelancer].push(escrowAddress);

        uint256 totalAmount = escrow.totalRequired();

        escrowDetails[escrowAddress] = AgreementInfo({
            escrowAddress: escrowAddress,
            client: msg.sender,
            freelancer: _freelancer,
            arbitrator: _arbitrator,
            title: _title,
            totalAmount: totalAmount,
            createdAt: block.timestamp
        });

        emit AgreementCreated(
            escrowAddress,
            msg.sender,
            _freelancer,
            _arbitrator,
            _title,
            totalAmount,
            _milestoneTitles.length,
            block.timestamp
        );
    }

    function getEscrowCount() external view returns (uint256) {
        return allEscrows.length;
    }

    function getAllEscrows() external view returns (address[] memory) {
        return allEscrows;
    }

    function getEscrowsForClient(address _client) external view returns (address[] memory) {
        return clientEscrows[_client];
    }

    function getEscrowsForFreelancer(address _freelancer) external view returns (address[] memory) {
        return freelancerEscrows[_freelancer];
    }
}
