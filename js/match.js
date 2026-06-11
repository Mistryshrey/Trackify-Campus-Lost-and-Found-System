// Matching Algorithm Logic
document.addEventListener('DOMContentLoaded', function() {
    initializeMatching();
});

// Initialize Matching System
function initializeMatching() {
    console.log('Initializing Matching System');
    
    // Run matching algorithm periodically (every 30 seconds)
    setInterval(findMatches, 30000);
    
    // Also run immediately
    findMatches();
}

// Main Matching Algorithm
function findMatches() {
    console.log('Running matching algorithm...');
    
    const lostItems = JSON.parse(localStorage.getItem('lostItems') || '[]').filter(item => item.status === 'active');
    const foundItems = JSON.parse(localStorage.getItem('foundItems') || '[]').filter(item => item.status === 'active');
    const existingMatches = JSON.parse(localStorage.getItem('matches') || '[]');
    
    let newMatches = [];
    
    // Compare each lost item with each found item
    lostItems.forEach(lostItem => {
        foundItems.forEach(foundItem => {
            // Skip if already matched
            if (isAlreadyMatched(lostItem.id, foundItem.id, existingMatches)) {
                return;
            }
            
            const matchScore = calculateMatchScore(lostItem, foundItem);
            
            // If match score is above threshold, create a match
            if (matchScore >= 70) { // 70% threshold
                const match = createMatch(lostItem, foundItem, matchScore);
                newMatches.push(match);
                
                // Update item statuses
                updateItemStatus(lostItem.id, 'lost', 'matched');
                updateItemStatus(foundItem.id, 'found', 'matched');
            }
        });
    });
    
    // Save new matches
    if (newMatches.length > 0) {
        const allMatches = [...existingMatches, ...newMatches];
        localStorage.setItem('matches', JSON.stringify(allMatches));
        
        console.log(`Found ${newMatches.length} new matches`);
        
        // Show notification if on dashboard page
        if (window.location.pathname.includes('dashboard.html') && newMatches.length > 0) {
            appUtils.showNotification(`Found ${newMatches.length} new potential matches!`, 'success');
        }
        
        // Update dashboard if open
        if (typeof loadDashboardItems === 'function') {
            loadDashboardItems();
        }
    }
    
    return newMatches;
}

// Check if items are already matched
function isAlreadyMatched(lostItemId, foundItemId, existingMatches) {
    return existingMatches.some(match => 
        match.lostItemId === lostItemId && match.foundItemId === foundItemId
    );
}

// Calculate Match Score between Lost and Found Items
function calculateMatchScore(lostItem, foundItem) {
    let score = 0;
    const weights = {
        category: 30,
        itemName: 25,
        description: 20,
        color: 15,
        location: 10
    };
    
    // Category match (exact match required for high score)
    if (lostItem.category === foundItem.category) {
        score += weights.category;
    } else {
        // Partial credit for similar categories
        if (areCategoriesSimilar(lostItem.category, foundItem.category)) {
            score += weights.category * 0.5;
        }
    }
    
    // Item name similarity
    const nameSimilarity = calculateStringSimilarity(
        lostItem.itemName.toLowerCase(), 
        foundItem.itemName.toLowerCase()
    );
    score += weights.itemName * nameSimilarity;
    
    // Description similarity
    if (lostItem.description && foundItem.description) {
        const descSimilarity = calculateStringSimilarity(
            lostItem.description.toLowerCase(),
            foundItem.description.toLowerCase()
        );
        score += weights.description * descSimilarity;
    }
    
    // Color match
    if (lostItem.color && foundItem.color) {
        const colorSimilarity = calculateColorSimilarity(
            lostItem.color.toLowerCase(),
            foundItem.color.toLowerCase()
        );
        score += weights.color * colorSimilarity;
    }
    
    // Location proximity (simplified - exact match for demo)
    if (lostItem.location && foundItem.location) {
        const locationSimilarity = calculateLocationSimilarity(
            lostItem.location.toLowerCase(),
            foundItem.location.toLowerCase()
        );
        score += weights.location * locationSimilarity;
    }
    
    // Additional factors
    score = applyAdditionalFactors(score, lostItem, foundItem);
    
    // Ensure score is between 0 and 100
    return Math.min(Math.max(score, 0), 100);
}

// Check if categories are similar
function areCategoriesSimilar(cat1, cat2) {
    const similarGroups = {
        electronics: ['electronics', 'phones', 'laptops', 'tablets'],
        accessories: ['accessories', 'bags', 'wallets', 'jewelry'],
        personal: ['clothing', 'accessories', 'bags']
    };
    
    for (const group in similarGroups) {
        if (similarGroups[group].includes(cat1) && similarGroups[group].includes(cat2)) {
            return true;
        }
    }
    
    return false;
}

