import { pbkdf2Sync, randomBytes } from "node:crypto";
import { createInterface } from "node:readline";

const input = createInterface({ input: process.stdin, output: process.stdout });
const ask = (question) => new Promise((resolve) => input.question(question, resolve));
const password = await ask("Enter a strong DigiKatha password: ");
input.close();
if (password.length < 12) {
  console.error("Password must contain at least 12 characters.");
  process.exit(1);
}
const iterations = 310_000;
const salt = randomBytes(16);
const digest = pbkdf2Sync(password, salt, iterations, 32, "sha256");
console.log(`${iterations}$${salt.toString("base64url")}$${digest.toString("base64url")}`);
