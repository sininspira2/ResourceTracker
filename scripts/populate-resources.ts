import { db, resources } from "../lib/db";
import { nanoid } from "nanoid";

// Function to determine status based on quantity and target
function calculateStatus(quantity: number, target: number): string {
  const percentage = (quantity / target) * 100;
  if (percentage >= 100) return "at_target";
  if (percentage >= 50) return "below_target";
  return "critical";
}

// Function to estimate target quantities based on current quantities and status indicators
function estimateTarget(quantity: number, statusFromEmoji: string): number {
  switch (statusFromEmoji) {
    case "at_target": // 🟢
      return Math.floor(quantity * 0.9); // Assuming current is slightly above target
    case "below_target": // 🟠
      return Math.floor(quantity * 1.5); // Assuming current is 50-99% of target
    case "critical": // 🔴
      return quantity > 0 ? Math.floor(quantity * 3) : 1000; // Assuming current is <50% of target
    default:
      return quantity > 0 ? quantity : 1000;
  }
}

// EXAMPLE DATA - Replace with your own resources!
// This is sample data for demonstration. Customize for your organization.

const rawResources = [
  {
    name: "Wood",
    quantityHagga: 1250,
    quantityDeepDesert: 0,
    icon: "🪵",
    status: "at_target",
    lastUpdatedBy: "Admin User",
  },
  {
    name: "Stone",
    quantityHagga: 850,
    quantityDeepDesert: 0,
    icon: "🪨",
    status: "below_target",
    lastUpdatedBy: "Collector Alpha",
  },
  {
    name: "Iron Ore",
    quantityHagga: 450,
    quantityDeepDesert: 0,
    icon: "⛏️",
    status: "critical",
    lastUpdatedBy: "Miner Beta",
  },
  {
    name: "Cotton",
    quantityHagga: 2100,
    quantityDeepDesert: 0,
    icon: "🌱",
    status: "at_target",
    lastUpdatedBy: "Farmer Gamma",
  },
  {
    name: "Water",
    quantityHagga: 5000,
    quantityDeepDesert: 0,
    icon: "💧",
    status: "at_target",
    lastUpdatedBy: "Gatherer Delta",
  },
  {
    name: "Clay",
    quantityHagga: 120,
    quantityDeepDesert: 0,
    icon: "🏺",
    status: "critical",
    lastUpdatedBy: "Crafter Epsilon",
  },
  {
    name: "Sand",
    quantityHagga: 800,
    quantityDeepDesert: 0,
    icon: "⏳",
    status: "below_target",
    lastUpdatedBy: "Builder Zeta",
  },
  {
    name: "Coal",
    quantityHagga: 600,
    quantityDeepDesert: 0,
    icon: "⚫",
    status: "below_target",
    lastUpdatedBy: "Miner Beta",
  },
  {
    name: "Copper Ore",
    quantityHagga: 300,
    quantityDeepDesert: 0,
    icon: "🟤",
    status: "critical",
    lastUpdatedBy: "Prospector Eta",
  },
  {
    name: "Leather",
    quantityHagga: 180,
    quantityDeepDesert: 0,
    icon: "🦬",
    status: "critical",
    lastUpdatedBy: "Hunter Theta",
  },
];

const refinedResources = [
  {
    name: "Iron Ingot",
    quantityHagga: 250,
    quantityDeepDesert: 0,
    icon: "🔩",
    status: "at_target",
    lastUpdatedBy: "Blacksmith Alpha",
  },
  {
    name: "Steel Bars",
    quantityHagga: 150,
    quantityDeepDesert: 0,
    icon: "⚡",
    status: "below_target",
    lastUpdatedBy: "Forger Beta",
  },
  {
    name: "Copper Wire",
    quantityHagga: 400,
    quantityDeepDesert: 0,
    icon: "🟫",
    status: "at_target",
    lastUpdatedBy: "Electrician Gamma",
  },
  {
    name: "Glass Sheets",
    quantityHagga: 80,
    quantityDeepDesert: 0,
    icon: "🪟",
    status: "critical",
    lastUpdatedBy: "Glassblower Delta",
  },
  {
    name: "Fabric Bolts",
    quantityHagga: 320,
    quantityDeepDesert: 0,
    icon: "🧵",
    status: "at_target",
    lastUpdatedBy: "Weaver Epsilon",
  },
  {
    name: "Processed Food",
    quantityHagga: 500,
    quantityDeepDesert: 0,
    icon: "🥫",
    status: "at_target",
    lastUpdatedBy: "Chef Zeta",
  },
  {
    name: "Refined Oil",
    quantityHagga: 120,
    quantityDeepDesert: 0,
    icon: "🛢️",
    status: "below_target",
    lastUpdatedBy: "Refiner Eta",
  },
  {
    name: "Plastic Pellets",
    quantityHagga: 200,
    quantityDeepDesert: 0,
    icon: "🔸",
    status: "critical",
    lastUpdatedBy: "Processor Theta",
  },
];

