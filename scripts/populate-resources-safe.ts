/**
 * SAFE EXAMPLE RESOURCE POPULATION SCRIPT
 * 
 * This script contains example resource data and gracefully handles database connection issues.
 * 
 * ⚠️  CUSTOMIZE FOR YOUR ORGANIZATION:
 * - Replace the resource arrays below with your own data
 * - Update user names to match your Discord server
 * - Change icons to match your Discord emojis  
 * - Modify categories for your specific use case
 */

import { nanoid } from 'nanoid'

// Function to determine status based on quantity and target
function calculateStatus(quantity: number, target: number): string {
  const percentage = (quantity / target) * 100
  if (percentage >= 100) return 'at_target'
  if (percentage >= 50) return 'below_target'
  return 'critical'
}

// Function to estimate target quantities based on current quantities and status indicators
function estimateTarget(quantity: number, statusFromEmoji: string): number {
  switch (statusFromEmoji) {
    case 'at_target': // 🟢
      return Math.floor(quantity * 0.9) // Assuming current is slightly above target
    case 'below_target': // 🟠  
      return Math.floor(quantity * 1.5) // Assuming current is 50-99% of target
    case 'critical': // 🔴
      return quantity > 0 ? Math.floor(quantity * 3) : 1000 // Assuming current is <50% of target
    default:
      return quantity > 0 ? quantity : 1000
  }
}

// EXAMPLE DATA - Replace with your own resources!
const rawResources = [
  { name: 'Wood', quantityHagga: 1250, quantityDeepDesert: 0, icon: '🪵', status: 'at_target', lastUpdatedBy: 'Admin User' },
  { name: 'Stone', quantityHagga: 850, quantityDeepDesert: 0, icon: '🪨', status: 'below_target', lastUpdatedBy: 'Collector Alpha' },
  { name: 'Iron Ore', quantityHagga: 450, quantityDeepDesert: 0, icon: '⛏️', status: 'critical', lastUpdatedBy: 'Miner Beta' },
  { name: 'Cotton', quantityHagga: 2100, quantityDeepDesert: 0, icon: '🌱', status: 'at_target', lastUpdatedBy: 'Farmer Gamma' },
  { name: 'Water', quantityHagga: 5000, quantityDeepDesert: 0, icon: '💧', status: 'at_target', lastUpdatedBy: 'Gatherer Delta' },
  { name: 'Clay', quantityHagga: 120, quantityDeepDesert: 0, icon: '🏺', status: 'critical', lastUpdatedBy: 'Crafter Epsilon' },
  { name: 'Sand', quantityHagga: 800, quantityDeepDesert: 0, icon: '⏳', status: 'below_target', lastUpdatedBy: 'Builder Zeta' },
  { name: 'Coal', quantityHagga: 600, quantityDeepDesert: 0, icon: '⚫', status: 'below_target', lastUpdatedBy: 'Miner Beta' },
  { name: 'Copper Ore', quantityHagga: 300, quantityDeepDesert: 0, icon: '🟤', status: 'critical', lastUpdatedBy: 'Prospector Eta' },
  { name: 'Leather', quantityHagga: 180, quantityDeepDesert: 0, icon: '🦬', status: 'critical', lastUpdatedBy: 'Hunter Theta' }
]