// Calculate String Similarity (Levenshtein distance based)
function calculateStringSimilarity(str1, str2) {
    if (!str1 || !str2) return 0;
    
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    // Exact match
    if (str1 === str2) return 1.0;
    
    // Contains match
    if (longer.includes(shorter)) return 0.8;
    
    // Common words match
    const words1 = str1.split(/\s+/);
    const words2 = str2.split(/\s+/);
    const commonWords = words1.filter(word => words2.includes(word));
    if (commonWords.length > 0) {
        return commonWords.length / Math.max(words1.length, words2.length);
    }
    
    // Simple character-based similarity
    return (longer.length - calculateEditDistance(longer, shorter)) / longer.length;
}

// Calculate Edit Distance (Levenshtein distance)
function calculateEditDistance(str1, str2) {
    const matrix = [];
    
    // Initialize matrix
    for (let i = 0; i <= str2.length; i++) {
        matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
        matrix[0][j] = j;
    }
    
    // Fill matrix
    for (let i = 1; i <= str2.length; i++) {
        for (let j = 1; j <= str1.length; j++) {
            if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    matrix[i][j - 1] + 1,     // insertion
                    matrix[i - 1][j] + 1      // deletion
                );
            }
        }
    }
    
    return matrix[str2.length][str1.length];
}

// Calculate Color Similarity
function calculateColorSimilarity(color1, color2) {
    if (color1 === color2) return 1.0;
    
    const colorGroups = {
        red: ['red', 'crimson', 'scarlet', 'maroon', 'burgundy'],
        blue: ['blue', 'navy', 'sky blue', 'azure', 'cobalt'],
        green: ['green', 'emerald', 'olive', 'lime', 'forest green'],
        black: ['black', 'charcoal', 'ebony', 'jet black'],
        white: ['white', 'ivory', 'cream', 'eggshell'],
        brown: ['brown', 'tan', 'beige', 'khaki', 'chocolate'],
        yellow: ['yellow', 'gold', 'amber', 'mustard'],
        purple: ['purple', 'violet', 'lavender', 'lilac'],
        pink: ['pink', 'rose', 'fuchsia', 'salmon'],
        gray: ['gray', 'grey', 'silver', 'slate']
    };
    
    // Check if colors are in the same group
    for (const group in colorGroups) {
        if (colorGroups[group].includes(color1) && colorGroups[group].includes(color2)) {
            return 0.7;
        }
    }
    
    return 0;
}

// Calculate Location Similarity
function calculateLocationSimilarity(loc1, loc2) {
    if (loc1 === loc2) return 1.0;
    
    // Simple location matching based on common words
    const commonLocationWords = ['building', 'hall', 'room', 'library', 'cafe', 'parking', 'lot'];
    const words1 = loc1.split(/\s+/);
    const words2 = loc2.split(/\s+/);
    
    const commonWords = words1.filter(word => 
        words2.includes(word) && commonLocationWords.includes(word)
    );
    
    if (commonWords.length > 0) return 0.6;
    
    return 0;
}

// Apply Additional Matching Factors
function applyAdditionalFactors(score, lostItem, foundItem) {
    // Brand match bonus
    if (lostItem.brand && foundItem.brand && 
        lostItem.brand.toLowerCase() === foundItem.brand.toLowerCase()) {
        score += 5;
    }
    
    // Model match bonus
    if (lostItem.model && foundItem.model && 
        lostItem.model.toLowerCase() === foundItem.model.toLowerCase()) {
        score += 5;
    }
    
    // Time proximity bonus (within 24 hours)
    const lostDateTime = new Date(`${lostItem.date}T${lostItem.time}`);
    const foundDateTime = new Date(`${foundItem.date}T${foundItem.time}`);
    const timeDiff = Math.abs(foundDateTime - lostDateTime);
    const hoursDiff = timeDiff / (1000 * 60 * 60);
    
    if (hoursDiff <= 24) {
        score += 10 * (1 - hoursDiff / 24); // Linear decay over 24 hours
    }
    
    return score;
}

// Create Match Object
function createMatch(lostItem, foundItem, matchScore) {
    return {
        id: appUtils.generateId(),
        lostItemId: lostItem.id,
        foundItemId: foundItem.id,
        matchScore: Math.round(matchScore),
        matchDate: new Date().toISOString(),
        status: 'pending',
        verification: {
            lostCode: lostItem.verificationCode,
            foundCode: foundItem.verificationCode
        }
    };
}

