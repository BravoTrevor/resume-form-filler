document.addEventListener('DOMContentLoaded', () => {
    // --- Get references to all input elements ---
    const firstNameInput = document.getElementById('firstName');
    const lastNameInput = document.getElementById('lastName');
    const fullNameInput = document.getElementById('fullName');
    const emailInput = document.getElementById('email');
    const phoneInput = document.getElementById('phone');
    const residenceInput = document.getElementById('residence');
    const linksInput = document.getElementById('links');
    const summaryInput = document.getElementById('summary');
    const workExperienceInput = document.getElementById('workExperience');
    const educationInput = document.getElementById('education');
    const skillsInput = document.getElementById('skills');
    const certificationsInput = document.getElementById('certifications');
    const referencesInput = document.getElementById('references');

    const saveButton = document.getElementById('save');
    const fillButton = document.getElementById('fill');
    const statusDiv = document.getElementById('status');

    // Helper function to parse textarea lists (simple newline split)
    const parseList = (text) => text.split('\n').map(s => s.trim()).filter(s => s); // Trim lines and remove empty ones

    // Helper function to parse structured lists (like Work/Edu)
    const parseStructuredList = (text, separator = '|') => {
        return text.split('\n')
            .map(line => line.trim())
            .filter(line => line)
            .map(line => {
                const parts = line.split(separator).map(p => p.trim());
                // Basic structure assumption - adjust if needed
                if (parts.length === 3) { // e.g., Company | Role | Duration
                    return { part1: parts[0], part2: parts[1], part3: parts[2] };
                } else if (parts.length === 2) {
                     return { part1: parts[0], part2: parts[1] };
                } else if (parts.length === 1) {
                    return { part1: parts[0] }; // Handle single item per line if needed
                }
                return null; // Ignore lines that don't fit expected structure
            })
            .filter(item => item); // Remove null items
    };


    // --- 1. Load saved data when popup opens ---
    chrome.storage.local.get(['userData'], (result) => {
        if (result.userData) {
            const data = result.userData;
            firstNameInput.value = data.firstName || '';
            lastNameInput.value = data.lastName || '';
            fullNameInput.value = data.fullName || '';
            emailInput.value = data.email || '';
            phoneInput.value = data.phone || '';
            residenceInput.value = data.residence || '';
            summaryInput.value = data.summary || '';

            // Format arrays back into textarea strings
            linksInput.value = (data.links || []).join('\n');
            skillsInput.value = (data.skills || []).join('\n'); // Or use ', ' if you prefer comma separation display
            certificationsInput.value = (data.certifications || []).join('\n');
            referencesInput.value = (data.references || []).join('\n');

            // Format structured lists back into textarea strings
            workExperienceInput.value = (data.workExperience || [])
                .map(item => `${item.company || item.part1 || ''} | ${item.role || item.part2 || ''} | ${item.duration || item.part3 || ''}`)
                .join('\n');
             educationInput.value = (data.education || [])
                .map(item => `${item.institution || item.part1 || ''} | ${item.major || item.part2 || ''} | ${item.duration || item.part3 || ''}`)
                .join('\n');

            console.log('Loaded data:', data);
        } else {
            console.log('No saved data found.');
        }
    });

    // --- 2. Save data when "Save" button is clicked ---
    saveButton.addEventListener('click', () => {
        const userData = {
            firstName: firstNameInput.value.trim(),
            lastName: lastNameInput.value.trim(),
            fullName: fullNameInput.value.trim(),
            email: emailInput.value.trim(),
            phone: phoneInput.value.trim(),
            residence: residenceInput.value.trim(),
            summary: summaryInput.value.trim(),

            // Parse textareas into arrays
            links: parseList(linksInput.value),
            skills: parseList(skillsInput.value), // Assumes newline separation, adjust if using commas
            certifications: parseList(certificationsInput.value),
            references: parseList(referencesInput.value), // Simple list for now

            // Parse structured textareas
             workExperience: parseStructuredList(workExperienceInput.value).map(item => ({
                company: item.part1, role: item.part2, duration: item.part3
             })),
             education: parseStructuredList(educationInput.value).map(item => ({
                 institution: item.part1, major: item.part2, duration: item.part3
             }))
        };

        chrome.storage.local.set({ userData: userData }, () => {
            console.log('Data saved:', userData);
            statusDiv.textContent = 'Details Saved!';
            setTimeout(() => { statusDiv.textContent = ''; }, 3000);
        });
    });

    // --- 3. Trigger content script when "Fill Form" is clicked ---
    fillButton.addEventListener('click', async () => {
        let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        if (tab && tab.id) {
            console.log(`Injecting content script into tab: ${tab.id}`);
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ['content_script.js']
            }, (injectionResults) => {
                 if (chrome.runtime.lastError) {
                    console.error("Script injection failed: ", chrome.runtime.lastError.message);
                    statusDiv.textContent = 'Error injecting script.';
                 } else {
                    console.log("Script injected successfully.");
                    // window.close(); // Optional: Close popup
                 }
                 // Clear status message regardless
                  setTimeout(() => { statusDiv.textContent = ''; }, 3000);
            });
        } else {
            console.error("Could not get active tab ID.");
            statusDiv.textContent = 'Could not access active tab.';
             setTimeout(() => { statusDiv.textContent = ''; }, 3000);
        }
    });
});