const refinedResources = [
  { name: 'Copper Ingot', quantityHagga: 2119, quantityDeepDesert: 0, icon: ':CopperIngot:', status: 'at_target', lastUpdatedBy: 'Magdalena ((Pheebs))' },
  { name: 'Iron Ingot', quantityHagga: 1000, quantityDeepDesert: 0, icon: ':IronIngot:', status: 'critical', lastUpdatedBy: 'Magdalena ((Pheebs))' },
  { name: 'Silicone Block', quantityHagga: 4687, quantityDeepDesert: 0, icon: ':SiliconeBlock:', status: 'at_target', lastUpdatedBy: 'Magdalena ((Pheebs))' },
  { name: 'Cobalt Paste', quantityHagga: 1579, quantityDeepDesert: 0, icon: ':ColbaltPaste:', status: 'at_target', lastUpdatedBy: 'Yasvahi Assuan (Nathrai)' },
  { name: 'Low-grade Lubricant', quantityHagga: 0, quantityDeepDesert: 0, icon: ':LowGradeLubricant:', status: 'critical', lastUpdatedBy: 'Mother Y\'thelia (Yetty)' },
  { name: 'Medium Sized Vehicle Fuel Cell', quantityHagga: 32, quantityDeepDesert: 0, icon: ':LargeVehicleFuelCell:', status: 'critical', lastUpdatedBy: 'Magdalena ((Pheebs))' },
  { name: 'Spice Melange', quantityHagga: 0, quantityDeepDesert: 0, icon: ':spice:', status: 'critical', lastUpdatedBy: 'Magdalena ((Pheebs))' },
  { name: 'Steel Ingot', quantityHagga: 3113, quantityDeepDesert: 0, icon: ':SteelIngot:', status: 'at_target', lastUpdatedBy: 'Magdalena ((Pheebs))' },
  { name: 'Aluminum Ingot', quantityHagga: 598, quantityDeepDesert: 0, icon: ':AluminumIngot:', status: 'critical', lastUpdatedBy: 'Magdalena ((Pheebs))' },
  { name: 'Large Vehicle Fuel Cell', quantityHagga: 12, quantityDeepDesert: 0, icon: ':LargeVehicleFuelCell:', status: 'critical', lastUpdatedBy: 'Magdalena ((Pheebs))' },
  { name: 'Plastone', quantityHagga: 8122, quantityDeepDesert: 0, icon: ':Plastone:', status: 'at_target', lastUpdatedBy: 'Magdalena ((Pheebs))' },
  { name: 'Standard Filter', quantityHagga: 0, quantityDeepDesert: 0, icon: ':StandardFilter:', status: 'critical', lastUpdatedBy: 'Magdalena ((Pheebs))' },
  { name: 'Duraluminum Ingot', quantityHagga: 882, quantityDeepDesert: 0, icon: ':DuraluminumIngot:', status: 'below_target', lastUpdatedBy: 'Magdalena ((Pheebs))' },
  { name: 'Industrial-grade Lubricant', quantityHagga: 208, quantityDeepDesert: 0, icon: ':IndustrialGradeLubricant:', status: 'critical', lastUpdatedBy: 'Magdalena ((Pheebs))' },
  { name: 'Solaris', quantityHagga: 8350, quantityDeepDesert: 0, icon: ':Solaris:', status: 'critical', lastUpdatedBy: 'Mother Y\'thelia (Yetty)' },
  { name: 'Plastanium Ingot', quantityHagga: 0, quantityDeepDesert: 0, icon: ':PlastaniumIngot:', status: 'critical', lastUpdatedBy: 'Magdalena ((Pheebs))' },
  { name: 'Spice-infused Fuel Cell', quantityHagga: 0, quantityDeepDesert: 0, icon: ':SpiceInfusedFuelCell:', status: 'critical', lastUpdatedBy: 'Magdalena ((Pheebs))' },
  { name: 'Stravidium Fiber', quantityHagga: 0, quantityDeepDesert: 0, icon: ':StravidiumFiber:', status: 'critical', lastUpdatedBy: 'Magdalena ((Pheebs))' }
]

