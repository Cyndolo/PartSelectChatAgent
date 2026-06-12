export type RawTroubleshootingSeed = {
  issue: string;
  keywords: string[];
  diagnosticFlow: string[];
  possibleCauses: string[];
  likelyParts: string[];
  sourceUrl: string;
  sourceType: "troubleshooting";
};

export const troubleshootingSeed: RawTroubleshootingSeed[] = [
  {
    issue: "ice maker not working",
    keywords: ["ice maker not working", "no ice", "ice maker", "ice production"],
    diagnosticFlow: [
      "Confirm the freezer is cold enough and the ice maker is switched on.",
      "Check the water supply line for kinks, clogs, or low pressure.",
      "Inspect the fill tube for ice blockage.",
      "Listen for the inlet valve opening during a fill cycle.",
      "If the unit powers but does not harvest, the ice maker assembly may be failing."
    ],
    possibleCauses: [
      "Low water pressure or a blocked supply line",
      "Frozen fill tube",
      "Failed inlet valve",
      "Failed ice maker module"
    ],
    likelyParts: ["WPW10300024", "W10408179"],
    sourceUrl: "https://www.partselect.com/Repair/Refrigerator/Ice-Maker-Not-Working.htm",
    sourceType: "troubleshooting"
  },
  {
    issue: "dishwasher leaking",
    keywords: ["dishwasher leaking", "water dripping", "leak", "door leak"],
    diagnosticFlow: [
      "Inspect the door gasket for tears, flattening, or gaps.",
      "Make sure the door latches securely and the rack is not blocking the seal.",
      "Check for detergent overuse or overfilling that can cause foam leaks.",
      "Look underneath for loose hose connections if the leak persists.",
      "If the leak tracks around the door, the door gasket is the first part to test."
    ],
    possibleCauses: [
      "Flattened or torn door gasket",
      "Door not closing evenly",
      "Excess suds from too much detergent",
      "Loose hose connection"
    ],
    likelyParts: ["PS11752778"],
    sourceUrl: "https://www.partselect.com/Repair/Dishwasher/Leaking-Water.htm",
    sourceType: "troubleshooting"
  },
  {
    issue: "poor cleaning",
    keywords: ["poor cleaning", "dirty dishes", "dishes still dirty"],
    diagnosticFlow: [
      "Verify that the spray arms spin freely and are not clogged with debris.",
      "Clean the spray arm holes and filter screen.",
      "Confirm water temperature and detergent are appropriate.",
      "If the lower rack is receiving little water, inspect the lower spray arm hub."
    ],
    possibleCauses: [
      "Blocked spray arm",
      "Worn lower spray arm",
      "Clogged filter screen",
      "Low water circulation"
    ],
    likelyParts: ["WPW10448645"],
    sourceUrl: "https://www.partselect.com/Repair/Dishwasher/Poor-Cleaning.htm",
    sourceType: "troubleshooting"
  }
];
