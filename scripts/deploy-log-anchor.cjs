const fs = require('node:fs');
const path = require('node:path');
const hre = require('hardhat');

async function main() {
  const networkName = hre.network.name;
  const chainId = Number((await hre.ethers.provider.getNetwork()).chainId);

  const factory = await hre.ethers.getContractFactory('LogAnchor');
  const contract = await factory.deploy();
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  const outputPath = path.join(__dirname, '..', 'src', 'blockchain', 'generated', 'deployments.json');
  const existing = fs.existsSync(outputPath)
    ? JSON.parse(fs.readFileSync(outputPath, 'utf8'))
    : { localhost: null, sepolia: null };

  const next = {
    ...existing,
    [networkName]: contractAddress,
    [String(chainId)]: contractAddress,
  };

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(next, null, 2)}\n`);

  console.log(`LogAnchor deployed to ${contractAddress} on ${networkName} (${chainId})`);
  console.log(`Updated ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
