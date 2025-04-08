console.log("Content script injected and running.");

// --- Function to perform the form filling ---
function fillFormFields(userData) {
    console.log("Attempting to fill form with data:", userData);

    // --- Define Mappings: Link userData keys to possible field identifiers ---
    // Add more variations as you encounter them! Case-insensitive matching is used below.
    const fieldMappings = {
        firstName: ['first name', 'firstname', 'given name', 'fname', 'voornaam'],
        lastName: ['last name', 'lastname', 'surname', 'family name', 'lname', 'achternaam'],
        email: ['email', 'email address', 'e-mail'],
        phone: ['phone', 'phone number', 'mobile number', 'telephone', 'tel', 'mobiel']
    };

    // --- Find all relevant input fields and textareas ---
    const inputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], input[type="url"], input[type="search"], textarea');
    let fieldsFilled = 0;

    inputs.forEach(input => {
        if (!input.value) { // Only fill if the field is currently empty
            let matchedKey = null;
            let labelText = '';
            let placeholderText = (input.placeholder || '').toLowerCase();
            let inputId = (input.id || '').toLowerCase();
            let inputName = (input.name || '').toLowerCase();

            // Try finding label associated with the input
            let label = input.closest('label'); // Check if input is inside a label
            if (!label) {
                // Check for label using 'for' attribute
                 if (input.id) {
                    label = document.querySelector(`label[for="${input.id}"]`);
                 }
            }
            if (label) {
                 labelText = (label.textContent || '').toLowerCase();
            }

            // --- Check against mappings ---
            for (const key in fieldMappings) {
                if (userData[key]) { // Only check if we have data for this key
                    const possibleIdentifiers = fieldMappings[key];
                    if (possibleIdentifiers.some(id =>
                        labelText.includes(id) ||
                        placeholderText.includes(id) ||
                        inputId.includes(id) ||
                        inputName.includes(id)
                    )) {
                        matchedKey = key;
                        break; // Found a match for this input field
                    }
                }
            }

            // --- Fill if a match was found ---
            if (matchedKey) {
                console.log(`Match found for '${matchedKey}': Filling input (ID: ${input.id}, Name: ${input.name}, Label: ${labelText.trim()})`);
                input.value = userData[matchedKey];
                fieldsFilled++;

                // Optional: Trigger change/input events which some websites might need
                 input.dispatchEvent(new Event('input', { bubbles: true }));
                 input.dispatchEvent(new Event('change', { bubbles: true }));
            }
        } else {
             console.log(`Skipping already filled input (ID: ${input.id}, Name: ${input.name})`);
        }
    });

    console.log(`Form filling attempt complete. Fields filled: ${fieldsFilled}`);
    alert(`Form Filler MVP: Filled ${fieldsFilled} fields.`); // Simple feedback
}


// --- Main execution flow for the content script ---
// 1. Retrieve the stored user data
chrome.storage.local.get(['userData'], (result) => {
    if (result.userData && Object.keys(result.userData).length > 0) {
        // 2. If data exists, call the function to fill the fields
        fillFormFields(result.userData);
    } else {
        console.log('No user data found in storage. Cannot fill form.');
        alert('Form Filler MVP: No user data saved. Please save your details in the extension popup.');
    }
});