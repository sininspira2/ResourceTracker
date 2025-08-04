import { db, resources } from '../lib/db'
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

const rawResources = [
  { name: 'Corpse', quantity: 14, icon: ':Corpse:', status: 'critical', lastUpdatedBy: 'Mother Y\'thelia (Yetty)' },
  { name: 'Plant Fiber', quantity: 964, icon: ':PlantFiber:', status: 'critical', lastUpdatedBy: 'Yasvahi Assuan (Nathrai)' },
  { name: 'Salvaged Metal', quantity: 13331, icon: ':SalvagedMetal:', status: 'at_target', lastUpdatedBy: 'Magdalena ((Pheebs))' },
  { name: 'Water', quantity: 888586, icon: ':ocean:', status: 'at_target', lastUpdatedBy: 'Mother Y\'thelia (Yetty)' },
  { name: 'Fuel Cell', quantity: 7456, icon: ':FuelCell:', status: 'at_target', lastUpdatedBy: 'Magdalena ((Pheebs))' },
  { name: 'Flour Sand', quantity: 5789, icon: ':FlourSand:', status: 'at_target', lastUpdatedBy: 'Yasvahi Assuan (Nathrai)' },
  { name: 'Iron Ore', quantity: 5804, icon: ':IronOre:', status: 'below_target', lastUpdatedBy: 'Yasvahi Assuan (Nathrai)' },
  { name: 'Spice Sand', quantity: 405, icon: ':spice:', status: 'critical', lastUpdatedBy: 'Magdalena ((Pheebs))' },
  { name: 'Carbon Ore', quantity: 6154, icon: ':CarbonOre:', status: 'at_target', lastUpdatedBy: 'Yasvahi Assuan (Nathrai)' },
  { name: 'Erythrite Crystal', quantity: 3541, icon: ':ErythriteCrystal:', status: 'at_target', lastUpdatedBy: 'Yasvahi Assuan (Nathrai)' },
  { name: 'Aluminum Ore', quantity: 5418, icon: ':AllumniumCore:', status: 'at_target', lastUpdatedBy: 'Yasvahi Assuan (Nathrai)' },
  { name: 'Basalt Stone', quantity: 78, icon: ':Basalt:', status: 'critical', lastUpdatedBy: 'Magdalena ((Pheebs))' },
  { name: 'Jasmium Crystal', quantity: 2891, icon: ':JasmiumCrystal:', status: 'at_target', lastUpdatedBy: 'Magdalena ((Pheebs))' },
  { name: 'Stravidium Mass', quantity: 0, icon: ':StravidiumMass:', status: 'critical', lastUpdatedBy: 'Magdalena ((Pheebs))' },
  { name: 'Titanium Ore', quantity: 0, icon: ':TitaniumOre:', status: 'critical', lastUpdatedBy: 'Magdalena ((Pheebs))' }
]

