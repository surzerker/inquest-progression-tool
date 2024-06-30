// ==UserScript==
// @name        Inquest Progression Tool
// @namespace    http://tampermonkey.net/
// @version      0.4
// @description  Manage and progress through tournament rounds with visual columns and dynamic interaction
// @author       Surzerker (S2)
// @match        https://*.racewarkingdoms.com/inquest.htm
// @icon         https://www.google.com/s2/favicons?sz=64&domain=racewarkingdoms.com
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    let roundContainers = [];

    function setupMatches() {
        const bElements = document.querySelectorAll('b');
        const matches = [];
        // Hide the original list by targeting the container most likely to be the parent
        if (bElements.length > 0) {
            bElements[0].parentNode.style.display = 'none';
        }

        bElements.forEach(b => {
            const siblingText = b.nextSibling;
            if (siblingText && siblingText.nodeType === Node.TEXT_NODE && siblingText.textContent.trim().includes('vs.')) {
                const nextB = siblingText.nextSibling;
                if (nextB && nextB.tagName === 'B') {
                    matches.push([b.textContent.trim(), nextB.textContent.trim()]);
                }
            }
        });

        const tournamentContainer = document.createElement('div');
        tournamentContainer.style.display = 'flex';
        document.body.insertBefore(tournamentContainer, document.body.firstChild);

        // Create round containers dynamically based on the number of matches
        let numRounds = Math.ceil(Math.log2(matches.length)) + 1;
        for (let i = 0; i < numRounds; i++) {
            const roundContainer = document.createElement('div');
            roundContainer.className = 'round-container';
            roundContainer.style.marginLeft = '20px';
            tournamentContainer.appendChild(roundContainer);
            roundContainers.push(roundContainer);
            if (i > 0) { // Only add pending matches to future rounds initially
                for (let j = 0; j < Math.pow(2, numRounds - i - 1); j++) {
                    const matchDiv = document.createElement('div');
                    matchDiv.textContent = "Pending Match";
                    roundContainer.appendChild(matchDiv);
                }
            }
        }

        // Initialize the first round matches
        initializeMatches(matches);
    }

    function initializeMatches(matches) {
        matches.forEach((match, index) => {
            const matchDiv = document.createElement('div');
            const leftCheckbox = document.createElement('input');
            const rightCheckbox = document.createElement('input');
            leftCheckbox.type = 'checkbox';
            rightCheckbox.type = 'checkbox';

            matchDiv.appendChild(leftCheckbox);
            matchDiv.appendChild(document.createTextNode(`${match[0]} vs. ${match[1]}`));
            matchDiv.appendChild(rightCheckbox);
            roundContainers[0].appendChild(matchDiv);

            leftCheckbox.addEventListener('change', () => handleSelection(leftCheckbox, rightCheckbox, match[0], index, 0));
            rightCheckbox.addEventListener('change', () => handleSelection(rightCheckbox, leftCheckbox, match[1], index, 0));
        });
    }

    function handleSelection(selectedCheckbox, otherCheckbox, selectedName, matchIndex, roundIndex) {
        if (selectedCheckbox.checked) {
            otherCheckbox.checked = false;
            const nextRoundIndex = roundIndex + 1;
            const nextMatchIndex = Math.floor(matchIndex / 2);
            const nextMatchDiv = roundContainers[nextRoundIndex].children[nextMatchIndex];
            updateNextRoundMatch(nextMatchDiv, selectedName, matchIndex % 2 === 0);
        }
    }

    function updateNextRoundMatch(matchDiv, selectedName, isLeft) {
        if (!matchDiv.textContent.includes("vs.")) { // Not yet initialized
            matchDiv.textContent = isLeft ? `${selectedName} vs. ` : ` vs. ${selectedName}`;
            const leftCheckbox = document.createElement('input');
            leftCheckbox.type = 'checkbox';
            const rightCheckbox = document.createElement('input');
            rightCheckbox.type = 'checkbox';
            matchDiv.prepend(leftCheckbox);
            matchDiv.appendChild(rightCheckbox);

            leftCheckbox.addEventListener('change', () => handleFutureSelection(leftCheckbox, rightCheckbox, matchDiv, true));
            rightCheckbox.addEventListener('change', () => handleFutureSelection(rightCheckbox, leftCheckbox, matchDiv, false));
        } else { // Already initialized
            matchDiv.childNodes[1].nodeValue = isLeft ? `${selectedName} vs. ${matchDiv.textContent.split(' vs. ')[1]}` : `${matchDiv.textContent.split(' vs. ')[0]} vs. ${selectedName}`;
        }
    }

    function handleFutureSelection(selectedCheckbox, otherCheckbox, matchDiv, isLeft) {
        if (selectedCheckbox.checked) {
            otherCheckbox.checked = false;
            let selectedName = isLeft ? matchDiv.textContent.split(' vs. ')[0] : matchDiv.textContent.split(' vs. ')[1];
            const currentRoundDiv = matchDiv.parentNode;
            const nextRoundDiv = currentRoundDiv.nextSibling;
            if (!nextRoundDiv) return;

            const matchIndex = Array.from(currentRoundDiv.children).indexOf(matchDiv);
            const nextMatchDiv = nextRoundDiv.children[Math.floor(matchIndex / 2)];
            updateNextRoundMatch(nextMatchDiv, selectedName, matchIndex % 2 === 0);
        }
    }

    window.addEventListener('load', setupMatches);
})();
