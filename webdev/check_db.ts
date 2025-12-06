
import { prismaAuth } from "./src/lib/db/auth";
import { prismaCitizen } from "./src/lib/db/citizen";
import { prismaBusiness } from "./src/lib/db/business";
import { prismaGov } from "./src/lib/db/gov";

async function main() {
  console.log("Checking Auth DB...");
  await prismaAuth.$connect();
  console.log("Auth DB Connected.");

  console.log("Checking Citizen DB...");
  await prismaCitizen.$connect();
  console.log("Citizen DB Connected.");

  console.log("Checking Business DB...");
  await prismaBusiness.$connect();
  console.log("Business DB Connected.");

  console.log("Checking Gov DB...");
  await prismaGov.$connect();
  console.log("Gov DB Connected.");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prismaAuth.$disconnect();
    await prismaCitizen.$disconnect();
    await prismaBusiness.$disconnect();
    await prismaGov.$disconnect();
  });
