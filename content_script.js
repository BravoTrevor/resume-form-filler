console.log("Advanced Content Script injected and running.");

const STORAGE_KEY = 'userDataAdvanced'; // Must match popup.js

// --- Helper: Check if an element is visible to the user ---
function isVisible(elem) {
    if (!(elem instanceof Element)) return false;
    return !!(elem.offsetWidth || elem.offsetHeight || elem.getClientRects().length);
}

// --- Helper: Simple fuzzy matching (example - could use a library) ---
function fuzzyMatch(term, candidates) {
    const lowerTerm = term.toLowerCase().replace(/[^a-z0-9\s]/g, ''); // Basic normalization
    for (const candidate of candidates) {
        const lowerCandidate = candidate.toLowerCase().replace(/[^a-z0-9\s]/g, '');
        if (lowerCandidate.includes(lowerTerm) || lowerTerm.includes(lowerCandidate)) {
            return true;
        }
        // Add more sophisticated matching if needed (e.g., Levenshtein distance)
    }
    return false;
}


// --- Define Mappings (EXPANDED SIGNIFICANTLY) ---
// Keys match the structure saved in storage
const fieldMappings = {
    // Basic Info
    fullName: ['full name', 'name', 'legal name'],
    firstName: ['first name', 'firstname', 'given name', 'fname'], // Keep for potential split fields
    lastName: ['last name', 'lastname', 'surname', 'family name', 'lname'], // Keep for potential split fields
    email: ['email', 'e-mail', 'email address'],
    phone: ['phone', 'phone number', 'mobile number', 'telephone', 'contact number'],
    residence: ['location', 'residence', 'city', 'country', 'address', 'postal code', 'zip code'], // Broad matching
    summary: ['summary', 'about me', 'profile', 'objective', 'introduction', 'bio'], // Targets textareas primarily

    // Lists / Textareas
    skills: ['skills', 'proficiencies', 'technical skills', 'competencies'], // Often a textarea

    // Links (Look for pairs)
    linkUrl: ['url', 'website', 'link', 'portfolio', 'github', 'linkedin'],
    linkName: ['link name', 'description', 'website name', 'link title'], // Less common

    // Work Experience Groupings (Keywords for fields WITHIN a work block)
    workExperience: {
        groupKeywords: ['work experience', 'employment history', 'job history', 'positions'], // Keywords to identify the section/group container
        companyName: ['company', 'employer', 'organization'],
        role: ['title', 'role', 'position', 'job title'],
        duration: ['duration', 'dates employed', 'time period'], // Could be single field
        startDate: ['start date', 'from', 'period start'], // Or separate fields
        endDate: ['end date', 'to', 'period end', 'currently working'], // Or separate fields
        description: ['description', 'responsibilities', 'achievements', 'job details'] // Usually a textarea
    },

    // Education Groupings
    education: {
        groupKeywords: ['education', 'academic background', 'schooling', 'qualifications'],
        institution: ['school', 'university', 'college', 'institution'],
        major: ['major', 'degree', 'field of study', 'course'],
        duration: ['duration', 'dates attended'],
        startDate: ['start date', 'from'],
        endDate: ['end date', 'to', 'expected graduation'],
        // gradDate: ['graduation date', 'completion date'] // Alt to end date
    },

     // Certifications Groupings
     certifications: {
         groupKeywords: ['certifications', 'licenses', 'credentials', 'qualifications'],
         certName: ['name', 'certificate name', 'license name', 'title'],
         issuer: ['issuing body', 'issuer', 'organization', 'authority'],
         dateIssued: ['date issued', 'issue date', 'completion date']
     },

     // References Groupings
     references: {
         groupKeywords: ['references', 'professional references'],
         refName: ['name', 'reference name', 'contact name'],
         refTitle: ['title', 'relationship'],
         refCompany: ['company', 'organization'],
         refEmail: ['email', 'contact email'],
         refPhone: ['phone', 'contact phone']
     }
};

