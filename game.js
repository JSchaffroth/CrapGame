
/*
========================================
CRAP
Choices, Ratings, Anecdotes & Priorities
========================================
*/


// ======================================
// GAME STATE
// ======================================

const game = {

    players: [],
    currentRound: 0,
    judgeIndex: 0,
    currentResponderIndex: 0,
    totalRounds: 10,
    currentPrompt: null,
    answers: [],
    usedPrompts: [],
    selectedRating: null,
    selectedPriority: null,
    selectedJudgeAnswer: null,
    judgeAnswer: null,
    phase: "lobby"

};


// ======================================
// PROMPTS
// ======================================

const prompts = {

    choices: choicesPrompts,
    ratings: ratingsPrompts,
    anecdotes: anecdotesPrompts,
    priorities: prioritiesPrompts

};


// ======================================
// GET DOM ELEMENTS
// ======================================

const roundCountSelect =
    document.getElementById("round-count");

const lobby =
    document.getElementById("lobby");

const round =
    document.getElementById("round");

const judgeScreen =
    document.getElementById("judge-screen");

const results =
    document.getElementById("results");

const scoreboard =
    document.getElementById("scoreboard");

const answerArea =
    document.getElementById("answer-area");

const playerCountSelect =
    document.getElementById("player-count");

const playerNamesContainer =
    document.getElementById("player-names");


// ======================================
// PLAYER NAME INPUTS
// ======================================

function updatePlayerNameInputs() {

    const playerCount =
        parseInt(playerCountSelect.value);

    playerNamesContainer.innerHTML = "";

    for (let i = 0; i < playerCount; i++) {

        const input =
            document.createElement("input");

        input.type = "text";

        input.className =
            "player-name-input";

        input.placeholder =
            `Player ${i + 1} name`;

        input.maxLength = 20;

        playerNamesContainer.appendChild(
            input
        );

    }

}


// Update names whenever player count changes

playerCountSelect.addEventListener(
    "change",
    updatePlayerNameInputs
);


// Create initial name fields

updatePlayerNameInputs();


// ======================================
// START GAME
// ======================================

document
    .getElementById("start-game")
    .addEventListener(
        "click",
        startGame
    );

function startGame() {
    // Starting a new game means deleting
    // any previous saved game.
    localStorage.removeItem("crapGame");

    const playerCount =
        parseInt(playerCountSelect.value);

    const nameInputs =
        document.querySelectorAll(
            ".player-name-input"
        );

    // Create players
    game.players = [];

    for (let i = 0; i < playerCount; i++) {
        let name =
            nameInputs[i].value.trim();

        // Default name if left blank
        if (!name) {
            name =
                `Player ${i + 1}`;
        }

        game.players.push({
            id: i + 1,
            name: name,
            score: 0
        });
    }

    // Reset game state
    game.currentRound = 0;
    game.judgeIndex = 0;
    game.currentResponderIndex = 0;
    game.totalRounds =
        parseInt(roundCountSelect.value);
    game.currentPrompt = null;
    game.answers = [];
    game.usedPrompts = [];
    game.selectedRating = null;
    game.selectedPriority = null;
    game.selectedJudgeAnswer = null;
    game.judgeAnswer = null;

    // Start
    lobby.classList.add("hidden");
    round.classList.remove("hidden");

    saveGame();
    startRound();
}


// ======================================
// START ROUND
// ======================================

function startRound() {

    game.currentRound++;

    game.phase = "answering";

    game.answers = [];

    game.selectedRating = null;

    game.selectedPriority = null;

    game.selectedJudgeAnswer = null;

    game.judgeAnswer = null;


    // Get Judge
    const judge =
        game.players[game.judgeIndex];

    // First responder is the player
    // immediately after the Judge
    game.currentResponderIndex =
        (game.judgeIndex + 1)
        % game.players.length;

    // Show the round number immediately.
    // The prompt stays hidden until category selection finishes.
    document.getElementById("round-info").classList.remove("hidden");
    document.getElementById("prompt").classList.add("hidden");

    document
        .getElementById("round-number")
        .textContent = `Round ${game.currentRound}`;

    const judgeDisplay =
        document.getElementById("judge");

    judgeDisplay.textContent =
        `Judge: ${judge.name}`;

    judgeDisplay.classList.remove("hidden");



    // Find categories that still have
    // unused prompts available.

    const availableCategories =
        Object.keys(prompts).filter(
            category =>
                prompts[category].some(
                    prompt =>
                        !game.usedPrompts.includes(
                            prompt.text
                        )
                )
        );


    if (availableCategories.length === 0) {

        console.error(
            "No unused prompts remaining!"
        );

        return;

    }


    // Randomly choose the ACTUAL category
    // that this round will use.

    const selectedCategory =
        availableCategories[
            Math.floor(
                Math.random() *
                availableCategories.length
            )
        ];


    // Start the category animation.

    animateCategorySelection(
        selectedCategory,
        availableCategories,
        () => {

            // ======================================
            // ANIMATION FINISHED
            // Continue setting up the round.
            // ======================================

            finishStartingRound(
                selectedCategory,
                judge
            );

        }
    );

}


