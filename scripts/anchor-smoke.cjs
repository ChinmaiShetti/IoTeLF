// End-to-end smoke test for the anchor→verify path the dashboard uses.
// Deploys LogAnchor, anchors a record with sha256/keccak hashes (same shapes
// the frontend's createLogEntry produces), and asserts verifyLog matches.
// Run: npx hardhat run scripts/anchor-smoke.cjs
const assert = require('node:assert/strict');
const hre = require('hardhat');

async function main() {
  const factory = await hre.ethers.getContractFactory('LogAnchor');
  const contract = await factory.deploy();
  await contract.waitForDeployment();

  const recordId = hre.ethers.id('firebase:AUTH_OK:2026-06-26T10:30:00.000Z');
  const logHash = hre.ethers.sha256(hre.ethers.toUtf8Bytes('{"event":"AUTH_OK"}'));
  const metadataHash = hre.ethers.sha256(hre.ethers.toUtf8Bytes('{"uid":"81073266"}'));
  const clientTs = Math.floor(Date.now() / 1000);

  await (await contract.anchorLog(recordId, logHash, metadataHash, clientTs)).wait();

  assert.equal(await contract.verifyLog(recordId, logHash, metadataHash), true, 'should verify');
  const wrong = hre.ethers.sha256(hre.ethers.toUtf8Bytes('tampered'));
  assert.equal(await contract.verifyLog(recordId, wrong, metadataHash), false, 'tamper detected');

  console.log('anchor-smoke OK: anchored + verified, tamper rejected');
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