// --- Function to find the best input based on keywords ---
function findInputForKeywords(keywords, parentElement = document, inputTypes = ['text', 'email', 'tel', 'url', 'search', 'month']) {
    const selector = inputTypes.map(type => `input[type="${type}"]`).join(', ') + ', textarea';
    const inputs = parentElement.querySelectorAll(selector);
    let bestMatch = null;
    let highestScore = 0; // Simple score: label=3, placeholder=2, id/name=1

    inputs.forEach(input => {
         if (!isVisible(input) || input.value) return; // Skip hidden or already filled

         let currentScore = 0;
         let labelText = '';
         let placeholderText = (input.placeholder || '').toLowerCase();
         let inputId = (input.id || '').toLowerCase();
         let inputName = (input.name || '').toLowerCase();

         // Find associated label
         let labelElem = input.closest('label') || (input.id && document.querySelector(`label[for="${input.id}"]`));
         if (labelElem) {
            labelText = (labelElem.textContent || '').toLowerCase();
         } else {
             // Try finding label text in parent elements (less reliable)
            let parent = input.parentElement;
            let k = 0;
            while(parent && k < 3) { // Limit search upwards
                 const parentLabel = parent.querySelector('label, span, div'); // Look for potential labels nearby
                 if(parentLabel && parentLabel.textContent) {
                    labelText = (parentLabel.textContent || '').toLowerCase();
                    break;
                 }
                 parent = parent.parentElement;
                 k++;
            }
         }


        if (fuzzyMatch(labelText, keywords)) currentScore += 3;
        if (fuzzyMatch(placeholderText, keywords)) currentScore += 2;
        if (fuzzyMatch(inputId, keywords) || fuzzyMatch(inputName, keywords)) currentScore += 1;


        if (currentScore > highestScore) {
            highestScore = currentScore;
            bestMatch = input;
        }
    });

     // Also check for textareas specifically for summary/description
     if (keywords.some(k => ['summary', 'description', 'skills', 'about me', 'responsibilities'].includes(k))) {
         parentElement.querySelectorAll('textarea').forEach(textarea => {
              if (!isVisible(textarea) || textarea.value) return;
              // Re-check label/placeholder/id/name for textarea
              let currentScore = 0;
             // (Add scoring logic similar to above for textarea)
              if(currentScore > highestScore) { // Check if textarea is a better match
                  // ... update bestMatch and highestScore ...
              }
         });
     }

    return bestMatch;
}


// --- Function to fill a single field ---
function fillField(input, value) {
    if (input && isVisible(input) && !input.value && value) {
        console.log(`Filling field (ID: ${input.id}, Name: ${input.name}) with value: ${value.substring(0, 50)}...`);
        input.value = value;
        // Trigger events for frameworks
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        input.dispatchEvent(new Event('blur', { bubbles: true })); // Sometimes needed
        return true;
    }
    return false;
}

// --- Function to fill grouped items (Work, Edu, Certs, Refs) ---
function fillGroupedItems(groupData, mappingConfig, groupContainerSelector = 'div, fieldset, section') {
    if (!groupData || groupData.length === 0) return 0;

    let itemsFilledCount = 0;
    // Try to find containers for each item (VERY HEURISTIC)
    // Look for elements that might contain keywords or visually group fields
    // This needs refinement based on common ATS structures (Greenhouse, Lever etc.)
    const potentialGroups = Array.from(document.querySelectorAll(groupContainerSelector))
        .filter(el => isVisible(el) && mappingConfig.groupKeywords.some(kw => (el.textContent || '').toLowerCase().includes(kw)));

    // Fallback: Search the whole document if specific groups aren't clear
    const searchContexts = potentialGroups.length > 0 ? potentialGroups : [document.body];
    let currentDataIndex = 0;

    console.log(`Attempting to fill ${groupData.length} items for group:`, mappingConfig.groupKeywords[0]);

     searchContexts.forEach(context => {
         // Limit search within the context
         const contextInputs = context.querySelectorAll('input, textarea, select');
         if (contextInputs.length < 2) return; // Skip contexts with too few inputs

         while (currentDataIndex < groupData.length) {
             const currentItemData = groupData[currentDataIndex];
             let fieldsFoundInContext = 0;
             let filledInThisContext = false;

             // Try to find and fill all fields for the *current* data item within this context
             for (const fieldKey in mappingConfig) {
                 if (fieldKey === 'groupKeywords' || !currentItemData[fieldKey]) continue; // Skip meta-key and empty data

                 const inputField = findInputForKeywords(mappingConfig[fieldKey], context);
                 if (inputField) {
                      fieldsFoundInContext++;
                      if(fillField(inputField, currentItemData[fieldKey])) {
                         filledInThisContext = true;
                      }
                 }
             }

              // If we successfully filled at least one field for this item in this context,
              // assume this context corresponds to this data item and move to the next data item.
              // This is a big assumption and might mismatch items if contexts are not distinct.
             if (filledInThisContext) {
                 console.log(`Filled fields for item ${currentDataIndex + 1} within context:`, context.className || context.tagName);
                 itemsFilledCount++;
                 currentDataIndex++; // Move to the next data item
             } else {
                  // If we couldn't fill anything for the current data item in this context,
                  // break the inner loop for this context and try the next context (if any)
                  // for the *same* data item.
                  break;
             }
        }
         if (currentDataIndex >= groupData.length) return; // Stop searching contexts if all data is used
    });


    console.log(`Finished grouped fill attempt for ${mappingConfig.groupKeywords[0]}. Items filled: ${itemsFilledCount}`);
    return itemsFilledCount;
}


