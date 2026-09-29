let questions = [];
let currentQuestionIndex = 0;
let score = 0;

const questionEl = document.getElementById("question-text");
const optionsEl = document.getElementById("options-container");
const nextBtn = document.getElementById("next-btn");
const progressEl = document.getElementById("progress");
const scoreLiveEl = document.getElementById("score-live");
const quizBody = document.getElementById("quiz-body");
const resultsScreen = document.getElementById("results-screen");

// Cargar preguntas desde el JSON
fetch("questions.json")
    .then(res => res.json())
    .then(data => {
        questions = data;
        startQuiz();
    })
    .catch(err => {
        questionEl.innerText = "Error al cargar las preguntas.";
        console.error(err);
    });

function startQuiz() {
    currentQuestionIndex = 0;
    score = 0;
    showQuestion();
}

function showQuestion() {
    resetState();
    const q = questions[currentQuestionIndex];
    
    progressEl.innerText = `Pregunta ${currentQuestionIndex + 1} de ${questions.length}`;
    questionEl.innerText = q.question;

    q.options.forEach((opt, index) => {
        const btn = document.createElement("button");
        btn.innerText = opt;
        btn.classList.add("option-btn");
        btn.addEventListener("click", () => selectOption(btn, index));
        optionsEl.appendChild(btn);
    });
}

function resetState() {
    nextBtn.style.display = "none";
    optionsEl.innerHTML = "";
}

function selectOption(selectedBtn, selectedIndex) {
    const q = questions[currentQuestionIndex];
    const buttons = optionsEl.querySelectorAll(".option-btn");

    buttons.forEach((btn, idx) => {
        btn.disabled = true;
        if (idx === q.answer) {
            btn.classList.add("correct");
        }
    });

    if (selectedIndex === q.answer) {
        score++;
        scoreLiveEl.innerText = `Puntuación: ${score}`;
    } else {
        selectedBtn.classList.add("incorrect");
    }

    if (currentQuestionIndex < questions.length - 1) {
        nextBtn.style.display = "block";
    } else {
        setTimeout(showResults, 1500);
    }
}

nextBtn.addEventListener("click", () => {
    currentQuestionIndex++;
    showQuestion();
});

function showResults() {
    quizBody.style.display = "none";
    resultsScreen.style.display = "block";
    
    const percentage = Math.round((score / questions.length) * 100);
    const finalScoreEl = document.getElementById("final-score");
    const statusMsg = document.getElementById("status-message");

    finalScoreEl.innerText = `${score} / ${questions.length} (${percentage}%)`;

    if (percentage >= 70) {
        statusMsg.innerText = "¡APROBADO! Tienes buen dominio de la arquitectura VCF.";
        statusMsg.style.color = "#16a34a";
    } else {
        statusMsg.innerText = "NO APROBADO. Revisa la documentación de VCF e inténtalo de nuevo.";
        statusMsg.style.color = "#dc2626";
    }
}