// ======================================
// CATEGORY SELECTION ANIMATION
// ======================================

function animateCategorySelection(
    selectedCategory,
    availableCategories,
    onComplete
) {

    const selection =
        document.getElementById(
            "category-selection"
        );

    const spinner =
        document.getElementById(
            "category-spinner"
        );


    selection.classList.remove("hidden");

    spinner.classList.remove(
        "category-winner"
    );


    const allCategories = [
        "choices",
        "ratings",
        "anecdotes",
        "priorities"
    ];


    let currentIndex = 0;

    let elapsed = 0;

    let delay = 70;


    function spin() {

        const category =
            allCategories[currentIndex];


        spinner.textContent =
            category.toUpperCase();


        currentIndex =
            (currentIndex + 1)
            % allCategories.length;


        elapsed += delay;


        /*
         * Slow down over time.
         */

        delay *= 1.13;


        /*
         * Don't allow the animation to
         * become ridiculously slow.
         */

        delay =
            Math.min(delay, 500);


        /*
         * Once we've spun for at least
         * 1.5 seconds, stop when the
         * selected category appears.
         */

        if (
            elapsed >= 1500 &&
            category === selectedCategory
        ) {

            spinner.textContent =
                selectedCategory.toUpperCase();


            spinner.classList.add(
                "category-winner"
            );


            setTimeout(() => {

                selection.classList.add(
                    "hidden"
                );

                spinner.classList.remove(
                    "category-winner"
                );

                onComplete();

            }, 700);


            return;

        }


        setTimeout(
            spin,
            delay
        );

    }


    spin();

}


// ======================================
// FINISH STARTING ROUND
// ======================================

function finishStartingRound(
    category,
    judge
) {

    const categoryPrompts =
        prompts[category];


    const availablePrompts =
        categoryPrompts.filter(
            prompt =>
                !game.usedPrompts.includes(
                    prompt.text
                )
        );


    /*
     * This should always contain at least
     * one prompt because we only selected
     * categories that had unused prompts.
     */

    if (availablePrompts.length === 0) {

        console.error(
            "No unused prompts available for category:",
            category
        );

        return;

    }


    const prompt =
        availablePrompts[
            Math.floor(
                Math.random() *
                availablePrompts.length
            )
        ];


    game.usedPrompts.push(
        prompt.text
    );


    // Replace {judge} with the actual Judge's name

    const formattedPrompt = {
        ...prompt,
        text: prompt.text.replace(
            /\{judge\}/gi,
            judge.name
        )
    };


    game.currentPrompt = {

        category,
        ...formattedPrompt

    };


    // ======================================
    // DISPLAY ROUND
    // ======================================

    // Show the normal round information
    // now that category selection is finished.
    document.getElementById("round-info").classList.remove("hidden");
    document.getElementById("prompt").classList.remove("hidden");

    document
        .getElementById("round-number")
        .textContent =
        `Round ${game.currentRound}`;


    updateResponderDisplay();


    document
        .getElementById("prompt")
        .textContent =
        game.currentPrompt.text;


    showAnswerInterface(
        prompt.type
    );

}


// ======================================
// UPDATE RESPONDER DISPLAY
// ======================================

function updateResponderDisplay() {

    const judge =
        game.players[game.judgeIndex];

    const responder =
        game.players[
            game.currentResponderIndex
        ];


    document
        .getElementById("judge")
        .textContent =
        `Judge: ${judge.name} | Answering: ${responder.name}`;

}


// ======================================
// ANSWER INTERFACE
// ======================================

