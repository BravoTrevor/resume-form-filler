// --- Add this new section at the top of your popup.js ---

document.addEventListener('DOMContentLoaded', () => {
    // --- Get references for new Job Analysis elements ---
    const jobUrlInput = document.getElementById('jobUrl');
    const analyzeJobBtn = document.getElementById('analyzeJobBtn');
    const analysisResultDiv = document.getElementById('analysisResult');
    const analysisSpinner = document.getElementById('analysisSpinner');
    const BACKEND_URL = 'http://localhost:5000/analyze-job'; // URL of your local backend

    /**
     * Renders the analysis results into the popup's result container.
     */
    function renderAnalysis(data) {
        if (!data || data.error) {
            analysisResultDiv.innerHTML = `<p style="color: red;">Error: ${data.error || 'Failed to get analysis.'}</p>`;
            return;
        }

        // Build the HTML to display the analysis
        let html = `<h4>${data.jobTitle || 'Job Analysis'}</h4>`;
        html += `<p><strong>Company:</strong> ${data.companyName || 'N/A'}</p>`;

        if (data.keyResponsibilities && data.keyResponsibilities.length > 0) {
            html += `<h5>Key Responsibilities:</h5><ul>`;
            data.keyResponsibilities.forEach(item => { html += `<li>${item}</li>`; });
            html += `</ul>`;
        }

        if (data.requiredSkills && data.requiredSkills.length > 0) {
            html += `<h5>Required Skills:</h5><ul>`;
            data.requiredSkills.forEach(item => { html += `<li>${item}</li>`; });
            html += `</ul>`;
        }

        if (data.preferredSkills && data.preferredSkills.length > 0) {
            html += `<h5>Preferred Skills:</h5><ul>`;
            data.preferredSkills.forEach(item => { html += `<li>${item}</li>`; });
            html += `</ul>`;
        }

        if (data.standOutFactors) {
            html += `<h5>How to Stand Out:</h5><p><em>${data.standOutFactors}</em></p>`;
        }

        analysisResultDiv.innerHTML = html;
    }


    // --- Event Listener for the "Analyze Job" button ---
    analyzeJobBtn.addEventListener('click', async () => {
        const jobUrl = jobUrlInput.value.trim();
        if (!jobUrl) {
            alert('Please enter a job listing URL.');
            return;
        }

        // Show spinner and clear previous results
        analysisSpinner.style.display = 'block';
        analysisResultDiv.innerHTML = '';

        try {
            const response = await fetch(BACKEND_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url: jobUrl }),
            });

            const analysisData = await response.json();

            if (!response.ok) {
                // Handle HTTP errors like 500 Internal Server Error
                throw new Error(analysisData.error || `HTTP error! Status: ${response.status}`);
            }

            // Render the successful analysis
            renderAnalysis(analysisData);

        } catch (error) {
            console.error("Error analyzing job:", error);
            renderAnalysis({ error: error.message });
        } finally {
            // Hide spinner regardless of outcome
            analysisSpinner.style.display = 'none';
        }
    });

    // --- Get references to static input elements ---
    const fullNameInput = document.getElementById('fullName');
    const emailInput = document.getElementById('email');
    const phoneInput = document.getElementById('phone');
    const residenceInput = document.getElementById('residence');
    const summaryInput = document.getElementById('summary');
    const skillsInput = document.getElementById('skills'); // Textarea for skills

    // --- Get references to list container divs ---
    const workListDiv = document.getElementById('workExperienceList');
    const eduListDiv = document.getElementById('educationList');
    const linksListDiv = document.getElementById('linksList');
    const certsListDiv = document.getElementById('certsList');
    const referencesListDiv = document.getElementById('referencesList');

    // --- Get references to "Add" buttons ---
    const addWorkExpBtn = document.getElementById('addWorkExp');
    const addEducationBtn = document.getElementById('addEducation');
    const addLinkBtn = document.getElementById('addLink');
    const addCertBtn = document.getElementById('addCert');
    const addReferenceBtn = document.getElementById('addReference');

    // --- Get references to action buttons and status area ---
    const saveButton = document.getElementById('save');
    const fillButton = document.getElementById('fill');
    const statusDiv = document.getElementById('status');

    // --- Data Structure Key in chrome.storage.local ---
    const STORAGE_KEY = 'userDataAdvanced'; // Ensure this matches content_script

    // --- Helper Functions for Dynamic Lists ---

    /**
     * Creates and appends a list item container with specified fields.
     * @param {HTMLElement} container - The parent div to append the item to.
     * @param {Array<object>} fieldsConfig - Configuration for each input field [{name, label, type?, placeholder?, rows?}].
     * @param {object} data - Optional initial data to populate the fields.
     */
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
                input.rows = field.rows || 2; // Default rows
            } else {
                input = document.createElement('input');
                input.type = field.type || 'text';
            }
            input.name = field.name; // Crucial for retrieving data later
            input.placeholder = field.placeholder || '';
            input.value = data[field.name] || ''; // Populate with initial data if provided
            input.className = 'list-item-input'; // Add class for potential styling
            itemDiv.appendChild(input);
            // itemDiv.appendChild(document.createElement('br')); // Use CSS margin instead
        });

        const removeBtn = document.createElement('button');
        removeBtn.textContent = 'X';
        removeBtn.title = 'Remove item'; // Tooltip
        removeBtn.className = 'remove-item-btn';
        removeBtn.type = 'button'; // Prevent form submission if ever wrapped in a form
        removeBtn.onclick = () => itemDiv.remove(); // Remove the item div when clicked
        itemDiv.appendChild(removeBtn);

        container.appendChild(itemDiv);
    }

    // --- Configuration and Add Functions for Each List Type ---

    const workFieldsConfig = [
        { name: 'companyName', label: 'Company Name', placeholder: 'Acme Corp' },
        { name: 'role', label: 'Role/Title', placeholder: 'Software Engineer' },
        { name: 'duration', label: 'Duration', placeholder: 'e.g., Jan 2020 - Dec 2022 or 2 years' },
        { name: 'description', label: 'Description/Achievements (Optional)', type: 'textarea', rows: 3}
    ];
    function addWorkItem(data = {}) { createListItem(workListDiv, workFieldsConfig, data); }

    const eduFieldsConfig = [
        { name: 'institution', label: 'Institution', placeholder: 'University of Example' },
        { name: 'major', label: 'Major/Degree', placeholder: 'B.Sc. Computer Science' },
        { name: 'duration', label: 'Duration/Dates', placeholder: 'e.g., Sep 2016 - May 2020 or Graduated 2020' }
    ];
    function addEducationItem(data = {}) { createListItem(eduListDiv, eduFieldsConfig, data); }

    const linkFieldsConfig = [
        { name: 'linkName', label: 'Link Name (e.g., Portfolio)', placeholder: 'LinkedIn Profile' },
        { name: 'linkUrl', label: 'URL', type:'url', placeholder: 'https://...' }
    ];
    function addLinkItem(data = {}) { createListItem(linksListDiv, linkFieldsConfig, data); }

    const certFieldsConfig = [
        { name: 'certName', label: 'Certificate/License Name', placeholder: 'AWS Certified Developer - Associate' },
        { name: 'issuer', label: 'Issuing Body (Optional)', placeholder: 'Amazon Web Services' },
        { name: 'dateIssued', label: 'Date Issued/Expires (Optional)', type:'text', placeholder: 'e.g., Issued: Apr 2021' }
    ];
    function addCertItem(data = {}) { createListItem(certsListDiv, certFieldsConfig, data); }

    const refFieldsConfig = [
        { name: 'refName', label: 'Reference Name' },
        { name: 'refTitle', label: 'Title/Relationship' },
        { name: 'refCompany', label: 'Company (Optional)'},
        { name: 'refEmail', label: 'Email', type:'email'},
        { name: 'refPhone', label: 'Phone (Optional)', type:'tel'}
    ];
    function addReferenceItem(data = {}) { createListItem(referencesListDiv, refFieldsConfig, data); }


    /**
     * Collects data from all input/textarea elements within a list container.
     * @param {HTMLElement} container - The parent div containing .list-item elements.
     * @returns {Array<object>} An array of objects, each representing an item's data.
     */
    function collectListData(container) {
        const items = [];
        container.querySelectorAll('.list-item').forEach(itemDiv => {
            const itemData = {};
            let hasValue = false;
            itemDiv.querySelectorAll('input, textarea').forEach(input => {
                if (input.name) { // Only collect if input has a name attribute
                    const value = input.value.trim();
                    itemData[input.name] = value;
                    if (value !== '') {
                        hasValue = true;
                    }
                }
            });
             // Only add if item has at least one non-empty field
             if (hasValue) {
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
    function loadData() {
        chrome.storage.local.get([STORAGE_KEY], (result) => {
            const data = result[STORAGE_KEY];
            if (data) {
                console.log('Loaded data:', data);
                // Populate basic fields
                fullNameInput.value = data.fullName || '';
                emailInput.value = data.email || '';
                phoneInput.value = data.phone || '';
                residenceInput.value = data.residence || '';
                summaryInput.value = data.summary || '';
                // Load skills (comma-separated string for display)
                skillsInput.value = (data.skills || []).join(', ');

                // Clear existing list items before loading saved ones
                workListDiv.innerHTML = '';
                eduListDiv.innerHTML = '';
                linksListDiv.innerHTML = '';
                certsListDiv.innerHTML = '';
                referencesListDiv.innerHTML = '';

                // Re-create list items from saved data
                (data.workExperience || []).forEach(item => addWorkItem(item));
                (data.education || []).forEach(item => addEducationItem(item));
                (data.links || []).forEach(item => addLinkItem(item));
                (data.certifications || []).forEach(item => addCertItem(item));
                (data.references || []).forEach(item => addReferenceItem(item));

            } else {
                console.log('No saved data found for key:', STORAGE_KEY);
                // Optionally add one empty item to key lists to guide the user if no data exists
                addWorkItem();
                addEducationItem();
                addLinkItem();
            }
        });
    }
    loadData(); // Load data immediately when the popup opens

    // --- Save data when "Save" button is clicked ---
    saveButton.addEventListener('click', () => {
        statusDiv.textContent = 'Saving...'; // Provide immediate feedback

        const userData = {
            // Basic fields
            fullName: fullNameInput.value.trim(),
            email: emailInput.value.trim(),
            phone: phoneInput.value.trim(),
            residence: residenceInput.value.trim(),
            summary: summaryInput.value.trim(),
            // Parse comma-separated skills into an array
            skills: skillsInput.value.split(',').map(s => s.trim()).filter(s => s),

            // Collect data from dynamic lists
            workExperience: collectListData(workListDiv),
            education: collectListData(eduListDiv),
            links: collectListData(linksListDiv),
            certifications: collectListData(certsListDiv),
            references: collectListData(referencesListDiv)
        };

        chrome.storage.local.set({ [STORAGE_KEY]: userData }, () => {
            // Check for potential errors during save
            if (chrome.runtime.lastError) {
                console.error("Error saving data:", chrome.runtime.lastError);
                statusDiv.textContent = 'Error saving data!';
            } else {
                console.log('Data saved:', userData);
                statusDiv.textContent = 'Details Saved!';
            }
            // Clear the status message after a few seconds
            setTimeout(() => { statusDiv.textContent = ''; }, 3000);
        });
    });

    // --- Trigger content script when "Fill Form" is clicked ---
    fillButton.addEventListener('click', async () => {
        statusDiv.textContent = 'Attempting to fill form...';
        let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        if (tab && tab.id) {
            // Ensure content_script.js is specified if not using programmatic injection function
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ['content_script.js'] // Execute the content script file
            }, (injectionResults) => {
                // Check for errors after execution attempt
                 if (chrome.runtime.lastError) {
                    console.error("Script execution failed:", chrome.runtime.lastError);
                    statusDiv.textContent = 'Error filling form.';
                 } else {
                    console.log("Content script executed.");
                    // Note: Feedback ("X fields filled") should come FROM the content script via alert/console
                    statusDiv.textContent = ''; // Clear "Attempting..." message
                    // window.close(); // Optional: Close popup after clicking fill
                 }
                 // Clear status message if it was an error message
                 setTimeout(() => { if(statusDiv.textContent.startsWith('Error')) statusDiv.textContent = ''; }, 4000);
            });
        } else {
            console.error("Could not get active tab ID.");
            statusDiv.textContent = 'Could not access active tab.';
            setTimeout(() => { statusDiv.textContent = ''; }, 4000);
        }
    });
});