const refinedResources = [
  { name: 'Copper Ingot', quantity: 2119, icon: ':CopperIngot:', status: 'at_target', lastUpdatedBy: 'Magdalena ((Pheebs))' },
  { name: 'Iron Ingot', quantity: 1000, icon: ':IronIngot:', status: 'critical', lastUpdatedBy: 'Magdalena ((Pheebs))' },
  { name: 'Silicone Block', quantity: 4687, icon: ':SiliconeBlock:', status: 'at_target', lastUpdatedBy: 'Magdalena ((Pheebs))' },
  { name: 'Cobalt Paste', quantity: 1579, icon: ':ColbaltPaste:', status: 'at_target', lastUpdatedBy: 'Yasvahi Assuan (Nathrai)' },
  { name: 'Low-grade Lubricant', quantity: 0, icon: ':LowGradeLubricant:', status: 'critical', lastUpdatedBy: 'Mother Y\'thelia (Yetty)' },
  { name: 'Medium Sized Vehicle Fuel Cell', quantity: 32, icon: ':LargeVehicleFuelCell:', status: 'critical', lastUpdatedBy: 'Magdalena ((Pheebs))' },
  { name: 'Spice Melange', quantity: 0, icon: ':spice:', status: 'critical', lastUpdatedBy: 'Magdalena ((Pheebs))' },
  { name: 'Steel Ingot', quantity: 3113, icon: ':SteelIngot:', status: 'at_target', lastUpdatedBy: 'Magdalena ((Pheebs))' },
  { name: 'Aluminum Ingot', quantity: 598, icon: ':AluminumIngot:', status: 'critical', lastUpdatedBy: 'Magdalena ((Pheebs))' },
  { name: 'Large Vehicle Fuel Cell', quantity: 12, icon: ':LargeVehicleFuelCell:', status: 'critical', lastUpdatedBy: 'Magdalena ((Pheebs))' },
  { name: 'Plastone', quantity: 8122, icon: ':Plastone:', status: 'at_target', lastUpdatedBy: 'Magdalena ((Pheebs))' },
  { name: 'Standard Filter', quantity: 0, icon: ':StandardFilter:', status: 'critical', lastUpdatedBy: 'Magdalena ((Pheebs))' },
  { name: 'Duraluminum Ingot', quantity: 882, icon: ':DuraluminumIngot:', status: 'below_target', lastUpdatedBy: 'Magdalena ((Pheebs))' },
  { name: 'Industrial-grade Lubricant', quantity: 208, icon: ':IndustrialGradeLubricant:', status: 'critical', lastUpdatedBy: 'Magdalena ((Pheebs))' },
  { name: 'Solaris', quantity: 8350, icon: ':Solaris:', status: 'critical', lastUpdatedBy: 'Mother Y\'thelia (Yetty)' },
  { name: 'Plastanium Ingot', quantity: 0, icon: ':PlastaniumIngot:', status: 'critical', lastUpdatedBy: 'Magdalena ((Pheebs))' },
  { name: 'Spice-infused Fuel Cell', quantity: 0, icon: ':SpiceInfusedFuelCell:', status: 'critical', lastUpdatedBy: 'Magdalena ((Pheebs))' },
  { name: 'Stravidium Fiber', quantity: 0, icon: ':StravidiumFiber:', status: 'critical', lastUpdatedBy: 'Magdalena ((Pheebs))' }
]

