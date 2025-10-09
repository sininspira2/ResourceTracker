console.log("🚀 Updating resource multipliers...");

// Since we can't easily run TypeScript from Node directly,
// let's output SQL statements that can be run manually
const updates = [
  { name: "Plant Fiber", multiplier: 0.1 },
  { name: "Wood", multiplier: 0.5 },
  { name: "Stone", multiplier: 0.3 },
  { name: "Iron Ore", multiplier: 2.0 },
  { name: "Rare Metal", multiplier: 5.0 },
  { name: "Circuits", multiplier: 3.0 },
  { name: "Advanced Components", multiplier: 4.0 },
  { name: "Steel", multiplier: 1.5 },
  { name: "Electronics", multiplier: 2.5 },
];

console.log("\n📝 SQL statements to run in your database:");
console.log("========================================");

updates.forEach((update) => {
  console.log(
    `UPDATE resources SET multiplier = ${update.multiplier} WHERE name = '${update.name}';`,
  );
});

console.log(
  "\n✅ Copy and paste these SQL statements into your database tool!",
);
console.log(
  "🎉 Or run them through your preferred database management interface.",
);
