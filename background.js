// background.js - Service Worker

// Minimal service worker for Manifest V3 compliance.
// Can be expanded later if needed for more complex background tasks.

chrome.runtime.onInstalled.addListener(() => {
    console.log('Simple Form Filler MVP installed.');
    // You could potentially set default values in storage here if needed
    // chrome.storage.local.set({ userData: { firstName: "", lastName: "", ... } });
  });
  
  // Listen for any messages if needed in the future (not used in this MVP)
  /*
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log("Message received in background:", message);
      // Handle messages from content scripts or popups if necessary
      if (message.action === "someAction") {
          // Do something
          sendResponse({ status: "done" });
      }
      return true; // Indicates async response possible
  });
  */
  
  console.log("Background service worker started.");