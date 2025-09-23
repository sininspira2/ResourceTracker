/**
 * SAFE EXAMPLE RESOURCE POPULATION SCRIPT
 * * This script contains example resource data and gracefully handles database connection issues.
 * * ⚠️  CUSTOMIZE FOR YOUR ORGANIZATION:
 * - Replace the resource arrays below with your own data
 * - Update user names to match your Discord server
 * - Change icons to match your Discord emojis  
 * - Modify categories for your specific use case
 */

import { nanoid } from 'nanoid'

// Function to determine status based on quantity and target
function calculateStatus(quantityHagga: number, target: number): string {
  const percentage = (quantityHagga / target) * 100
  if (percentage >= 100) return 'at_target'
  if (percentage >= 50) return 'below_target'
  return 'critical'
}

// Function to estimate target quantities based on current quantities and status indicators
function estimateTarget(quantityHagga: number, statusFromEmoji: string): number {
  switch (statusFromEmoji) {
    case 'at_target': // 🟢
      return Math.floor(quantityHagga * 0.9) // Assuming current is slightly above target
    case 'below_target': // 🟠  
      return Math.floor(quantityHagga * 1.5) // Assuming current is 50-99% of target
    case 'critical': // 🔴
      return quantityHagga > 0 ? Math.floor(quantityHagga * 3) : 1000 // Assuming current is <50% of target
    default:
      return quantityHagga > 0 ? quantityHagga : 1000
  }
}

// EXAMPLE DATA - Replace with your own resources!
const rawResources = [
  { name: 'Agave Seeds', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Aluminum Ore', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Basalt', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Carbon Ore', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Copper Ore', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Corpse', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Erythrite Crystal', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Flour Sand', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Fuel Cell', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Granite Stone', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Iron Ore', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Jasmium Crystal', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Mouse Corpse', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Opafire Gem', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Plant Fiber', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Spice Sand', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Stravidium Mass', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Titanium Ore', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
]

const refinedResources = [
  { name: 'Aluminum Ingot', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Armor Plating', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Atmospheric Filtered Fabric', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Cobalt Paste', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Copper Ingot', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Duraluminum Ingot', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Industrial-grade Lubricant', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Iron Ingot', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Large Vehicle Fuel Cell', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Low-grade Lubricant', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Medium Sized Vehicle Fuel Cell', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Micro-sandwich Fabric', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Missile', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Particulate Filter', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Plastanium Ingot', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Plastone', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Silicone Block', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Small Vehicle Fuel Cell', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Spice Melange', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Spice Residue', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Standard Filter', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Steel Ingot', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Stravidium Fiber', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Welding wire', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Rockets', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
]

const components = [
  { name: 'Advanced Machinery', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Advanced Particulate Filter', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Advanced Servoks', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Ballistic Weave Fabric', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Blade Parts', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Plasteel Microflora Fiber', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Calibrated Servok', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Carbide blade parts', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Carbide Scraps', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Particle Capacitor', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Complex Machinery', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Diamodine blade parts', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Diamondine Dust', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'EMF Generator', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Fluid Efficient Industrial Pump', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Fluted Heavy Caliber Compressor', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Fluted Light Caliber Compressor', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Gun Parts', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Heavy Caliber Compressor', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Holtzman Actuator', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Hydraulic Piston', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Improved Holtzman Actuator', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Improved Watertube', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Industrial Pump', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Insulated Fabric', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Irradiated Core', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Irradiated Slag', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Light Caliber Compressor', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Makeshift Filter', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Mechanical Parts', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Military Power Regulator', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Off-world Medical Supplies', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Overclocked Power Regulator', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Plasteel Composite Armor Plating', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Plasteel Composite Blade Parts', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Plasteel Composite Gun Parts', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Plasteel Plate', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Precision Range Finder', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Range Finder', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Ray Amplifier', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Salvaged Metal', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Sandtrout Leathers', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Ship Manifest', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Spice-infused Aluminum Dust', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Spice-infused Copper Dust', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Spice-infused Duraluminum Dust', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Spice-infused Fuel Cell', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Spice-infused Iron Dust', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Spice-infused Plastanium Dust', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Spice-infused Steel Dust', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Stillsuit Tubing', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Thermo-Responsive Ray Amplifier', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Thermoelectric Cooler', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Tri-Forged Hydraulic Piston', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
]

const otherResources = [
  { name: 'Blank Sinkchart', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Sinkchart', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Solari', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
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
      ...rawResources.map(r => ({ ...r, category: 'Raw' })),
      ...refinedResources.map(r => ({ ...r, category: 'Refined' })),
      ...components.map(r => ({ ...r, category: 'Components' })),
      ...otherResources.map(r => ({ ...r, category: 'Other' }))
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
    console.log(`- Other Resources: ${otherResources.length}`)
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
    ...rawResources.map(r => ({ ...r, category: 'Raw' })),
    ...refinedResources.map(r => ({ ...r, category: 'Refined' })),
    ...components.map(r => ({ ...r, category: 'Components' })),
    ...otherResources.map(r => ({...r, category: 'Other' }))
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
