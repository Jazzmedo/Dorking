document.addEventListener('DOMContentLoaded', () => {
    // Initialize theme
    const body = document.body;
    const themeToggle = document.getElementById('themeToggle');
    const sunPath = themeToggle.querySelector('.sun');
    const moonPath = themeToggle.querySelector('.moon');

    // Load saved theme and last query
    chrome.storage.local.get(['darkMode', 'lastDorks', 'lastQuery'], (result) => {
        if (result.darkMode) {
            body.classList.add('dark');
            sunPath.classList.remove('hidden');
            moonPath.classList.add('hidden');
        }

        // Load last used dorks
        if (result.lastDorks && Array.isArray(result.lastDorks)) {
            result.lastDorks.forEach(dork => {
                activeDorks.push(dork);
                addDorkToList(dork);
            });
            updateFinalQuery();
        }

        // Restore last query if exists
        if (result.lastQuery) {
            finalQuery.value = result.lastQuery;
            finalQuery.innerHTML = result.lastQuery;
        }
    });

    // Theme toggle functionality
    themeToggle.addEventListener('click', () => {
        body.classList.toggle('dark');
        const isDark = body.classList.contains('dark');
        chrome.storage.local.set({ darkMode: isDark });
        sunPath.classList.toggle('hidden');
        moonPath.classList.toggle('hidden');
    });

    // Active dorks management
    const activeDorks = [];
    const activeDorksContainer = document.getElementById('activeDorks');
    const dorkValue = document.getElementById('dorkValue');
    const finalQuery = document.getElementById('finalQuery');
    const dorkOperator = document.getElementById('dorkOperator');

    // Save query when it changes
    finalQuery.addEventListener('input', () => {
        chrome.storage.local.set({ lastQuery: finalQuery.value });
    });

    function getDorkColorClass(operator) {
        const colorMap = {
            'site:': 'dork-site',
            'inurl:': 'dork-inurl',
            'intitle:': 'dork-intitle',
            'filetype:': 'dork-filetype',
            'intext:': 'dork-intext',
            'cache:': 'dork-cache',
            'related:': 'dork-related',
            'link:': 'dork-link',
            'before:': 'dork-date',
            'after:': 'dork-date',
            'allintext:': 'dork-intext',
            'allinurl:': 'dork-inurl',
            'allintitle:': 'dork-intitle',
            'define:': 'dork-define',
            'ext:': 'dork-filetype',
            'info:': 'dork-info'
        };
        return colorMap[operator] || '';
    }

    function updateFinalQuery() {
        // Create a container for the colored dorks
        const coloredDorks = activeDorks.map(dork => {
            let colorClass = '';
            let operator = '';
            let value = dork;

            // Extract operator and value
            const operatorMatch = dork.match(/^([^:]+:)?/);
            if (operatorMatch && operatorMatch[1]) {
                operator = operatorMatch[1];
                value = dork.slice(operator.length);
                colorClass = getDorkColorClass(operator);
            }

            // Return the dork with operator and value separately colored
            return operator ? 
                `<span class="${colorClass}">${operator}</span><span class="${colorClass}">${value}</span>` : 
                `<span>${dork}</span>`;
        });

        // Set the HTML content and plain text value
        finalQuery.innerHTML = coloredDorks.join(' ');
        finalQuery.value = activeDorks.join(' ');
        // Save current dorks and query to storage
        chrome.storage.local.set({ 
            lastDorks: activeDorks,
            lastQuery: finalQuery.value
        });
    }

    function addDorkToList(dork) {
        const dorkElement = document.createElement('div');
        dorkElement.className = 'flex justify-between items-center p-2 bg-gray-100 dark:bg-gray-700 rounded';
        
        const dorkText = document.createElement('span');
        // Extract operator and apply color class
        const operatorMatch = dork.match(/^([^:]+:)?/);
        if (operatorMatch && operatorMatch[1]) {
            dorkText.className = getDorkColorClass(operatorMatch[1]);
        }
        dorkText.textContent = dork;
        dorkElement.appendChild(dorkText);

        const removeButton = document.createElement('button');
        removeButton.className = 'text-red-500 hover:text-red-700';
        removeButton.innerHTML = '×';
        removeButton.onclick = () => {
            const index = activeDorks.indexOf(dork);
            if (index > -1) {
                activeDorks.splice(index, 1);
                activeDorksContainer.removeChild(dorkElement);
                updateFinalQuery();
            }
        };
        dorkElement.appendChild(removeButton);

        activeDorksContainer.appendChild(dorkElement);
    }

    // Add dork button functionality
    document.getElementById('addDork').addEventListener('click', () => {
        const operator = dorkOperator.value;
        const value = dorkValue.value.trim();

        if (!operator || !value) return;

        let dorkString;
        if (operator === '""') {
            dorkString = `"${value}"`;
        } else if (operator === '..') {
            const [start, end] = value.split(',').map(v => v.trim());
            dorkString = start && end ? `${start}..${end}` : value;
        } else {
            dorkString = operator + value;
        }

        activeDorks.push(dorkString);
        addDorkToList(dorkString);
        updateFinalQuery();

        // Reset inputs
        dorkOperator.value = '';
        dorkValue.value = '';
    });

    // Clear all dorks
    document.getElementById('clearDorks').addEventListener('click', () => {
        activeDorks.length = 0;
        activeDorksContainer.innerHTML = '';
        updateFinalQuery();
    });

    // Copy query button
    document.getElementById('copyQuery').addEventListener('click', () => {
        finalQuery.select();
        document.execCommand('copy');
    });

    // Search on Google button
    document.getElementById('searchGoogle').addEventListener('click', () => {
        const query = encodeURIComponent(finalQuery.value);
        chrome.tabs.create({ url: `https://www.google.com/search?q=${query}` });
    });
});