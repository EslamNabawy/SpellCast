/* ==========================================================================
   SPELLCAST — WORDS.JS
   The app's entire word library in one data file. Loaded before script.js.

   Schema:
     WORD_LIBRARY = {
       meta: { version, updated },
       categories: {
         <key>: {
           label: "Display name",
           e: [...easy words],
           m: [...medium words],
           h: [...hard words]
         }
       }
     }

   Rules for this file:
   - words are lowercase, letters only (script.js validates and also
     lowercases/trims defensively — but don't rely on that)
   - no word repeated within the same difficulty tier (cross-category and
     cross-tier repeats are allowed; script.js dedupes tiers on load)
   - e = everyday difficulty, m = meaty, h = genuinely tricky spellings
   - to add a word, append it to the matching tier array — no other change needed
   ========================================================================== */

const WORD_LIBRARY = {
  meta: { version: 2, updated: "2026-10" },

  categories: {
    nouns: {
      label: "Nouns",
      e: [
        "apple", "window", "garden", "school", "river", "planet", "pencil",
        "bottle", "forest", "bridge", "island", "market", "engine", "castle",
        "blanket", "candle", "ladder", "mirror", "pocket", "ticket"
      ],
      m: [
        "mountain", "computer", "library", "keyboard", "umbrella", "calendar",
        "backpack", "telescope", "sandwich", "notebook", "elephant",
        "orchestra", "suitcase", "fireplace", "receipt", "landscape",
        "silhouette", "corridor", "scissors", "appendix"
      ],
      h: [
        "restaurant", "architecture", "phenomenon", "questionnaire",
        "laboratory", "atmosphere", "infrastructure", "parliament",
        "bureaucracy", "chronology", "rendezvous", "camouflage", "epitome",
        "juxtaposition", "labyrinth"
      ]
    },

    verbs: {
      label: "Verbs",
      e: [
        "accept", "believe", "explain", "manage", "suggest", "arrive",
        "borrow", "listen", "travel", "answer", "happen", "follow",
        "persuade", "deserve", "decline", "measure"
      ],
      m: [
        "achieve", "calculate", "discover", "imagine", "improve", "remember",
        "understand", "recognize", "encourage", "establish", "negotiate",
        "demonstrate", "anticipate", "emphasize", "summarize", "prioritize",
        "correspond"
      ],
      h: [
        "differentiate", "hypothesize", "accommodate", "substantiate",
        "reconcile", "exacerbate", "perpetuate", "circumvent", "corroborate",
        "extrapolate", "procrastinate", "conceptualize", "reprimand"
      ]
    },

    adjectives: {
      label: "Adjectives",
      e: [
        "careful", "different", "excellent", "familiar", "possible",
        "terrible", "honest", "curious", "gentle", "narrow", "recent",
        "simple", "brilliant", "cautious"
      ],
      m: [
        "beautiful", "difficult", "important", "necessary", "successful",
        "valuable", "reliable", "generous", "peculiar", "ambitious",
        "efficient", "sensible", "intelligent", "consistent"
      ],
      h: [
        "conscientious", "miscellaneous", "indispensable", "unprecedented",
        "quintessential", "incomprehensible", "idiosyncratic", "unequivocal",
        "irrevocable", "ubiquitous"
      ]
    },

    adverbs: {
      label: "Adverbs",
      e: [
        "actually", "finally", "quickly", "usually", "easily", "openly",
        "safely", "loudly", "gently", "nearly", "quietly", "brightly"
      ],
      m: [
        "carefully", "completely", "especially", "generally", "immediately",
        "probably", "recently", "naturally", "obviously", "frequently",
        "eventually", "seriously"
      ],
      h: [
        "unquestionably", "simultaneously", "disproportionately",
        "indiscriminately", "unequivocally", "conscientiously",
        "unprecedentedly", "inadvertently"
      ]
    },

    commonlyMisspelled: {
      label: "Commonly Misspelled",
      e: [
        "separate", "definitely", "receive", "believe", "friend", "weird",
        "until", "beginning", "writing", "argument", "absence", "ceiling"
      ],
      m: [
        "necessary", "embarrass", "occurrence", "privilege", "restaurant",
        "environment", "government", "maintenance", "recommend", "existence",
        "occasion", "similar", "judgment", "mischievous"
      ],
      h: [
        "accommodate", "conscientious", "unnecessarily", "questionnaire",
        "millennium", "supersede", "liaison", "inoculate", "consensus",
        "minuscule", "paraphernalia", "chrysanthemum"
      ]
    },

    advanced: {
      label: "Advanced",
      e: [
        "hierarchy", "independent", "fluorescent", "pronunciation", "vacuum",
        "rhythm", "pseudonym", "synonym", "mischievous", "privilege",
        "rhyme", "yacht"
      ],
      m: [
        "entrepreneur", "questionnaire", "perseverance", "occasionally",
        "disappointment", "recommendation", "acknowledgment", "phenomenon",
        "extraordinary", "sophisticated"
      ],
      h: [
        "miscellaneous", "conscientious", "onomatopoeia", "idiosyncrasy",
        "chiaroscuro", "bureaucratic", "unparalleled", "inextricable",
        "pharmaceutical", "counterintuitive"
      ]
    },

    animals: {
      label: "Animals",
      e: [
        "lion", "tiger", "zebra", "panda", "koala", "camel", "turtle",
        "rabbit", "monkey", "parrot", "dolphin", "penguin", "giraffe",
        "jaguar", "ferret", "falcon"
      ],
      m: [
        "cheetah", "gorilla", "leopard", "squirrel", "crocodile", "flamingo",
        "kangaroo", "octopus", "pelican", "chimpanzee", "hedgehog",
        "armadillo", "tortoise", "mongoose"
      ],
      h: [
        "rhinoceros", "hippopotamus", "platypus", "orangutan", "chameleon",
        "caterpillar", "nightingale", "albatross", "chrysalis", "axolotl",
        "hummingbird"
      ]
    },

    food: {
      label: "Food",
      e: [
        "pizza", "pasta", "banana", "orange", "tomato", "cheese", "cookie",
        "burger", "salad", "sushi", "bagel", "donut", "waffle", "pancake",
        "raisin", "melon"
      ],
      m: [
        "spaghetti", "chocolate", "cinnamon", "broccoli", "strawberry",
        "pineapple", "sandwich", "casserole", "guacamole", "croissant",
        "lasagna", "margarine", "pretzel", "marinade"
      ],
      h: [
        "mayonnaise", "mozzarella", "prosciutto", "cauliflower",
        "pomegranate", "asparagus", "bouillabaisse", "charcuterie",
        "pumpernickel", "connoisseur"
      ]
    },

    science: {
      label: "Science",
      e: [
        "atom", "cell", "gravity", "energy", "magnet", "planet", "orbit",
        "fossil", "climate", "oxygen", "protein", "virus", "proton"
      ],
      m: [
        "molecule", "electron", "neutron", "galaxy", "ecosystem", "evolution",
        "photosynthesis", "chromosome", "laboratory", "hypothesis",
        "quantum", "isotope"
      ],
      h: [
        "electromagnetic", "thermodynamics", "crystallography",
        "astrophysics", "bioluminescence", "paleontology", "spectroscopy",
        "neurotransmitter", "deoxyribonucleic"
      ]
    },

    technology: {
      label: "Technology",
      e: [
        "keyboard", "monitor", "battery", "router", "browser", "network",
        "printer", "software", "hardware", "sensor", "circuit", "server"
      ],
      m: [
        "algorithm", "database", "encryption", "interface", "protocol",
        "bandwidth", "firewall", "malware", "pixel", "bluetooth",
        "satellite", "semiconductor"
      ],
      h: [
        "cryptocurrency", "virtualization", "microprocessor", "asynchronous",
        "authentication", "infrastructure", "blockchain",
        "interoperability", "cybersecurity", "telecommunications"
      ]
    },

    nature: {
      label: "Nature",
      e: [
        "forest", "desert", "river", "meadow", "valley", "canyon", "island",
        "glacier", "volcano", "waterfall", "jungle", "marsh"
      ],
      m: [
        "wilderness", "ecosystem", "peninsula", "archipelago", "tundra",
        "savanna", "wetland", "aurora", "estuary", "geyser", "lagoon",
        "mangrove"
      ],
      h: [
        "biodiversity", "precipitation", "photosynthesis", "topography",
        "cataclysmic", "equinox", "solstice", "biodegradable",
        "deforestation", "exothermic"
      ]
    },

    sports: {
      label: "Sports",
      e: [
        "soccer", "tennis", "hockey", "cricket", "rugby", "boxing",
        "archery", "bowling", "cycling", "karate", "javelin"
      ],
      m: [
        "tournament", "championship", "athlete", "gymnastics", "marathon",
        "badminton", "volleyball", "handball", "fencing", "triathlon",
        "sprint", "defense"
      ],
      h: [
        "decathlon", "steeplechase", "sportsmanship", "ambidextrous",
        "physiotherapy", "tactician", "quarterback", "interception",
        "recreational", "professionalism"
      ]
    }
  }
};