// --- Main Execution ---
chrome.storage.local.get([STORAGE_KEY], (result) => {
    const userData = result[STORAGE_KEY];
    if (!userData || Object.keys(userData).length === 0) {
        console.log('No user data found in storage. Cannot fill form.');
        alert('Advanced Form Filler: No user data saved. Please save your details in the extension popup.');
        return;
    }

    console.log("Attempting to fill form with advanced data:", userData);
    let totalFieldsFilled = 0;

    // --- Fill Basic Info ---
    const basicFields = ['fullName', 'email', 'phone', 'residence'];
    basicFields.forEach(key => {
        if (userData[key]) {
            const input = findInputForKeywords(fieldMappings[key]);
            if (fillField(input, userData[key])) {
                 totalFieldsFilled++;
            }
        }
    });
     // Special handling for potentially split Name fields
     if (!findInputForKeywords(fieldMappings.fullName) && userData.fullName) {
         const nameParts = userData.fullName.split(' ');
         const firstName = nameParts[0];
         const lastName = nameParts.slice(1).join(' ');
         const firstInput = findInputForKeywords(fieldMappings.firstName);
         if(fillField(firstInput, firstName)) totalFieldsFilled++;
         const lastInput = findInputForKeywords(fieldMappings.lastName);
         if(fillField(lastInput, lastName)) totalFieldsFilled++;
     }


    // --- Fill Summary/About Me (Textarea) ---
    if (userData.summary) {
        const summaryArea = findInputForKeywords(fieldMappings.summary, document, ['textarea']);
         if (fillField(summaryArea, userData.summary)) {
             totalFieldsFilled++;
         }
    }

    // --- Fill Skills (Assuming comma-separated in textarea) ---
    if (userData.skills && userData.skills.length > 0) {
        const skillsArea = findInputForKeywords(fieldMappings.skills, document, ['textarea']);
         if (fillField(skillsArea, userData.skills.join(', '))) {
             totalFieldsFilled++;
         }
         // TODO: Add logic for multiple skill input fields if textarea not found
    }

     // --- Fill Links ---
     if(userData.links && userData.links.length > 0) {
         // Simple approach: find pairs of URL/Name fields sequentially
         let linkFieldsFilled = 0;
         const urlInputs = document.querySelectorAll('input[type="url"], input[type="text"]'); // Find potential URL fields
         let linkDataIndex = 0;

         urlInputs.forEach(urlInput => {
             if (linkDataIndex >= userData.links.length) return; // Stop if no more link data

             // Check if the URL input seems relevant based on label/placeholder
             const urlLabelText = (urlInput.closest('label')?.textContent || urlInput.placeholder || urlInput.id || urlInput.name || '').toLowerCase();
             if (isVisible(urlInput) && !urlInput.value && fieldMappings.linkUrl.some(kw => urlLabelText.includes(kw))) {

                 // Try to find a corresponding Name/Description field nearby
                 const nameInput = findInputForKeywords(fieldMappings.linkName, urlInput.closest('div, p, li') || urlInput.parentElement); // Search nearby

                 if (fillField(urlInput, userData.links[linkDataIndex].linkUrl)) {
                     linkFieldsFilled++;
                     // Optionally fill name field if found
                     fillField(nameInput, userData.links[linkDataIndex].linkName);
                     linkDataIndex++; // Move to next link data item
                 }
             }
         });
         console.log(`Filled ${linkFieldsFilled} link fields.`);
         totalFieldsFilled += linkFieldsFilled > 0 ? 1 : 0; // Count as one block
     }


    // --- Fill Grouped Sections ---
    totalFieldsFilled += fillGroupedItems(userData.workExperience, fieldMappings.workExperience);
    totalFieldsFilled += fillGroupedItems(userData.education, fieldMappings.education);
    totalFieldsFilled += fillGroupedItems(userData.certifications, fieldMappings.certifications);
    totalFieldsFilled += fillGroupedItems(userData.references, fieldMappings.references);


    // --- Final Feedback ---
    console.log(`Form filling attempt complete. Approximate fields/sections filled: ${totalFieldsFilled}`);
    alert(`Advanced Form Filler: Filled approximately ${totalFieldsFilled} fields/sections. Please review carefully!`);
});