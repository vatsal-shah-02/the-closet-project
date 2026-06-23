import Anthropic from '@anthropic-ai/sdk'

if (typeof window !== 'undefined') {
  throw new Error('Anthropic client must only be used server-side')
}

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export const MODEL = 'claude-sonnet-4-6'

export const TAGGING_PROMPT = `You are a fashion stylist tagging a clothing item for a wardrobe app. Analyse the image and return ONLY a JSON object with no markdown or backticks.

The wardrobe owner is Indian, so you must correctly identify Indian ethnic clothing:
- Saree, kurti, salwar kameez, lehenga, kurta set, dupatta → type: "ethnic", with correct ethnic_subtype
- Western clothing → use: tops, bottoms, dresses, outerwear, shoes, accessories

JSON shape:
{
  "name": "short descriptive name (e.g. 'navy silk saree', 'white linen shirt')",
  "type": "tops | bottoms | dresses | outerwear | shoes | accessories | ethnic",
  "ethnic_subtype": "saree | kurti | salwar | lehenga | kurta-set | dupatta | other (only if type is ethnic)",
  "color": "primary color as single word",
  "colors": ["all colors visible in the item"],
  "style": "casual | smart-casual | formal | ethnic | party | work | athleisure",
  "occasion": "casual | work | formal | party | ethnic | vacation | all",
  "season": "all | summer | winter | monsoon",
  "notes": "one sentence on how to style it"
}`

export const COMPATIBILITY_PROMPT = `You are a personal stylist. Look at these two clothing items and assess if they work together as an outfit.

Respond ONLY with JSON, no markdown:
{
  "compatible": boolean,
  "verdict": "one sentence yes or no with confidence",
  "reason": "2-3 sentences explaining why they do or don't work — color theory, formality match, silhouette balance",
  "missing": "what one item would complete this look (shoes, belt, dupatta, etc.) — be specific",
  "occasion_fit": ["list of occasions this combo suits"]
}

Consider Indian ethnic combinations too — e.g. kurti + palazzo, saree + blouse, kurta + churidar. Be specific and practical.`