const components = [
  { name: 'Advanced Servoks Components', quantityHagga: 6482, quantityDeepDesert: 0, icon: ':AdvancedServoks:', status: 'at_target', lastUpdatedBy: 'Magdalena ((Pheebs))' },
  { name: 'EMF Generator Components', quantityHagga: 1119, quantityDeepDesert: 0, icon: ':EMFGenerators:', status: 'at_target', lastUpdatedBy: 'Magdalena ((Pheebs))' },
  { name: 'Holtzman Actuator Components', quantityHagga: 6147, quantityDeepDesert: 0, icon: ':HoltzmanActuator:', status: 'at_target', lastUpdatedBy: 'Magdalena ((Pheebs))' },
  { name: 'Micro-sandwich Fabric Components', quantityHagga: 330, quantityDeepDesert: 0, icon: ':MicroSandwichFabric:', status: 'at_target', lastUpdatedBy: 'Yasvahi Assuan (Nathrai)' },
  { name: 'Particle Capacitor Components', quantityHagga: 871, quantityDeepDesert: 0, icon: ':ParticleCapacitor:', status: 'at_target', lastUpdatedBy: 'Magdalena ((Pheebs))' },
  { name: 'Ray Amplifier Components', quantityHagga: 1163, quantityDeepDesert: 0, icon: ':RayAmplifiers:', status: 'at_target', lastUpdatedBy: 'Magdalena ((Pheebs))' },
  { name: 'Carbide Scraps Components', quantityHagga: 704, quantityDeepDesert: 0, icon: ':CarbideScraps:', status: 'at_target', lastUpdatedBy: 'Yasvahi Assuan (Nathrai)' },
  { name: 'Diamondine Dust Components', quantityHagga: 232, quantityDeepDesert: 0, icon: ':DiamondineDust:', status: 'at_target', lastUpdatedBy: 'Yasvahi Assuan (Nathrai)' },
  { name: 'Industrial Pump Components', quantityHagga: 221, quantityDeepDesert: 0, icon: ':IndustrialPumpComponents:', status: 'at_target', lastUpdatedBy: 'Yasvahi Assuan (Nathrai)' },
  { name: 'Hydraulic Piston Components', quantityHagga: 935, quantityDeepDesert: 0, icon: ':HydraulicPistonComponents:', status: 'at_target', lastUpdatedBy: 'Magdalena ((Pheebs))' },
  { name: 'Thermoelectric Cooler Components', quantityHagga: 1611, quantityDeepDesert: 0, icon: ':ThermoElectricCooler:', status: 'at_target', lastUpdatedBy: 'Magdalena ((Pheebs))' },
  { name: 'Spice-infused Duraluminum Dust Components', quantityHagga: 4783, quantityDeepDesert: 0, icon: ':SpiceinfusedDuraluminumDustC:', status: 'at_target', lastUpdatedBy: 'Magdalena ((Pheebs))' },
  { name: 'Advanced Machinery Components', quantityHagga: 25, quantityDeepDesert: 0, icon: ':AdvancedMachineryComponents:', status: 'critical', lastUpdatedBy: 'Yasvahi Assuan (Nathrai)' },
  { name: 'Fluid Efficient Industrial Pump Components', quantityHagga: 100, quantityDeepDesert: 0, icon: ':FluidEfficientIndustrialPump:', status: 'at_target', lastUpdatedBy: 'Yasvahi Assuan (Nathrai)' },
  { name: 'Fluted Heavy Caliber Compressor Components', quantityHagga: 361, quantityDeepDesert: 0, icon: ':FlutedHeavyCaliberCompressor:', status: 'at_target', lastUpdatedBy: 'Magdalena ((Pheebs))' },
  { name: 'Fluted Light Caliber Compressor Components', quantityHagga: 532, quantityDeepDesert: 0, icon: ':FlutedLightCaliberCompressor:', status: 'at_target', lastUpdatedBy: 'Magdalena ((Pheebs))' },
  { name: 'Overclocked Power Regulator Components', quantityHagga: 283, quantityDeepDesert: 0, icon: ':OverclockedPowerRegulatorComp:', status: 'at_target', lastUpdatedBy: 'Magdalena ((Pheebs))' },
  { name: 'Plasteel Plate Components', quantityHagga: 1833, quantityDeepDesert: 0, icon: ':PlasteelPlateComponents:', status: 'at_target', lastUpdatedBy: 'Dominic [Quartermaster]' },
  { name: 'Spice-infused Plastanium Dust Components', quantityHagga: 255, quantityDeepDesert: 0, icon: ':SpiceinfusedPlastaniumDustCo:', status: 'at_target', lastUpdatedBy: 'Dominic [Quartermaster]' }
]

