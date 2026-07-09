// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract LogAnchor {
    uint256 public constant MAX_BATCH_SIZE = 25;

    struct LogRecord {
        bytes32 logHash;
        bytes32 metadataHash;
        uint64 clientTimestamp;
        uint64 anchoredAt;
        address submitter;
        bool exists;
    }

    mapping(bytes32 => LogRecord) private records;
    mapping(bytes32 => bool) public isHashAnchored;

    error EmptyValue();
    error RecordAlreadyExists(bytes32 recordId);
    error RecordNotFound(bytes32 recordId);
    error InvalidBatchLengths();
    error BatchTooLarge(uint256 submitted, uint256 maximum);

    event LogAnchored(
        bytes32 indexed recordId,
        bytes32 indexed logHash,
        bytes32 indexed metadataHash,
        uint64 clientTimestamp,
        uint64 anchoredAt,
        address submitter
    );

    function anchorLog(
        bytes32 recordId,
        bytes32 logHash,
        bytes32 metadataHash,
        uint64 clientTimestamp
    ) external {
        _anchor(recordId, logHash, metadataHash, clientTimestamp);
    }

    function anchorLogs(
        bytes32[] calldata recordIds,
        bytes32[] calldata logHashes,
        bytes32[] calldata metadataHashes,
        uint64[] calldata clientTimestamps
    ) external {
        if (
            recordIds.length != logHashes.length ||
            recordIds.length != metadataHashes.length ||
            recordIds.length != clientTimestamps.length
        ) {
            revert InvalidBatchLengths();
        }

        if (recordIds.length > MAX_BATCH_SIZE) {
            revert BatchTooLarge(recordIds.length, MAX_BATCH_SIZE);
        }

        for (uint256 i = 0; i < recordIds.length; i++) {
            _anchor(recordIds[i], logHashes[i], metadataHashes[i], clientTimestamps[i]);
        }
    }

    function getLogRecord(bytes32 recordId) external view returns (LogRecord memory) {
        LogRecord memory record = records[recordId];
        if (!record.exists) {
            revert RecordNotFound(recordId);
        }
        return record;
    }

    function verifyLog(
        bytes32 recordId,
        bytes32 expectedLogHash,
        bytes32 expectedMetadataHash
    ) external view returns (bool) {
        LogRecord memory record = records[recordId];
        if (!record.exists) {
            return false;
        }

        return record.logHash == expectedLogHash && record.metadataHash == expectedMetadataHash;
    }

    function _anchor(
        bytes32 recordId,
        bytes32 logHash,
        bytes32 metadataHash,
        uint64 clientTimestamp
    ) internal {
        if (recordId == bytes32(0) || logHash == bytes32(0) || metadataHash == bytes32(0)) {
            revert EmptyValue();
        }

        if (records[recordId].exists) {
            revert RecordAlreadyExists(recordId);
        }

        uint64 anchoredAt = uint64(block.timestamp);
        records[recordId] = LogRecord({
            logHash: logHash,
            metadataHash: metadataHash,
            clientTimestamp: clientTimestamp,
            anchoredAt: anchoredAt,
            submitter: msg.sender,
            exists: true
        });

        isHashAnchored[logHash] = true;

        emit LogAnchored(recordId, logHash, metadataHash, clientTimestamp, anchoredAt, msg.sender);
    }
}
