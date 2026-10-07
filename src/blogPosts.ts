export type BlogBlock =
  | { type: 'h2'; text: string }
  | { type: 'h3'; text: string }
  | { type: 'p'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }

export type BlogPost = {
  slug: string
  title: string
  label: string
  excerpt: string
  author: string
  published: string
  updated: string
  originalUrl: string
  blocks: BlogBlock[]
}

export const blogUpdatedLabel = 'November 10, 2024'

export const medicalDisclaimer =
  'This page republishes general information from Local Infusion. It is not medical advice and does not diagnose, prescribe, or promise that someone will qualify for treatment or coverage. Infusion reactions, ARIA, and bleeding can be serious. Drug approvals, prices, and availability can change after the original publication date. Confirm current prescribing information with a licensed clinician. Call 911 for a medical emergency. Local Doctor does not operate infusion centers.'

export const blogPosts: BlogPost[] = [
  {
    slug: 'diet-for-alzheimers-patients',
    title: 'Diet For Alzheimer’s Patients: Foods To Eat & Avoid',
    label: 'Brain health',
    excerpt:
      'What Local Infusion published about the MIND and Mediterranean diets, including food groups to emphasize and foods the MIND diet limits.',
    author: 'Ashley Knapp, RN',
    published: '2024-01-16',
    updated: '2024-11-10',
    originalUrl: 'https://mylocalinfusion.com/diet-for-alzheimers-patients/',
    blocks: [
      {
        type: 'p',
        text: 'The science behind what foods to eat and avoid so patients and their caregivers can feel empowered to make the healthiest choices.',
      },
      {
        type: 'p',
        text: 'Alzheimer’s disease — the most common cause of dementia — is a neurodegenerative disease that affects a person’s memory and thinking skills. It causes physical changes to the brain cells, resulting in the buildup of amyloid plaques and bundles of fibers called neurofibrillary tangles (abnormal bundles of tau proteins). These plaques and tangles in the brain result in a loss of connections between neurons. Since the neurons are responsible for transmitting messages, as they die, Alzheimer’s patients experience memory loss, confusion, and difficulty carrying out tasks. While there is no cure for Alzheimer’s, a healthy diet can help support a patient’s brain and body. Below is the original article’s account of foods to eat and avoid.',
      },
      { type: 'h2', text: 'The best diet for Alzheimer’s patients' },
      {
        type: 'p',
        text: 'MIND diet is an acronym for Mediterranean-DASH Intervention for Neurodegenerative Delay. It is a mix of the Mediterranean diet and the DASH diet (Dietary Approaches to Stop Hypertension). The focus: food choices that lower blood pressure and have been proven to benefit brain health.',
      },
      {
        type: 'p',
        text: 'It focuses on plant-based foods with a reduced consumption of animal products, as well as foods rich in saturated fat. The emphasis is on plants, with a high consumption of berries and green leafy vegetables.',
      },
      {
        type: 'p',
        text: 'According to research the original article describes, conducted on over 900 dementia-free older adults, following the MIND diet resulted in a reduced risk of Alzheimer’s and a slower rate of cognitive decline. An intensive analysis of the MIND diet and other factors found that adhering to it for about 4.5 years reduced the rate of Alzheimer’s disease by 53% compared with when it was not adhered to.',
      },
      {
        type: 'p',
        text: 'One reason the original article gives for these benefits is the antioxidants in the recommended food groups. The antioxidants in berries and the vitamin E in olive oil, leafy greens, avocados, and nuts can help protect the brain from oxidative stress, which refers to the imbalance between the production of antioxidant defenses and free radicals. Long-term exposure to oxidative stress can result in cell damage, especially in the brain.',
      },
      {
        type: 'p',
        text: 'Another reason is an anti-inflammatory effect. While inflammation is the body’s natural response to infections and injuries, it can be harmful in excess. When not properly regulated, inflammation can contribute to chronic disease. Omega-3 fatty acids have anti-inflammatory effects on the brain, and their consumption is associated with slower loss of brain function.',
      },
      {
        type: 'p',
        text: 'The original article lists these brain-healthy food groups in the MIND diet:',
      },
      { type: 'h3', text: 'Green leafy vegetables' },
      {
        type: 'p',
        text: 'Vegetables like kale, spinach, collard greens, and lettuce help with age-related cognitive decline. They help lower inflammation and oxidative stress, both of which are associated with Alzheimer’s disease. The original article says that, on this diet, patients consume greater than or equal to 6 servings of leafy green vegetables per week.',
      },
      { type: 'h3', text: 'Nuts' },
      {
        type: 'p',
        text: 'Cashews, almonds, and pistachios are described as snacks for the brain because they contain fiber, antioxidants, and healthy fats. On this diet, the original article says Alzheimer’s patients should consume greater than or equal to 5 servings of nuts per week.',
      },
      { type: 'h3', text: 'Berries' },
      {
        type: 'p',
        text: 'According to studies cited in the original article, consuming berries such as blackberries, strawberries, raspberries, and blueberries can prevent cognitive aging in women by up to 2.5 years. Consuming more than or equal to 2 servings of berries per week is recommended there.',
      },
      { type: 'h3', text: 'Beans' },
      {
        type: 'p',
        text: 'Beans such as black beans, pinto beans, and kidney beans are described as low in calories and fat and high in protein and fiber. The original article suggests more than 3 servings per week.',
      },
      { type: 'h3', text: 'Whole grains' },
      {
        type: 'p',
        text: 'Grains like brown rice, oatmeal, whole grain pasta, and quinoa are described as useful for the brain. The MIND diet, as summarized in the original article, recommends more than or equal to 3 servings of whole grains per day.',
      },
      { type: 'h3', text: 'Fish' },
      {
        type: 'p',
        text: 'Fish included on the MIND diet in the original article are salmon, tuna, and trout, all of which contain healthy fats. The article says researchers found that eating fish at least once a week helps protect brain function.',
      },
      { type: 'h3', text: 'Poultry' },
      {
        type: 'p',
        text: 'Poultry like chicken, turkey, and eggs are described as brain foods. The original article says consumption of eggs is associated with better performance in memory function and verbal fluency, and that eggs in the diet are associated with better performance on cognitive tests. Patients are described as consuming more than or equal to 2 servings of poultry per week.',
      },
      { type: 'h3', text: 'Olive oil' },
      {
        type: 'p',
        text: 'A study cited in the original article found that using olive oil as the primary oil at home provides better protection against cognitive decline and other risk factors like obesity and heart disease.',
      },
      { type: 'h2', text: 'A note on the Mediterranean diet' },
      {
        type: 'p',
        text: 'Closely related to MIND, the Mediterranean diet focuses on the traditional foods of countries bordering the Mediterranean Sea and is described as a long-term approach to healthy eating. It emphasizes nuts and seeds, whole grains, fruits, legumes, and vegetables.',
      },
      {
        type: 'p',
        text: 'In a 2018 study described in the original article, researchers found that those who followed this diet had thicker cortical brain regions (in Alzheimer’s patients, these brain regions shrink). The article also says Alzheimer’s patients have a higher level of beta-amyloid protein and lower glucose metabolism, but following the Mediterranean diet may result in higher glucose metabolism and lower levels of beta-amyloid protein.',
      },
      {
        type: 'p',
        text: 'A study the original article describes, which examined about 600 brains of older people who died at 91, found that people who stuck to either the Mediterranean or MIND diet had less evidence of pathologies like tau tangles and amyloid plaques.',
      },
      { type: 'h2', text: 'Foods that should be avoided with Alzheimer’s' },
      {
        type: 'p',
        text: 'The original article says the MIND diet specifically limits some foods, including:',
      },
      {
        type: 'ul',
        items: ['Red meat', 'Butter and margarine', 'Cheese', 'Pastries and sweets', 'Fried or fast food'],
      },
      {
        type: 'p',
        text: 'The original article says it is important to avoid a high-fat diet with excess saturated fatty acids (SFA) and cholesterol, as they can contribute to the progression of Alzheimer’s disease. It also says this type of diet is related to hyper-insulinemia, which may result in a higher risk of Alzheimer’s disease.',
      },
      { type: 'h2', text: 'Treatment follow-through is separate from diet' },
      {
        type: 'p',
        text: 'The original article says that on January 6, 2023, Leqembi received full FDA approval through the Accelerated Approval pathway for the treatment of Alzheimer’s, and that Local Infusion is ready to offer Leqembi at Local Infusion locations once a patient is referred. It also describes Local Infusion Guides who work with a patient and their physician on what to expect, financial guidance, and prior authorization.',
      },
      {
        type: 'p',
        text: 'That infusion-center offering belongs to Local Infusion, the original publisher. Local Doctor does not operate infusion centers. Diet changes are not a substitute for a clinical evaluation. If you want a specialist to review whether treatment readiness is even the right question, start with Local Doctor’s eligibility check.',
      },
    ],
  },
  {
    slug: 'leqembi-lecanemab-cost',
    title: 'How Much Does Leqembi (Lecanemab) Cost?',
    label: 'Cost',
    excerpt:
      'Local Infusion’s published breakdown of Leqembi’s annual list price, how insurance concepts change the bill, and why the care setting can change the cost.',
    author: 'Jenna Paladino, NP',
    published: '2023-09-21',
    updated: '2024-11-10',
    originalUrl: 'https://mylocalinfusion.com/leqembi-lecanemab-cost/',
    blocks: [
      {
        type: 'p',
        text: 'How much infusions of this Alzheimer’s drug cost, with and without insurance, and how the original article says patients can lower the cost.',
      },
      {
        type: 'p',
        text: 'Leqembi is an intravenous (IV) infusion prescribed for early Alzheimer’s disease that belongs to the amyloid beta-directed monoclonal antibody drug class. It contains the active drug lecanemab-irmb and is used to slow the progression of Alzheimer’s disease in patients who have mild cognitive impairment or mild dementia — meaning those who are still in the early stages of dementia or who are experiencing some cognitive changes that do not significantly impair their daily lives.',
      },
      {
        type: 'p',
        text: 'The original article says that on January 6, 2023, Leqembi received full approval from the U.S. Food and Drug Administration through the Accelerated Approval pathway for the treatment of Alzheimer’s disease. It says Leqembi joined medications that target the fundamental pathophysiology of Alzheimer’s disease and have received traditional approval, including Aduhelm (aducanumab). Leqembi works by reducing amyloid plaques in the brain which, in turn, slows down the progression of cognitive decline associated with Alzheimer’s disease.',
      },
      {
        type: 'p',
        text: 'The original article states that, following the clinical trial and FDA approval, Local Infusion became the first center in Maine to administer Leqembi, and that Local Infusion is ready to offer it at its own locations once a patient is referred by a clinician. That “first in Maine” statement is Local Infusion’s claim about Local Infusion centers. Local Doctor does not operate infusion centers and does not claim that status.',
      },
      { type: 'h2', text: 'How much does Leqembi (lecanemab) cost?' },
      {
        type: 'p',
        text: 'The original article says Leqembi, produced by Eisai Inc. and Biogen Inc., has a list price of $26,500 per year. The actual out-of-pocket amount each patient pays will vary depending on individual insurance coverage. The article says to ask about co-pay assistance programs through Eisai if cost is a concern — many patients will qualify for additional assistance and even a $0 copay depending on eligibility.',
      },
      { type: 'h2', text: 'How does insurance coverage impact drug pricing?' },
      {
        type: 'p',
        text: 'The original article says how much the patient pays is ultimately a function of the insurance plan. Every plan is different and has different premiums. It highlights these concepts:',
      },
      {
        type: 'ul',
        items: [
          'Copay: a fixed amount of money that you pay for a healthcare service, which the original article says generally totals $0–$50 per visit.',
          'Coinsurance: a percentage of the total cost of a healthcare service.',
          'Deductible: an amount of money you must pay before your health insurance plan starts to share costs.',
          'Or a combination of these options.',
        ],
      },
      {
        type: 'p',
        text: 'The original article reports an Eisai estimate that roughly 91% of patients will be covered through Medicare with Medigap (supplemental insurance), Medicare Advantage, Medicaid, or commercial insurance, thus reducing their care costs to $0 or a few dollars per day. It then says the remaining 9% of patients will be responsible for 20% of Leqembi costs as coinsurance under Medicare Part B, paying $26,500 per year (or roughly $14.50 per day). Those figures are stated together in the original article.',
      },
      {
        type: 'p',
        text: 'The original article also says that if you do not have insurance or are not in-network with your infusion center, it may be possible to bill an insurance company for the medication costs out of network. If out-of-network benefits are not available, it says you may be able to be seen as a self-pay patient.',
      },
      { type: 'h2', text: 'How does site of care impact the cost of Leqembi (lecanemab)?' },
      {
        type: 'p',
        text: 'The original article says the decision a patient can make to influence the cost of an infusion is where to receive treatment. It lists three options where a patient may receive prescription drug infusion therapy from a healthcare professional:',
      },
      {
        type: 'ol',
        items: [
          'Hospital outpatient',
          'Home',
          'Office setting (ambulatory infusion center or specialty doctor’s office)',
        ],
      },
      {
        type: 'p',
        text: 'The original article says hospital outpatient is where 50–60% of infusions take place nationally, and that the cost is generally about twice what it costs in the home or office. It says home infusion has received a lot of press, but according to the National Infusion Center Association, as cited there, home infusion tends to be 50% more expensive than a healthcare provider’s office. It says the office setting will be the most affordable care setting for patients who have received a referral from their physician for infusion therapy.',
      },
      {
        type: 'p',
        text: 'These site-of-care comparisons describe infusion settings in general. They are not a statement that Local Doctor runs an infusion center, a home-infusion service, or a hospital clinic.',
      },
      { type: 'h2', text: 'How can I lower the cost of Leqembi (lecanemab) infusions?' },
      {
        type: 'p',
        text: 'The original article says Eisai is in the process of establishing a Patient Assistance Program to provide Leqembi at no cost for eligible uninsured and underinsured patients who meet certain financial criteria.',
      },
      { type: 'h2', text: 'What the original article says Local Infusion does' },
      {
        type: 'p',
        text: 'The original article says that at Local Infusion, each patient is paired 1:1 with a Guide who works with them to determine out-of-pocket costs and which financial programs they are eligible for, and that Guides also handle prior authorization. That is Local Infusion’s infusion-center support model.',
      },
      {
        type: 'p',
        text: 'Local Doctor can help you start a treatment-readiness review, including insurance questions that belong in that review. Coverage still depends on the plan, the clinical criteria, and the site that would actually provide treatment.',
      },
    ],
  },
  {
    slug: 'donanemab-vs-lecanemab',
    title: 'Leqembi (Lecanemab) vs Donanemab For Alzheimer’s: What’s The Difference?',
    label: 'Comparison',
    excerpt:
      'How the original Local Infusion article compares lecanemab and donanemab: what each antibody targets, dosing interval, trial results, price, and ARIA rates.',
    author: 'Jenna Paladino, NP',
    published: '2023-08-30',
    updated: '2024-11-10',
    originalUrl: 'https://mylocalinfusion.com/donanemab-vs-lecanemab/',
    blocks: [
      {
        type: 'p',
        text: 'The original article compares Leqembi (lecanemab) and donanemab for early-stage Alzheimer’s disease. Approval status and price in that article are as Local Infusion published them on the updated date above.',
      },
      {
        type: 'p',
        text: 'Alzheimer’s disease continues to pose a significant healthcare challenge, which has led to the search for Alzheimer’s drugs. According to the National Institute on Aging and the Alzheimer’s Association Research Framework, as cited in the original article, abnormal β-amyloid is a key pathological hallmark of Alzheimer’s disease. β-amyloid, also known as beta-amyloid, is a protein fragment that tends to accumulate and form sticky plaques outside the neurons of the brain. The accumulation of this plaque disrupts communication between neurons, which is why it is one of the major targets in Alzheimer’s disease drug development. Leqembi (lecanemab) and donanemab are two medications the original article discusses for early-stage Alzheimer’s disease.',
      },
      { type: 'h2', text: 'About lecanemab' },
      {
        type: 'p',
        text: 'The original article says lecanemab, manufactured by Biogen and Eisai, is a monoclonal antibody that targets soluble aggregated Aβ species such as monomers, oligomers, insoluble fibrils in plaques, and protofibrils. It describes soluble aggregated Aβ species as forms of β-amyloid (Aβ) peptides that tend to clump together and form aggregates, leading to insoluble plaques in the brains of those with Alzheimer’s disease. It says research has shown that lecanemab is effective in reducing robust brain fibrillar amyloid and slowing clinical decline in early Alzheimer’s disease (“early” meaning mild cognitive impairment or mild dementia).',
      },
      { type: 'h2', text: 'About donanemab' },
      {
        type: 'p',
        text: 'The original article says donanemab (N3pG) is a monoclonal antibody that recognizes the Aβ found in amyloid plaques. Unlike other Alzheimer’s medications that work to prevent the deposition of new plaques or the growth of existing plaques, it says donanemab targets the deposited plaque and works to clear the existing amyloid plaques in the brain.',
      },
      { type: 'h2', text: 'Top-line differences between lecanemab and donanemab' },
      {
        type: 'p',
        text: 'The original article says that while donanemab and lecanemab are both monoclonal antibodies that target amyloid-beta (Aβ) plaques, the main difference is that they target them at different stages as they build up in the brain. It says lecanemab targets amyloid-beta plaques as they proceed to form fibers, whereas donanemab binds to the plaques when the fibers have clumped together to become a larger plaque in the brain.',
      },
      {
        type: 'p',
        text: 'Another difference it describes: both are given as intravenous infusions based on the weight of the patient, but lecanemab is given every 2 weeks while donanemab is given every 4 weeks.',
      },
      { type: 'h2', text: 'Are both lecanemab and donanemab FDA-approved?' },
      {
        type: 'p',
        text: 'The original article says the U.S. Food and Drug Administration approved lecanemab in January 2023 for the treatment of Alzheimer’s disease through the Accelerated Approval Pathway, which expedites the approval of medications for a serious medical condition with unmet treatment needs.',
      },
      {
        type: 'p',
        text: 'The same article says Eli Lilly’s donanemab has been found effective for reducing amyloid plaque in the early stages of Alzheimer’s disease, and that the FDA considers amyloid plaque reduction to be a valid Alzheimer’s biomarker, but that the medication had not yet received FDA approval at the time of that update. Treat that sentence as the original article’s statement as of November 10, 2024, not as a current Local Doctor regulatory determination.',
      },
      { type: 'h2', text: 'Efficacy: does lecanemab work as well as donanemab?' },
      {
        type: 'p',
        text: 'The original article says that in the phase 3 trials for early Alzheimer’s disease, CLARITY-AD for lecanemab and TRAILBLAZER-ALZ 2 for donanemab, these two medications resulted in the slowing of cognitive decline and positive alterations on specific biomarkers of Alzheimer’s disease.',
      },
      {
        type: 'p',
        text: 'It says that, according to results from a study it calls landmark, Eli Lilly’s donanemab slowed cognitive and functional decline in Alzheimer’s patients by 35%, measured using the Integrated Alzheimer’s Disease Rating Scale (iADRS).',
      },
      {
        type: 'p',
        text: 'It says results from Eisai and Biogen’s lecanemab trial show that it reduces the rate of Alzheimer’s disease by 27%.',
      },
      { type: 'h2', text: 'What is the cost difference between lecanemab and donanemab?' },
      {
        type: 'p',
        text: 'The original article says lecanemab costs $26,500 per year. It says that because donanemab was not yet on the market in that article, there was not a specific price, but that there were speculations by the manufacturers that it would likely be around the same price as lecanemab.',
      },
      { type: 'h2', text: 'How long it takes for lecanemab and donanemab to work' },
      {
        type: 'p',
        text: 'According to the original article’s summary of lecanemab’s phase 3 trial, amyloid reduction is achieved within 3 months of treatment and clinical benefits within 6 months of treatment. It says more than 80% of subjects were amyloid negative (by visual reading) within 12–18 months of treatment in comparison with placebo.',
      },
      {
        type: 'p',
        text: 'It says research shows that, in early Alzheimer’s disease, donanemab resulted in a decrease of amyloid plaque by 24 weeks, and 68% of those who received donanemab were “amyloid-negative” — meaning their amyloid plaque level was below 24.1 CL (described there as complete amyloid clearance) — by the 76-week mark.',
      },
      { type: 'h2', text: 'Side effects of lecanemab and donanemab' },
      { type: 'h3', text: 'Infusion-related reactions with lecanemab' },
      {
        type: 'p',
        text: 'The original article says lecanemab may result in severe reactions during or after infusion, including:',
      },
      {
        type: 'ul',
        items: [
          'Chills',
          'Fever',
          'Lightheadedness or dizziness',
          'Nausea',
          'Vomiting',
          'Racing heart or chest pounding',
          'Shortness of breath or difficulty breathing',
          'Joint pain',
          'Body aches',
        ],
      },
      {
        type: 'p',
        text: 'It says you should inform your healthcare provider if you experience any of those reactions, and that a doctor may give medications before treatment that may prevent a reaction.',
      },
      { type: 'h3', text: 'Serious side effects of lecanemab' },
      {
        type: 'p',
        text: 'The original article says lecanemab may cause amyloid related imaging abnormalities, or ARIA. It describes two types: ARIA-E, characterized by parenchymal or pial edema, and ARIA-hemorrhage (ARIA-H), which involves hemosiderin deposition in the form of superficial siderosis or hemorrhage.',
      },
      {
        type: 'p',
        text: 'It says ARIA is mostly seen as temporary swelling in some parts of the brain which resolves over time. Some patients may have small spots of bleeding in or on the surface of the brain, and sometimes there might be larger areas of brain bleeding. It says patients who experience this swelling are typically asymptomatic. If ARIA is symptomatic, signs and symptoms may include:',
      },
      {
        type: 'ul',
        items: [
          'Headache',
          'Confusion',
          'Difficulty walking',
          'Dizziness',
          'Seizures',
          'Vision changes',
        ],
      },
      {
        type: 'p',
        text: 'The original article says having the genetic risk factor (homozygous apolipoprotein E gene carriers) may result in an increased risk for ARIA. It also says some medications can increase the risk for larger areas of bleeding in the brain in patients receiving lecanemab. It says a healthcare provider will check medications that may increase the risk and carry out magnetic resonance imaging (MRI) scans before and frequently throughout treatment to check for ARIA.',
      },
      { type: 'h3', text: 'Side effects of donanemab' },
      {
        type: 'p',
        text: 'The original article says patients may experience infusion-related reactions when receiving donanemab, but that the specific reactions it may cause had not been disclosed in that write-up. It says donanemab may result in ARIA, which can be discovered through an MRI.',
      },
      {
        type: 'p',
        text: 'It reports TRAILBLAZER-ALZ clinical trial results in which 38.9% of patients had amyloid-related imaging abnormalities. In that trial summary, 27.5% of the patients who received donanemab experienced ARIA-E while 30.5% had ARIA-H. It also reports a 0.8% incidence of ARIA-E in the placebo group and a 7.2% incidence of ARIA-H in the placebo group.',
      },
      { type: 'h2', text: 'Safety: is lecanemab a safe alternative to donanemab, and vice versa?' },
      {
        type: 'p',
        text: 'The original article says that in the phase 3 trials, the reported rates of ARIA were slightly higher for donanemab (ARIA-E 24.0%, ARIA-H 31.4%) compared with lecanemab (ARIA-E 12.6%, ARIA-H 17.3%). Which drug, if either, is appropriate is a clinician’s decision after MRI review, genotype discussion when appropriate, and a medication review. It is not a choice a webpage can make.',
      },
    ],
  },
  {
    slug: 'lecanemab-vs-aducanumab',
    title: 'Leqembi (Lecanemab) vs Aduhelm (Aducanumab) For Alzheimer’s: What’s The Difference?',
    label: 'Comparison',
    excerpt:
      'Local Infusion’s comparison of lecanemab and aducanumab: targets, FDA pathway as described in the article, CDR-SB, list prices, and side effects including ARIA.',
    author: 'Jenna Paladino, NP',
    published: '2023-08-24',
    updated: '2024-11-10',
    originalUrl: 'https://mylocalinfusion.com/lecanemab-vs-aducanumab/',
    blocks: [
      {
        type: 'p',
        text: 'The original article compares Leqembi (lecanemab) and Aduhelm (aducanumab). It says neither cures or reverses Alzheimer’s disease. Both are described there as anti-amyloid treatments that reduce beta-amyloid plaques in the brain.',
      },
      {
        type: 'p',
        text: 'Alzheimer’s disease is described as a debilitating condition that affects millions of people. According to the National Institute on Aging and the Alzheimer’s Association Research Framework, as cited in the original, abnormal β-amyloid is a key pathological hallmark of Alzheimer’s disease. β-amyloid, also known as beta-amyloid, is a protein fragment that tends to accumulate and form sticky plaques outside the neurons of the brain. The accumulation disrupts communication between neurons, which is why it is one of the major targets in Alzheimer’s disease drug development.',
      },
      { type: 'h2', text: 'About lecanemab' },
      {
        type: 'p',
        text: 'The original article says lecanemab, manufactured by Biogen and Eisai, is a monoclonal antibody that targets a structure of beta-amyloid called N3pG, which helps in the formation of amyloid plaques in the brain.',
      },
      {
        type: 'p',
        text: 'The same section also says lecanemab targets soluble aggregated Aβ species such as monomers, oligomers, insoluble fibrils in plaques, and protofibrils. It describes those species as forms of β-amyloid peptides that tend to clump together and form aggregates, leading to insoluble plaques. It says research has shown that lecanemab is effective in reducing robust brain fibrillar amyloid and slowing clinical decline in early Alzheimer’s disease (“early” meaning mild cognitive impairment or mild dementia).',
      },
      { type: 'h2', text: 'About aducanumab' },
      {
        type: 'p',
        text: 'The original article says aducanumab is an amyloid beta-directed monoclonal antibody. It says aducanumab was found effective in people living with early Alzheimer’s disease, mild cognitive impairment (MCI), or mild dementia due to Alzheimer’s disease, or those with amyloid plaque buildup in the brain.',
      },
      { type: 'h2', text: 'Top-line differences between lecanemab and aducanumab' },
      {
        type: 'p',
        text: 'The original article says the main difference is that lecanemab primarily focuses on Aβ protofibrils, while aducanumab focuses on highly aggregated forms of Aβ. It also says another difference is mechanism of action: aducanumab removes beta-amyloid from the brain while lecanemab blocks the formation of amyloid plaques in the brain. Those are the original article’s descriptions, including where its sections emphasize different binding targets.',
      },
      { type: 'h2', text: 'Are both lecanemab and aducanumab FDA-approved?' },
      {
        type: 'p',
        text: 'The original article says both lecanemab and aducanumab received approval from the U.S. Food and Drug Administration. It says that in 2021, the FDA approved aducanumab through the Accelerated Approval Pathway. It says that in January 2023, lecanemab received FDA approval based on Clarity AD, where lecanemab met the primary endpoint and all key secondary endpoints with statistically significant results. “Endpoint” here, as the original glosses it, means the specific outcome used to assess effectiveness during a clinical trial. It says lecanemab was also approved through the Accelerated Approval Pathway.',
      },
      { type: 'h2', text: 'Efficacy: does lecanemab work as well as aducanumab?' },
      {
        type: 'p',
        text: 'The original article says aducanumab showed significant slowing of cognitive decline in patients with early-stage disease in one of two phase 3 clinical trials.',
      },
      {
        type: 'p',
        text: 'It says lecanemab has a comparable efficacy to aducanumab, as measured by the Clinical Dementia Rating-Sum of Boxes (CDR-SB), the measurement tool used in clinical trials to assess the severity of dementia in individuals with Alzheimer’s disease and other forms of dementia.',
      },
      {
        type: 'p',
        text: 'It says one reason lecanemab is beneficial is its binding profile: lecanemab focuses on Aβ protofibrils, while aducanumab and other medications like gantenerumab target highly aggregated forms of Aβ. The original article says this different target focus makes lecanemab more effective and safer, with a substantially lower incidence of amyloid-related imaging abnormalities such as transient immunotherapy-related brain edema and microbleeds.',
      },
      { type: 'h2', text: 'What is the cost difference between lecanemab and aducanumab?' },
      {
        type: 'p',
        text: 'The original article says lecanemab costs $26,500 for a year’s worth of treatment while aducanumab costs $28,200. It says the amount a patient eventually pays will depend on insurance or whether they use services like Medicare.',
      },
      { type: 'h2', text: 'How long it takes for lecanemab and aducanumab to work' },
      {
        type: 'p',
        text: 'According to the original article’s summary of lecanemab’s phase 3 trial, amyloid reduction is achieved within 3 months of treatment and clinical benefits within 6 months of treatment. It says more than 80% of subjects were amyloid negative (by visual reading) within 12–18 months of treatment in comparison with placebo.',
      },
      {
        type: 'p',
        text: 'According to the original article’s summary of aducanumab clinical trials, it takes about 18 months to reduce amyloid plaque levels. The article notes that aducanumab is a long-term drug, so if it is effective a doctor may have a patient take it for a longer period.',
      },
      { type: 'h2', text: 'Side effects of lecanemab and aducanumab' },
      { type: 'h3', text: 'Infusion-related reactions with lecanemab' },
      {
        type: 'p',
        text: 'The original article says lecanemab may result in severe reactions during or after infusion, including:',
      },
      {
        type: 'ul',
        items: [
          'Chills',
          'Fever',
          'Lightheadedness or dizziness',
          'Nausea',
          'Vomiting',
          'Racing heart or chest pounding',
          'Shortness of breath or difficulty breathing',
          'Joint pain',
          'Body aches',
        ],
      },
      {
        type: 'p',
        text: 'It says you should inform your healthcare provider if you experience any of those reactions, and that a doctor may give medications before treatment that may prevent a reaction.',
      },
      { type: 'h3', text: 'Serious side effects of lecanemab' },
      {
        type: 'p',
        text: 'The original article says lecanemab may cause ARIA. It describes ARIA-E, characterized by parenchymal or pial edema, and ARIA-hemorrhage (ARIA-H), which involves hemosiderin deposition in the form of superficial siderosis or hemorrhage.',
      },
      {
        type: 'p',
        text: 'It says this is mostly seen as temporary swelling in some parts of the brain which resolves over time. Some patients may have small spots of bleeding in or on the surface of the brain, and sometimes larger areas of brain bleeding. It says patients with this swelling are typically asymptomatic. If ARIA is symptomatic, signs and symptoms may include:',
      },
      {
        type: 'ul',
        items: [
          'Headache',
          'Confusion',
          'Difficulty walking',
          'Dizziness',
          'Seizures',
          'Vision changes',
        ],
      },
      {
        type: 'p',
        text: 'The original article says the genetic risk factor (homozygous apolipoprotein E gene carriers) may increase ARIA risk. It says some medications can increase the risk for larger areas of bleeding in the brain in patients receiving lecanemab, and that a healthcare provider will check medications and carry out MRI scans before and during treatment to check for ARIA.',
      },
      { type: 'h3', text: 'Mild side effects of aducanumab' },
      {
        type: 'p',
        text: 'The original article says aducanumab may cause mild side effects, including:',
      },
      {
        type: 'ul',
        items: [
          'Headache',
          'Diarrhea',
          'Upper respiratory tract infection',
          'Confusion',
          'Disorientation',
        ],
      },
      {
        type: 'p',
        text: 'It says these side effects may stop within a few days or a couple of weeks.',
      },
      { type: 'h3', text: 'Serious allergic reactions with aducanumab' },
      {
        type: 'p',
        text: 'The original article says aducanumab may cause serious allergic reactions during or after an infusion, including hives and swelling of the face, mouth, lips, or tongue. It says to inform a healthcare provider if those symptoms occur during or after an infusion. It also says hypersensitivity reactions such as angioedema or urticaria may occur during an infusion, in which case the provider will immediately discontinue treatment.',
      },
      { type: 'h3', text: 'ARIA with aducanumab' },
      {
        type: 'p',
        text: 'The original article says aducanumab may also cause ARIA. It says a healthcare provider will conduct baseline MRI scans before the start of treatment and periodic MRI scans during treatment to monitor for ARIA.',
      },
      { type: 'h2', text: 'Safety: is lecanemab a safe alternative to aducanumab, and vice versa?' },
      {
        type: 'p',
        text: 'The original article says there is a substantially lower incidence of amyloid related imaging abnormalities with lecanemab, because lecanemab mainly targets Aβ protofibrils, while aducanumab and other medications like gantenerumab target highly aggregated forms of Aβ. A licensed clinician has to decide whether either medicine is appropriate. This page does not.',
      },
    ],
  },
  {
    slug: 'leqembi-infusion',
    title: 'Leqembi (Lecanemab) Is Now Approved For Alzheimer’s Treatment: What To Know',
    label: 'Treatment',
    excerpt:
      'What Local Infusion published about Leqembi (lecanemab-irmb): who it is prescribed for, what Clarity AD reported, the every-two-week infusion, and ARIA monitoring.',
    author: 'Jenna Paladino, NP',
    published: '2023-08-17',
    updated: '2024-11-10',
    originalUrl: 'https://mylocalinfusion.com/leqembi-infusion/',
    blocks: [
      {
        type: 'p',
        text: 'The original article says the FDA’s full approval of Leqembi (lecanemab-irmb) made it one of the few infusions that can be used for Alzheimer’s disease, and explains how Leqembi works and what makes it different from other Alzheimer’s drugs.',
      },
      { type: 'h2', text: 'What is Leqembi?' },
      {
        type: 'p',
        text: 'The original article says Leqembi is an intravenous (IV) infusion prescribed for early Alzheimer’s disease. It contains the active drug lecanemab-irmb and is used to slow the progression of Alzheimer’s disease in patients who have mild cognitive impairment or mild dementia — meaning those who are still in the early stages of dementia or who are experiencing some cognitive changes that do not significantly impair their daily lives.',
      },
      {
        type: 'p',
        text: 'It says Alzheimer’s disease results from an accumulation of beta-amyloid plaques in the brain, which damage nerve cells. Leqembi belongs to the amyloid beta-directed monoclonal antibodies drug class and works to slow the decline of Alzheimer’s disease in its early stages by reducing the buildup of these plaques.',
      },
      { type: 'h2', text: 'When was Leqembi approved by the U.S. Food and Drug Administration (FDA)?' },
      {
        type: 'p',
        text: 'The original article says that on January 6, 2023, Leqembi received full FDA approval through the Accelerated Approval pathway for the treatment of Alzheimer’s disease after meeting its primary and secondary endpoints with statistically significant results. It glosses “endpoint” as the specific outcome used to assess the effectiveness of a medication during a clinical trial. It says Leqembi joined medications that target the fundamental pathophysiology of Alzheimer’s disease and have received traditional approval, including Aduhelm (aducanumab).',
      },
      {
        type: 'p',
        text: 'It also says that, as a recently authorized medication, Leqembi may not be widely available yet since many facilities, particularly those that do not specialize in infusion therapy, often take longer to add a new drug to their formulary.',
      },
      { type: 'h2', text: 'Where the original article says Leqembi is offered' },
      {
        type: 'p',
        text: 'The original article answers “Is Leqembi offered at Local Infusion?” with yes: Local Infusion is ready to offer Leqembi at its locations once a patient is referred. That is a statement about Local Infusion’s centers. Local Doctor does not operate infusion centers. If a licensed clinician decides treatment is appropriate, local infusion follow-through happens at an appropriate treatment site, not on this website.',
      },
      { type: 'h2', text: 'How does Leqembi work?' },
      {
        type: 'p',
        text: 'The original article says research has not fully uncovered the specific causes of Alzheimer’s disease, but that it is typically recognized by alterations in the brain. Those alterations include amyloid beta plaques and neurofibrillary (tau) tangles, which lead to the loss of neurons and their connections. This process affects memory and cognitive abilities. It says Leqembi works by reducing amyloid beta plaques in the brain which, in turn, slows down the progression of Alzheimer’s disease.',
      },
      { type: 'h2', text: 'What is the success rate of Leqembi?' },
      {
        type: 'p',
        text: 'The original article says that in 2022, researchers from Eisai and Biogen, the manufacturers of Leqembi, published the results of Clarity AD (the phase 3 clinical trial) in The New England Journal of Medicine. Compared with placebo, it says Leqembi slowed the rate of cognitive decline and reduced the buildup of amyloid beta plaques by approximately 59.1 centiloids, a unit used to measure amyloid burden in the brain.',
      },
      { type: 'h3', text: 'On reducing amyloid-β levels' },
      {
        type: 'p',
        text: 'The original article says Leqembi demonstrated efficacy in reducing brain amyloid-β levels. Over an 18-month period of Leqembi treatment, approximately 68% of treated patients exhibited complete removal of amyloid-β from their brains, confirmed through amyloid positron-emission tomography (PET) imaging.',
      },
      { type: 'h3', text: 'On reducing tau' },
      {
        type: 'p',
        text: 'The original article says measurements of plasma markers of phospho-tau species, carried out by PET and cerebrospinal fluid (CSF) biomarkers of Alzheimer’s disease, showed comparable reductions to those observed in brain amyloid-β levels. It says it is possible that Leqembi might also be impactful on tau, a substance related to amyloid-β and closely associated with the cognitive decline and memory loss seen in Alzheimer’s disease.',
      },
      {
        type: 'p',
        text: 'The original article says one potential reason Leqembi had a high success rate was that it targeted amyloid-β better than other treatments for Alzheimer’s disease. It also names a limitation: it cannot address cognitive impairment in older ages.',
      },
      { type: 'h2', text: 'How long does treatment with Leqembi take?' },
      {
        type: 'p',
        text: 'The original article says the prescribed dose for Leqembi is 10 mg/kg, which should be diluted and administered as an intravenous infusion lasting about 1 hour. This infusion is administered once every 2 weeks. If a scheduled infusion is missed, it says the patient should receive the subsequent dose as soon as possible.',
      },
      {
        type: 'p',
        text: 'It also says it is important to confirm the presence of amyloid beta pathology before receiving Leqembi.',
      },
      { type: 'h2', text: 'What are the potential side effects of Leqembi?' },
      { type: 'h3', text: 'Infusion-related reactions' },
      {
        type: 'p',
        text: 'According to the original article’s summary of Leqembi’s prescribing information, Leqembi may cause reactions either during the infusion or shortly after. There is a recommended observation time after Leqembi infusions, during which an infusion provider monitors for signs or symptoms of a reaction. Reactions listed in the original article include:',
      },
      {
        type: 'ul',
        items: [
          'Chills',
          'Body aches',
          'Joint pain',
          'Fever',
          'Shortness of breath',
          'Lightheadedness',
          'Racing heart rate',
        ],
      },
      {
        type: 'p',
        text: 'The original article says that if you experience any of those symptoms, inform healthcare providers or caregivers immediately. It says a provider may also administer allergy medicines, anti-inflammatory medicines, or steroids to help prevent infusion-related reactions.',
      },
      { type: 'h3', text: 'Amyloid related imaging abnormalities (ARIA)' },
      {
        type: 'p',
        text: 'The original article says Leqembi can cause serious side effects called amyloid related imaging abnormalities (ARIA) — ARIA with edema (ARIA-E) or ARIA with hemosiderin deposition (ARIA-H). It says this serious, life-threatening side effect is typically asymptomatic and only detectable on brain MRIs. Potential symptoms may include:',
      },
      {
        type: 'ul',
        items: [
          'Vision changes',
          'Seizures',
          'Dizziness',
          'Headache',
          'Nausea',
          'Confusion',
          'Difficulty walking',
        ],
      },
      {
        type: 'p',
        text: 'It says ARIA commonly occurs as temporary brain swelling that resolves over time. Some patients may experience brain bleeding in small spots, and on rare occasions brain bleeding can occur in larger areas of the brain. It says some people have a genetic risk factor (ApoE ε4 homozygotes) that may cause an increased risk for ARIA, and that patients should talk with healthcare professionals about testing for ApoE ε4 status before beginning Leqembi.',
      },
      {
        type: 'p',
        text: 'It says some medications, including anticoagulant medication and supplements, can increase a patient’s risk for larger areas of brain bleeding. Patients should tell a healthcare provider about all medications and supplements. The original article says the provider will also do MRI scans before treatment starts and during treatment to check for ARIA.',
      },
      { type: 'h3', text: 'Intracerebral hemorrhage' },
      {
        type: 'p',
        text: 'The original article says another neurological side effect of Leqembi is serious intracerebral hemorrhage, a type of stroke that occurs when a blood vessel ruptures and bleeds into the brain tissue.',
      },
      { type: 'h2', text: 'How much does Leqembi cost?' },
      {
        type: 'p',
        text: 'The original article says Leqembi, from Eisai Inc. and Biogen Inc., has an annual list price of $26,500. The actual out-of-pocket amount varies with insurance coverage and use of Medicare and Medicaid. It says to ask about copay assistance if cost is a concern, because many patients will qualify for additional assistance and even a $0 copay depending on eligibility. It says this program is sponsored by Eisai Inc.',
      },
      {
        type: 'p',
        text: 'Questions about what you would pay, and whether a workup is even the right next step, can start with Local Doctor’s eligibility check. Local Doctor does not set the drug’s list price and does not bill infusions as an infusion center.',
      },
    ],
  },
]

const postsBySlug = new Map(blogPosts.map((post) => [post.slug, post]))

export function getBlogPost(slug: string) {
  return postsBySlug.get(slug)
}

export function formatBlogDate(isoDate: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${isoDate}T00:00:00Z`))
}
