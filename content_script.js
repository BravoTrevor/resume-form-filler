console.log("Content script injected and running (v2).");

// --- Function to perform the form filling ---
function fillFormFields(userData) {
    console.log("Attempting to fill form with data (v2):", userData);

    // --- Define Mappings: Link userData keys to possible field identifiers ---
    // EXPANDED MAPPINGS - Add more variations as needed!
    const fieldMappings = {
        // Simple Text Fields
        firstName: ['first name', 'firstname', 'given name', 'fname', 'vorname'],
        lastName: ['last name', 'lastname', 'surname', 'family name', 'lname', 'nachname', 'achternaam'],
        fullName: ['full name', 'name', 'legal name', 'nombre completo'], // Add 'name' here, might conflict slightly but often needed
        email: ['email', 'email address', 'e-mail', 'mail', 'correo electrónico'],
        phone: ['phone', 'phone number', 'mobile number', 'telephone', 'tel', 'mobil', 'celular', 'telefono'],
        residence: ['address', 'street address', 'location', 'city', 'residence', 'adresse', 'standort', 'direccion'],

        // Text Areas (or potentially single inputs for lists)
        summary: ['summary', 'profile', 'objective', 'about me', 'bio', 'introduction', 'profil', 'über mich', 'resumen'],
        skills: ['skills', 'technical skills', 'proficiencies', 'fähigkeiten', 'kenntnisse', 'habilidades'], // Often a textarea or comma-separated input
        links: ['website', 'portfolio', 'linkedin', 'github', 'url', 'link', 'personal site'], // May appear multiple times, fill first found for now
        certifications: ['certifications', 'licenses', 'certificates', 'zertifikate', 'lizenzen', 'certificaciones'],
        references: ['references', 'referenzen', 'referencias'], // Be cautious filling this automatically

        // Complex fields - Try filling textareas first, more specific matching is harder
        workExperienceTextArea: ['work experience', 'experience', 'employment history', 'previous roles', 'berufserfahrung', 'experiencia laboral'], // Target large textareas first
        educationTextArea: ['education', 'academic background', 'qualifications', 'bildung', 'ausbildung', 'educación'], // Target large textareas first

        // TODO: Add more specific mappings later if needed for individual parts of work/education
        // company: ['company', 'employer', 'firma', 'arbeitgeber'],
        // role: ['role', 'job title', 'position', 'position'],
        // etc.
    };

    // --- Find all relevant input fields and textareas ---
    const inputs = document.querySelectorAll(
        'input[type="text"], input[type="email"], input[type="tel"], input[type="url"], input[type="search"], textarea'
    );
    let fieldsFilled = 0;
    const filledDataKeys = new Set(); // Keep track of which userData keys we've used

    inputs.forEach(input => {
        // Skip if field already filled OR if it's hidden
        if (input.value || input.offsetParent === null || input.type === 'hidden') {
             // console.log(`Skipping already filled or hidden input (ID: ${input.id}, Name: ${input.name})`);
            return;
        }

        let matchedKey = null;
        let labelText = '';
        let elementText = ''; // Combine various text sources for matching
        let isTextArea = input.tagName === 'TEXTAREA';

        // --- Gather text clues for matching ---
        const placeholderText = (input.placeholder || '').toLowerCase();
        const inputId = (input.id || '').toLowerCase();
        const inputName = (input.name || '').toLowerCase();
        const ariaLabel = (input.getAttribute('aria-label') || '').toLowerCase();

        // Find associated label more robustly
        let label = input.closest('label');
        if (!label && input.id) {
            label = document.querySelector(`label[for="${input.id}"]`);
        }
        // Look for label in parent elements as well
        if (!label) {
            let parent = input.parentElement;
            while(parent && parent.tagName !== 'BODY' && !label) {
                label = parent.querySelector('label'); // Simple check within parent
                parent = parent.parentElement;
            }
        }
         if (label) {
            labelText = (label.textContent || '').trim().toLowerCase();
        }

        // Combine all text clues
        elementText = `${labelText} ${placeholderText} ${inputId} ${inputName} ${ariaLabel}`.trim();
        if (!elementText) return; // Skip if no text clues found


        // --- Check against mappings ---
        for (const key in fieldMappings) {
            // Ensure we have data for this key AND haven't used it yet for a simple field
            if (userData[key] && !filledDataKeys.has(key)) {
                const possibleIdentifiers = fieldMappings[key];
                if (possibleIdentifiers.some(id => elementText.includes(id))) {
                    matchedKey = key;
                    break;
                }
            }
        }

        // --- Fill if a match was found ---
        if (matchedKey && userData[matchedKey]) {
            console.log(`Match found for '${matchedKey}': Filling element (ID: ${input.id}, Tag: ${input.tagName}, Label: ${labelText})`);

            let valueToFill = '';

            // Format array data for textareas or simple inputs
            if (Array.isArray(userData[matchedKey])) {
                 if (['workExperienceTextArea', 'educationTextArea'].includes(matchedKey)) {
                    // Format structured lists nicely for textareas
                    const structuredData = userData[matchedKey.replace('TextArea', '')]; // Get actual data array
                    valueToFill = structuredData.map(item => {
                        // Reconstruct based on keys saved in popup.js
                         const parts = [
                            item.company || item.institution || item.part1, // Adapt based on keys used
                            item.role || item.major || item.part2,
                            item.duration || item.part3
                         ].filter(p => p).join(' | '); // Join non-empty parts
                         return parts;
                    }).join('\n');
                 } else {
                    // Join simple lists with newlines (good for textareas, often okay for inputs too)
                    valueToFill = userData[matchedKey].join('\n');
                 }

            } else {
                // Simple string value
                valueToFill = userData[matchedKey];
            }

            if (valueToFill) {
                input.value = valueToFill;
                fieldsFilled++;
                // Mark simple keys as used to prevent filling multiple fields with the same data (e.g., 'name' and 'firstName')
                // We might allow list data (like links) to fill multiple fields if needed, so don't mark those yet.
                if (!Array.isArray(userData[matchedKey]) && !isTextArea) {
                     filledDataKeys.add(matchedKey);
                }


                // Trigger events
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.dispatchEvent(new Event('change', { bubbles: true }));
                input.dispatchEvent(new Event('blur', { bubbles: true })); // Add blur event too
            }
        }
    });

    console.log(`Form filling attempt complete. Fields filled: ${fieldsFilled}`);
    if (fieldsFilled > 0) {
        alert(`Form Filler: Filled ${fieldsFilled} fields.`);
    } else {
         alert(`Form Filler: Could not find matching fields to fill, or fields were already populated.`);
    }
}


// --- Main execution flow for the content script ---
chrome.storage.local.get(['userData'], (result) => {
    if (result.userData && Object.keys(result.userData).length > 0) {
        fillFormFields(result.userData);
    } else {
        console.log('No user data found in storage. Cannot fill form.');
        alert('Form Filler: No user data saved. Please save your details in the extension popup first.');
    }
});