function showAnswerInterface(type) {

    // Show answer area

    answerArea.classList.remove(
        "hidden"
    );


    // Hide all answer types

    document
        .querySelectorAll(".answer-type")
        .forEach(element => {

            element.classList.add(
                "hidden"
            );

        });


    if (type === "text") {

        document
            .getElementById("text-answer")
            .classList.remove(
                "hidden"
            );

    }


    if (type === "rating") {

        createRatingButtons();

        document
            .getElementById("rating-answer")
            .classList.remove(
                "hidden"
            );

    }


    if (type === "priority") {

        createPriorityButtons();

        document
            .getElementById("priority-answer")
            .classList.remove(
                "hidden"
            );

    }

}


// ======================================
// RATING BUTTONS
// ======================================

function createRatingButtons() {

    const container =
        document.getElementById(
            "rating-buttons"
        );


    container.innerHTML = "";


    for (let i = 1; i <= 10; i++) {

        const button =
            document.createElement(
                "button"
            );


        button.textContent = i;

        button.className =
            "rating-button";


        button.onclick = () => {

            game.selectedRating = i;


            document
                .querySelectorAll(
                    ".rating-button"
                )
                .forEach(btn => {

                    btn.classList.remove(
                        "selected"
                    );

                });


            button.classList.add(
                "selected"
            );

        };


        container.appendChild(
            button
        );

    }

}


// ======================================
// PRIORITY BUTTONS
// ======================================

function createPriorityButtons() {

    const container =
        document.getElementById(
            "priority-options"
        );


    container.innerHTML = "";


    game.currentPrompt.options
        .forEach(option => {

            const button =
                document.createElement(
                    "button"
                );


            button.textContent =
                option;


            button.className =
                "priority-option";


            button.onclick = () => {

                game.selectedPriority =
                    option;


                document
                    .querySelectorAll(
                        ".priority-option"
                    )
                    .forEach(btn => {

                        btn.classList.remove(
                            "selected"
                        );

                    });


                button.classList.add(
                    "selected"
                );

            };


            container.appendChild(
                button
            );

        });

}


// ======================================
// TEXT SUBMISSION
// ======================================

document
    .getElementById("submit-answer")
    .addEventListener(
        "click",
        () => {

            const input =
                document.getElementById(
                    "answer-input"
                );


            const answer =
                input.value.trim();


            if (!answer) {

                return;

            }


            submitAnswer(answer);

        }
    );


// ======================================
// RATING SUBMISSION
// ======================================

document
    .getElementById("submit-rating")
    .addEventListener(
        "click",
        () => {

            if (
                game.selectedRating === null
            ) {

                return;

            }


            submitAnswer(
                game.selectedRating
            );

        }
    );


// ======================================
// PRIORITY SUBMISSION
// ======================================

document
    .getElementById("submit-priority")
    .addEventListener(
        "click",
        () => {

            if (
                game.selectedPriority === null
            ) {

                return;

            }


            submitAnswer(
                game.selectedPriority
            );

        }
    );


// ======================================
// SUBMIT ANSWER
// ======================================

function submitAnswer(answer) {

    const player =
        game.players[
            game.currentResponderIndex
        ];


    game.answers.push({

        playerId: player.id,
        playerName: player.name,
        answer: answer

    });

    saveGame();

    console.log(
        `${player.name} submitted:`,
        answer
    );


    // Clear text input

    const input =
        document.getElementById(
            "answer-input"
        );


    if (input) {

        input.value = "";

    }


    // Reset selections

    game.selectedRating = null;

    game.selectedPriority = null;


    // Have all non-Judge players answered?

    const responsesNeeded =
        game.players.length - 1;


    if (
        game.answers.length >=
        responsesNeeded
    ) {

        answerArea.classList.add(
            "hidden"
        );


        showJudgeScreen();

        return;

    }


    // Move to next responder

    game.currentResponderIndex =
        (game.currentResponderIndex + 1)
        % game.players.length;


    // Skip Judge

    if (
        game.currentResponderIndex ===
        game.judgeIndex
    ) {

        game.currentResponderIndex =
            (game.currentResponderIndex + 1)
            % game.players.length;

    }


    updateResponderDisplay();


    // Show the answer interface

    showAnswerInterface(
        game.currentPrompt.type
    );

}


// ======================================
// JUDGE SCREEN
// ======================================

