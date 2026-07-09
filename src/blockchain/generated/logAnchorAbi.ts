export const LOG_ANCHOR_ABI = [
  {
    inputs: [
      { internalType: 'bytes32', name: 'recordId', type: 'bytes32' },
      { internalType: 'bytes32', name: 'logHash', type: 'bytes32' },
      { internalType: 'bytes32', name: 'metadataHash', type: 'bytes32' },
      { internalType: 'uint64', name: 'clientTimestamp', type: 'uint64' },
    ],
    name: 'anchorLog',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32[]', name: 'recordIds', type: 'bytes32[]' },
      { internalType: 'bytes32[]', name: 'logHashes', type: 'bytes32[]' },
      { internalType: 'bytes32[]', name: 'metadataHashes', type: 'bytes32[]' },
      { internalType: 'uint64[]', name: 'clientTimestamps', type: 'uint64[]' },
    ],
    name: 'anchorLogs',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'bytes32', name: 'recordId', type: 'bytes32' }],
    name: 'getLogRecord',
    outputs: [
      {
        components: [
          { internalType: 'bytes32', name: 'logHash', type: 'bytes32' },
          { internalType: 'bytes32', name: 'metadataHash', type: 'bytes32' },
          { internalType: 'uint64', name: 'clientTimestamp', type: 'uint64' },
          { internalType: 'uint64', name: 'anchoredAt', type: 'uint64' },
          { internalType: 'address', name: 'submitter', type: 'address' },
          { internalType: 'bool', name: 'exists', type: 'bool' },
        ],
        internalType: 'struct LogAnchor.LogRecord',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    name: 'isHashAnchored',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'MAX_BATCH_SIZE',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'recordId', type: 'bytes32' },
      { internalType: 'bytes32', name: 'expectedLogHash', type: 'bytes32' },
      { internalType: 'bytes32', name: 'expectedMetadataHash', type: 'bytes32' },
    ],
    name: 'verifyLog',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;
