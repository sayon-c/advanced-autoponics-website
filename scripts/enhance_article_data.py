#!/usr/bin/env python3
"""Inject stats strips, concrete numbers, and SVG/CSS charts into article pages."""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ARTICLES_DIR = ROOT / "articles"

# Bodies include stats, charts, and attributed ranges from 2024–2026 industry coverage
# (AGEYE, CEAg World / trade press, iGrow-style summaries). Hedge language preserved.

BODIES: dict[str, str] = {
    "why-vertical-farms-are-failing": r"""
<div class="article-stats" role="group" aria-label="Key figures">
  <div class="article-stats__item"><p class="article-stats__value">~$2.8B → $290M</p><p class="article-stats__label">Disclosed CEA funding, 2021 peak vs 2025</p></div>
  <div class="article-stats__item"><p class="article-stats__value">~90%</p><p class="article-stats__label">Funding drop cited in 2025 reviews</p></div>
  <div class="article-stats__item"><p class="article-stats__value">14</p><p class="article-stats__label">CEA-related bankruptcies noted for 2025</p></div>
</div>

<p>Over the last decade, vertical farming attracted enormous capital and even larger headlines. Some facilities produced beautiful crops. Many still could not produce a durable business. Closures and pivots followed — and with them, a useful industry reckoning: controlled environment agriculture is not a real-estate narrative. It is an operations and automation problem.</p>

<p>Industry year-in-review coverage of 2025 put hard numbers on the reset: disclosed funding on the order of roughly <strong>$290 million</strong> versus a peak near <strong>$2.8 billion in 2021</strong> — about a 90% decline — alongside roughly <strong>14 bankruptcies</strong> among indoor farming and related CEA operators. Those figures vary by methodology, but the direction is unambiguous.</p>

<figure class="article-chart" aria-labelledby="chart-vf-funding-title">
  <figcaption class="article-chart__title" id="chart-vf-funding-title">Disclosed CEA funding (illustrative)</figcaption>
  <p class="article-chart__subtitle">Peak vs. correction year · USD</p>
  <svg class="article-chart__svg" viewBox="0 0 360 160" role="img" aria-label="Bar chart comparing about 2.8 billion dollars in 2021 to about 290 million in 2025">
    <line class="chart-grid" x1="48" y1="28" x2="340" y2="28"/>
    <line class="chart-grid" x1="48" y1="68" x2="340" y2="68"/>
    <line class="chart-grid" x1="48" y1="108" x2="340" y2="108"/>
    <line class="chart-axis" x1="48" y1="20" x2="48" y2="128"/>
    <line class="chart-axis" x1="48" y1="128" x2="340" y2="128"/>
    <rect class="chart-bar" x="90" y="30" width="72" height="98"/>
    <rect class="chart-bar chart-bar--muted" x="210" y="112" width="72" height="16"/>
    <text class="chart-value" x="126" y="24" text-anchor="middle">~$2.8B</text>
    <text class="chart-value" x="246" y="106" text-anchor="middle">~$290M</text>
    <text x="126" y="148" text-anchor="middle">2021 peak</text>
    <text x="246" y="148" text-anchor="middle">2025</text>
  </svg>
  <p class="article-chart__footnote">Sources summarized from 2025 industry reviews (e.g. AGEYE / trade press). Exact tallies differ by what counts as “disclosed.”</p>
</figure>

<p>Understanding why vertical farms are failing (or struggling) is the first step toward building facilities that last. The future belongs to growers who treat automation as infrastructure, not as a slide-deck feature.</p>

<h2>Capital intensity without operational clarity</h2>
<p>Indoor farms carry heavy fixed costs: facility build-out, HVAC, lighting, racking, and skilled labor. Those costs only make sense when utilization, yield consistency, and labor hours per kilogram stay inside a tight band. Too many projects optimized for square footage and brand imagery before they optimized for visibility into what the facility was actually doing hour by hour.</p>
<p>When climate, irrigation, and nutrient systems do not share a common data layer, operators fill the gaps with walkthroughs and spreadsheets. That works at pilot scale. It collapses when you multiply rooms, shifts, and SKUs.</p>

<figure class="article-chart" aria-labelledby="chart-vf-fail-stack-title">
  <figcaption class="article-chart__title" id="chart-vf-fail-stack-title">Where stressed vertical ops usually break</figcaption>
  <p class="article-chart__subtitle">Typical stress share of OpEx · illustrative ranges</p>
  <div class="article-chart__stack">
    <div class="article-chart__stack-bar" role="img" aria-label="Stacked bar: energy about 35 percent, labor about 30 percent, other about 35 percent">
      <span class="article-chart__stack-seg" style="--w:35%; --seg:var(--accent)"></span>
      <span class="article-chart__stack-seg" style="--w:30%; --seg:#9a9a9a"></span>
      <span class="article-chart__stack-seg" style="--w:35%; --seg:#d8d8d8"></span>
    </div>
    <ul class="article-chart__legend">
      <li><span class="article-chart__swatch" style="--swatch:var(--accent)"></span>Energy ~25–40%+</li>
      <li><span class="article-chart__swatch" style="--swatch:#9a9a9a"></span>Labor ~20–35%</li>
      <li><span class="article-chart__swatch" style="--swatch:#d8d8d8"></span>Other OpEx</li>
    </ul>
  </div>
  <p class="article-chart__footnote">Ranges commonly cited across CEA operator surveys and energy analyses; facility mix varies widely.</p>
</figure>

<h2>Energy and climate are not side quests</h2>
<p>Lighting and HVAC dominate operating expense in many vertical systems — often cited in the mid-twenties to forty-plus percent of OpEx when power tariffs bite. If setpoint strategy, dehumidification, and airflow are managed separately from irrigation and crop stage, energy waste and crop stress travel together. The farms that survive treat climate and fertigation as one control problem — with protocols that connect mechanical systems to grow automation instead of isolating them in a BMS silo.</p>

<h2>Automation theater vs. automation that runs</h2>
<p>Buying sensors is easy. Buying dashboards is easy. Running a facility where issues are detected before they hit yield is hard. Many vertical farms deployed partial automation: a climate controller here, a dosing skid there, a cloud app that only worked when someone remembered to check it. Without on-site intelligence and a unified model, “automation” became another place to look when something went wrong.</p>
<p>Advanced Autoponics’ view is straightforward: operators should not run blind. Controller-level AI and a cloud command center only matter if they reduce guesswork in daily work — catching drift, predicting problems, and keeping every facility on the same network of truth.</p>

<h2>What the future of farming automation looks like</h2>
<ul>
  <li><strong>Brand-agnostic integration.</strong> Facilities will keep mixed equipment. Rip-and-replace is rarely affordable. Open protocols and a unified data layer win.</li>
  <li><strong>Edge + cloud together.</strong> Local controllers keep the crop safe when connectivity drops; cloud systems like <a href="/#geminy">Geminy IoT</a> give multi-site visibility and command.</li>
  <li><strong>Predictive visibility over raw logs.</strong> Teams need plain-language summaries and anomaly alerts, not walls of sensor noise. See <a href="/articles/predictive-ai-for-grow-room-anomaly-detection/">predictive AI for grow-room anomaly detection</a>.</li>
  <li><strong>Faster modernization paths.</strong> New builds and retrofits both need deployment measured in weeks, with troubleshooting that does not require a custom software team. Related: <a href="/articles/full-automation-without-custom-development/">full automation without custom development</a>.</li>
</ul>

<h2>Vertical is not dead — fragile ops stacks are</h2>
<p>Indoor and vertical production still makes sense for the right crops, markets, and energy contexts. What failed was the assumption that hardware alone creates a business. The winners will look more like industrial plants than lifestyle brands: standardized controls, continuous monitoring, and automation that adapts as the operation scales. For the mid-decade picture, see <a href="/articles/vertical-farming-after-the-hype/">vertical farming after the hype</a> and <a href="/articles/vertical-farming-energy-unit-economics/">energy and unit economics</a>.</p>
<p>Advanced Autoponics builds that stack — from on-site controllers and industrial protocols to a unified platform and Geminy in the cloud. Explore the <a href="/#platform">platform layers</a> or <a href="/#solution">our approach</a> to connecting disconnected systems.</p>

<p>If you are planning a CEA build, a retrofit, or a post-mortem on an underperforming site, talk to us about turning automation into an operating system — not a collection of apps. <a href="/#contact">Book a demo</a> · <a href="mailto:info@advancedautoponics.com">info@advancedautoponics.com</a> · <a href="tel:+16083200213">(608) 320-0213</a>.</p>
<p class="article-footnote">Funding and bankruptcy figures referenced above are drawn from widely cited 2025 CEA industry reviews; treat them as order-of-magnitude context, not audited company financials.</p>
""",
    "vertical-farming-energy-unit-economics": r"""
<div class="article-stats" role="group" aria-label="Key figures">
  <div class="article-stats__item"><p class="article-stats__value">25–40%+</p><p class="article-stats__label">Energy share of OpEx in many VF sites</p></div>
  <div class="article-stats__item"><p class="article-stats__value">~50–70%</p><p class="article-stats__label">Lighting share of indoor power draw</p></div>
  <div class="article-stats__item"><p class="article-stats__value">2×+</p><p class="article-stats__label">Horticultural LED efficacy gains vs early 2010s</p></div>
</div>

<p>Vertical farming’s hardest lesson of the mid-2020s was not botanical. It was economic. Industry coverage of 2025 described a wave of restructurings and exits among capital-intensive indoor growers, alongside a sharp pullback in late-stage venture funding from the early-decade peak. The common thread was unit economics: facilities that could not keep energy, labor, and yield inside a workable band could not outrun their fixed costs.</p>

<p>Energy sits at the center of that story. In fully lit vertical systems, electricity is often reported as roughly a quarter to more than two-fifths of operating expense — and lighting commonly accounts for about half to two-thirds of that power draw, with HVAC close behind. Those are ranges, not guarantees: tariff structure, crop, and climate strategy move the needle.</p>

<figure class="article-chart" aria-labelledby="chart-energy-opex-title">
  <figcaption class="article-chart__title" id="chart-energy-opex-title">Illustrative indoor OpEx mix</figcaption>
  <p class="article-chart__subtitle">Energy-heavy vertical leaf production · share of OpEx</p>
  <ul class="article-chart__bars">
    <li class="article-chart__bar-row"><span class="article-chart__bar-label">Energy</span><span class="article-chart__bar-track"><span class="article-chart__bar-fill" style="--bar:72%"></span></span><span class="article-chart__bar-value">~35%</span></li>
    <li class="article-chart__bar-row"><span class="article-chart__bar-label">Labor</span><span class="article-chart__bar-track"><span class="article-chart__bar-fill" style="--bar:56%"></span></span><span class="article-chart__bar-value">~28%</span></li>
    <li class="article-chart__bar-row"><span class="article-chart__bar-label">Consumables</span><span class="article-chart__bar-track"><span class="article-chart__bar-fill article-chart__bar-fill--muted" style="--bar:36%"></span></span><span class="article-chart__bar-value">~18%</span></li>
    <li class="article-chart__bar-row"><span class="article-chart__bar-label">Other</span><span class="article-chart__bar-track"><span class="article-chart__bar-fill article-chart__bar-fill--muted" style="--bar:38%"></span></span><span class="article-chart__bar-value">~19%</span></li>
  </ul>
  <p class="article-chart__footnote">Composite of ranges commonly reported in CEA energy and labor discussions (2024–2026). Not a single-facility audit.</p>
</figure>

<h2>Why energy decides indoor margins</h2>
<p>Indoor farms replace free sunlight with electricity. When lighting, humidity, and temperature control are scheduled independently — or worse, managed by walkthroughs and sticky notes — you pay for over-lighting, over-cooling, and fighting your own dehumidification load.</p>
<p>Field evaluations of smart CEA controls have shown that strategies such as automated daily light integral (DLI) management and variable-speed ventilation can unlock large electricity savings versus static schedules — sometimes cited in the teens to thirty-plus percent depending on baseline. The exact percentage depends on crop, climate zone, and equipment — but the direction is clear: integrated controls are how you protect contribution margin.</p>

<figure class="article-chart" aria-labelledby="chart-kwh-compare-title">
  <figcaption class="article-chart__title" id="chart-kwh-compare-title">Energy intensity by production method</figcaption>
  <p class="article-chart__subtitle">Approx. kWh per kg lettuce · published order-of-magnitude ranges</p>
  <ul class="article-chart__bars">
    <li class="article-chart__bar-row"><span class="article-chart__bar-label">Open field</span><span class="article-chart__bar-track"><span class="article-chart__bar-fill article-chart__bar-fill--muted" style="--bar:4%"></span></span><span class="article-chart__bar-value">1–5</span></li>
    <li class="article-chart__bar-row"><span class="article-chart__bar-label">Hi-tech GH</span><span class="article-chart__bar-track"><span class="article-chart__bar-fill" style="--bar:14%"></span></span><span class="article-chart__bar-value">5–40</span></li>
    <li class="article-chart__bar-row"><span class="article-chart__bar-label">Vertical</span><span class="article-chart__bar-track"><span class="article-chart__bar-fill" style="--bar:100%"></span></span><span class="article-chart__bar-value">~150–350+</span></li>
  </ul>
  <p class="article-chart__footnote">Order-of-magnitude ranges echoed in CEA energy analyses and secondary summaries (e.g. ScienceDirect / trade roundups). Optimized sites can sit lower; poor controls sit higher.</p>
</figure>

<h2>Unit economics is an operations stack problem</h2>
<p>Survivors in the post-hype market tend to share habits that look more like manufacturing than tech storytelling:</p>
<ul>
  <li><strong>Prove cost per harvestable unit before scaling rooms.</strong> Square footage without utilization and yield consistency is a liability.</li>
  <li><strong>Locate for power and logistics, not only for brand proximity.</strong> High retail density does not help if your tariff structure makes leafy greens uncompetitive.</li>
  <li><strong>Choose crops and formats that can carry the energy bill.</strong> Commodity lettuce at thin premiums is a brutal test of every kilowatt.</li>
  <li><strong>Instrument the facility like a plant, not a showroom.</strong> If you cannot see lighting, climate, and fertigation on one timeline, you cannot manage cost.</li>
</ul>

<h2>Where automation and data actually move the needle</h2>
<p>Buying more efficient LEDs helps — horticultural fixture efficacy has roughly doubled versus early-2010s baselines in many product lines. So do better HVAC designs. But hardware efficiency plateaus if the control layer still runs open-loop. The next gains come from coupling lighting setpoints, VPD strategy, irrigation events, and equipment state into one operational model — then letting edge intelligence flag drift before it becomes crop loss or wasted runtime.</p>
<p>That is the Advanced Autoponics lens: a <a href="/#platform">unified data layer</a> across climate, irrigation, and sensors; controller-level AI for anomaly detection; and <a href="/#geminy">Geminy IoT</a> as the multi-site command center. Protocols such as BACnet, Modbus, and MQTT are how existing mechanical and grow systems join that model without a rip-and-replace. Related: <a href="/articles/bacnet-integration-for-cea/">BACnet integration for CEA</a> and <a href="/articles/unified-data-layer-for-greenhouses/">unified data layer for greenhouses</a>.</p>

<h2>A practical energy discipline checklist</h2>
<ol>
  <li>Map the top energy consumers by zone and by crop recipe — not only by utility meter.</li>
  <li>Correlate kWh with yield and quality so “savings” that hurt marketable product get caught early.</li>
  <li>Replace static photoperiods with DLI-aware or stage-aware lighting strategies where fixtures and controls allow.</li>
  <li>Coordinate dehumidification and irrigation so you are not paying to remove water you just added.</li>
  <li>Keep safety and mechanical interlocks with the BMS while CEA automation owns grow-relevant setpoints and visibility.</li>
</ol>

<h2>The 2026 reality</h2>
<p>Capital markets remain selective for unprofitable indoor operators. LED efficiency has improved versus earlier this decade, and automation costs continue to fall as industrial robotics and configurable controls migrate into agriculture — but none of that substitutes for a facility that can see and control its cost drivers in real time.</p>
<p>Vertical farming is not over. Fragile energy ops stacks are. If your team still discovers overruns on the utility bill or after a quality complaint, you do not have an energy strategy — you have a lagging indicator.</p>

<p>Talk with Advanced Autoponics about tying lighting, climate, and fertigation into one control surface. <a href="/#contact">Book a demo</a> · <a href="mailto:info@advancedautoponics.com">info@advancedautoponics.com</a> · <a href="tel:+16083200213">(608) 320-0213</a>.</p>
<p class="article-footnote">OpEx and kWh/kg figures are illustrative ranges from industry analyses and secondary coverage — always validate against your tariff, crop, and facility audit.</p>
""",
    "vertical-farming-after-the-hype": r"""
<div class="article-stats" role="group" aria-label="Key figures">
  <div class="article-stats__item"><p class="article-stats__value">~$290M</p><p class="article-stats__label">Disclosed CEA funding cited for 2025</p></div>
  <div class="article-stats__item"><p class="article-stats__value">14</p><p class="article-stats__label">Bankruptcies flagged in 2025 reviews</p></div>
  <div class="article-stats__item"><p class="article-stats__value">188</p><p class="article-stats__label">Global CEA announcements tracked in 2025</p></div>
</div>

<p>For roughly a decade, vertical farming sold a story of inevitable disruption: infinite local greens, software-like scale, and venture returns. Then the bill came due. Industry year-in-review reporting on 2025 described numerous bankruptcies and exits, a collapse in disclosed funding versus the 2021 peak (on the order of <strong>$290M vs ~$2.8B</strong>), and a decisive end to the “raise big, scale fast, figure out economics later” playbook.</p>

<figure class="article-chart" aria-labelledby="chart-hype-funding-title">
  <figcaption class="article-chart__title" id="chart-hype-funding-title">Funding reset after the boom</figcaption>
  <p class="article-chart__subtitle">Illustrative disclosed funding · USD billions</p>
  <svg class="article-chart__svg" viewBox="0 0 360 170" role="img" aria-label="Line chart showing funding rising to about 2.8 billion in 2021 then falling toward 0.29 billion in 2025">
    <line class="chart-grid" x1="40" y1="30" x2="340" y2="30"/>
    <line class="chart-grid" x1="40" y1="70" x2="340" y2="70"/>
    <line class="chart-grid" x1="40" y1="110" x2="340" y2="110"/>
    <line class="chart-axis" x1="40" y1="20" x2="40" y2="130"/>
    <line class="chart-axis" x1="40" y1="130" x2="340" y2="130"/>
    <polyline class="chart-line" points="60,118 120,70 180,28 240,78 300,118"/>
    <circle class="chart-dot" cx="180" cy="28" r="3.5"/>
    <circle class="chart-dot" cx="300" cy="118" r="3.5"/>
    <text class="chart-value" x="180" y="18" text-anchor="middle">~$2.8B</text>
    <text class="chart-value" x="300" y="108" text-anchor="middle">~$0.29B</text>
    <text x="60" y="150" text-anchor="middle">2019</text>
    <text x="180" y="150" text-anchor="middle">2021</text>
    <text x="300" y="150" text-anchor="middle">2025</text>
  </svg>
  <p class="article-chart__footnote">Shape based on widely cited peak-vs-2025 disclosed funding comparisons; intermediate years are schematic.</p>
</figure>

<p>That was painful. It was also clarifying. The question for 2026 is no longer whether indoor farming can grow plants. It is which operating models survive contact with power prices, labor markets, and retailers who pay for reliability — not slides.</p>

<h2>What the shakeout actually selected for</h2>
<p>Companies that endured tended to emphasize operational discipline over narrative: focused crop strategies, secured distribution, patient capacity expansion, and cost structures that could work at current scale. Consolidation also accelerated — mergers and platform combinations that pool technology, facilities, and retail reach instead of building every capability from scratch.</p>
<p>Greenhouse-scale CEA operators, including large hybrid platforms assembled through acquisition, continue to demonstrate that sunlight-assisted production remains the volume backbone of controlled environment produce. Vertical capacity persists where the crop, market, and energy context justify it — not as a universal replacement for field agriculture.</p>

<figure class="article-chart" aria-labelledby="chart-hype-survive-title">
  <figcaption class="article-chart__title" id="chart-hype-survive-title">What survivors prioritize</figcaption>
  <p class="article-chart__subtitle">Relative emphasis · schematic score</p>
  <ul class="article-chart__bars">
    <li class="article-chart__bar-row"><span class="article-chart__bar-label">Unit economics</span><span class="article-chart__bar-track"><span class="article-chart__bar-fill" style="--bar:95%"></span></span><span class="article-chart__bar-value">High</span></li>
    <li class="article-chart__bar-row"><span class="article-chart__bar-label">Energy control</span><span class="article-chart__bar-track"><span class="article-chart__bar-fill" style="--bar:88%"></span></span><span class="article-chart__bar-value">High</span></li>
    <li class="article-chart__bar-row"><span class="article-chart__bar-label">Retail proof</span><span class="article-chart__bar-track"><span class="article-chart__bar-fill" style="--bar:80%"></span></span><span class="article-chart__bar-value">High</span></li>
    <li class="article-chart__bar-row"><span class="article-chart__bar-label">Narrative scale</span><span class="article-chart__bar-track"><span class="article-chart__bar-fill article-chart__bar-fill--muted" style="--bar:22%"></span></span><span class="article-chart__bar-value">Low</span></li>
  </ul>
  <p class="article-chart__footnote">Qualitative synthesis of post-2025 operator and investor commentary — not a survey instrument.</p>
</figure>

<h2>What failed was not “tech” — it was incomplete systems</h2>
<p>Many failed projects had impressive hardware. Fewer had a coherent operating system: shared data across climate and fertigation, predictive awareness, and automation that reduced labor and energy waste under real tariffs. Dashboards without a unified model became another place to look when something went wrong. For the deeper ops diagnosis, see <a href="/articles/why-vertical-farms-are-failing/">why vertical farms are failing</a>.</p>

<h2>The intelligence layer is now a competitive asset</h2>
<p>As capital stays selective, advantages compound for teams that treat every cycle as a data-generating event. Recipe tuning, equipment failure prediction, and energy optimization all depend on a durable schema — zones, assets, quality flags, and time series that mean the same thing across sites. That is why a <a href="/articles/unified-data-layer-for-greenhouses/">unified data layer</a> is not an IT nice-to-have; it is how institutional knowledge survives shift changes and facility expansion.</p>
<p>AI adoption in CEA is rising, often embedded in climate and fertigation equipment. Growers still want transparency and control. Controller-level anomaly detection and cloud command centers earn trust when they reduce surprises rather than invent another black box. Related: <a href="/articles/predictive-ai-for-grow-room-anomaly-detection/">predictive AI for anomaly detection</a>.</p>

<h2>What “good” looks like after the hype</h2>
<ul>
  <li><strong>Unit economics first.</strong> Prove contribution margin before multiplying rooms.</li>
  <li><strong>Energy as a managed input.</strong> Lighting and HVAC strategy tied to crop stage and measured outcomes. See <a href="/articles/vertical-farming-energy-unit-economics/">energy and unit economics</a>.</li>
  <li><strong>Labor redesign.</strong> People coach the system; they are not the integration bus. See <a href="/articles/cea-labor-shortage-controls-ai/">labor scarcity and controls</a>.</li>
  <li><strong>Brand-agnostic integration.</strong> Keep mixed equipment; standardize the data and control layer.</li>
  <li><strong>Multi-site sameness.</strong> One network, every facility — with edge autonomy when connectivity drops.</li>
</ul>

<h2>Advanced Autoponics’ view of the next chapter</h2>
<p>We build the stack survivors need: industrial protocols in, a unified platform out, controller-level AI for early warning, and <a href="/#geminy">Geminy IoT</a> for command across locations. Whether you run greenhouse acres, indoor rooms, or a hybrid, the competitive difference is rarely another sensor brand. It is whether your team can see and act on the same truth in minutes.</p>
<p>The CEA industry entering mid-decade is smaller than the hype predicted. It is also healthier when it tells the truth about costs. That is not a failure story. It is an industry growing up.</p>

<p>If you are rebuilding after a tough site, planning a retrofit, or standardizing controls across facilities, <a href="/#contact">book a demo</a> with Advanced Autoponics. <a href="mailto:info@advancedautoponics.com">info@advancedautoponics.com</a> · <a href="tel:+16083200213">(608) 320-0213</a>.</p>
<p class="article-footnote">2025 announcement, bankruptcy, and funding tallies referenced from industry year-in-review coverage (including AGEYE summaries of trade data).</p>
""",
    "greenhouse-vs-vertical-farming-automation": r"""
<div class="article-stats" role="group" aria-label="Key figures">
  <div class="article-stats__item"><p class="article-stats__value">~5–40</p><p class="article-stats__label">kWh/kg lettuce · hi-tech greenhouse range</p></div>
  <div class="article-stats__item"><p class="article-stats__value">~150–350+</p><p class="article-stats__label">kWh/kg lettuce · many vertical systems</p></div>
  <div class="article-stats__item"><p class="article-stats__value">GH ≫ VF</p><p class="article-stats__label">Commercial site counts in CEA censuses</p></div>
</div>

<p>Global CEA census reporting continues to show a familiar imbalance: greenhouses significantly outnumber vertical farms among commercial operators, with generally lower construction intensity and more established paths to profitability. That does not make vertical obsolete. It means operators should choose architecture for unit economics — then invest automation where the model is structurally weak.</p>

<figure class="article-chart" aria-labelledby="chart-gh-vf-energy-title">
  <figcaption class="article-chart__title" id="chart-gh-vf-energy-title">Energy intensity: glass vs racks</figcaption>
  <p class="article-chart__subtitle">Approx. kWh per kg lettuce · order-of-magnitude</p>
  <div class="article-chart__compare">
    <div class="article-chart__compare-col">
      <p class="article-chart__compare-head">High-tech greenhouse</p>
      <p class="article-chart__compare-metric">5–40 kWh/kg</p>
      <p class="article-chart__compare-note">Sunlight carries most photons; LEDs and climate still matter.</p>
    </div>
    <div class="article-chart__compare-col">
      <p class="article-chart__compare-head">Indoor vertical</p>
      <p class="article-chart__compare-metric">150–350+ kWh/kg</p>
      <p class="article-chart__compare-note">Every photon is purchased — controls decide if you waste them.</p>
    </div>
  </div>
  <p class="article-chart__footnote">Ranges echoed in CEA energy analyses and secondary summaries; optimized VF can improve, but the structural gap remains large.</p>
</figure>

<p>Advanced Autoponics works across both glass and indoor rooms. The control problem looks different in each — but the failure mode is often identical: climate, irrigation, sensors, and alerts never share one operational truth.</p>

<h2>What greenhouses still do better</h2>
<p>Sunlight is a free (if variable) light source. Greenhouses convert that into lower lighting OpEx and, in many markets, more familiar construction and labor patterns. Hybrid approaches — supplemental LED, screens, and precise fertigation — let growers chase consistency without paying for every photon. Energy and labor remain top cost pressures in operator surveys through 2025, but the baseline is often more forgiving than a fully lit rack facility.</p>
<p>The automation win in greenhouses is usually integration: BACnet-heavy HVAC and screens, Modbus dosing skids, MQTT sensor networks, and a grow team that needs one view. See <a href="/articles/bacnet-integration-for-cea/">BACnet integration for CEA</a>.</p>

<figure class="article-chart" aria-labelledby="chart-gh-vf-capex-title">
  <figcaption class="article-chart__title" id="chart-gh-vf-capex-title">Where automation leverage lands</figcaption>
  <p class="article-chart__subtitle">Relative priority by model · schematic</p>
  <ul class="article-chart__bars">
    <li class="article-chart__bar-row"><span class="article-chart__bar-label">GH · climate integ.</span><span class="article-chart__bar-track"><span class="article-chart__bar-fill" style="--bar:90%"></span></span><span class="article-chart__bar-value">Critical</span></li>
    <li class="article-chart__bar-row"><span class="article-chart__bar-label">GH · fertigation</span><span class="article-chart__bar-track"><span class="article-chart__bar-fill" style="--bar:78%"></span></span><span class="article-chart__bar-value">High</span></li>
    <li class="article-chart__bar-row"><span class="article-chart__bar-label">VF · energy loops</span><span class="article-chart__bar-track"><span class="article-chart__bar-fill" style="--bar:96%"></span></span><span class="article-chart__bar-value">Critical</span></li>
    <li class="article-chart__bar-row"><span class="article-chart__bar-label">VF · labor density</span><span class="article-chart__bar-track"><span class="article-chart__bar-fill" style="--bar:85%"></span></span><span class="article-chart__bar-value">High</span></li>
  </ul>
  <p class="article-chart__footnote">Schematic priorities for operators choosing where to invest controls first.</p>
</figure>

<h2>Where vertical still earns its keep</h2>
<p>Indoor vertical systems excel when you need extreme locality, tight food-safety narratives, high-value formats, or production that cannot depend on outdoor climate. They struggle when they compete head-to-head with field or greenhouse commodity greens on price alone — especially in high-tariff metros. After 2025’s consolidation wave, the credible vertical stories tend to emphasize focused crop portfolios, secured retail channels, and modular capacity tied to proven demand rather than speculative megafacilities.</p>
<p>In those facilities, automation wins on labor density, recipe repeatability, and energy discipline. A rack farm without closed-loop visibility is a capital project waiting for an operations crisis. Background: <a href="/articles/why-vertical-farms-are-failing/">why vertical farms are failing</a> and <a href="/articles/vertical-farming-energy-unit-economics/">energy and unit economics</a>.</p>

<h2>Hybrid models are not a compromise — they are a control design</h2>
<p>Many 2026 roadmaps blend greenhouse scale with indoor finishing, nursery, or specialty lines. That only works if the data model spans both. Different mechanical systems, different protocols, same crop commitments. Operators who bolt on a separate cloud per vendor recreate the blind spots that killed earlier “smart farm” projects.</p>

<h2>Where automation creates leverage in both models</h2>
<ul>
  <li><strong>Unified semantics.</strong> Zones, crops, and assets — not vendor point names — should drive the UI and alerts.</li>
  <li><strong>Edge autonomy.</strong> Local controllers keep irrigation and climate safety alive when the WAN drops.</li>
  <li><strong>Predictive visibility.</strong> Drift in VPD, EC, or equipment runtime should surface before yield does. Related: <a href="/articles/predictive-ai-for-grow-room-anomaly-detection/">predictive AI for grow-room anomaly detection</a>.</li>
  <li><strong>Protocol honesty.</strong> Use BACnet, Modbus, MQTT, and OPC UA where they already exist instead of forcing a single proprietary stack. See <a href="/articles/mqtt-vs-modbus-vs-opc-ua-in-cea/">MQTT vs Modbus vs OPC UA</a>.</li>
</ul>

<h2>How to choose without ideology</h2>
<p>Ask four questions before you pick glass, racks, or both:</p>
<ol>
  <li>What price and quality premium can this crop reliably command in this market?</li>
  <li>What does power cost — and how variable is it — at the sites you can actually permit?</li>
  <li>Can your labor model staff the facility without heroic overtime every harvest week?</li>
  <li>Will your controls stack give one network across every facility you plan to operate?</li>
</ol>
<p>If the answers favor sunlight and acreage, build greenhouse-first and automate integration. If they favor density and locality with a crop that can carry the energy bill, vertical can work — with manufacturing-grade controls from day one.</p>

<p>Advanced Autoponics builds brand-agnostic automation for both paths: on-site controllers, a <a href="/#platform">unified data layer</a>, and Geminy in the cloud so every site shares live views and commands. <a href="/#contact">Book a demo</a> · <a href="tel:+16083200213">(608) 320-0213</a> · <a href="mailto:info@advancedautoponics.com">info@advancedautoponics.com</a>.</p>
""",
}


