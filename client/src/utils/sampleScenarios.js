/**
 * Pre-configured industrial benchmark presets with SVG-generated imagery.
 * Enables zero-setup 1-click end-to-end evaluation of the full Gemini Vision pipeline.
 */

export const SAMPLE_BENCHMARKS = [
  {
    id: "pcb-solder-bridge",
    domain: "MANUFACTURING_QC",
    title: "High-Density SMT PCB Micro-Inspection - Rev 4.2",
    assetIdentifier: "PCB-SMT-44091-B",
    facilityLocation: "Austin Advanced Fab, Cleanroom 2",
    complianceStandard: "IPC-A-610 Class 3",
    sensitivityLevel: "HIGH_PRECISION",
    operatorNotes: "Automated optical check detected potential solder bridging on IC pin header.",
    badge: "PCB Solder Defect",
    description: "Multi-layer circuit board with IC-2 showing conductive solder bridge across pins 14 & 15.",
    mimeType: "image/svg+xml",
    imageDataUrl: `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'>
      <rect width='800' height='600' fill='%230b1b14'/>
      <rect x='60' y='60' width='680' height='480' fill='%23064e3b' rx='16' stroke='%2310b981' stroke-width='3'/>
      <!-- Copper traces -->
      <path d='M100 120 L300 120 L340 180' stroke='%23eab308' stroke-width='4' fill='none'/>
      <path d='M100 160 L280 160 L320 220' stroke='%23eab308' stroke-width='4' fill='none'/>
      <path d='M100 480 L350 480 L380 430' stroke='%23eab308' stroke-width='4' fill='none'/>
      <!-- Test points -->
      <circle cx='140' cy='220' r='14' fill='%23fbbf24' stroke='%23b45309' stroke-width='2'/>
      <circle cx='190' cy='220' r='14' fill='%23fbbf24' stroke='%23b45309' stroke-width='2'/>
      <circle cx='140' cy='280' r='14' fill='%23fbbf24' stroke='%23b45309' stroke-width='2'/>
      <!-- Main IC Chip -->
      <rect x='340' y='180' width='260' height='180' fill='%230f172a' rx='8' stroke='%2364748b' stroke-width='3'/>
      <circle cx='365' cy='205' r='6' fill='%2394a3b8'/>
      <text x='385' y='275' fill='%23f8fafc' font-family='monospace' font-weight='bold' font-size='20'>ARM CORTEX-M7</text>
      <text x='410' y='305' fill='%2338bdf8' font-family='monospace' font-size='13'>STM32H743ZI</text>
      <!-- IC Pins (Top & Bottom) -->
      <rect x='360' y='360' width='16' height='26' fill='%23cbd5e1'/>
      <rect x='395' y='360' width='16' height='26' fill='%23cbd5e1'/>
      <rect x='430' y='360' width='16' height='26' fill='%23cbd5e1'/>
      <!-- Bridged Pins (14 & 15) -->
      <rect x='465' y='360' width='16' height='26' fill='%23ef4444'/>
      <rect x='500' y='360' width='16' height='26' fill='%23ef4444'/>
      <path d='M470 372 L510 372' stroke='%23ef4444' stroke-width='10' stroke-linecap='round'/>
      <rect x='535' y='360' width='16' height='26' fill='%23cbd5e1'/>
      <rect x='570' y='360' width='16' height='26' fill='%23cbd5e1'/>
      <!-- Silk Screen & Labels -->
      <rect x='90' y='505' width='380' height='28' fill='%2306281e' rx='4'/>
      <text x='105' y='525' fill='%2334d399' font-family='monospace' font-weight='bold' font-size='15'>SN: PCB-SMT-44091-B | LOT: 2026-X | RoHS</text>
    </svg>`,
  },
  {
    id: "civil-concrete-crack",
    domain: "INFRASTRUCTURE_CIVIL",
    title: "Bridge Pier 7 Structural Shear Crack & Spalling Survey",
    assetIdentifier: "ASSET-BRG-PIER-07",
    facilityLocation: "Interstate 35 Overpass, Sector 4",
    complianceStandard: "ASTM-E284 / ACI-224.1R",
    sensitivityLevel: "ZERO_TOLERANCE",
    operatorNotes: "High-resolution drone capture during quarterly highway substructure audit.",
    badge: "Concrete Bridge Crack",
    description: "Reinforced bridge pier showing deep diagonal shear fracture and localized surface spalling.",
    mimeType: "image/svg+xml",
    imageDataUrl: `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'>
      <rect width='800' height='600' fill='%23334155'/>
      <!-- Concrete Column Face -->
      <rect x='120' y='40' width='560' height='520' fill='%2364748b' stroke='%231e293b' stroke-width='6'/>
      <!-- Surface texture markings -->
      <circle cx='200' cy='120' r='18' fill='%23475569'/>
      <circle cx='540' cy='450' r='24' fill='%23475569'/>
      <!-- Main Structural Crack -->
      <path d='M280 140 Q380 260 340 370 T440 490' stroke='%230f172a' stroke-width='9' fill='none' stroke-linecap='round'/>
      <path d='M340 260 Q420 290 480 310' stroke='%230f172a' stroke-width='5' fill='none'/>
      <path d='M360 410 Q320 460 300 480' stroke='%230f172a' stroke-width='4' fill='none'/>
      <!-- Spalling zone -->
      <path d='M220 430 Q260 410 290 440 T270 480 Z' fill='%2394a3b8' stroke='%23475569' stroke-width='3'/>
      <!-- Asset ID Plate -->
      <rect x='150' y='65' width='210' height='45' fill='%23090d16' rx='4' stroke='%230ea5e9' stroke-width='2'/>
      <text x='165' y='94' fill='%2338bdf8' font-family='monospace' font-weight='bold' font-size='16'>PIER-07-NORTH-B4</text>
    </svg>`,
  },
  {
    id: "workplace-ppe-safety",
    domain: "WORKPLACE_SAFETY_EHS",
    title: "Forklift Corridor Personnel PPE & Hazard Audit",
    assetIdentifier: "ZONE-BAY4-CORRIDOR",
    facilityLocation: "Central Logistics Hub, Bay 4 Loading Dock",
    complianceStandard: "OSHA 1910.132 / ISO-45001",
    sensitivityLevel: "HIGH_PRECISION",
    operatorNotes: "Automated CCTV safety frame capture during active inventory transit shift.",
    badge: "Warehouse PPE Check",
    description: "Active loading dock corridor with operator missing ANSI hardhat and blocked emergency exit.",
    mimeType: "image/svg+xml",
    imageDataUrl: `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'>
      <rect width='800' height='600' fill='%231e293b'/>
      <!-- Floor & Yellow Safety Warning Strip -->
      <rect x='0' y='420' width='800' height='180' fill='%23334155'/>
      <path d='M0 420 L800 420' stroke='%23eab308' stroke-width='14' stroke-dasharray='30 20'/>
      <!-- OSHA Warning Sign on wall -->
      <rect x='80' y='60' width='280' height='100' fill='%23ffffff' rx='6' stroke='%23ef4444' stroke-width='4'/>
      <rect x='80' y='60' width='280' height='40' fill='%23ef4444' rx='4'/>
      <text x='150' y='88' fill='%23ffffff' font-family='sans-serif' font-weight='bold' font-size='20'>DANGER</text>
      <text x='95' y='125' fill='%230f172a' font-family='sans-serif' font-weight='bold' font-size='14'>HARD HATS & VESTS REQUIRED</text>
      <!-- Emergency Exit Door (Blocked) -->
      <rect x='620' y='180' width='130' height='240' fill='%2310b981' rx='4' stroke='%23064e3b' stroke-width='3'/>
      <text x='640' y='210' fill='%23ffffff' font-family='sans-serif' font-weight='bold' font-size='15'>EXIT</text>
      <!-- Stacked Pallets blocking exit -->
      <rect x='610' y='360' width='150' height='30' fill='%23b45309' stroke='%2378350f' stroke-width='2'/>
      <rect x='615' y='330' width='140' height='30' fill='%23b45309' stroke='%2378350f' stroke-width='2'/>
      <!-- Worker Figure (Missing Hardhat) -->
      <circle cx='340' cy='230' r='24' fill='%23fbcfe8' stroke='%23f43f5e' stroke-width='3'/> <!-- head without hardhat -->
      <path d='M305 270 L375 270 L385 410 L295 410 Z' fill='%232563eb'/> <!-- body/shirt -->
      <path d='M315 275 L365 275 L365 350 L315 350 Z' fill='%23eab308'/> <!-- high-vis vest -->
      <text x='290' y='190' fill='%23f43f5e' font-family='monospace' font-weight='bold' font-size='14'>[NO HARDHAT]</text>
    </svg>`,
  },
  {
    id: "gauge-overpressure",
    domain: "DOCUMENT_GAUGE_OCR",
    title: "High-Pressure Hydraulic Loop Gauge & Nameplate OCR",
    assetIdentifier: "GAUGE-HYD-8820",
    facilityLocation: "Turbine Hall 1, Steam Manifold B",
    complianceStandard: "ANSI-Z535 / NIST Calibration",
    sensitivityLevel: "HIGH_PRECISION",
    operatorNotes: "Operator reported pressure needle vibrating near the upper redline boundary.",
    badge: "Pressure Gauge Overpressure",
    description: "Analog pressure dial displaying needle excursion at 88 Bar with OCR calibration label.",
    mimeType: "image/svg+xml",
    imageDataUrl: `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'>
      <rect width='800' height='600' fill='%230f172a'/>
      <!-- Outer Dial Bezel -->
      <circle cx='400' cy='300' r='230' fill='%23334155' stroke='%2364748b' stroke-width='8'/>
      <circle cx='400' cy='300' r='205' fill='%23f8fafc' stroke='%230f172a' stroke-width='4'/>
      <!-- Dial Scale Arc (Green safe zone, Red warning zone) -->
      <circle cx='400' cy='300' r='180' fill='none' stroke='%2322c55e' stroke-width='16' stroke-dasharray='350 500' transform='rotate(135 400 300)'/>
      <circle cx='400' cy='300' r='180' fill='none' stroke='%23ef4444' stroke-width='16' stroke-dasharray='120 500' stroke-dashoffset='-350' transform='rotate(135 400 300)'/>
      <!-- Ticks and numbers -->
      <text x='250' y='360' fill='%230f172a' font-family='sans-serif' font-weight='bold' font-size='22'>0</text>
      <text x='250' y='240' fill='%230f172a' font-family='sans-serif' font-weight='bold' font-size='22'>25</text>
      <text x='385' y='170' fill='%230f172a' font-family='sans-serif' font-weight='bold' font-size='22'>50</text>
      <text x='510' y='240' fill='%230f172a' font-family='sans-serif' font-weight='bold' font-size='22'>75</text>
      <text x='510' y='360' fill='%23ef4444' font-family='sans-serif' font-weight='bold' font-size='24'>100</text>
      <text x='380' y='250' fill='%23475569' font-family='sans-serif' font-weight='bold' font-size='16'>BAR</text>
      <text x='365' y='275' fill='%2364748b' font-family='monospace' font-size='13'>WIKA 232.50</text>
      <!-- Defect: Needle pointing into red zone at 88.5 Bar -->
      <line x1='400' y1='300' x2='530' y2='315' stroke='%23dc2626' stroke-width='6' stroke-linecap='round'/>
      <circle cx='400' cy='300' r='16' fill='%230f172a'/>
      <!-- OCR Calibration Sticker -->
      <rect x='120' y='490' width='360' height='75' fill='%23e2e8f0' rx='6' stroke='%23475569' stroke-width='2'/>
      <text x='135' y='518' fill='%230f172a' font-family='monospace' font-weight='bold' font-size='14'>ASSET: GAUGE-HYD-8820</text>
      <text x='135' y='542' fill='%230f172a' font-family='monospace' font-size='13'>CALIB: NIST-TRACEABLE | DUE: 10/2026</text>
    </svg>`,
  },
];