const components = [
  { name: 'Advanced Servoks Components', quantity: 6482, icon: ':AdvancedServoks:', status: 'at_target', lastUpdatedBy: 'Magdalena ((Pheebs))' },
  { name: 'EMF Generator Components', quantity: 1119, icon: ':EMFGenerators:', status: 'at_target', lastUpdatedBy: 'Magdalena ((Pheebs))' },
  { name: 'Holtzman Actuator Components', quantity: 6147, icon: ':HoltzmanActuator:', status: 'at_target', lastUpdatedBy: 'Magdalena ((Pheebs))' },
  { name: 'Micro-sandwich Fabric Components', quantity: 330, icon: ':MicroSandwichFabric:', status: 'at_target', lastUpdatedBy: 'Yasvahi Assuan (Nathrai)' },
  { name: 'Particle Capacitor Components', quantity: 871, icon: ':ParticleCapacitor:', status: 'at_target', lastUpdatedBy: 'Magdalena ((Pheebs))' },
  { name: 'Ray Amplifier Components', quantity: 1163, icon: ':RayAmplifiers:', status: 'at_target', lastUpdatedBy: 'Magdalena ((Pheebs))' },
  { name: 'Carbide Scraps Components', quantity: 704, icon: ':CarbideScraps:', status: 'at_target', lastUpdatedBy: 'Yasvahi Assuan (Nathrai)' },
  { name: 'Diamondine Dust Components', quantity: 232, icon: ':DiamondineDust:', status: 'at_target', lastUpdatedBy: 'Yasvahi Assuan (Nathrai)' },
  { name: 'Industrial Pump Components', quantity: 221, icon: ':IndustrialPumpComponents:', status: 'at_target', lastUpdatedBy: 'Yasvahi Assuan (Nathrai)' },
  { name: 'Hydraulic Piston Components', quantity: 935, icon: ':HydraulicPistonComponents:', status: 'at_target', lastUpdatedBy: 'Magdalena ((Pheebs))' },
  { name: 'Thermoelectric Cooler Components', quantity: 1611, icon: ':ThermoElectricCooler:', status: 'at_target', lastUpdatedBy: 'Magdalena ((Pheebs))' },
  { name: 'Spice-infused Duraluminum Dust Components', quantity: 4783, icon: ':SpiceinfusedDuraluminumDustC:', status: 'at_target', lastUpdatedBy: 'Magdalena ((Pheebs))' },
  { name: 'Advanced Machinery Components', quantity: 25, icon: ':AdvancedMachineryComponents:', status: 'critical', lastUpdatedBy: 'Yasvahi Assuan (Nathrai)' },
  { name: 'Fluid Efficient Industrial Pump Components', quantity: 100, icon: ':FluidEfficientIndustrialPump:', status: 'at_target', lastUpdatedBy: 'Yasvahi Assuan (Nathrai)' },
  { name: 'Fluted Heavy Caliber Compressor Components', quantity: 361, icon: ':FlutedHeavyCaliberCompressor:', status: 'at_target', lastUpdatedBy: 'Magdalena ((Pheebs))' },
  { name: 'Fluted Light Caliber Compressor Components', quantity: 532, icon: ':FlutedLightCaliberCompressor:', status: 'at_target', lastUpdatedBy: 'Magdalena ((Pheebs))' },
  { name: 'Overclocked Power Regulator Components', quantity: 283, icon: ':OverclockedPowerRegulatorComp:', status: 'at_target', lastUpdatedBy: 'Magdalena ((Pheebs))' },
  { name: 'Plasteel Plate Components', quantity: 1833, icon: ':PlasteelPlateComponents:', status: 'at_target', lastUpdatedBy: 'Dominic [Quartermaster]' },
  { name: 'Spice-infused Plastanium Dust Components', quantity: 255, icon: ':SpiceinfusedPlastaniumDustCo:', status: 'at_target', lastUpdatedBy: 'Dominic [Quartermaster]' }
]

async function populateResources() {
  try {
    console.log('Starting to populate resources...')
    
    // Clear existing resources (optional - remove if you want to keep existing ones)
    // await db.delete(resources)
    
    const allResources = [
      ...rawResources.map(r => ({ ...r, category: 'Raw Resources' })),
      ...refinedResources.map(r => ({ ...r, category: 'Refined Resources' })),
      ...components.map(r => ({ ...r, category: 'Components' }))
    ]
    
    const resourceData = allResources.map(resource => {
      const targetQuantity = estimateTarget(resource.quantity, resource.status)
      const actualStatus = calculateStatus(resource.quantity, targetQuantity)
      
      return {
        id: nanoid(),
        name: resource.name,
        quantity: resource.quantity,
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
    
    console.log(`Inserting ${resourceData.length} resources...`)
    
    // Insert in batches to avoid overwhelming the database
    const batchSize = 10
    for (let i = 0; i < resourceData.length; i += batchSize) {
      const batch = resourceData.slice(i, i + batchSize)
      await db.insert(resources).values(batch)
      console.log(`Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(resourceData.length / batchSize)}`)
    }
    
    console.log('✅ Successfully populated all resources!')
    console.log(`📊 Summary:`)
    console.log(`- Raw Resources: ${rawResources.length}`)
    console.log(`- Refined Resources: ${refinedResources.length}`)
    console.log(`- Components: ${components.length}`)
    console.log(`- Total: ${allResources.length}`)
    
  } catch (error) {
    console.error('❌ Error populating resources:', error)
  }
}

// Run the script
populateResources().then(() => {
  console.log('Script completed!')
  process.exit(0)
}).catch(error => {
  console.error('Script failed:', error)
  process.exit(1)
}) 