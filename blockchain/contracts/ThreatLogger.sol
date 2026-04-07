// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title  ThreatLogger
 * @notice Immutable on-chain log for AI-detected cyber threats.
 *         Each entry stores an event ID, SHA-256 payload hash,
 *         threat level, and block timestamp.
 */
contract ThreatLogger {

    // ─────────────────────── Events ───────────────────────
    event ThreatLogged(
        uint256 indexed id,
        string  eventId,
        string  payloadHash,
        string  threatLevel,
        uint256 timestamp
    );

    // ─────────────────────── Storage ──────────────────────
    struct ThreatRecord {
        uint256 id;
        string  eventId;
        string  payloadHash;
        string  threatLevel;   // "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
        uint256 timestamp;
        address reporter;
    }

    ThreatRecord[] private threats;
    mapping(string => uint256) private eventIndex; // eventId → array index + 1
    address public owner;

    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    // ─────────────────────── Write ────────────────────────

    /**
     * @notice Log a detected threat on-chain.
     * @param eventId     Unique UUID from the AI detection engine.
     * @param payloadHash SHA-256 of the original traffic payload.
     * @param threatLevel Severity string.
     * @return id         The sequential threat ID.
     */
    function logThreat(
        string memory eventId,
        string memory payloadHash,
        string memory threatLevel
    ) public returns (uint256) {
        require(bytes(eventId).length > 0,     "eventId required");
        require(bytes(payloadHash).length > 0, "payloadHash required");
        require(eventIndex[eventId] == 0,      "Event already logged");

        uint256 id = threats.length + 1;

        threats.push(ThreatRecord({
            id:          id,
            eventId:     eventId,
            payloadHash: payloadHash,
            threatLevel: threatLevel,
            timestamp:   block.timestamp,
            reporter:    msg.sender
        }));

        eventIndex[eventId] = id;

        emit ThreatLogged(id, eventId, payloadHash, threatLevel, block.timestamp);
        return id;
    }

    // ─────────────────────── Read ─────────────────────────

    function getThreat(uint256 id) public view returns (
        string memory eventId,
        string memory payloadHash,
        string memory threatLevel,
        uint256       timestamp
    ) {
        require(id > 0 && id <= threats.length, "Invalid ID");
        ThreatRecord storage r = threats[id - 1];
        return (r.eventId, r.payloadHash, r.threatLevel, r.timestamp);
    }

    function getThreatByEventId(string memory eventId) public view returns (
        uint256 id,
        string memory payloadHash,
        string memory threatLevel,
        uint256       timestamp
    ) {
        uint256 idx = eventIndex[eventId];
        require(idx != 0, "Event not found");
        ThreatRecord storage r = threats[idx - 1];
        return (r.id, r.payloadHash, r.threatLevel, r.timestamp);
    }

    function getThreatCount() public view returns (uint256) {
        return threats.length;
    }

    /**
     * @notice Verify a payload hash matches the stored record.
     */
    function verifyPayload(string memory eventId, string memory payloadHash)
        public view returns (bool)
    {
        uint256 idx = eventIndex[eventId];
        if (idx == 0) return false;
        return keccak256(bytes(threats[idx - 1].payloadHash)) ==
               keccak256(bytes(payloadHash));
    }
}