def _remaining_bodies() -> dict[str, str]:
    """Second half of bodies to keep this module maintainable."""
    return {
        "cea-labor-shortage-controls-ai": r"""
<div class="article-stats" role="group" aria-label="Key figures">
  <div class="article-stats__item"><p class="article-stats__value">Top 2</p><p class="article-stats__label">Energy + labor in 2025 CEA pressure surveys</p></div>
  <div class="article-stats__item"><p class="article-stats__value">20–35%</p><p class="article-stats__label">Labor share of OpEx · common CEA range</p></div>
  <div class="article-stats__item"><p class="article-stats__value">Hours → alerts</p><p class="article-stats__label">Shift from rounds to exception handling</p></div>
</div>

<p>Ask commercial CEA operators what constrains growth and you will hear energy — and then labor, almost in the same breath. Industry surveys through 2025 continued to rank both among the top operating pressures. Labor often lands in a rough <strong>20–35%</strong> band of OpEx depending on crop and automation maturity; skilled grow tech roles remain hard to fill in many regions. Robotics and “physical AI” are entering harvest and logistics, but most facilities still depend on people for scouting, setpoint changes, quality checks, and exception handling.</p>

<figure class="article-chart" aria-labelledby="chart-labor-time-title">
  <figcaption class="article-chart__title" id="chart-labor-time-title">Where skilled time goes without a data layer</figcaption>
  <p class="article-chart__subtitle">Illustrative weekly share of grow-tech hours</p>
  <div class="article-chart__stack">
    <div class="article-chart__stack-bar" role="img" aria-label="Stacked bar of weekly labor time allocation">
      <span class="article-chart__stack-seg" style="--w:40%; --seg:var(--accent)"></span>
      <span class="article-chart__stack-seg" style="--w:25%; --seg:#9a9a9a"></span>
      <span class="article-chart__stack-seg" style="--w:20%; --seg:#b8b8b8"></span>
      <span class="article-chart__stack-seg" style="--w:15%; --seg:#d8d8d8"></span>
    </div>
    <ul class="article-chart__legend">
      <li><span class="article-chart__swatch" style="--swatch:var(--accent)"></span>Status rounds ~40%</li>
      <li><span class="article-chart__swatch" style="--swatch:#9a9a9a"></span>Firefighting ~25%</li>
      <li><span class="article-chart__swatch" style="--swatch:#b8b8b8"></span>Quality / pack ~20%</li>
      <li><span class="article-chart__swatch" style="--swatch:#d8d8d8"></span>Recipe work ~15%</li>
    </ul>
  </div>
  <p class="article-chart__footnote">Schematic of a fragmented multi-vendor site — not a universal time study. Unified alerts typically reclaim status-round hours first.</p>
</figure>

<p>The mistake is waiting for a humanoid robot to fix a workflow that is already broken. The immediate win is removing the need for humans to stitch systems together every shift.</p>

<h2>Labor is often paying for missing visibility</h2>
<p>When climate lives in one app, fertigation in another, and alerts arrive as texts nobody trusts, operators walk the facility to rebuild the truth. That walk is labor. So is the spreadsheet that reconciles yesterday’s EC readings. So is the evening call when a humidity spike was visible in three places and actionable in none.</p>
<p>Automation that only adds more screens increases cognitive load. Automation that unifies signals and prioritizes exceptions reduces the hours spent hunting for problems. In practice, that means fewer “status rounds,” faster onboarding for new technicians, and less dependence on the one veteran who knows which HMI to trust.</p>
<p>Training costs matter too. Every proprietary silo adds a learning curve. A single operational schema — zones, crops, assets, and alerts — lets new hires contribute sooner while senior growers focus on recipe improvement instead of system archaeology.</p>

<figure class="article-chart" aria-labelledby="chart-labor-maturity-title">
  <figcaption class="article-chart__title" id="chart-labor-maturity-title">Labor leverage vs. automation maturity</figcaption>
  <p class="article-chart__subtitle">Relative manual load · schematic</p>
  <ul class="article-chart__bars">
    <li class="article-chart__bar-row"><span class="article-chart__bar-label">Clipboard ops</span><span class="article-chart__bar-track"><span class="article-chart__bar-fill" style="--bar:100%"></span></span><span class="article-chart__bar-value">High</span></li>
    <li class="article-chart__bar-row"><span class="article-chart__bar-label">Multi-dashboard</span><span class="article-chart__bar-track"><span class="article-chart__bar-fill" style="--bar:78%"></span></span><span class="article-chart__bar-value">High</span></li>
    <li class="article-chart__bar-row"><span class="article-chart__bar-label">Unified + AI</span><span class="article-chart__bar-track"><span class="article-chart__bar-fill" style="--bar:42%"></span></span><span class="article-chart__bar-value">Lower</span></li>
    <li class="article-chart__bar-row"><span class="article-chart__bar-label">+ Task robotics</span><span class="article-chart__bar-track"><span class="article-chart__bar-fill article-chart__bar-fill--muted" style="--bar:28%"></span></span><span class="article-chart__bar-value">Lowest</span></li>
  </ul>
  <p class="article-chart__footnote">Robotics help most after exception workflows and data quality exist — not before.</p>
</figure>

<h2>What “controls and AI” mean on a real grow floor</h2>
<ul>
  <li><strong>Closed-loop basics first.</strong> Stable irrigation, dosing, and climate loops cut firefighting before any model is trained.</li>
  <li><strong>Controller-level intelligence.</strong> Edge AI can watch VPD, nutrient curves, and equipment runtime for drift patterns that humans notice too late.</li>
  <li><strong>Plain-language summaries.</strong> Supervisors need “what matters this hour,” not a wall of raw points. That is the job of predictive visibility layers on top of a clean data model.</li>
  <li><strong>Governed remote action.</strong> Multi-site managers should command from one interface — with clear write authority — instead of calling night shifts to click through HMIs.</li>
</ul>
<p>Advanced Autoponics packages that stack as a <a href="/#platform">unified data layer</a>, AI anomaly detection, and <a href="/#geminy">Geminy IoT</a> as the command center. Read <a href="/articles/predictive-ai-for-grow-room-anomaly-detection/">predictive AI for grow-room anomaly detection</a> and <a href="/articles/full-automation-without-custom-development/">full automation without custom development</a>.</p>

<h2>Robotics help — after the data layer exists</h2>
<p>High-profile operator moves to bring harvesting robotics in-house underline a broader trend: automation costs are falling as warehouse and industrial tech crosses into agriculture. Those systems still need clean schedules, reliable environment data, and exception workflows. A robot cannot save a facility that cannot keep setpoints and recipes consistent.</p>

<h2>A labor-aware automation roadmap</h2>
<ol>
  <li>List the ten manual checks that consume the most skilled time each week.</li>
  <li>Instrument those loops continuously and retire clipboard steps that duplicate sensors.</li>
  <li>Normalize alerts so only actionable, prioritized events interrupt a shift.</li>
  <li>Document who may write setpoints remotely — and what stays local for safety.</li>
  <li>Only then evaluate task robotics for harvest, packing, or material movement.</li>
</ol>

<h2>People still matter — just not as middleware</h2>
<p>The goal is not a dark factory fantasy. Growers remain essential for crop judgment, customer quality, and continuous improvement. What should disappear is the role of human-as-bus between BACnet climate, Modbus skids, and a vendor cloud. That role does not scale, and in a tight labor market it becomes the single point of failure.</p>

<p>If your best growers spend their days reconciling systems instead of improving recipes, talk to Advanced Autoponics about an operations stack that earns back those hours. <a href="/#contact">Book a demo</a> · <a href="mailto:info@advancedautoponics.com">info@advancedautoponics.com</a> · <a href="tel:+16083200213">(608) 320-0213</a>.</p>
""",
        "bacnet-integration-for-cea": r"""
<div class="article-stats" role="group" aria-label="Key figures">
  <div class="article-stats__item"><p class="article-stats__value">#1 HVAC</p><p class="article-stats__label">BACnet’s usual role in commercial CEA</p></div>
  <div class="article-stats__item"><p class="article-stats__value">Curated</p><p class="article-stats__label">Zone tags beat 4,000 raw objects</p></div>
  <div class="article-stats__item"><p class="article-stats__value">IP &gt; MS/TP</p><p class="article-stats__label">Preferred path on most new builds</p></div>
</div>

<p>Controlled environment agriculture sits on top of building systems that were never designed for crop production. Chillers, AHUs, CO<sub>2</sub> dosing, shade screens, and zone dampers often speak BACnet because that is what the mechanical contractor installed. Grow teams then bolt on irrigation controllers, nutrient dosing skids, and sensor networks that speak something else entirely. The result is familiar: climate lives in one interface, fertigation in another, and nobody trusts either when a crop starts to drift.</p>

<figure class="article-chart" aria-labelledby="chart-bacnet-mix-title">
  <figcaption class="article-chart__title" id="chart-bacnet-mix-title">Typical protocol mix on a glass-house site</figcaption>
  <p class="article-chart__subtitle">Share of points by subsystem · illustrative</p>
  <ul class="article-chart__bars">
    <li class="article-chart__bar-row"><span class="article-chart__bar-label">BACnet climate</span><span class="article-chart__bar-track"><span class="article-chart__bar-fill" style="--bar:45%"></span></span><span class="article-chart__bar-value">~45%</span></li>
    <li class="article-chart__bar-row"><span class="article-chart__bar-label">Modbus skids</span><span class="article-chart__bar-track"><span class="article-chart__bar-fill" style="--bar:30%"></span></span><span class="article-chart__bar-value">~30%</span></li>
    <li class="article-chart__bar-row"><span class="article-chart__bar-label">MQTT sensors</span><span class="article-chart__bar-track"><span class="article-chart__bar-fill" style="--bar:18%"></span></span><span class="article-chart__bar-value">~18%</span></li>
    <li class="article-chart__bar-row"><span class="article-chart__bar-label">Other / REST</span><span class="article-chart__bar-track"><span class="article-chart__bar-fill article-chart__bar-fill--muted" style="--bar:7%"></span></span><span class="article-chart__bar-value">~7%</span></li>
  </ul>
  <p class="article-chart__footnote">Composite of common greenhouse integrations — individual sites vary by contractor and vintage.</p>
</figure>

<p>BACnet integration for CEA is about closing that gap. Done well, it turns existing HVAC and climate assets into first-class data sources for a unified operations layer — without forcing a rip-and-replace of equipment that still has years of life left.</p>

<h2>Why BACnet shows up in greenhouses</h2>
<p>BACnet (Building Automation and Control Network) became the default language for commercial HVAC because it is vendor-neutral, widely supported, and well understood by controls contractors. Many greenhouse projects inherit that stack: the same engineers who automate office buildings also automate mechanical rooms for indoor farms and glass houses.</p>
<p>That creates an opportunity. Temperature setpoints, supply air status, economizer positions, and fault flags are already on the wire. If your CEA platform can read and write those points safely, you stop treating climate as a black box and start treating it as a controllable subsystem in the same view as irrigation and nutrients.</p>

<figure class="article-chart" aria-labelledby="chart-bacnet-rollout-title">
  <figcaption class="article-chart__title" id="chart-bacnet-rollout-title">Safer write authority over time</figcaption>
  <p class="article-chart__subtitle">Integration maturity · schematic</p>
  <svg class="article-chart__svg" viewBox="0 0 360 150" role="img" aria-label="Line chart showing write authority increasing from read-only to governed writes">
    <line class="chart-grid" x1="40" y1="30" x2="340" y2="30"/>
    <line class="chart-grid" x1="40" y1="70" x2="340" y2="70"/>
    <line class="chart-grid" x1="40" y1="110" x2="340" y2="110"/>
    <line class="chart-axis" x1="40" y1="20" x2="40" y2="120"/>
    <line class="chart-axis" x1="40" y1="120" x2="340" y2="120"/>
    <polyline class="chart-line" points="70,110 150,95 230,60 310,35"/>
    <circle class="chart-dot" cx="70" cy="110" r="3.5"/>
    <circle class="chart-dot" cx="310" cy="35" r="3.5"/>
    <text x="70" y="140" text-anchor="middle">Read-only</text>
    <text x="230" y="140" text-anchor="middle">Alarms</text>
    <text x="310" y="140" text-anchor="middle">Writes</text>
  </svg>
  <p class="article-chart__footnote">Best practice: earn trust with visibility before expanding setpoint write rights.</p>
</figure>

<h2>What “good” BACnet integration looks like</h2>
<p>Integration is not a dump of every object on the network into a dashboard. Operators do not need 4,000 raw points. They need a curated model of the rooms and zones that matter for crop decisions.</p>
<ul>
  <li><strong>Normalize objects into grow semantics.</strong> Map BACnet analog inputs and binary statuses to zone temperature, humidity, VPD proxies, equipment state, and alarm priority.</li>
  <li><strong>Respect write authority.</strong> Read-heavy monitoring is safer than unrestricted setpoint writes. Define which points Geminy or on-site controllers may command, and under what conditions.</li>
  <li><strong>Keep polling intentional.</strong> Aggressive COV/polling can congest a BACnet/IP segment. Prioritize critical climate loops; sample slower for diagnostics.</li>
  <li><strong>Preserve the BMS where it belongs.</strong> Life-safety and mechanical interlocks stay with the building system. CEA automation should coordinate, not override, those protections.</li>
</ul>

<h2>BACnet/IP vs BACnet MS/TP in CEA projects</h2>
<p>Most new facilities prefer BACnet/IP for throughput and simpler IT handoff. Older sites may still run MS/TP over RS-485. Both can feed a unified data layer, but the integration pattern differs. IP allows cleaner discovery and higher update rates; MS/TP often needs a router or gateway and more careful scheduling. Either way, the goal is the same: bring climate signals into the same operational schema as Modbus irrigation skids and MQTT sensor brokers.</p>

<h2>Where Advanced Autoponics fits</h2>
<p>Advanced Autoponics designs brand-agnostic automation that sits above mixed equipment. Our <a href="/#platform">unified data layer</a> accepts BACnet alongside Modbus, MQTT, OPC UA, and REST — so greenhouse HVAC, fertigation, and edge AI can share one model. Controller-level intelligence watches for climate drift and equipment anomalies before they show up as crop loss. <a href="/#geminy">Geminy IoT</a> then gives operators a command-center view across every connected facility.</p>
<p>That matters when you operate more than one site. A BACnet-connected glass house in Colorado and a CEA room elsewhere should not require two mental models. One network, every facility — with protocols in and a single control layer out.</p>

<h2>Practical rollout checklist</h2>
<ol>
  <li>Inventory BACnet devices, object lists, and who owns write access today.</li>
  <li>Define zone-level tags that match how growers talk about rooms, not how the BMS names AHUs.</li>
  <li>Start with read-only visibility and alarm normalization; add controlled writes after trust is earned.</li>
  <li>Correlate climate BACnet points with irrigation and nutrient signals so anomalies make sense in context.</li>
  <li>Document failover: what happens if BACnet drops, and what the on-site controller must keep running locally.</li>
</ol>

<p>If you are evaluating BACnet for a new build or a retrofit, the question is not whether the protocol works — it already does. The question is whether your team can see climate, irrigation, and alerts in one place before the crop pays for delayed awareness. That is the integration problem Advanced Autoponics solves.</p>

<p>Related reading: <a href="/articles/unified-data-layer-for-greenhouses/">Unified data layer for greenhouses</a> and <a href="/articles/mqtt-vs-modbus-vs-opc-ua-in-cea/">MQTT vs Modbus vs OPC UA in CEA</a>. Ready to map your BACnet points into a live operations view? <a href="/#contact">Book a demo</a> or call <a href="tel:+16083200213">(608) 320-0213</a>.</p>
""",
        "optimal-ec-and-ph-for-hydroponic-herbs": r"""
<div class="article-stats" role="group" aria-label="Key figures">
  <div class="article-stats__item"><p class="article-stats__value">1.0–1.6</p><p class="article-stats__label">Basil EC starting band · mS/cm</p></div>
  <div class="article-stats__item"><p class="article-stats__value">5.5–6.5</p><p class="article-stats__label">Common herb pH operating window</p></div>
  <div class="article-stats__item"><p class="article-stats__value">Minutes</p><p class="article-stats__label">Drift detection vs daily clipboards</p></div>
</div>

<p>Hydroponic herbs look simple until the first crop that tastes flat, yellows early, or stalls after a nutrient change. In recirculating and NFT systems, electrical conductivity (EC) and pH are the two numbers that most often explain those outcomes. They are also the two numbers most often checked too late.</p>

<p>This guide covers practical target ranges for common culinary herbs, why values drift, and how automation turns spot checks into continuous control — the same philosophy behind Advanced Autoponics’ data-first approach to CEA.</p>

<figure class="article-chart" aria-labelledby="chart-herb-ec-title">
  <figcaption class="article-chart__title" id="chart-herb-ec-title">Starting EC bands by herb</figcaption>
  <p class="article-chart__subtitle">mS/cm · recirculating systems · validate locally</p>
  <ul class="article-chart__bars">
    <li class="article-chart__bar-row"><span class="article-chart__bar-label">Basil</span><span class="article-chart__bar-track"><span class="article-chart__bar-fill" style="--bar:72%"></span></span><span class="article-chart__bar-value">1.0–1.6</span></li>
    <li class="article-chart__bar-row"><span class="article-chart__bar-label">Mint</span><span class="article-chart__bar-track"><span class="article-chart__bar-fill" style="--bar:80%"></span></span><span class="article-chart__bar-value">1.0–1.8</span></li>
    <li class="article-chart__bar-row"><span class="article-chart__bar-label">Cilantro</span><span class="article-chart__bar-track"><span class="article-chart__bar-fill" style="--bar:64%"></span></span><span class="article-chart__bar-value">0.8–1.6</span></li>
    <li class="article-chart__bar-row"><span class="article-chart__bar-label">Chives</span><span class="article-chart__bar-track"><span class="article-chart__bar-fill" style="--bar:78%"></span></span><span class="article-chart__bar-value">1.2–1.8</span></li>
  </ul>
  <p class="article-chart__footnote">Operational starting points used widely in herb hydroponics guides — cultivar, water chemistry, and system type still win.</p>
</figure>

<h2>What EC and pH actually control</h2>
<p><strong>EC</strong> estimates the total dissolved salts in solution — a proxy for nutrient strength. Too low and growth slows; too high and plants struggle with osmotic stress, tip burn, or bitter flavor. <strong>pH</strong> governs nutrient availability. Even a “perfect” recipe fails if pH locks out iron, manganese, or phosphorus.</p>
<p>For herbs, the goal is not chasing a single magic number. It is keeping the root zone inside a band that matches crop stage, water source, and system type — and knowing within minutes when you leave that band.</p>

<figure class="article-chart" aria-labelledby="chart-herb-ph-title">
  <figcaption class="article-chart__title" id="chart-herb-ph-title">pH windows for culinary herbs</figcaption>
  <p class="article-chart__subtitle">Typical target bands · schematic</p>
  <svg class="article-chart__svg" viewBox="0 0 360 140" role="img" aria-label="Comparison bars showing pH ranges for basil mint cilantro and chives">
    <line class="chart-axis" x1="70" y1="20" x2="70" y2="120"/>
    <line class="chart-axis" x1="70" y1="120" x2="340" y2="120"/>
    <text x="70" y="136" text-anchor="middle">5.0</text>
    <text x="205" y="136" text-anchor="middle">6.0</text>
    <text x="340" y="136" text-anchor="middle">7.0</text>
    <rect class="chart-bar" x="138" y="28" width="95" height="14"/>
    <rect class="chart-bar" x="138" y="52" width="135" height="14"/>
    <rect class="chart-bar" x="178" y="76" width="95" height="14"/>
    <rect class="chart-bar" x="205" y="100" width="68" height="14"/>
    <text x="8" y="39">Basil</text>
    <text x="8" y="63">Mint</text>
    <text x="8" y="87">Cilantro</text>
    <text x="8" y="111">Chives</text>
  </svg>
  <p class="article-chart__footnote">Bands approximate 5.5–6.2 (basil), 5.5–6.5 (mint), 5.8–6.5 (cilantro/parsley), 6.0–6.5 (chives).</p>
</figure>

<h2>Starting ranges for common hydroponic herbs</h2>
<p>Always validate against your cultivar, media, and water chemistry. These ranges are useful operational starting points for many leafy culinary herbs in recirculating systems:</p>
<ul>
  <li><strong>Basil:</strong> EC roughly 1.0–1.6 mS/cm; pH 5.5–6.2</li>
  <li><strong>Mint / spearmint:</strong> EC roughly 1.0–1.8 mS/cm; pH 5.5–6.5</li>
  <li><strong>Cilantro / parsley:</strong> EC roughly 0.8–1.6 mS/cm; pH 5.8–6.5</li>
  <li><strong>Chives / green onion herbs:</strong> EC roughly 1.2–1.8 mS/cm; pH 6.0–6.5</li>
</ul>
<p>Seedlings and young transplants usually prefer the lower end of EC. Mature production can tolerate higher strength if climate and irrigation frequency stay stable. When VPD and temperature rise, plants drink faster — EC can climb in reservoirs even if you “did nothing.”</p>

<h2>Why values drift in real facilities</h2>
<ul>
  <li>Evaporation and plant uptake concentrate salts between reservoir top-ups.</li>
  <li>Acid/base dosing overshoots when sensors are fouled or poorly calibrated.</li>
  <li>Stock tank mix errors propagate across every zone sharing a manifold.</li>
  <li>Biofilm and debris on probes create false confidence in a bad reading.</li>
</ul>
<p>Manual daily checks catch some of this. They miss overnight spikes, weekend gaps, and the slow climb that only becomes obvious after leaf quality drops.</p>

<h2>From clipboards to continuous control</h2>
<p>Optimal EC and pH are only useful if you can hold them. Continuous probes, calibrated maintenance routines, and automated dosing close the loop. Better still, those signals should live in the same operational view as climate and alerts — not in an isolated fertigation HMI.</p>
<p>Advanced Autoponics controllers and the <a href="/#platform">unified data layer</a> bring nutrient curves into the same system that watches temperature, humidity, and equipment status. <a href="/#geminy">Geminy IoT</a> surfaces live pH/EC-style readouts and AI summaries so teams act before herbs go off-spec. Pair that with <a href="/articles/predictive-ai-for-grow-room-anomaly-detection/">anomaly detection</a> and slow nutrient drift becomes an early warning, not a post-harvest autopsy.</p>

<h2>Operator habits that protect herb quality</h2>
<ol>
  <li>Calibrate pH and EC probes on a fixed schedule; replace aging sensors before they lie politely.</li>
  <li>Log reservoir volume changes alongside EC — concentration effects are easy to misread.</li>
  <li>Change targets by crop stage, not by gut feel after a bad harvest.</li>
  <li>Treat nutrient, climate, and irrigation as one recipe — herbs taste the interaction, not the spreadsheet row.</li>
</ol>

<p>Stable EC and pH are the difference between consistent herb SKUs and weekly excuses. If your team still finds out about drift from the leaves instead of the trend, talk to Advanced Autoponics. <a href="/#contact">Book a demo</a> · <a href="mailto:info@advancedautoponics.com">info@advancedautoponics.com</a> · <a href="tel:+16083200213">(608) 320-0213</a>.</p>
""",
    }


