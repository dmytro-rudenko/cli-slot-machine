// Import readline module for handling keyboard input
const readline = require("readline");

// Main object storing game state and player data
const DATA = {
  energy: 50,         // Current player's energy
  gold: 100,          // Player's gold amount
  result: [0, 0, 0],  // Current slot machine values
  bet: 1,             // Current bet amount (range 1-5)
  message: "Welcome to Slot Machine! Press SPACE to spin!", // Game messages
  spinning: false,    // Whether slots are currently spinning
  energyRecoveryTimer: null,    // Timer ID for energy recovery
  nextEnergyRecovery: null,     // Timestamp for next energy recovery
};

// Game constants and configuration
const GOLD_NUMBER = 5;          // Symbol representing gold
const ENERGY_NUMBER = 0;        // Symbol representing energy
const SPIN_TIME = 1000;         // Total spin duration in milliseconds
const SPIN_INTERVAL = 50;      // Slot update interval during spin
const ENERGY_RECOVERY_TIME = 60000; // 1 minute per energy recovery
const ENERGY_COST = 10;         // Gold cost to buy 1 energy
const GOLD_COST = 1;            // Energy cost to buy 10 gold

/**
 * Generates the game interface text
 * @returns {string} Formatted ASCII game interface
 */
const renderUI = () => {
  let recoveryTime = DATA.nextEnergyRecovery
    ? Math.max(0, Math.ceil((DATA.nextEnergyRecovery - Date.now()) / 1000))
    : 0;
  return `
🎰🎲 SLOT MACHINE 🎲🎰
--------------------------------
⚡ Energy: ${DATA.energy} | 💰 Gold: ${DATA.gold} | 🎯 Bet: ${DATA.bet}
🕒 Next Energy in: ${recoveryTime}s
--------------------------------
🎰 [ ${DATA.result.join(" | ")} ] 🎰
--------------------------------
📢 ${DATA.message}
--------------------------------
🔄 Press SPACEBAR to SPIN 🎰
🔼 Up to INCREASE BET 📈
🔽 Down to DECREASE BET 📉
💲 ⚡ Press B to BUY ENERGY (+${GOLD_COST} Energy for ${ENERGY_COST} Gold)
💲 💰 Press N to BUY GOLD (+${ENERGY_COST} Gold for ${GOLD_COST} Energy)
❌ Press Q to QUIT
  `;
};

/**
 * Updates game message and refreshes interface
 * @param {string} message - New message to display
 */
const updateMessage = (message = "") => {
  if (message) DATA.message = message;
};

/**
 * Starts energy recovery timer if not already running
 */
const startEnergyRecovery = () => {
  if (DATA.energyRecoveryTimer) return;
  DATA.nextEnergyRecovery = Date.now() + ENERGY_RECOVERY_TIME;
  DATA.energyRecoveryTimer = setInterval(() => {
    if (DATA.energy < 50) {
      DATA.energy += 1;
      DATA.nextEnergyRecovery = Date.now() + ENERGY_RECOVERY_TIME;
      updateMessage("⚡ Energy restored by 1!");
    }
    if (DATA.energy >= 50) {
      clearInterval(DATA.energyRecoveryTimer);
      DATA.energyRecoveryTimer = null;
      DATA.nextEnergyRecovery = null;
    }
  }, ENERGY_RECOVERY_TIME);
};

/**
 * Generates slot numbers with probability adjustments based on bet size
 * @returns {number} Generated slot number (0-9)
 */
const getSlotNumber = () => {
  const baseChance = 25;        // 25% base chance for gold at bet=1
  const currentBet = DATA.bet;
  // Decrease gold chance by 1% per bet level
  const chanceForGold = Math.max(0, baseChance - (currentBet - 1));
  
  if (Math.random() * 100 < chanceForGold) {
    return GOLD_NUMBER;
  }
  // Return random non-special or energy number
  const otherNumbers = [0, 1, 2, 3, 4, 6, 7, 8, 9];
  return otherNumbers[Math.floor(Math.random() * otherNumbers.length)];
};

/**
 * Generates random slot results using game logic
 * @returns {number[]} Array of three slot numbers
 */
