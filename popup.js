document.addEventListener('DOMContentLoaded', () => {
    const firstNameInput = document.getElementById('firstName');
    const lastNameInput = document.getElementById('lastName');
    const emailInput = document.getElementById('email');
    const phoneInput = document.getElementById('phone');
    const saveButton = document.getElementById('save');
    const fillButton = document.getElementById('fill');
    const statusDiv = document.getElementById('status');

    // --- 1. Load saved data when popup opens ---
    chrome.storage.local.get(['userData'], (result) => {
        if (result.userData) {
            firstNameInput.value = result.userData.firstName || '';
            lastNameInput.value = result.userData.lastName || '';
            emailInput.value = result.userData.email || '';
            phoneInput.value = result.userData.phone || '';
            console.log('Loaded data:', result.userData);
        } else {
            console.log('No saved data found.');
        }
    });

    // --- 2. Save data when "Save" button is clicked ---
    saveButton.addEventListener('click', () => {
        const userData = {
            firstName: firstNameInput.value.trim(),
            lastName: lastNameInput.value.trim(),
            email: emailInput.value.trim(),
            phone: phoneInput.value.trim()
        };

        chrome.storage.local.set({ userData: userData }, () => {
            console.log('Data saved:', userData);
            statusDiv.textContent = 'Details Saved!';
            // Clear the status message after a few seconds
            setTimeout(() => { statusDiv.textContent = ''; }, 3000);
        });
    });

    // --- 3. Trigger content script when "Fill Form" is clicked ---
    fillButton.addEventListener('click', async () => {
        // Get the current active tab
        let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        // Ensure we have a tab and it has an ID
        if (tab && tab.id) {
            console.log(`Injecting content script into tab: ${tab.id}`);
            // Execute the content script in the active tab
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ['content_script.js'] // Specify the script file to inject and run
            }, (injectionResults) => {
                 // You can check results for errors if needed
                 if (chrome.runtime.lastError) {
                    console.error("Script injection failed: ", chrome.runtime.lastError.message);
                    statusDiv.textContent = 'Error injecting script.';
                 } else {
                    console.log("Script injected successfully.");
                    // Optional: Close the popup after clicking fill
                    // window.close();
                 }
            });
        } else {
            console.error("Could not get active tab ID.");
            statusDiv.textContent = 'Could not access active tab.';
        }
         // Clear the status message after a few seconds
         setTimeout(() => { statusDiv.textContent = ''; }, 3000);
    });
});