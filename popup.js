document.addEventListener('DOMContentLoaded', () => {
    // --- Get references to all input elements ---
    const fullNameInput = document.getElementById('fullName');
    const emailInput = document.getElementById('email');
    const phoneInput = document.getElementById('phone');
    const residenceInput = document.getElementById('residence');
    const summaryInput = document.getElementById('summary');
    const skillsInput = document.getElementById('skills');

    const workListDiv = document.getElementById('workExperienceList');
    const eduListDiv = document.getElementById('educationList');
    const linksListDiv = document.getElementById('linksList');
    const certsListDiv = document.getElementById('certsList');
    const referencesListDiv = document.getElementById('referencesList');

    const addWorkExpBtn = document.getElementById('addWorkExp');
    const addEducationBtn = document.getElementById('addEducation');
    const addLinkBtn = document.getElementById('addLink');
    const addCertBtn = document.getElementById('addCert');
    const addReferenceBtn = document.getElementById('addReference');

    const saveButton = document.getElementById('save');
    const fillButton = document.getElementById('fill');
    const statusDiv = document.getElementById('status');

    // --- Data Structure Key ---
    const STORAGE_KEY = 'userDataAdvanced';

    // --- Helper Functions for Dynamic Lists ---

    // Generic function to create a list item with fields
    function createListItem(container, fieldsConfig, data = {}) {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'list-item';

        fieldsConfig.forEach(field => {
            const label = document.createElement('label');
            label.textContent = field.label + ':';
            itemDiv.appendChild(label);

            let input;
            if (field.type === 'textarea') {
                input = document.createElement('textarea');
                input.rows = field.rows || 3;
            } else {
                input = document.createElement('input');
                input.type = field.type || 'text';
            }
            input.name = field.name; // Crucial for retrieving data later
            input.placeholder = field.placeholder || '';
            input.value = data[field.name] || '';
            itemDiv.appendChild(input);
            itemDiv.appendChild(document.createElement('br')); // Simple spacing
        });

        const removeBtn = document.createElement('button');
        removeBtn.textContent = 'X';
        removeBtn.className = 'remove-item-btn';
        removeBtn.type = 'button'; // Prevent form submission if wrapped in form
        removeBtn.onclick = () => itemDiv.remove();
        itemDiv.appendChild(removeBtn);

        container.appendChild(itemDiv);
    }

    // Specific functions to add items
    function addWorkItem(data = {}) {
        createListItem(workListDiv, [
            { name: 'companyName', label: 'Company Name', placeholder: 'Acme Corp' },
            { name: 'role', label: 'Role/Title', placeholder: 'Software Engineer' },
            { name: 'duration', label: 'Duration', placeholder: 'e.g., Jan 2020 - Dec 2022 or 2 years' },
             { name: 'description', label: 'Description (Optional)', type: 'textarea', rows: 2} // Simple duration for now
        ], data);
    }

    function addEducationItem(data = {}) {
        createListItem(eduListDiv, [
            { name: 'institution', label: 'Institution', placeholder: 'University of Example' },
            { name: 'major', label: 'Major/Degree', placeholder: 'B.Sc. Computer Science' },
            { name: 'duration', label: 'Duration', placeholder: 'e.g., Sep 2016 - May 2020' } // Simple duration
        ], data);
    }

     function addLinkItem(data = {}) {
        createListItem(linksListDiv, [
            { name: 'linkName', label: 'Link Name', placeholder: 'Portfolio' },
            { name: 'linkUrl', label: 'URL', type:'url', placeholder: 'https://...' }
        ], data);
    }
     function addCertItem(data = {}) {
        createListItem(certsListDiv, [
            { name: 'certName', label: 'Certificate/License Name', placeholder: 'AWS Certified Developer' },
            { name: 'issuer', label: 'Issuing Body', placeholder: 'Amazon Web Services' },
            { name: 'dateIssued', label: 'Date Issued (Optional)', type:'month', placeholder: 'YYYY-MM' }
        ], data);
    }
     function addReferenceItem(data = {}) {
        createListItem(referencesListDiv, [
            { name: 'refName', label: 'Reference Name' },
            { name: 'refTitle', label: 'Title/Relationship' },
            { name: 'refCompany', label: 'Company'},
            { name: 'refEmail', label: 'Email', type:'email'},
            { name: 'refPhone', label: 'Phone (Optional)', type:'tel'}
        ], data);
    }

    // --- Helper function to collect data from a list ---
    function collectListData(container) {
        const items = [];
        container.querySelectorAll('.list-item').forEach(itemDiv => {
            const itemData = {};
            itemDiv.querySelectorAll('input, textarea').forEach(input => {
                if (input.name) { // Only collect if input has a name
                    itemData[input.name] = input.value.trim();
                }
            });
             // Only add if item has some data (prevent empty entries if needed)
             if (Object.values(itemData).some(val => val !== '')) {
                 items.push(itemData);
             }
        });
        return items;
    }

    // --- Event Listeners for "Add" buttons ---
    addWorkExpBtn.addEventListener('click', () => addWorkItem());
    addEducationBtn.addEventListener('click', () => addEducationItem());
    addLinkBtn.addEventListener('click', () => addLinkItem());
    addCertBtn.addEventListener('click', () => addCertItem());
    addReferenceBtn.addEventListener('click', () => addReferenceItem());

    // --- Load saved data when popup opens ---
    chrome.storage.local.get([STORAGE_KEY], (result) => {
        const data = result[STORAGE_KEY];
        if (data) {
            console.log('Loaded data:', data);
            fullNameInput.value = data.fullName || '';
            emailInput.value = data.email || '';
            phoneInput.value = data.phone || '';
            residenceInput.value = data.residence || '';
            summaryInput.value = data.summary || '';
            skillsInput.value = (data.skills || []).join(', '); // Load skills as comma-separated

            // Populate lists
            (data.workExperience || []).forEach(item => addWorkItem(item));
            (data.education || []).forEach(item => addEducationItem(item));
            (data.links || []).forEach(item => addLinkItem(item));
            (data.certifications || []).forEach(item => addCertItem(item));
            (data.references || []).forEach(item => addReferenceItem(item));

        } else {
            console.log('No saved data found for key:', STORAGE_KEY);
            // Optionally add one empty item to each list to guide the user
             addWorkItem();
             addEducationItem();
             addLinkItem();
        }
    });

    // --- Save data when "Save" button is clicked ---
    saveButton.addEventListener('click', () => {
        const userData = {
            fullName: fullNameInput.value.trim(),
            email: emailInput.value.trim(),
            phone: phoneInput.value.trim(),
            residence: residenceInput.value.trim(),
            summary: summaryInput.value.trim(),
            skills: skillsInput.value.split(',').map(s => s.trim()).filter(s => s), // Save skills as array
            workExperience: collectListData(workListDiv),
            education: collectListData(eduListDiv),
            links: collectListData(linksListDiv),
            certifications: collectListData(certsListDiv),
            references: collectListData(referencesListDiv)
        };

        chrome.storage.local.set({ [STORAGE_KEY]: userData }, () => {
            console.log('Data saved:', userData);
            statusDiv.textContent = 'Details Saved!';
            setTimeout(() => { statusDiv.textContent = ''; }, 3000);
        });
    });

    // --- Trigger content script ("Fill Form") ---
    // (This part remains the same as before, just ensure content_script.js is updated to handle the new data)
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
                 }
            });
        } else {
            console.error("Could not get active tab ID.");
            statusDiv.textContent = 'Could not access active tab.';
        }
         setTimeout(() => { statusDiv.textContent = ''; }, 3000);
    });
});