async function populateResourcesSafe() {
  try {
    console.log('🚀 Starting safe resource population...')
    
    // Try to import the database, but handle gracefully if it fails
    let db, resources
    try {
      const dbModule = await import('../lib/db')
      db = dbModule.db
      resources = dbModule.resources
      console.log('✅ Database connection successful')
    } catch (error) {
      console.log('❌ Database connection failed:', error instanceof Error ? error.message : String(error))
      console.log('📝 Generating SQL statements instead...')
      
      // Generate SQL statements that can be run manually
      generateSQLStatements()
      return
    }
    
    const allResources = [
      ...rawResources.map(r => ({ ...r, category: 'Raw Resources' })),
      ...refinedResources.map(r => ({ ...r, category: 'Refined Resources' })),
      ...components.map(r => ({ ...r, category: 'Components' }))
    ]
    
    const resourceData = allResources.map(resource => {
      const targetQuantity = estimateTarget(resource.quantityHagga, resource.status)
      const actualStatus = calculateStatus(resource.quantityHagga, targetQuantity)
      
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
      }
    })
    
    console.log(`📊 Inserting ${resourceData.length} resources...`)
    
    // Insert in batches to avoid overwhelming the database
    const batchSize = 10
    for (let i = 0; i < resourceData.length; i += batchSize) {
      const batch = resourceData.slice(i, i + batchSize)
      await db.insert(resources).values(batch)
      console.log(`✅ Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(resourceData.length / batchSize)}`)
    }
    
    console.log('🎉 Successfully populated all resources!')
    console.log(`📈 Summary:`)
    console.log(`- Raw Resources: ${rawResources.length}`)
    console.log(`- Refined Resources: ${refinedResources.length}`)
    console.log(`- Components: ${components.length}`)
    console.log(`- Total: ${allResources.length}`)
    
  } catch (error) {
    console.error('💥 Error populating resources:', error)
    console.log('📝 Generating SQL statements as fallback...')
    generateSQLStatements()
  }
}

function generateSQLStatements() {
  console.log('\n📝 SQL INSERT STATEMENTS:')
  console.log('Copy and paste these into your database:\n')
  
  const allResources = [
    ...rawResources.map(r => ({ ...r, category: 'Raw Resources' })),
    ...refinedResources.map(r => ({ ...r, category: 'Refined Resources' })),
    ...components.map(r => ({ ...r, category: 'Components' }))
  ]
  
  allResources.forEach(resource => {
    const targetQuantity = estimateTarget(resource.quantityHagga, resource.status)
    const actualStatus = calculateStatus(resource.quantityHagga, targetQuantity)
    const id = nanoid()
    const now = Date.now()
    
    const sql = `INSERT INTO resources (id, name, quantity_hagga, quantity_deep_desert, description, category, icon, status, target_quantity, last_updated_by, created_at, updated_at) VALUES (
  '${id}',
  '${resource.name.replace(/'/g, "''")}',
  ${resource.quantityHagga},
  ${resource.quantityDeepDesert || 0},
  '${resource.category} - ${resource.name.replace(/'/g, "''")}',
  '${resource.category}',
  '${resource.icon}',
  '${actualStatus}',
  ${targetQuantity},
  '${resource.lastUpdatedBy.replace(/'/g, "''")}',
  ${now},
  ${now}
);`
    
    console.log(sql)
  })
  
  console.log(`\n📊 Total: ${allResources.length} resources to insert`)
}

// Run the script
populateResourcesSafe().then(() => {
  console.log('🏁 Script completed!')
  process.exit(0)
}).catch(error => {
  console.error('💥 Script failed:', error)
  process.exit(1)
}) 