const getRandomResult = () => [
  getSlotNumber(),
  getSlotNumber(),
  getSlotNumber(),
];

/**
 * Calculates rewards based on current slot results
 */
const calculateReward = () => {
  const [a, b, c] = DATA.result;
  let goldGain = 0;
  let energyGain = 0;

  // Check for triple matches
  if (a === b && b === c) {
    if (a === GOLD_NUMBER) {
      goldGain = DATA.bet * 10 + 50;
      updateMessage(`🎉 JACKPOT! +${goldGain} GOLD!`);
    } else if (a === ENERGY_NUMBER) {
      energyGain = 10;
      updateMessage("⚡ MEGA ENERGY BOOST! +10 Energy!");
    } else {
      goldGain = 50;
      updateMessage("💰 TRIPLE MATCH! +50 GOLD!");
    }
  } else {
    // Calculate partial matches
    goldGain = [a, b, c].filter((num) => num === GOLD_NUMBER).length * DATA.bet;
    energyGain = [a, b, c].filter((num) => num === ENERGY_NUMBER).length;
    
    let message = "";
    if (goldGain > 0) message += `💰 Gold Bonus! +${goldGain} GOLD `;
    if (energyGain > 0) message += `⚡ Energy Bonus! +${energyGain} Energy`;
    updateMessage(message || "😕 No significant win this time!");
  }

  // Update player resources
  DATA.gold += goldGain;
  DATA.energy = Math.min(50, DATA.energy + energyGain);
  DATA.spinning = false;
};

/**
 * Handles slot spinning mechanics and resource management
 */
const spin = () => {
  if (DATA.spinning) return;

  // Ensure energy recovery timer is running
  startEnergyRecovery();

  // Validate player resources
  if (DATA.gold < DATA.bet) {
    updateMessage("⚠️ Not enough gold to spin!");
    return;
  }
  if (DATA.energy <= 0) {
    updateMessage("⚠️ Not enough energy to spin!");
    return;
  }

  // Deduct resources and start spin
  DATA.gold -= DATA.bet;
  DATA.energy -= 1;
  DATA.spinning = true;
  updateMessage("🔄 Spinning...");

  // Visual spin effect
  const render = setInterval(() => {
    DATA.result = getRandomResult();
  }, SPIN_INTERVAL);

  // Finalize spin after SPIN_TIME
  setTimeout(() => {
    clearInterval(render);
    DATA.result = getRandomResult();
    calculateReward();
  }, SPIN_TIME);
};

// Game rendering loop (24 FPS)
let render = setInterval(() => {
  updateMessage();
  console.clear();
  console.log(renderUI());
}, 1000 / 24);

/**
 * Handles keyboard input and player actions
 */
const handleInput = () => {
  readline.emitKeypressEvents(process.stdin);
  process.stdin.setRawMode(true);
  process.stdin.on("keypress", (_, key) => {
    if (DATA.spinning) return;

    // Handle various key commands
    if (key.name === "space") spin();
    if (key.name === "q") {
      clearInterval(render);
      console.log("👋 Exiting...");
      process.exit();
    }
    if (key.name === "up") {
      DATA.bet = Math.min(15, DATA.bet + 1);
      updateMessage("🎯 Bet increased to " + DATA.bet);
    }
    if (key.name === "down") {
      DATA.bet = Math.max(1, DATA.bet - 1);
      updateMessage("🎯 Bet decreased to " + DATA.bet);
    }
    if (key.name === "b" && DATA.gold >= ENERGY_COST) {
      DATA.gold -= ENERGY_COST;
      DATA.energy = Math.min(50, DATA.energy + 1);
      updateMessage(`⚡ Bought ${GOLD_COST} Energy for ${ENERGY_COST} Gold`);
    }
    if (key.name === "n" && DATA.energy >= GOLD_COST) {
      DATA.energy -= GOLD_COST;
      DATA.gold += ENERGY_COST;
      updateMessage(`💰 Bought ${ENERGY_COST} Gold for ${GOLD_COST} Energy`);
    }
  });
};

// Initialize game
handleInput();