// Update Item Status
function updateItemStatus(itemId, type, newStatus) {
    const items = JSON.parse(localStorage.getItem(`${type}Items`) || '[]');
    const itemIndex = items.findIndex(item => item.id === itemId);
    
    if (itemIndex !== -1) {
        items[itemIndex].status = newStatus;
        localStorage.setItem(`${type}Items`, JSON.stringify(items));
    }
}

// Get Match Details
function getMatchDetails(matchId) {
    const matches = JSON.parse(localStorage.getItem('matches') || '[]');
    const match = matches.find(m => m.id === matchId);
    
    if (!match) return null;
    
    const lostItems = JSON.parse(localStorage.getItem('lostItems') || '[]');
    const foundItems = JSON.parse(localStorage.getItem('foundItems') || '[]');
    
    const lostItem = lostItems.find(item => item.id === match.lostItemId);
    const foundItem = foundItems.find(item => item.id === match.foundItemId);
    
    return {
        ...match,
        lostItem,
        foundItem
    };
}

// Get All Matches with Details
function getAllMatchesWithDetails() {
    const matches = JSON.parse(localStorage.getItem('matches') || '[]');
    
    return matches.map(match => {
        const matchDetails = getMatchDetails(match.id);
        return {
            ...match,
            ...matchDetails
        };
    }).filter(match => match.lostItem && match.foundItem); // Only return matches with valid items
}

// Manual Match Trigger (for testing)
function manualMatch() {
    const newMatches = findMatches();
    
    if (newMatches.length > 0) {
        appUtils.showNotification(`Found ${newMatches.length} new matches!`, 'success');
    } else {
        appUtils.showNotification('No new matches found', 'info');
    }
}

// Force Match Specific Items (for testing)
function forceMatch(lostItemId, foundItemId) {
    const lostItems = JSON.parse(localStorage.getItem('lostItems') || '[]');
    const foundItems = JSON.parse(localStorage.getItem('foundItems') || '[]');
    
    const lostItem = lostItems.find(item => item.id === lostItemId);
    const foundItem = foundItems.find(item => item.id === foundItemId);
    
    if (!lostItem || !foundItem) {
        appUtils.showNotification('Items not found', 'error');
        return;
    }
    
    const matchScore = 95; // High score for forced matches
    const match = createMatch(lostItem, foundItem, matchScore);
    
    const matches = JSON.parse(localStorage.getItem('matches') || '[]');
    matches.push(match);
    localStorage.setItem('matches', JSON.stringify(matches));
    
    updateItemStatus(lostItemId, 'lost', 'matched');
    updateItemStatus(foundItemId, 'found', 'matched');
    
    appUtils.showNotification('Items manually matched!', 'success');
    
    if (typeof loadDashboardItems === 'function') {
        loadDashboardItems();
    }
}

// Get Match Suggestions for Specific Item
function getMatchSuggestions(itemId, type) {
    const allItems = type === 'lost' 
        ? JSON.parse(localStorage.getItem('foundItems') || '[]').filter(item => item.status === 'active')
        : JSON.parse(localStorage.getItem('lostItems') || '[]').filter(item => item.status === 'active');
    
    const targetItem = type === 'lost'
        ? JSON.parse(localStorage.getItem('lostItems') || '[]').find(item => item.id === itemId)
        : JSON.parse(localStorage.getItem('foundItems') || '[]').find(item => item.id === itemId);
    
    if (!targetItem) return [];
    
    const suggestions = allItems.map(item => {
        const matchScore = type === 'lost'
            ? calculateMatchScore(targetItem, item)
            : calculateMatchScore(item, targetItem);
        
        return {
            item,
            matchScore: Math.round(matchScore),
            type: type === 'lost' ? 'found' : 'lost'
        };
    })
    .filter(suggestion => suggestion.matchScore >= 50) // Only show suggestions above 50%
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 5); // Top 5 suggestions
    
    return suggestions;
}

// Export functions for use in other files
window.matching = {
    findMatches,
    getMatchDetails,
    getAllMatchesWithDetails,
    getMatchSuggestions,
    manualMatch,
    forceMatch,
    calculateMatchScore
};

// Add matching algorithm info to console
console.log(`
🎯 Lost & Found Matching Algorithm Loaded
📊 Features:
• Smart category matching
• String similarity analysis
• Color and location matching
• Time-based scoring
• 70% match threshold

🔄 Running automatically every 30 seconds
🔧 Use matching.manualMatch() to trigger manually
`);

