export type RawPartSeed = {
  partNumber: string;
  manufacturerPartNumber: string;
  name: string;
  description: string;
  applianceType: "refrigerator" | "dishwasher";
  brand: string;
  price: number;
  availability: "In stock" | "Limited stock" | "Out of stock";
  compatibleModels: string[];
  symptoms: string[];
  installationSteps: string[];
  sourceUrl: string;
  sourceType: "product" | "installation" | "troubleshooting" | "compatibility";
};

export const partsSeed: RawPartSeed[] = [
  {
    partNumber: "PS11752778",
    manufacturerPartNumber: "WPW10404050",
    name: "Dishwasher Door Gasket",
    description: "Creates a watertight seal around the dishwasher tub opening to prevent leaks.",
    applianceType: "dishwasher",
    brand: "Whirlpool",
    price: 39.99,
    availability: "In stock",
    compatibleModels: ["WDT780SAEM1"],
    symptoms: ["dishwasher leaking", "water dripping", "door seal leak"],
    installationSteps: [
      "Unplug the dishwasher or switch off the breaker.",
      "Open the door and remove the old gasket from the channel around the tub opening.",
      "Clean the channel so the new gasket seats evenly.",
      "Starting at the top center, press the new gasket into the channel all the way around.",
      "Close the door and run a short cycle to verify the seal."
    ],
    sourceUrl: "https://www.partselect.com/PS11752778-Whirlpool-Dishwasher-Door-Gasket.htm",
    sourceType: "product"
  },
  {
    partNumber: "WPW10300024",
    manufacturerPartNumber: "WPW10300024",
    name: "Refrigerator Ice Maker Assembly",
    description: "Automatic ice maker assembly for compatible Whirlpool refrigerators.",
    applianceType: "refrigerator",
    brand: "Whirlpool",
    price: 109.99,
    availability: "Limited stock",
    compatibleModels: ["WRS588FIHZ00", "WRX735SDHZ00", "WRF535SWHZ00"],
    symptoms: ["ice maker not working", "no ice", "ice cubes are small"],
    installationSteps: [
      "Disconnect power and remove the ice bin.",
      "Remove the mounting screws and unplug the ice maker harness.",
      "Transfer any mounting bracket or fill tube components if needed.",
      "Install the new assembly and reconnect the harness.",
      "Restore power and allow a full harvest cycle."
    ],
    sourceUrl: "https://www.partselect.com/Refrigerator-Ice-Maker-Assembly-WPW10300024.htm",
    sourceType: "product"
  },
  {
    partNumber: "W10408179",
    manufacturerPartNumber: "W10408179",
    name: "Refrigerator Water Inlet Valve",
    description: "Controls water flow to the ice maker and dispenser in compatible refrigerators.",
    applianceType: "refrigerator",
    brand: "Whirlpool",
    price: 64.95,
    availability: "In stock",
    compatibleModels: ["WRS588FIHZ00", "WRF535SWHZ00", "GI6SARXXF04"],
    symptoms: ["ice maker not working", "no water", "slow water flow"],
    installationSteps: [
      "Unplug the refrigerator and shut off the water supply.",
      "Remove the rear access panel.",
      "Disconnect the inlet and outlet water lines from the old valve.",
      "Move the wiring harness and install the replacement valve.",
      "Restore water, check for leaks, and test ice production."
    ],
    sourceUrl: "https://www.partselect.com/Refrigerator-Water-Inlet-Valve-W10408179.htm",
    sourceType: "product"
  },
  {
    partNumber: "WPW10448645",
    manufacturerPartNumber: "WPW10448645",
    name: "Dishwasher Lower Spray Arm",
    description: "Rotating spray arm that distributes wash water to the lower rack.",
    applianceType: "dishwasher",
    brand: "Whirlpool",
    price: 28.5,
    availability: "In stock",
    compatibleModels: ["WDT780SAEM1", "WDF520PADM7", "WDT730PAHZ0"],
    symptoms: ["poor cleaning", "dishes still dirty", "spray arm broken"],
    installationSteps: [
      "Open the dishwasher and remove the lower rack.",
      "Unscrew or unclip the center retaining nut on the spray arm.",
      "Lift off the old spray arm and inspect the wash hub for debris.",
      "Install the new spray arm and secure the retainer.",
      "Spin it by hand to confirm clearance before running a cycle."
    ],
    sourceUrl: "https://www.partselect.com/Dishwasher-Lower-Spray-Arm-WPW10448645.htm",
    sourceType: "product"
  },
  {
    partNumber: "WPW10195417V",
    manufacturerPartNumber: "WPW10195417V",
    name: "Dishwasher Rack Wheel",
    description: "Replacement wheel that supports smooth movement of the dishwasher rack.",
    applianceType: "dishwasher",
    brand: "Whirlpool",
    price: 12.99,
    availability: "In stock",
    compatibleModels: ["WDT780SAEM1", "WDF520PADM7", "WDT730PAHZ0"],
    symptoms: ["rack not rolling", "rack falls off track", "rack wheel broken"],
    installationSteps: [
      "Pull the rack out until the damaged wheel is accessible.",
      "Release the old wheel from the rack rail.",
      "Snap the replacement wheel into place.",
      "Test the rack movement on both rails.",
      "Reinstall the rack and confirm smooth travel."
    ],
    sourceUrl: "https://www.partselect.com/Dishwasher-Rack-Wheel-WPW10195417V.htm",
    sourceType: "product"
  }
];
