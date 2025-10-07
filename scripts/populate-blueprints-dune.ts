/**
 * DUNE BLUEPRINT RESOURCE POPULATION SCRIPT
 * * This script contains blueprint resource data and gracefully handles database connection issues.
 * * ⚠️  CUSTOMIZE FOR YOUR ORGANIZATION:
 * - Update user names to match your Discord server
 * - Change icons to match your Discord emojis
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
const blueprints = [
  { name: 'A Dart for Every Man', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Adaptive Holtzman Shield', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Albatross Wing Module Mk6', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Ambition', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Bashar’s Command', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Bigger Buggy Boot Mk6', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Black Market K-28 Lasgun', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Bluddshot Buggy Engine Mk6', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Bulwark Boots', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Bulwark Chest', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Bulwark Gloves', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Bulwark Helmet', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Bulwark Leggings', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Buoyant Reaper Mk6', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Cauterizer', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Circuit Gauntlets', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Collapsible Dew Reaper Mk6', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Compact Compactor Mk6', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Dampened Sandcrawler Treads', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Desert Garb', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Dunewatcher', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: "Executor's Boots", quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: "Executor's Chestplate", quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: "Executor's Gauntlets", quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: "Executor's Helmet", quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: "Executor's Pants", quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: "Feyd's Drinker", quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Filter Extractor Mk6', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Focused Buggy Cutteray Mk6', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Glasser', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Hajra Literjon Mk6', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: "Halleck's Pick", quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Hook-claw Gloves', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Hummingbird Wing Module Mk6', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: "Idaho's Charge", quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Imperial Stillsuit Boots', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Imperial Stillsuit Garment', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Imperial Stillsuit Gloves', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Imperial Stillsuit Mask', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Impure Extractor Mk6', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: "Indara's Lullaby", quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Ix-core Leggings', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: "Kyne's Cutteray", quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Mohandis Sandbike Engine Mk6', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Night Rider Sandbike Boost Mk6', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Omni Focused Dew Scythe', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: "Pardot's Hood", quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Penetrator', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Perforator', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Pincushion Boots', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Pincushion Gauntlets', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Pincushion Helmet', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Pincushion Pants', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Plasma Cannon', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Power Harness', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Rattler Boost Module Mk6', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Regis Burst Drillshot', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Regis Disruptor Pistol', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Regis Tripleshot Repeating Rifle', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Replica Pulse-knife', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Replica Pulse-sword', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Roc Carrier Wing', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Salusan Vengeance', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Sardaukar Intimidator', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Seethe', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Sentinel Belt', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: "Shaddam's Bladder", quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Shellburster', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: "Shishakli's Bite", quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Static Needle', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Steady Assault Boost Module Mk6', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Steady Carrier Boost Module Mk6', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Stormrider Boost Module Mk6', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Tabr Softstep Boots', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'The Ancient Way', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: "The Baron's Bloodbag", quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: "The Emperor's Wings Mk6", quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'The Forge Boots', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'The Forge Chestpiece', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'The Forge Gloves', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'The Forge Helmet', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'The Forge Pants', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Upgraded Regis Spice Container', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Vaporizer', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: "Villari's Stillsuit Boots", quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: "Villari's Stillsuit Garment", quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: "Villari's Stillsuit Gloves", quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: "Villari's Stillsuit Mask", quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Walker Sandcrawler Engine Mk6', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Way of the Misr', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Wayfinder Helm', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: 'Young Sparky Mk6', quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
  { name: "Yueh's Reaper Gloves", quantityHagga: 0, quantityDeepDesert: 0, icon: '❓', status: 'critical', lastUpdatedBy: 'PopulateResourceScript' },
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
      ...blueprints.map(r => ({ ...r, category: 'Blueprint' })),
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
    console.log(`- Blueprints: ${blueprints.length}`)
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
    ...blueprints.map(r => ({ ...r, category: 'Blueprint' })),
  ]

  allResources.forEach(resource => {
    const targetQuantity = estimateTarget(resource.quantityHagga, resource.status)
    const actualStatus = calculateStatus(resource.quantityHagga, targetQuantity)
    const id = nanoid()
    const now = Math.floor(Date.now() / 1000)

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