BODIES.update(_remaining_bodies())


def _more_bodies() -> dict[str, str]:
    return {
        "full-automation-without-custom-development": r"""
<div class="article-stats" role="group" aria-label="Key figures">
  <div class="article-stats__item"><p class="article-stats__value">Weeks</p><p class="article-stats__label">Target first-site deploy vs multi-month custom</p></div>
  <div class="article-stats__item"><p class="article-stats__value">1 model</p><p class="article-stats__label">Configurable zones beat one-off codebases</p></div>
  <div class="article-stats__item"><p class="article-stats__value">N sites</p><p class="article-stats__label">Reuse mappings — don’t rebuild per facility</p></div>
</div>

<p>Every ambitious grow facility eventually hits the same fork in the road: keep stitching together vendor apps, or commission a custom control system that “finally does everything.” Custom development can work. It also creates schedule risk, knowledge concentration, and a maintenance burden that outlives the project budget.</p>

<figure class="article-chart" aria-labelledby="chart-custom-cost-title">
  <figcaption class="article-chart__title" id="chart-custom-cost-title">Total cost of ownership shape</figcaption>
  <p class="article-chart__subtitle">Relative effort over time · schematic</p>
  <svg class="article-chart__svg" viewBox="0 0 360 160" role="img" aria-label="Line chart comparing rising custom development cost versus flatter platform cost">
    <line class="chart-grid" x1="40" y1="30" x2="340" y2="30"/>
    <line class="chart-grid" x1="40" y1="70" x2="340" y2="70"/>
    <line class="chart-grid" x1="40" y1="110" x2="340" y2="110"/>
    <line class="chart-axis" x1="40" y1="20" x2="40" y2="130"/>
    <line class="chart-axis" x1="40" y1="130" x2="340" y2="130"/>
    <polyline class="chart-line" points="60,100 140,85 220,55 300,25" style="stroke:var(--grey-175)"/>
    <polyline class="chart-line" points="60,95 140,90 220,88 300,86"/>
    <text x="300" y="18" text-anchor="end" class="chart-value">Custom</text>
    <text x="300" y="78" text-anchor="end" class="chart-value">Platform</text>
    <text x="60" y="148" text-anchor="middle">Launch</text>
    <text x="220" y="148" text-anchor="middle">Year 2</text>
    <text x="300" y="148" text-anchor="middle">Scale</text>
  </svg>
  <p class="article-chart__footnote">Schematic: custom stacks often look cheap at kickoff and expensive at site two.</p>
</figure>

<p>Advanced Autoponics exists for operators who want full automation without turning into a software company. The path is platform configuration, industrial protocols, and a unified data layer — not endless tickets against a bespoke stack.</p>

<h2>Where custom development goes wrong in AgTech</h2>
<ul>
  <li><strong>Scope creep.</strong> “Just one more sensor type” becomes a rewrite of the data model.</li>
  <li><strong>Fragile integrations.</strong> Point-to-point scripts break when a PLC firmware updates.</li>
  <li><strong>Key-person risk.</strong> Only one integrator understands the night-shift irrigation logic.</li>
  <li><strong>Slow change.</strong> Adding a new zone or recipe requires a development cycle instead of a configuration change.</li>
</ul>
<p>Growers do not need uniqueness for its own sake. They need reliable loops: climate, irrigation, nutrients, alarms, and visibility across sites. The more of those loops you encode in one-off software, the more every expansion project inherits technical debt.</p>
<p>Teams also underestimate integration testing. A custom dashboard that works in a staging rack can fail when a third-party controller changes register maps, when a broker certificate expires, or when a second facility uses slightly different equipment. Configurable platforms absorb those differences as mappings. Custom apps absorb them as emergencies.</p>

<figure class="article-chart" aria-labelledby="chart-custom-decision-title">
  <figcaption class="article-chart__title" id="chart-custom-decision-title">Build vs configure decision weights</figcaption>
  <p class="article-chart__subtitle">When platform configuration usually wins</p>
  <ul class="article-chart__bars">
    <li class="article-chart__bar-row"><span class="article-chart__bar-label">Standard loops</span><span class="article-chart__bar-track"><span class="article-chart__bar-fill" style="--bar:92%"></span></span><span class="article-chart__bar-value">Configure</span></li>
    <li class="article-chart__bar-row"><span class="article-chart__bar-label">Multi-site reuse</span><span class="article-chart__bar-track"><span class="article-chart__bar-fill" style="--bar:88%"></span></span><span class="article-chart__bar-value">Configure</span></li>
    <li class="article-chart__bar-row"><span class="article-chart__bar-label">Novel R&amp;D skid</span><span class="article-chart__bar-track"><span class="article-chart__bar-fill article-chart__bar-fill--muted" style="--bar:55%"></span></span><span class="article-chart__bar-value">Edge custom</span></li>
    <li class="article-chart__bar-row"><span class="article-chart__bar-label">Full rewrite</span><span class="article-chart__bar-track"><span class="article-chart__bar-fill article-chart__bar-fill--muted" style="--bar:18%"></span></span><span class="article-chart__bar-value">Rare</span></li>
  </ul>
  <p class="article-chart__footnote">Keep bespoke logic at the edges; keep the operations spine standard.</p>
</figure>

<h2>What “full automation” should mean</h2>
<p>Full automation is not a black box that removes humans. It is a system that:</p>
<ol>
  <li>Captures real-time data from existing equipment using open protocols where available.</li>
  <li>Unifies disconnected devices into one operational model.</li>
  <li>Standardizes controls so expansion does not require reinventing the architecture.</li>
  <li>Deploys faster than proprietary lock-in platforms, with troubleshooting that stays accessible.</li>
</ol>
<p>That is the same sequence we describe on our <a href="/#solution">solution</a> page — data capture, platform integration, standardized controls, faster deployment.</p>

<h2>Configurable platforms beat one-off code</h2>
<p>A brand-agnostic stack meets the facility where it is. Modbus dosing skids, BACnet HVAC, MQTT sensors, and REST APIs can all feed one schema. Operators configure zones, setpoints, and alert policies instead of commissioning new microservices for each device family. See <a href="/articles/unified-data-layer-for-greenhouses/">unified data layer for greenhouses</a> and <a href="/articles/mqtt-vs-modbus-vs-opc-ua-in-cea/">MQTT vs Modbus vs OPC UA</a> for how protocol choice fits that model.</p>
<p>Controller-level AI then watches the normalized signals. Anomalies and forecasts show up in <a href="/#geminy">Geminy IoT</a> as actionable insight — without asking your team to maintain a custom ML pipeline.</p>

<h2>When custom still makes sense</h2>
<p>Some research facilities and novel hardware need bespoke logic. Even then, keep custom code at the edges — device drivers, experimental recipes — and keep the operations spine standard. The more of your runtime that lives in a maintained platform, the less your harvest depends on a single repository.</p>

<h2>A practical decision test</h2>
<p>Before approving a custom automation project, ask:</p>
<ul>
  <li>Can this requirement be met by mapping points into an existing data model?</li>
  <li>Will a second site inherit this work, or will we rebuild?</li>
  <li>Who owns the code when the original developer is unavailable for a weekend emergency?</li>
  <li>Does the schedule assume “software will catch up” after plants are already in the room?</li>
</ul>

<p>If the honest answers push you toward a configurable, protocol-friendly platform, talk to Advanced Autoponics about deploying full automation without the custom-development tax. <a href="/#contact">Book a demo</a> · <a href="tel:+16083200213">(608) 320-0213</a> · <a href="mailto:info@advancedautoponics.com">info@advancedautoponics.com</a>.</p>
""",
        "unified-data-layer-for-greenhouses": r"""
<div class="article-stats" role="group" aria-label="Key figures">
  <div class="article-stats__item"><p class="article-stats__value">1 schema</p><p class="article-stats__label">Zones, assets, alerts — not vendor names</p></div>
  <div class="article-stats__item"><p class="article-stats__value">3–5+</p><p class="article-stats__label">Apps growers often juggle without unification</p></div>
  <div class="article-stats__item"><p class="article-stats__value">Edge-safe</p><p class="article-stats__label">Local control when the WAN drops</p></div>
</div>

<p>Walk into a typical commercial greenhouse and you will find competence everywhere — and still struggle to answer a simple question: what is actually happening across the facility right now? Climate may live in a BMS. Irrigation may live on a panel HMI. Sensors may stream to a vendor cloud. Alerts may arrive as texts that nobody trusts. Industry walkthroughs regularly describe teams checking <strong>three to five</strong> interfaces before they trust a decision.</p>

<figure class="article-chart" aria-labelledby="chart-udl-apps-title">
  <figcaption class="article-chart__title" id="chart-udl-apps-title">Fragmented vs unified visibility</figcaption>
  <p class="article-chart__subtitle">Interfaces touched for a single zone check</p>
  <div class="article-chart__compare">
    <div class="article-chart__compare-col">
      <p class="article-chart__compare-head">Fragmented site</p>
      <p class="article-chart__compare-metric">4–6 apps</p>
      <p class="article-chart__compare-note">BMS + fertigation HMI + sensor cloud + SMS + spreadsheet.</p>
    </div>
    <div class="article-chart__compare-col">
      <p class="article-chart__compare-head">Unified layer</p>
      <p class="article-chart__compare-metric">1 model</p>
      <p class="article-chart__compare-note">Same zones and alerts on site and in Geminy.</p>
    </div>
  </div>
  <p class="article-chart__footnote">Counts are illustrative of common multi-vendor greenhouse stacks.</p>
</figure>

<p>A unified data layer is the missing middle. It normalizes those feeds into one operational schema so people, automation, and AI can work from the same truth.</p>

<h2>What a unified data layer is (and is not)</h2>
<p>It is not “another dashboard.” Dashboards are views. The data layer is the model underneath: zones, assets, points, units, quality flags, and time series that mean the same thing whether the source was Modbus, BACnet, MQTT, or a REST API.</p>
<p>It is also not a data lake for someday analytics. Greenhouse operators need low-latency, decision-grade signals — with enough history to diagnose drift, not a warehouse that only data scientists can query.</p>

<figure class="article-chart" aria-labelledby="chart-udl-pipeline-title">
  <figcaption class="article-chart__title" id="chart-udl-pipeline-title">Collect → model → act</figcaption>
  <p class="article-chart__subtitle">Throughput of useful decisions · schematic</p>
  <ul class="article-chart__bars">
    <li class="article-chart__bar-row"><span class="article-chart__bar-label">Raw points</span><span class="article-chart__bar-track"><span class="article-chart__bar-fill article-chart__bar-fill--muted" style="--bar:100%"></span></span><span class="article-chart__bar-value">High volume</span></li>
    <li class="article-chart__bar-row"><span class="article-chart__bar-label">Normalized</span><span class="article-chart__bar-track"><span class="article-chart__bar-fill" style="--bar:60%"></span></span><span class="article-chart__bar-value">Trusted</span></li>
    <li class="article-chart__bar-row"><span class="article-chart__bar-label">Prioritized</span><span class="article-chart__bar-track"><span class="article-chart__bar-fill" style="--bar:28%"></span></span><span class="article-chart__bar-value">Actionable</span></li>
    <li class="article-chart__bar-row"><span class="article-chart__bar-label">Governed writes</span><span class="article-chart__bar-track"><span class="article-chart__bar-fill" style="--bar:12%"></span></span><span class="article-chart__bar-value">Few, safe</span></li>
  </ul>
  <p class="article-chart__footnote">Good layers shrink noise into a small set of decisions — they do not maximize chart widgets.</p>
</figure>

<h2>Why greenhouses feel fragmented</h2>
<ul>
  <li>Equipment arrives from different vendors over different capital cycles.</li>
  <li>Protocols differ by subsystem: HVAC often BACnet, skids often Modbus, sensors often MQTT.</li>
  <li>Naming conventions rarely match how growers think about rooms and crops.</li>
  <li>Cloud apps multiply until “checking the system” means five browser tabs.</li>
</ul>
<p>Fragmentation forces manual reconciliation. Manual reconciliation becomes the system. That is the failure mode we describe in <a href="/#problem">why most operations still run blind</a>.</p>

<h2>Design principles that work in production</h2>
<ol>
  <li><strong>Grower semantics first.</strong> Tag by zone, crop, and function before preserving vendor point names as the primary UI language.</li>
  <li><strong>Normalize units and quality.</strong> °F vs °C, mS/cm vs ppm, stale vs live — operators should not do unit math under pressure.</li>
  <li><strong>Separate collect, model, and act.</strong> Ingest widely; model carefully; write back only through governed control paths.</li>
  <li><strong>Keep edge autonomy.</strong> Local controllers must continue irrigation and climate safety if the cloud link drops.</li>
  <li><strong>Make AI a consumer of the model.</strong> Anomaly detection and forecasts are only as good as the schema underneath. See <a href="/articles/predictive-ai-for-grow-room-anomaly-detection/">predictive AI for anomaly detection</a>.</li>
</ol>

<h2>How Advanced Autoponics implements the layer</h2>
<p>Our <a href="/#platform">Platform Layer 1.0</a> is a unified data layer for climate, irrigation, sensors, and alerts — MQTT, BACnet, and Modbus feeds normalized into a single operational schema without rip-and-replace. Layers above add AI anomaly detection and predictive visibility. <a href="/#geminy">Geminy IoT</a> becomes the command center on top of that model, not a parallel silo.</p>
<p>For multi-site operators, the same layer powers the “one network, every facility” story: on-site controllers feed the cloud so every greenhouse shares live views, alerts, and commands. Read more on <a href="/#connectivity">distributed CEA connectivity</a>.</p>

<h2>Getting started without boiling the ocean</h2>
<p>Start with one production block. Map the ten signals that decide whether today’s crop succeeds. Connect those sources, prove the unified view, then expand to adjacent zones. Parallel work can include BACnet climate mapping (<a href="/articles/bacnet-integration-for-cea/">BACnet integration for CEA</a>) and protocol strategy (<a href="/articles/mqtt-vs-modbus-vs-opc-ua-in-cea/">MQTT vs Modbus vs OPC UA</a>).</p>

<p>If your team still builds the full picture in their heads, you do not have a visualization problem — you have a data layer problem. That same gap shows up when comparing <a href="/articles/greenhouse-vs-vertical-farming-automation/">greenhouse vs vertical automation</a> strategies and when labor teams become the integration layer — see <a href="/articles/cea-labor-shortage-controls-ai/">labor scarcity and controls</a>.</p>
<p><a href="/#contact">Book a demo</a> with Advanced Autoponics to see how quickly a first location can share one system view. <a href="tel:+16083200213">(608) 320-0213</a> · <a href="mailto:info@advancedautoponics.com">info@advancedautoponics.com</a>.</p>
""",
        "mqtt-vs-modbus-vs-opc-ua-in-cea": r"""
<div class="article-stats" role="group" aria-label="Key figures">
  <div class="article-stats__item"><p class="article-stats__value">Modbus</p><p class="article-stats__label">Skids, VFDs, meters — floor workhorse</p></div>
  <div class="article-stats__item"><p class="article-stats__value">MQTT</p><p class="article-stats__label">Multi-site telemetry &amp; events</p></div>
  <div class="article-stats__item"><p class="article-stats__value">OPC UA</p><p class="article-stats__label">Structured enterprise / MES path</p></div>
</div>

<p>Ask three integrators how a greenhouse should talk to the cloud and you may hear three answers: MQTT for IoT, Modbus because the skid already speaks it, or OPC UA because the enterprise architect asked for it. All three can be correct. None of them should become a religious war.</p>

<figure class="article-chart" aria-labelledby="chart-proto-fit-title">
  <figcaption class="article-chart__title" id="chart-proto-fit-title">Protocol fit by job</figcaption>
  <p class="article-chart__subtitle">Relative suitability · schematic score</p>
  <ul class="article-chart__bars">
    <li class="article-chart__bar-row"><span class="article-chart__bar-label">Machine I/O</span><span class="article-chart__bar-track"><span class="article-chart__bar-fill" style="--bar:95%"></span></span><span class="article-chart__bar-value">Modbus</span></li>
    <li class="article-chart__bar-row"><span class="article-chart__bar-label">Sensor fan-in</span><span class="article-chart__bar-track"><span class="article-chart__bar-fill" style="--bar:92%"></span></span><span class="article-chart__bar-value">MQTT</span></li>
    <li class="article-chart__bar-row"><span class="article-chart__bar-label">Enterprise model</span><span class="article-chart__bar-track"><span class="article-chart__bar-fill" style="--bar:88%"></span></span><span class="article-chart__bar-value">OPC UA</span></li>
    <li class="article-chart__bar-row"><span class="article-chart__bar-label">Legacy HVAC</span><span class="article-chart__bar-track"><span class="article-chart__bar-fill article-chart__bar-fill--muted" style="--bar:70%"></span></span><span class="article-chart__bar-value">BACnet*</span></li>
  </ul>
  <p class="article-chart__footnote">*BACnet often coexists — see the dedicated BACnet article. Scores are qualitative integrator guidance, not benchmarks.</p>
</figure>

<p>This comparison helps CEA and greenhouse teams choose protocols by job — and explains why Advanced Autoponics treats multi-protocol ingestion as table stakes for a <a href="/articles/unified-data-layer-for-greenhouses/">unified data layer</a>.</p>

<h2>Modbus: the workhorse on the plant floor</h2>
<p>Modbus RTU (serial) and Modbus TCP remain ubiquitous on irrigation skids, VFDs, power meters, and many dosing controllers. Strengths include simplicity, wide device support, and predictability. Limits include weak security on classic deployments, awkward modeling for complex assets, and polling designs that do not love thousands of sparse sensors.</p>
<p><strong>Use Modbus when:</strong> you are talking to industrial devices that already expose registers, and you need reliable read/write for control loops on site.</p>

<h2>MQTT: efficient telemetry and eventing</h2>
<p>MQTT shines for publish/subscribe telemetry — sensors, gateways, and edge agents that send frequent small messages. It is lightweight, firewall-friendly with the right broker design, and natural for multi-site fan-in to a cloud command center. It is not, by itself, a PLC programming model. Retained messages and topic design matter; so does authentication.</p>
<p><strong>Use MQTT when:</strong> you need scalable telemetry, mobile/cloud visibility, and event-driven alerts across facilities — especially alongside on-site controllers that still handle hard real-time I/O.</p>

<figure class="article-chart" aria-labelledby="chart-proto-stack-title">
  <figcaption class="article-chart__title" id="chart-proto-stack-title">Polyglot edge, one model</figcaption>
  <p class="article-chart__subtitle">Where each protocol typically lives</p>
  <div class="article-chart__stack">
    <div class="article-chart__stack-bar" role="img" aria-label="Stacked architecture layers for protocols">
      <span class="article-chart__stack-seg" style="--w:35%; --seg:#9a9a9a"></span>
      <span class="article-chart__stack-seg" style="--w:30%; --seg:var(--accent)"></span>
      <span class="article-chart__stack-seg" style="--w:20%; --seg:#b8b8b8"></span>
      <span class="article-chart__stack-seg" style="--w:15%; --seg:#d8d8d8"></span>
    </div>
    <ul class="article-chart__legend">
      <li><span class="article-chart__swatch" style="--swatch:#9a9a9a"></span>Field Modbus</li>
      <li><span class="article-chart__swatch" style="--swatch:var(--accent)"></span>MQTT telemetry</li>
      <li><span class="article-chart__swatch" style="--swatch:#b8b8b8"></span>OPC UA edge</li>
      <li><span class="article-chart__swatch" style="--swatch:#d8d8d8"></span>BACnet HVAC</li>
    </ul>
  </div>
  <p class="article-chart__footnote">Fighting for a single protocol usually costs more than normalizing mixed feeds.</p>
</figure>

<h2>OPC UA: structured, standards-heavy interoperability</h2>
<p>OPC UA offers rich information modeling, stronger security features, and a path many industrial enterprises prefer for MES/SCADA alignment. It can be heavier to implement and is not always available on horticultural devices. When present — often via gateways or modern PLCs — it is excellent for structured browseable data and controlled enterprise integration.</p>
<p><strong>Use OPC UA when:</strong> corporate standards require it, or when you need a more expressive model than Modbus registers for plant-wide systems.</p>
<p>In practice, many CEA sites end up with all three. A dosing skid speaks Modbus TCP. Wireless substrate probes publish over MQTT. A corporate OT standard asks for OPC UA on the plant network edge.</p>

<h2>Side-by-side for CEA decisions</h2>
<ul>
  <li><strong>Device density:</strong> Modbus for dense machine I/O; MQTT for many distributed sensors; OPC UA for modeled enterprise assets.</li>
  <li><strong>Control authority:</strong> Keep closed-loop actuation close to Modbus/fieldbus controllers; use MQTT/OPC UA carefully for supervisory commands.</li>
  <li><strong>Multi-site:</strong> MQTT (and secured IP protocols) usually win for cloud aggregation; field protocols stay at the edge.</li>
  <li><strong>Legacy HVAC:</strong> Often BACnet rather than these three — see <a href="/articles/bacnet-integration-for-cea/">BACnet integration for CEA</a>.</li>
</ul>

<h2>The winning pattern: polyglot edge, one model</h2>
<p>Advanced Autoponics supports Modbus TCP/RTU, MQTT, OPC UA, BACnet, and more on the <a href="/#connectivity">network</a> that feeds Geminy. Controllers speak industrial dialects; the platform normalizes points into grower-relevant zones and signals. Operators get one view. AI anomaly detection watches one schema. Nobody has to rip out a working Modbus skid to enjoy cloud visibility.</p>

<h2>Questions to ask vendors</h2>
<ol>
  <li>Which protocols are native vs. gateway-only?</li>
  <li>How are write commands authenticated and logged?</li>
  <li>What happens to control when the broker or cloud link fails?</li>
  <li>Can points be remapped without custom software? See <a href="/articles/full-automation-without-custom-development/">automation without custom development</a>.</li>
</ol>

<p>Pick protocols for the job, then demand a platform that can host all of them. <a href="/#contact">Book a demo</a> to see multi-protocol CEA automation in practice — <a href="tel:+16083200213">(608) 320-0213</a> · <a href="mailto:info@advancedautoponics.com">info@advancedautoponics.com</a>.</p>
""",
        "predictive-ai-for-grow-room-anomaly-detection": r"""
<div class="article-stats" role="group" aria-label="Key figures">
  <div class="article-stats__item"><p class="article-stats__value">Hours earlier</p><p class="article-stats__label">Drift vs hard threshold trips</p></div>
  <div class="article-stats__item"><p class="article-stats__value">2–4 wks</p><p class="article-stats__label">Typical shadow-mode trust period</p></div>
  <div class="article-stats__item"><p class="article-stats__value">Edge + cloud</p><p class="article-stats__label">Local action when WAN is imperfect</p></div>
</div>

<p>Most grow rooms already have alarms. Temperature high. Humidity high. Tank level low. Those alarms are necessary and still insufficient. Crops are lost in the gray zone where every individual reading looks “fine” but the combination is wrong — a slow EC climb, a VPD drift overnight, a pump duty cycle that no longer matches irrigation demand.</p>

<figure class="article-chart" aria-labelledby="chart-ai-detect-title">
  <figcaption class="article-chart__title" id="chart-ai-detect-title">When problems become visible</figcaption>
  <p class="article-chart__subtitle">Illustrative timeline · hours before yield impact</p>
  <svg class="article-chart__svg" viewBox="0 0 360 160" role="img" aria-label="Line chart comparing earlier anomaly detection versus later threshold alarms">
    <line class="chart-grid" x1="40" y1="30" x2="340" y2="30"/>
    <line class="chart-grid" x1="40" y1="70" x2="340" y2="70"/>
    <line class="chart-grid" x1="40" y1="110" x2="340" y2="110"/>
    <line class="chart-axis" x1="40" y1="20" x2="40" y2="130"/>
    <line class="chart-axis" x1="40" y1="130" x2="340" y2="130"/>
    <polyline class="chart-line" points="50,115 120,100 180,70 240,40 320,22"/>
    <polyline class="chart-line" points="50,118 160,112 250,90 320,55" style="stroke:var(--grey-175)"/>
    <circle class="chart-dot" cx="180" cy="70" r="3.5"/>
    <circle class="chart-dot" cx="280" cy="72" r="3.5" style="stroke:var(--grey-175)"/>
    <text class="chart-value" x="180" y="60" text-anchor="middle">Anomaly</text>
    <text x="280" y="62" text-anchor="middle">Threshold</text>
    <text x="50" y="148" text-anchor="middle">T0</text>
    <text x="200" y="148" text-anchor="middle">Drift</text>
    <text x="320" y="148" text-anchor="middle">Impact</text>
  </svg>
  <p class="article-chart__footnote">Schematic: pattern breaks often precede hard limit trips by hours — sometimes a full shift.</p>
</figure>

<p>Predictive AI for grow-room anomaly detection is about recognizing those pattern breaks early, at the controller and in the cloud, so teams respond before yield, labor, or uptime take the hit.</p>

<h2>Thresholds vs. anomalies</h2>
<p>A threshold says: alert if pH &lt; 5.4. An anomaly model says: this zone’s pH/EC/temperature relationship no longer matches its recent healthy behavior, even if each value is still inside absolute limits. Both belong in a serious facility. Thresholds catch hard faults. Anomaly detection catches silent drift.</p>

<figure class="article-chart" aria-labelledby="chart-ai-signals-title">
  <figcaption class="article-chart__title" id="chart-ai-signals-title">Signals that repay close attention</figcaption>
  <p class="article-chart__subtitle">Relative early-warning value · schematic</p>
  <ul class="article-chart__bars">
    <li class="article-chart__bar-row"><span class="article-chart__bar-label">Irrig. vs EC</span><span class="article-chart__bar-track"><span class="article-chart__bar-fill" style="--bar:92%"></span></span><span class="article-chart__bar-value">High</span></li>
    <li class="article-chart__bar-row"><span class="article-chart__bar-label">VPD pairs</span><span class="article-chart__bar-track"><span class="article-chart__bar-fill" style="--bar:88%"></span></span><span class="article-chart__bar-value">High</span></li>
    <li class="article-chart__bar-row"><span class="article-chart__bar-label">Dose frequency</span><span class="article-chart__bar-track"><span class="article-chart__bar-fill" style="--bar:75%"></span></span><span class="article-chart__bar-value">Med-high</span></li>
    <li class="article-chart__bar-row"><span class="article-chart__bar-label">Motor current</span><span class="article-chart__bar-track"><span class="article-chart__bar-fill" style="--bar:70%"></span></span><span class="article-chart__bar-value">Med-high</span></li>
  </ul>
  <p class="article-chart__footnote">Value collapses if naming and units are inconsistent across zones.</p>
</figure>

<h2>Where controller-level AI matters</h2>
<p>Cloud-only analytics arrive too late when a valve sticks at 1 a.m. Controller-level AI watches signals on site, flags drift in irrigation, VPD, and nutrient curves, and keeps acting when WAN links are imperfect. Cloud systems then aggregate multi-site insight, summaries, and supervisory control. Advanced Autoponics builds for that split: edge intelligence plus <a href="/#geminy">Geminy IoT</a> as the command center.</p>

<h2>Signals that repay close attention</h2>
<ul>
  <li>Irrigation runtime vs. substrate or return EC trends</li>
  <li>Zone temperature/humidity pairs that imply VPD stress</li>
  <li>Nutrient dosing frequency changes without recipe changes</li>
  <li>Fan or pump current signatures that precede mechanical failure</li>
  <li>CO<sub>2</sub> and light schedules that desync from climate capability</li>
</ul>
<p>None of these are useful in isolation if naming and units are inconsistent. Anomaly AI needs a <a href="/articles/unified-data-layer-for-greenhouses/">unified data layer</a> so “Zone 3 EC” means the same thing every night.</p>

<h2>What operators should see</h2>
<p>Raw model scores are not an interface. Growers need:</p>
<ol>
  <li>Plain-language summaries of what changed</li>
  <li>Priority that respects crop risk, not just statistical novelty</li>
  <li>Links from alert → zone → likely subsystems</li>
  <li>Confidence that false alarms will be tuned down over time</li>
</ol>
<p>That is the “predictive visibility” layer in our <a href="/#platform">platform</a>: forecasts and LLM-generated summaries of what matters now — not a wall of sensor logs.</p>
<p>Good anomaly workflows also preserve context. An alert that only says “Zone 3 unusual” wastes time. An alert that says irrigation runtime rose while return EC flattened — and points operators at the manifold and recipe history — shortens the path from notice to action.</p>

<h2>Avoiding AI theater</h2>
<p>If a vendor cannot explain which signals feed the model, how the system behaves offline, or how you correct bad alerts, you are buying a demo. Demand integration with your real protocols — Modbus, MQTT, BACnet, OPC UA — and a path that does not require a custom data science team. Related: <a href="/articles/full-automation-without-custom-development/">full automation without custom development</a> and <a href="/articles/mqtt-vs-modbus-vs-opc-ua-in-cea/">protocol choices in CEA</a>.</p>

<h2>A rollout that earns trust</h2>
<p>Start in shadow mode: detect and notify without auto-changing setpoints. Compare alerts to operator findings for two to four weeks. Then enable guided responses on well-understood loops. Keep humans in charge of crop-critical writes until the facility trusts the system.</p>

<p>Advanced Autoponics ships anomaly detection as part of a connected stack — controllers, unified data, and Geminy — so predictive insight shows up where work happens. <a href="/#contact">Book a demo</a> to see how early warnings look on a live-style zone view. <a href="tel:+16083200213">(608) 320-0213</a> · <a href="mailto:info@advancedautoponics.com">info@advancedautoponics.com</a>.</p>
""",
    }