function showJudgeScreen() {

    game.phase = "judging";
    saveGame();

    round.classList.add("hidden");

    judgeScreen.classList.remove(
        "hidden"
    );


    document
        .getElementById("judge-prompt")
        .textContent =
        `Round ${game.currentRound}: ${game.currentPrompt.text}`;

    const container =
        document.getElementById(
            "judge-answers"
        );


    container.innerHTML = "";


    // Ratings are handled separately

    if (
        game.currentPrompt.type ===
        "rating"
    ) {

        showJudgeRating();

        return;

    }


    // ======================================
    // GROUP IDENTICAL ANSWERS
    // ======================================

    /*
     * Create groups of identical answers.
     *
     * The original game.answers array is NOT
     * modified. Each group keeps references
     * to all of the original submissions.
     *
     * Example:
     *
     * Alex  -> "Pizza"
     * Sarah -> "Pizza"
     * Mike  -> "Tacos"
     *
     * Becomes:
     *
     * "Pizza" -> [Alex, Sarah]
     * "Tacos" -> [Mike]
     */

    const answerGroups = new Map();


    game.answers.forEach(answer => {

        // Convert the answer to a string so
        // text and other answer types can be
        // compared consistently.

        const key =
            String(answer.answer).trim().toLowerCase();


        if (!answerGroups.has(key)) {

            answerGroups.set(key, []);

        }


        answerGroups
            .get(key)
            .push(answer);

    });


    // Convert groups into an array

    const groupedAnswers =
        Array.from(
            answerGroups.entries()
        ).map(
            ([answer, submissions]) => ({

                answer,
                submissions

            })
        );


    // ======================================
    // SHUFFLE GROUPS
    // ======================================

    for (
        let i = groupedAnswers.length - 1;
        i > 0;
        i--
    ) {

        const j =
            Math.floor(
                Math.random() * (i + 1)
            );


        [
            groupedAnswers[i],
            groupedAnswers[j]
        ] = [
            groupedAnswers[j],
            groupedAnswers[i]
        ];

    }


    // ======================================
    // DISPLAY GROUPED ANSWERS
    // ======================================

    groupedAnswers.forEach(
        group => {

            const button =
                document.createElement("div");


            button.className =
                "judge-answer";


            button.textContent =
                group.answer;


            button.onclick = () => {

                /*
                 * Store the entire group rather than
                 * just one answer.
                 *
                 * This lets scoreRound() award the
                 * point to every player who submitted
                 * this answer.
                 */

                game.selectedJudgeAnswer =
                    group.submissions;


                document
                    .querySelectorAll(
                        ".judge-answer"
                    )
                    .forEach(element => {

                        element.classList.remove(
                            "selected"
                        );

                    });


                button.classList.add(
                    "selected"
                );

                saveGame();

            };


            container.appendChild(
                button
            );

        }
    );

}


// ======================================
// JUDGE RATING
// ======================================

function showJudgeRating() {

    const container =
        document.getElementById(
            "judge-answers"
        );


    container.innerHTML = `
        <p>Enter your answer:</p>
        <div id="judge-rating-buttons"></div>
    `;


    const buttons =
        document.getElementById(
            "judge-rating-buttons"
        );


    for (let i = 1; i <= 10; i++) {

        const button =
            document.createElement(
                "button"
            );


        button.textContent = i;

        button.className =
            "rating-button";


        button.onclick = () => {

            game.judgeAnswer = i;


            document
                .querySelectorAll(
                    "#judge-rating-buttons button"
                )
                .forEach(btn => {

                    btn.classList.remove(
                        "selected"
                    );

                });


            button.classList.add(
                "selected"
            );

            saveGame();

        };


        buttons.appendChild(
            button
        );

    }

}


// ======================================
// JUDGE SUBMIT
// ======================================

document
    .getElementById("judge-submit")
    .addEventListener(
        "click",
        () => {

            if (
                game.currentPrompt.type !==
                "rating" &&
                game.selectedJudgeAnswer === null
            ) {

                return;

            }


            if (
                game.currentPrompt.type ===
                "rating" &&
                game.judgeAnswer === null
            ) {

                return;

            }


            scoreRound();

        }
    );


// ======================================
// SCORE ROUND
// ======================================