// Demo data generator for testing
function generateDemoMatches() {
    console.log('Generating demo matches...');
    
    // Create some demo items if none exist
    const lostItems = JSON.parse(localStorage.getItem('lostItems') || '[]');
    const foundItems = JSON.parse(localStorage.getItem('foundItems') || '[]');
    
    if (lostItems.length === 0 || foundItems.length === 0) {
        console.log('Not enough items for demo matches');
        return;
    }
    
    // Force a few matches for demo purposes
    const demoPairs = [
        [lostItems[0]?.id, foundItems[0]?.id],
        [lostItems[1]?.id, foundItems[1]?.id]
    ].filter(pair => pair[0] && pair[1]);
    
    demoPairs.forEach(([lostId, foundId], index) => {
        setTimeout(() => {
            forceMatch(lostId, foundId);
        }, index * 1000);
    });
}

// Auto-generate demo matches if no matches exist (for testing)
setTimeout(() => {
    const matches = JSON.parse(localStorage.getItem('matches') || '[]');
    if (matches.length === 0) {
        generateDemoMatches();
    }
}, 2000);
// Add this function to match.js - Duplicate report detection
function checkForDuplicateReports(lostItem) {
    const existingLostItems = JSON.parse(localStorage.getItem('lostItems') || '[]');
    
    // Check for duplicate lost reports (same item, same email, within 1 hour)
    const duplicates = existingLostItems.filter(existing => 
        existing.contactEmail === lostItem.contactEmail &&
        existing.category === lostItem.category &&
        existing.itemName.toLowerCase() === lostItem.itemName.toLowerCase() &&
        Math.abs(new Date(existing.dateReported) - new Date(lostItem.dateReported)) < 3600000 // 1 hour
    );
    
    if (duplicates.length > 0) {
        return {
            isDuplicate: true,
            existingItem: duplicates[0],
            message: 'You already reported a similar item recently. Please check your dashboard.'
        };
    }
    
    return { isDuplicate: false };
}

// Modify findMatches function - add suspicious claim detection
// Find this line in findMatches(): "if (matchScore >= 70)" and replace the block
// Or add this check right before creating the match

// Add this inside the lostItems.forEach loop, before creating match:
            
            // 🔐 Check for suspicious claims (Lost reported AFTER Found)
            const lostDate = new Date(lostItem.dateReported);
            const foundDate = new Date(foundItem.dateReported);
            const isSuspicious = lostDate > foundDate;
            
            // 🔐 Check for duplicate claims
            const existingClaims = existingMatches.filter(m => 
                m.lostItemId === lostItem.id || m.foundItemId === foundItem.id
            );
            const isDuplicateClaim = existingClaims.length > 0;
            
            if (matchScore >= 70) {
                const match = createMatch(lostItem, foundItem, matchScore);
                
                // Set status based on suspicion level
                if (isDuplicateClaim) {
                    match.status = 'duplicate';
                    match.suspicious = true;
                    match.suspiciousReason = 'Duplicate claim attempt';
                } else if (isSuspicious && matchScore >= 85) {
                    match.status = 'under_review';
                    match.suspicious = true;
                    match.suspiciousReason = 'Lost reported after found item - possible fake claim';
                } else {
                    match.status = 'pending';
                }
                
                newMatches.push(match);
            }
            // Add to match.js - Time-Lock for Suspicious Claims

// Modify the createMatch function to include time-lock detection
function createMatchWithSecurity(lostItem, foundItem, matchScore) {
    const lostDate = new Date(lostItem.dateReported);
    const foundDate = new Date(foundItem.dateReported);
    const isSuspicious = lostDate > foundDate; // Lost reported AFTER found = SUSPICIOUS!
    
    let status = 'pending';
    let suspicious = false;
    let suspiciousReason = '';
    
    if (isSuspicious && matchScore >= 80) {
        status = 'under_review';
        suspicious = true;
        suspiciousReason = 'Lost item reported after found item - possible fake claim';
        console.log(`⚠️ SUSPICIOUS MATCH: Lost ${lostItem.id} reported after Found ${foundItem.id}`);
    }
    
    return {
        id: appUtils.generateId(),
        lostItemId: lostItem.id,
        foundItemId: foundItem.id,
        matchScore: Math.round(matchScore),
        matchDate: new Date().toISOString(),
        status: status,
        suspicious: suspicious,
        suspiciousReason: suspiciousReason,
        verification: {
            lostCode: lostItem.verificationCode,
            foundCode: foundItem.verificationCode
        }
    };
}
