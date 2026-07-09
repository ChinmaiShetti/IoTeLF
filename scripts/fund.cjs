// Fund an address with test ETH on the local Hardhat chain.
// Usage: FUND_TO=0xYourAddress FUND_ETH=10000 npx hardhat run scripts/fund.cjs --network localhost
const hre = require('hardhat');

async function main() {
  const to = process.env.FUND_TO;
  const amount = process.env.FUND_ETH || '10000';
  if (!to || !/^0x[0-9a-fA-F]{40}$/.test(to)) {
    throw new Error('Set FUND_TO to a valid 0x address (FUND_TO=0x... npx hardhat run ...).');
  }
  const [funder] = await hre.ethers.getSigners();
  const tx = await funder.sendTransaction({ to, value: hre.ethers.parseEther(amount) });
  await tx.wait();
  const bal = await hre.ethers.provider.getBalance(to);
  console.log(`Sent ${amount} ETH to ${to}`);
  console.log(`New balance: ${hre.ethers.formatEther(bal)} ETH  (tx ${tx.hash})`);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exitCode = 1;
});