function scoreRound() {

    const prompt =
        game.currentPrompt;


    // Ratings

    if (
        prompt.type === "rating"
    ) {

        const judgeAnswer =
            game.judgeAnswer;


        let closestDistance =
            Infinity;


        game.answers.forEach(
            answer => {

                const distance =
                    Math.abs(
                        answer.answer -
                        judgeAnswer
                    );


                if (
                    distance <
                    closestDistance
                ) {

                    closestDistance =
                        distance;

                }

            }
        );


        game.answers.forEach(
            answer => {

                const distance =
                    Math.abs(
                        answer.answer -
                        judgeAnswer
                    );


                if (
                    distance ===
                    closestDistance
                ) {

                    const player =
                        game.players.find(
                            p =>
                                p.id ===
                                answer.playerId
                        );


                    player.score++;

                }

            }
        );

        game.phase = "results";
        saveGame();
        showResults();

        return;

    }


    // Choices / Anecdotes / Priorities

    /*
     * selectedJudgeAnswer now contains an
     * array of submissions belonging to the
     * selected answer.
     *
     * Award one point to EVERY player in
     * that group.
     */

    const winningAnswers =
        game.selectedJudgeAnswer;


    if (
        !winningAnswers ||
        winningAnswers.length === 0
    ) {

        return;

    }


    winningAnswers.forEach(
        winningAnswer => {
            const winner =
                game.players.find(
                    player =>
                        player.id ===
                        winningAnswer.playerId
                );

            if (winner) {
                winner.score++;
            }
        }
    );


    game.phase = "results";
    saveGame();
    showResults();

}


// ======================================
// RESULTS
// ======================================

function showResults() {
    judgeScreen.classList.add("hidden");

    results.classList.remove("hidden");

    const container =
        document.getElementById("results-content");

    container.innerHTML = `
        <h2>Round ${game.currentRound} Results</h2>
    `;


    // Determine winners

    const winnerIds = new Set();


    if (
        game.currentPrompt.type ===
        "rating"
    ) {

        const judgeAnswer =
            game.judgeAnswer;


        let closestDistance =
            Infinity;


        game.answers.forEach(
            answer => {

                const distance =
                    Math.abs(
                        Number(answer.answer) -
                        Number(judgeAnswer)
                    );


                if (
                    distance <
                    closestDistance
                ) {

                    closestDistance =
                        distance;

                }

            }
        );


        game.answers.forEach(
            answer => {

                const distance =
                    Math.abs(
                        Number(answer.answer) -
                        Number(judgeAnswer)
                    );


                if (
                    distance ===
                    closestDistance
                ) {

                    winnerIds.add(
                        answer.playerId
                    );

                }

            }
        );


        container.innerHTML += `
            <h3>
                Judge's answer:
                ${game.judgeAnswer}
            </h3>
        `;

    } else {

        /*
         * selectedJudgeAnswer contains every
         * player who submitted the winning answer.
         */

        const winningAnswers =
            game.selectedJudgeAnswer;


        if (
            winningAnswers &&
            winningAnswers.length > 0
        ) {

            winningAnswers.forEach(
                winningAnswer => {

                    winnerIds.add(
                        winningAnswer.playerId
                    );

                }
            );

        }

    }


    // Display answers

    game.answers.forEach(
        answer => {

            const player =
                game.players.find(
                    p =>
                        p.id ===
                        answer.playerId
                );


            const star =
                winnerIds.has(
                    answer.playerId
                )
                    ? " ⭐"
                    : "";


            container.innerHTML += `
                <p>
                    <strong>
                        ${player.name}
                    </strong>:
                    ${answer.answer}${star}
                </p>
            `;

        }
    );


    container.innerHTML += "<hr>";
    container.innerHTML += "<h3>SCOREBOARD</h3>";


    // Display scoreboard
    const sortedPlayers = [...game.players].sort(
        (a, b) => b.score - a.score
    );

    sortedPlayers.forEach(
        player => {
            const star =
                winnerIds.has(player.id)
                    ? " ⭐"
                    : "";

            container.innerHTML += `
                <p>
                    ${player.name}:
                    <strong>
                        ${player.score}
                    </strong>${star}
                </p>
            `;
        }
    );

}


// ======================================
// NEXT ROUND
// ======================================

document
    .getElementById("next-round")
    .addEventListener(
        "click",
        () => {

            results.classList.add(
                "hidden"
            );


            // Rotate Judge

            game.judgeIndex =
                (game.judgeIndex + 1)
                % game.players.length;

            saveGame();

            // End game

            if (
                game.currentRound >=
                game.totalRounds
            ) {

                showFinalScores();

                return;

            }


            round.classList.remove(
                "hidden"
            );


            startRound();

        }
    );


// ======================================
// FINAL SCORES
// ======================================

