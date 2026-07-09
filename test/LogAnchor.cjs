const assert = require('node:assert/strict');

describe('LogAnchor', function () {
  async function deployFixture() {
    const [owner, other] = await ethers.getSigners();
    const factory = await ethers.getContractFactory('LogAnchor');
    const contract = await factory.deploy();
    await contract.waitForDeployment();
    return { contract, owner, other };
  }

  it('anchors and retrieves a log record', async function () {
    const { contract, owner } = await deployFixture();
    const recordId = ethers.id('record-1');
    const logHash = ethers.sha256(ethers.toUtf8Bytes('hello'));
    const metadataHash = ethers.sha256(ethers.toUtf8Bytes('metadata'));
    const clientTimestamp = 1_717_171_717;

    await contract.anchorLog(recordId, logHash, metadataHash, clientTimestamp);
    const record = await contract.getLogRecord(recordId);

    assert.equal(record.logHash, logHash);
    assert.equal(record.metadataHash, metadataHash);
    assert.equal(Number(record.clientTimestamp), clientTimestamp);
    assert.equal(record.submitter, owner.address);
    assert.equal(record.exists, true);
  });

  it('verifies a stored log hash and metadata hash', async function () {
    const { contract } = await deployFixture();
    const recordId = ethers.id('record-verify');
    const logHash = ethers.sha256(ethers.toUtf8Bytes('verify-me'));
    const metadataHash = ethers.sha256(ethers.toUtf8Bytes('verify-metadata'));

    await contract.anchorLog(recordId, logHash, metadataHash, 1234);

    assert.equal(await contract.verifyLog(recordId, logHash, metadataHash), true);
    assert.equal(await contract.verifyLog(recordId, logHash, ethers.sha256(ethers.toUtf8Bytes('wrong'))), false);
  });

  it('anchors a batch of records for lower gas overhead', async function () {
    const { contract } = await deployFixture();
    const recordIds = [ethers.id('batch-1'), ethers.id('batch-2')];
    const logHashes = [
      ethers.sha256(ethers.toUtf8Bytes('batch-log-1')),
      ethers.sha256(ethers.toUtf8Bytes('batch-log-2')),
    ];
    const metadataHashes = [
      ethers.sha256(ethers.toUtf8Bytes('meta-1')),
      ethers.sha256(ethers.toUtf8Bytes('meta-2')),
    ];
    const clientTimestamps = [100, 200];

    await contract.anchorLogs(recordIds, logHashes, metadataHashes, clientTimestamps);

    const first = await contract.getLogRecord(recordIds[0]);
    const second = await contract.getLogRecord(recordIds[1]);

    assert.equal(first.logHash, logHashes[0]);
    assert.equal(second.logHash, logHashes[1]);
  });

  it('rejects duplicate record identifiers', async function () {
    const { contract } = await deployFixture();
    const recordId = ethers.id('dup-record');
    const logHash = ethers.sha256(ethers.toUtf8Bytes('dup-log'));
    const metadataHash = ethers.sha256(ethers.toUtf8Bytes('dup-meta'));

    await contract.anchorLog(recordId, logHash, metadataHash, 100);

    await assert.rejects(
      contract.anchorLog(recordId, ethers.sha256(ethers.toUtf8Bytes('new-log')), metadataHash, 200)
    );
  });

  it('tracks anchored hashes independent of record id', async function () {
    const { contract, other } = await deployFixture();
    const logHash = ethers.sha256(ethers.toUtf8Bytes('shared-hash'));
    const metadataHash = ethers.sha256(ethers.toUtf8Bytes('shared-meta'));

    await contract.connect(other).anchorLog(ethers.id('shared-record'), logHash, metadataHash, 500);

    assert.equal(await contract.isHashAnchored(logHash), true);
  });
});
