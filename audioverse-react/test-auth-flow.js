// Test to verify the auth token flow manually
// This simulates what should happen during login

console.log("=== Testing Auth Flow ===");

// Mock localStorage for Node.js
const mockLocalStorage = {
    data: {},
    getItem(key) {
        return this.data[key] || null;
    },
    setItem(key, value) {
        this.data[key] = value;
    },
    removeItem(key) {
        delete this.data[key];
    }
};

const localStorage = mockLocalStorage;

// Simulate the module state
let accessToken = null;
let refreshToken = null;
const STORAGE_KEY_ACCESS = "audioverse_access_token";
const STORAGE_KEY_REFRESH = "audioverse_refresh_token";

// Simulate saveTokens
const saveTokens = (newAccessToken, newRefreshToken) => {
    console.log("saveTokens called with:", newAccessToken ? "access=yes" : "none", newRefreshToken ? "refresh=yes" : "none");
    accessToken = newAccessToken ?? null;
    refreshToken = newRefreshToken ?? null;
    
    if (accessToken) {
        localStorage.setItem(STORAGE_KEY_ACCESS, accessToken);
        console.log("Saved to localStorage");
    }
    if (refreshToken) {
        localStorage.setItem(STORAGE_KEY_REFRESH, refreshToken);
    }
};

// Simulate getAccessToken
const getAccessToken = () => {
    console.log("getAccessToken called, returning:", accessToken ? "yes" : "null");
    return accessToken;
};

// Simulate initTokensFromStorage
const initTokensFromStorage = () => {
    console.log("initTokensFromStorage called");
    const storedAccess = localStorage.getItem(STORAGE_KEY_ACCESS);
    const storedRefresh = localStorage.getItem(STORAGE_KEY_REFRESH);
    
    if (storedAccess) {
        accessToken = storedAccess;
        console.log("Restored from localStorage");
    }
    if (storedRefresh) {
        refreshToken = storedRefresh;
    }
};

// Test 1: Initial state
console.log("\n1. Initial state:");
console.log("getAccessToken():", getAccessToken());

// Test 2: After login (saveTokens is called)
console.log("\n2. After apiUser.loginUser() calls saveTokens():");
saveTokens("token123", "refresh456");
console.log("getAccessToken():", getAccessToken());
console.log("In localStorage:", localStorage.getItem(STORAGE_KEY_ACCESS) ? "YES" : "NO");

// Test 3: After logout (saveTokens with empty strings)
console.log("\n3. After logout (saveTokens('', '')):");
saveTokens("", "");
console.log("getAccessToken():", getAccessToken());
console.log("In localStorage:", localStorage.getItem(STORAGE_KEY_ACCESS) ? "YES" : "NO");

// Test 4: Initialize from storage (like on page load)
console.log("\n4. After page refresh, initTokensFromStorage() is called:");
accessToken = null; // Simulate module reload  
refreshToken = null;
// First need to put something back in localStorage from test 2
localStorage.setItem(STORAGE_KEY_ACCESS, "token123");
localStorage.setItem(STORAGE_KEY_REFRESH, "refresh456");
initTokensFromStorage();
console.log("getAccessToken():", getAccessToken());

console.log("\n=== Test Complete ===");