function showFinalScores() {

    round.classList.add("hidden");

    results.classList.add("hidden");

    scoreboard.classList.remove("hidden");


    const container =
        document.getElementById("scores");


    container.innerHTML = "";


    const sortedPlayers =
        [...game.players].sort(
            (a, b) =>
                b.score - a.score
        );


    const winningScore =
        sortedPlayers[0].score;


    sortedPlayers.forEach(
        player => {

            const isWinner =
                player.score === winningScore;


            const row =
                document.createElement("div");


            row.className =
                "score-row";


            row.innerHTML = `
                <span>
                    ${isWinner ? "⭐ " : ""}
                    ${player.name}
                    ${isWinner ? " ⭐" : ""}
                </span>

                <strong>
                    ${player.score}
                </strong>
            `;


            container.appendChild(row);

        }
    );

}


document
    .getElementById("return-to-menu")
    .addEventListener(
        "click",
        returnToMenu
    );


function returnToMenu() {

    localStorage.removeItem("crapGame");

    // Hide every game screen

    round.classList.add("hidden");

    judgeScreen.classList.add("hidden");

    results.classList.add("hidden");

    scoreboard.classList.add("hidden");


    // Show the lobby

    lobby.classList.remove("hidden");


    // Reset the game state

    game.players = [];

    game.currentRound = 0;

    game.judgeIndex = 0;

    game.currentResponderIndex = 0;

    game.currentPrompt = null;

    game.answers = [];

    game.usedPrompts = [];

    game.selectedRating = null;

    game.selectedPriority = null;

    game.selectedJudgeAnswer = null;

    game.judgeAnswer = null;

}


// ======================================
// SAVE GAME
// ======================================

function saveGame() {

    localStorage.setItem(
        "crapGame",
        JSON.stringify(game)
    );

    updateContinueButton();
}


// ======================================
// LOAD GAME
// ======================================

function loadGame() {

    const savedGame =
        localStorage.getItem("crapGame");

    if (!savedGame) {
        return false;
    }

    try {

        Object.assign(
            game,
            JSON.parse(savedGame)
        );

        return true;

    } catch (error) {

        console.error(
            "Could not load saved game:",
            error
        );

        localStorage.removeItem("crapGame");

        return false;
    }
}


// ======================================
// CONTINUE GAME BUTTON
// ======================================

const continueGameButton =
    document.getElementById(
        "continue-game"
    );

continueGameButton.addEventListener(
    "click",
    continueGame
);


function continueGame() {
    if (!loadGame()) {
        return;
    }

    lobby.classList.add("hidden");

    // ======================================
    // RESUME ANSWERING
    // ======================================

    if (
        game.phase === "answering" &&
        game.currentPrompt
    ) {
        round.classList.remove("hidden");
        judgeScreen.classList.add("hidden");
        results.classList.add("hidden");
        scoreboard.classList.add("hidden");

        document
            .getElementById("round-info")
            .classList.remove("hidden");

        document
            .getElementById("prompt")
            .classList.remove("hidden");

        document
            .getElementById("judge")
            .classList.remove("hidden");

        document
            .getElementById("round-number")
            .textContent =
            `Round ${game.currentRound}`;

        document
            .getElementById("prompt")
            .textContent =
            game.currentPrompt.text;

        updateResponderDisplay();

        showAnswerInterface(
            game.currentPrompt.type
        );

        return;
    }

    // ======================================
    // RESUME JUDGING
    // ======================================

    if (
        game.phase === "judging" &&
        game.currentPrompt
    ) {
        round.classList.add("hidden");
        results.classList.add("hidden");
        scoreboard.classList.add("hidden");

        judgeScreen.classList.remove("hidden");

        showJudgeScreen();

        return;
    }

    // ======================================
    // RESUME RESULTS
    // ======================================

    if (
        game.phase === "results" &&
        game.currentPrompt
    ) {
        round.classList.add("hidden");
        judgeScreen.classList.add("hidden");
        scoreboard.classList.add("hidden");

        results.classList.remove("hidden");

        showResults();

        return;
    }

    // ======================================
    // RESUME FINAL SCOREBOARD
    // ======================================

    if (
        game.currentRound >=
        game.totalRounds
    ) {
        showFinalScores();
        return;
    }

    console.error(
        "Saved game could not be resumed."
    );
}


// ======================================
// CONTINUE BUTTON VISIBILITY
// ======================================

function updateContinueButton() {

    const savedGame =
        localStorage.getItem("crapGame");

    if (savedGame) {
        continueGameButton.classList.remove(
            "hidden"
        );
    } else {
        continueGameButton.classList.add(
            "hidden"
        );
    }
}


// ======================================
// CHECK FOR SAVED GAME ON PAGE LOAD
// ======================================

updateContinueButton();
