/* Raider Labs: In the News (data for news.html).
   Newest week first. To add a week: put its stories at the TOP of the array.
   Each story: id, week (YYYY-MM-DD, the Sunday it was added), date (event date),
   title, summary, numbers[] (each with its source link and date), concept{title,html},
   hook{prompt, parts[{label, answer, tol, unit, signHint?}], worked}, hides, evidence,
   investigate, related[{href, label}].
   Rules: every number has a source and date; label company-reported figures;
   name agencies and programs, never parties; no em dashes. */
window.RAIDER_NEWS = [
 {
  "id": "us-storage-200-gwh-2026",
  "week": "2026-11-22",
  "date": "2026-11-17",
  "title": "US battery storage passes 200 gigawatt-hours, with a record number of states setting records",
  "summary": "The Solar Energy Industries Association (SEIA) and Benchmark Mineral Intelligence reported that installed US energy storage, almost all of it lithium-ion batteries, has passed 200 gigawatt-hours. Batteries let solar power captured at noon be used after sunset.",
  "numbers": [
   "Installed US energy storage has passed 200 gigawatt-hours (GWh) (<a href=\"https://www.powermag.com/u-s-exceeds-200-gwh-of-installed-energy-storage-capacity/\" target=\"_blank\" rel=\"noopener\">POWER Magazine, reporting the SEIA and Benchmark Mineral Intelligence outlook, Nov 17, 2026</a>).",
   "14.3 GWh was added in July to September 2026: 12.2 GWh utility-scale, 1.3 GWh commercial and industrial, 746 MWh residential (<a href=\"https://www.powermag.com/u-s-exceeds-200-gwh-of-installed-energy-storage-capacity/\" target=\"_blank\" rel=\"noopener\">POWER Magazine, reporting the SEIA and Benchmark Mineral Intelligence outlook, Nov 17, 2026</a>).",
   "48.3 GWh was added in the first nine months of 2026, up 20% from the same months of 2025 (<a href=\"https://www.powermag.com/u-s-exceeds-200-gwh-of-installed-energy-storage-capacity/\" target=\"_blank\" rel=\"noopener\">POWER Magazine, reporting the SEIA and Benchmark Mineral Intelligence outlook, Nov 17, 2026</a>).",
   "The forecast for total US storage in 2030 was raised 3.7% to 708 GWh (<a href=\"https://www.powermag.com/u-s-exceeds-200-gwh-of-installed-energy-storage-capacity/\" target=\"_blank\" rel=\"noopener\">POWER Magazine, reporting the SEIA and Benchmark Mineral Intelligence outlook, Nov 17, 2026</a>).",
   "Top states for utility-scale storage added in Q3: Texas 12.3 GWh, Arizona 7.7 GWh, California 6.8 GWh; eleven states set records (<a href=\"https://www.powermag.com/u-s-exceeds-200-gwh-of-installed-energy-storage-capacity/\" target=\"_blank\" rel=\"noopener\">POWER Magazine, reporting the SEIA and Benchmark Mineral Intelligence outlook, Nov 17, 2026</a>). These state totals are as reported and may count a longer period than one quarter.",
   "The EIA expects large US battery power capacity to grow from 28.9 gigawatts (GW) in 2025 to 66 GW by the end of 2026 (<a href=\"https://www.energycentral.com/energy-biz/post/seia-eia-doe-storage-and-solar-soars-coal-contracts-emMzuD4OIqcZ4Kf\" target=\"_blank\" rel=\"noopener\">Energy Central, quoting the EIA Short-Term Energy Outlook, Nov 18, 2026</a>)."
  ],
  "concept": {
   "title": "Energy is not power: GWh vs GW",
   "html": "<b>Power</b> (watts) is how fast energy flows; <b>energy</b> (watt-hours or joules) is how much. They are linked by E = P &times; t. A battery rated 100 MW and 400 MWh can deliver 100 MW for 4 hours. Storage capacity is reported in GWh, while the size of power plants is reported in GW, so news stories often mix them up. 1 Wh = 3,600 J, so 1 GWh = 3.6 &times; 10<sup>12</sup> J."
  },
  "hook": {
   "prompt": "Use the reported numbers. Part (b) assumes, as a teaching example, that the new batteries are all 4-hour batteries.",
   "parts": [
    {
     "label": "(a) How many joules is 200 GWh? Give the answer in units of 10<sup>14</sup> J.",
     "answer": 7.2,
     "tol": 0.05,
     "unit": "&times; 10<sup>14</sup> J"
    },
    {
     "label": "(b) If the 14.3 GWh added in Q3 were all 4-hour batteries, what total power could they deliver at once?",
     "answer": 3.575,
     "tol": 0.02,
     "unit": "GW"
    },
    {
     "label": "(c) 48.3 GWh in the first nine months of 2026 was 20% more than the same months of 2025. How much was added in those months of 2025?",
     "answer": 40.25,
     "tol": 0.1,
     "unit": "GWh"
    }
   ],
   "worked": "(a) 200 &times; 10<sup>9</sup> Wh &times; 3,600 J/Wh = 7.2 &times; 10<sup>14</sup> J, so <b>7.2</b>. (b) P = E &divide; t = 14.3 GWh &divide; 4 h = <b>3.575 GW</b>, about three large power plants for 4 hours. (c) 48.3 &divide; 1.20 = <b>40.25 GWh</b> (not 48.3 &times; 0.8 = 38.6)."
  },
  "hides": "The hook gives the minimum lithium that must move; real cells hold more lithium than they cycle, and packs also need iron, phosphate, graphite, copper and aluminum. Mining those materials has its own environmental and community costs. A record in storage capacity (GWh) is not the same as how much energy is actually delivered, which depends on how often the batteries cycle. SEIA is an industry group, and the outlook's falling wholesale prices in Texas and California (42% and 51% since 2021) are an association, not proof that batteries caused the drop.",
  "evidence": "Moderate: an industry market report with an independent analytics firm, read through trade-press coverage, not the report itself. The EIA capacity numbers are federal forecasts.",
  "investigate": "The <a href=\"https://www.eia.gov/electricity/data/browser/\" target=\"_blank\" rel=\"noopener\">EIA Electricity Data Browser</a> shows generation by source for each state. Pick Texas or California and compare solar generation in a summer month of 2021 and 2025. How much did it grow?",
  "related": [
   {
    "href": "index.html#power",
    "label": "Work and power"
   },
   {
    "href": "index.html#capacitor",
    "label": "Capacitors and RC circuits"
   }
  ]
 },
 {
  "id": "eia-record-generation-2026",
  "week": "2026-11-15",
  "date": "2026-11-10",
  "title": "US electricity generation heads for a record in 2026, with solar supplying most of the growth",
  "summary": "The US Energy Information Administration (EIA) expects the country to generate a record amount of electricity in 2026. Utility-scale solar provides most of the increase, and its share keeps rising into 2027 while coal's share falls.",
  "numbers": [
   "Almost 4,390 billion kWh expected in 2026, a record, up 2.7% from 2025 (<a href=\"https://www.eia.gov/pressroom/releases/press594.php\" target=\"_blank\" rel=\"noopener\">EIA Short-Term Energy Outlook release, Nov 10, 2026</a>).",
   "Solar's share of generation: 7% in 2025, 8% in 2026, 10% in 2027 (forecast) (<a href=\"https://www.eia.gov/pressroom/releases/press594.php\" target=\"_blank\" rel=\"noopener\">EIA, Nov 10, 2026</a>).",
   "Wind: 11% in 2025 and 2026, 12% in 2027 (<a href=\"https://www.eia.gov/pressroom/releases/press594.php\" target=\"_blank\" rel=\"noopener\">EIA, Nov 10, 2026</a>).",
   "Coal: 17% in 2025, 15% in 2026 and 2027 (<a href=\"https://www.eia.gov/pressroom/releases/press594.php\" target=\"_blank\" rel=\"noopener\">EIA, Nov 10, 2026</a>).",
   "Natural gas 40% and nuclear 18% of generation in 2026 (<a href=\"https://www.eia.gov/pressroom/releases/press594.php\" target=\"_blank\" rel=\"noopener\">EIA, Nov 10, 2026</a>)."
  ],
  "concept": {
   "title": "Energy is power &times; time",
   "html": "A <b>kilowatt-hour</b> (kWh) is the energy used by 1,000 watts running for one hour: 1 kWh = 1,000 J/s &times; 3,600 s = 3.6 &times; 10<sup>6</sup> J. Power plants are rated in watts (how fast they deliver energy); a year's generation is in kWh (how much energy in total). Divide a year's energy by the 8,760 hours in a year to get the average power the grid delivered."
  },
  "hook": {
   "prompt": "Use EIA's forecast of 4,390 billion kWh for 2026.",
   "parts": [
    {
     "label": "(a) At 8%, how much electricity will solar generate in 2026, in billion kWh?",
     "answer": 351.2,
     "tol": 1,
     "unit": "billion kWh"
    },
    {
     "label": "(b) Convert 4,390 billion kWh to joules. Give the number in front of &times; 10<sup>19</sup> J.",
     "answer": 1.58,
     "tol": 0.01,
     "unit": "× 10¹⁹ J"
    },
    {
     "label": "(c) What average power does that energy over one year (8,760 h) represent, in gigawatts?",
     "answer": 501,
     "tol": 2,
     "unit": "GW"
    }
   ],
   "worked": "(a) 0.08 &times; 4,390 = <b>351.2 billion kWh</b>. (b) 4,390 &times; 10<sup>9</sup> kWh &times; 3.6 &times; 10<sup>6</sup> J/kWh = 1.580 &times; 10<sup>19</sup> J, so <b>1.58</b>. (c) 4.39 &times; 10<sup>12</sup> kWh &divide; 8,760 h = 5.01 &times; 10<sup>8</sup> kW = <b>501 GW</b> on average. Demand swings far above and below that average across a day and a year, so the grid needs more capacity than 501 GW."
  },
  "hides": "These are forecasts, and EIA says the figures are subject to final review. A share of <i>generation</i> is not a share of <i>capacity</i>: a solar farm makes power only in daylight, so it produces less per watt of capacity than a plant that can run all day. A record total also means demand is growing; more generation is not by itself a sign of less pollution.",
  "evidence": "Moderate to strong: an official federal forecast from the main US energy statistics agency, read directly on its press release. It is a projection, not a final count.",
  "investigate": "The <a href=\"https://www.eia.gov/electricity/data/browser/\" target=\"_blank\" rel=\"noopener\">EIA Electricity Data Browser</a> shows generation by source for each state. Look up Colorado: what share came from wind and solar last year?",
  "related": [
   {
    "href": "index.html#power",
    "label": "Work and power"
   },
   {
    "href": "index.html#induction",
    "label": "Electromagnetic induction"
   }
  ]
 },
 {
  "id": "germany-ev-2026",
  "week": "2026-11-08",
  "date": "2026-11-04",
  "title": "Germany's electric car share hits a record 37%",
  "summary": "Germany's federal motor vehicle authority (KBA) released October 2026 registrations. Battery-electric cars outsold gasoline and diesel cars combined for the second month in a row.",
  "numbers": [
   "94,086 battery-electric cars were registered in October 2026, up 79.5% from 52,425 in October 2025 (<a href=\"https://electrek.co/2026/11/04/germany-electric-car-sales-record-37-percent-share/\" target=\"_blank\" rel=\"noopener\">KBA data as reported by Electrek, Nov 4, 2026</a>).",
   "Total new cars: 254,492. Gasoline: 38,516 (15.1%). Diesel: 23,882 (9.4%) (<a href=\"https://electrek.co/2026/11/04/germany-electric-car-sales-record-37-percent-share/\" target=\"_blank\" rel=\"noopener\">KBA data as reported by Electrek, Nov 4, 2026</a>).",
   "Average new-car CO<sub>2</sub> emissions: 79.4 g/km, down 21.1% from a year earlier (<a href=\"https://electrek.co/2026/11/04/germany-electric-car-sales-record-37-percent-share/\" target=\"_blank\" rel=\"noopener\">KBA data as reported by Electrek, Nov 4, 2026</a>).",
   "Context: a new government purchase subsidy of EUR 3,000 for a new battery-electric car (<a href=\"https://electrek.co/2026/11/04/germany-electric-car-sales-record-37-percent-share/\" target=\"_blank\" rel=\"noopener\">KBA data as reported by Electrek, Nov 4, 2026</a>)."
  ],
  "concept": {
   "title": "Where the energy goes",
   "html": "A car turns stored energy (chemical energy in fuel, or electrical energy in a battery) into kinetic energy. Energy is conserved, but not all of it becomes motion: an engine turns most of the fuel's energy into heat, while an electric motor turns most of the battery's energy into motion. Efficiency = useful energy out &divide; energy in. Fewer engines means fewer grams of tailpipe CO<sub>2</sub> per km."
  },
  "hook": {
   "prompt": "(a) Check the 37% share: what percent of October's new cars were battery-electric? (b) Average CO₂ fell 21.1% to 79.4 g/km. What was it a year earlier?",
   "parts": [
    {
     "label": "(a) Battery-electric share of new cars",
     "answer": 37.0,
     "tol": 0.2,
     "unit": "%"
    },
    {
     "label": "(b) Average CO₂ a year earlier",
     "answer": 100.6,
     "tol": 0.3,
     "unit": "g/km"
    }
   ],
   "worked": "(a) 94,086 &divide; 254,492 = 0.3697, about <b>37.0%</b>. (b) A 21.1% drop leaves 78.9%, so a year earlier = 79.4 &divide; 0.789 = <b>100.6 g/km</b>."
  },
  "hides": "Tailpipe CO<sub>2</sub> is not the whole story: an electric car's lifetime emissions depend on how its electricity and battery are made. One record month, partly driven by a new subsidy, is not yet a long-term trend.",
  "evidence": "Strong data, secondhand summary. The numbers are official government registration data, read through a trade-press article; the KBA release itself was not read.",
  "investigate": "The U.S. Department of Energy's <a href=\"https://afdc.energy.gov/data\" target=\"_blank\" rel=\"noopener\">Alternative Fuels Data Center</a> has electric vehicle registrations by state. How does Colorado's share compare with Germany's?",
  "related": [
   {
    "href": "index.html#power",
    "label": "Work and power"
   }
  ]
 }
];
