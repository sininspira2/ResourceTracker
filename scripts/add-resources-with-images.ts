import { db, resources } from "../lib/db";
import { nanoid } from "nanoid";

// Function to determine status based on quantity and target
function calculateStatus(quantity: number, target: number): string {
  const percentage = (quantity / target) * 100;
  if (percentage >= 100) return "at_target";
  if (percentage >= 50) return "below_target";
  return "critical";
}

// Function to estimate target quantities based on current quantities
function estimateTarget(quantity: number): number {
  return quantity > 0 ? Math.max(quantity * 2, 1000) : 1000;
}

// Interface for new resources with images
interface NewResource {
  name: string;
  quantityHagga: number;
  quantityDeepDesert: number;
  description?: string;
  category: string;
  icon?: string; // Optional emoji/icon identifier
  imageUrl?: string; // Optional image URL
  targetQuantity?: number;
  lastUpdatedBy: string;
}

// Example resources with image URLs
const newResourcesWithImages: NewResource[] = [
  {
    name: "Diamond Ore",
    quantityHagga: 45,
    quantityDeepDesert: 0,
    description: "Rare crystalline material for advanced manufacturing",
    category: "Raw Resources",
    icon: ":gem:",
    imageUrl: "https://example.com/images/diamond-ore.png",
    targetQuantity: 100,
    lastUpdatedBy: "System Admin",
  },
  {
    name: "Plasma Cell",
    quantityHagga: 12,
    quantityDeepDesert: 0,
    description: "High-energy storage device",
    category: "Technology",
    icon: ":zap:",
    imageUrl: "https://example.com/images/plasma-cell.png",
    targetQuantity: 50,
    lastUpdatedBy: "Engineering Team",
  },
  {
    name: "Quantum Fabric",
    quantityHagga: 3,
    quantityDeepDesert: 0,
    description: "Advanced textile with quantum properties",
    category: "Components",
    icon: ":thread:",
    imageUrl: "https://example.com/images/quantum-fabric.png",
    targetQuantity: 20,
    lastUpdatedBy: "Research Division",
  },
];

async function addResourcesWithImages(customResources?: NewResource[]) {
  try {
    console.log("🚀 Starting to add resources with images...");

    const resourcesToAdd = customResources || newResourcesWithImages;

    const resourceData = resourcesToAdd.map((resource) => {
      const targetQuantity =
        resource.targetQuantity || estimateTarget(resource.quantityHagga);
      const status = calculateStatus(resource.quantityHagga, targetQuantity);

      return {
        id: nanoid(),
        name: resource.name,
        quantityHagga: resource.quantityHagga,
        quantityDeepDesert: resource.quantityDeepDesert || 0,
        description:
          resource.description || `${resource.category} - ${resource.name}`,
        category: resource.category,
        icon: resource.icon || null,
        imageUrl: resource.imageUrl || null,
        status: status,
        targetQuantity: targetQuantity,
        lastUpdatedBy: resource.lastUpdatedBy,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    });

    console.log(`📊 Inserting ${resourceData.length} resources...`);

    // Insert resources
    await db.insert(resources).values(resourceData);

    console.log("✅ Successfully added all resources with images!");
    console.log(`📈 Summary:`);
    resourceData.forEach((resource) => {
      console.log(
        `- ${resource.name}: ${resource.quantityHagga} units (Hagga)${resource.imageUrl ? " (with image)" : ""}`,
      );
    });

    return resourceData;
  } catch (error) {
    console.error("❌ Error adding resources:", error);
    throw error;
  }
}

// Function to add a single resource
export async function addSingleResource(resource: NewResource) {
  return addResourcesWithImages([resource]);
}

// Function to add multiple resources
export async function addMultipleResources(resources: NewResource[]) {
  return addResourcesWithImages(resources);
}

// Run the script if called directly
if (require.main === module) {
  addResourcesWithImages()
    .then(() => {
      console.log("🏁 Script completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Script failed:", error);
      process.exit(1);
    });
}

export { addResourcesWithImages };
export type { NewResource };