BODIES.update(_more_bodies())

BODY_RE = re.compile(
    r'(<div class="article-body reveal">\s*)(.*?)(\s*</div>\s*\n\s*</article>)',
    re.DOTALL,
)


def inject_html(slug: str, body: str) -> None:
    path = ARTICLES_DIR / slug / "index.html"
    if not path.exists():
        raise FileNotFoundError(path)
    text = path.read_text(encoding="utf-8")
    new_body = body.strip() + "\n"
    updated, n = BODY_RE.subn(rf"\1{new_body}\3", text, count=1)
    if n != 1:
        raise RuntimeError(f"Failed to replace article body in {path}")
    # Bump dateModified in JSON-LD when present
    updated = re.sub(
        r'"dateModified":\s*"[^"]+"',
        '"dateModified": "2026-07-18"',
        updated,
        count=1,
    )
    path.write_text(updated, encoding="utf-8")
    print(f"Updated {path.relative_to(ROOT)}")


def main() -> None:
    missing = [s for s in BODIES if not (ARTICLES_DIR / s / "index.html").exists()]
    if missing:
        raise SystemExit(f"Missing article dirs: {missing}")
    for slug, body in BODIES.items():
        inject_html(slug, body)
    print(f"Done — {len(BODIES)} articles enhanced.")


if __name__ == "__main__":
    main()