const components = [
  {
    name: "Electronic Circuits",
    quantityHagga: 150,
    quantityDeepDesert: 0,
    icon: "🔌",
    status: "at_target",
    lastUpdatedBy: "Technician Alpha",
  },
  {
    name: "Mechanical Gears",
    quantityHagga: 80,
    quantityDeepDesert: 0,
    icon: "⚙️",
    status: "below_target",
    lastUpdatedBy: "Engineer Beta",
  },
  {
    name: "Power Cells",
    quantityHagga: 60,
    quantityDeepDesert: 0,
    icon: "🔋",
    status: "critical",
    lastUpdatedBy: "Supplier Gamma",
  },
  {
    name: "Control Modules",
    quantityHagga: 45,
    quantityDeepDesert: 0,
    icon: "🎛️",
    status: "critical",
    lastUpdatedBy: "Specialist Delta",
  },
  {
    name: "Display Screens",
    quantityHagga: 25,
    quantityDeepDesert: 0,
    icon: "📺",
    status: "critical",
    lastUpdatedBy: "Vendor Epsilon",
  },
  {
    name: "Sensor Arrays",
    quantityHagga: 35,
    quantityDeepDesert: 0,
    icon: "📡",
    status: "critical",
    lastUpdatedBy: "Installer Zeta",
  },
  {
    name: "Motor Assemblies",
    quantityHagga: 90,
    quantityDeepDesert: 0,
    icon: "🔧",
    status: "below_target",
    lastUpdatedBy: "Mechanic Eta",
  },
  {
    name: "Filter Systems",
    quantityHagga: 120,
    quantityDeepDesert: 0,
    icon: "🔍",
    status: "at_target",
    lastUpdatedBy: "Maintenance Theta",
  },
];

async function populateResources() {
  try {
    console.log("🚀 Starting to populate example resources...");
    console.log("⚠️  WARNING: This will add example data to your database!");
    console.log(
      "   Customize the resource arrays above for your organization.",
    );

    // Clear existing resources (optional - remove if you want to keep existing ones)
    // await db.delete(resources)

    const allResources = [
      ...rawResources.map((r) => ({ ...r, category: "Raw Resources" })),
      ...refinedResources.map((r) => ({ ...r, category: "Refined Resources" })),
      ...components.map((r) => ({ ...r, category: "Components" })),
    ];

    const resourceData = allResources.map((resource) => {
      const targetQuantity = estimateTarget(
        resource.quantityHagga,
        resource.status,
      );
      const actualStatus = calculateStatus(
        resource.quantityHagga,
        targetQuantity,
      );

      return {
        id: nanoid(),
        name: resource.name,
        quantityHagga: resource.quantityHagga,
        quantityDeepDesert: resource.quantityDeepDesert || 0,
        description: `${resource.category} - ${resource.name}`,
        category: resource.category,
        icon: resource.icon,
        status: actualStatus,
        targetQuantity: targetQuantity,
        lastUpdatedBy: resource.lastUpdatedBy,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    });

    console.log(`Inserting ${resourceData.length} resources...`);

    // Insert in batches to avoid overwhelming the database
    const batchSize = 10;
    for (let i = 0; i < resourceData.length; i += batchSize) {
      const batch = resourceData.slice(i, i + batchSize);
      await db.insert(resources).values(batch);
      console.log(
        `Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(resourceData.length / batchSize)}`,
      );
    }

    console.log("✅ Successfully populated all resources!");
    console.log(`📊 Summary:`);
    console.log(`- Raw Resources: ${rawResources.length}`);
    console.log(`- Refined Resources: ${refinedResources.length}`);
    console.log(`- Components: ${components.length}`);
    console.log(`- Total: ${allResources.length}`);
  } catch (error) {
    console.error("❌ Error populating resources:", error);
  }
}

// Run the script
populateResources()
  .then(() => {
    console.log("Script completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Script failed:", error);
    process.exit(1);
  });
