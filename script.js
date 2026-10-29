// Variables Globales
let currentQuestions = [];
let userAnswers = {};
let checkedAnswers = {}; // Controla si la pregunta ya fue comprobada
let currentQuestionIndex = 0;
let isEvaluated = false;

// Función Algoritmo Fisher-Yates para desordenar
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

document.addEventListener('DOMContentLoaded', () => {
  const btnArchitecture = document.getElementById('btn-architecture');
  if (btnArchitecture) {
    btnArchitecture.addEventListener('click', (e) => {
      e.preventDefault();
      selectExam('architecture-questions.json', 'VMware Cloud Foundation - Architecture');
    });
  }
});

// Cargar examen JSON
async function selectExam(jsonFile, examTitle) {
  const selectorScreen = document.getElementById('exam-selector-screen');
  const quizScreen = document.getElementById('quiz-screen');
  if (selectorScreen) selectorScreen.style.display = 'none';
  if (quizScreen) quizScreen.style.display = 'flex';

  const resultsContainer = document.getElementById('results-summary');
  if (resultsContainer) resultsContainer.style.display = 'none';

  isEvaluated = false;
  userAnswers = {};
  checkedAnswers = {};
  currentQuestionIndex = 0;

  try {
    const response = await fetch(jsonFile);
    if (!response.ok) throw new Error(`Error al cargar ${jsonFile}`);
    
    const allQuestions = await response.json();
    currentQuestions = shuffleArray(allQuestions).slice(0, 60);

    updateProgressBar();
    renderSidebarList();
    renderActiveQuestion();

  } catch (error) {
    console.error(error);
    alert(`No se pudo cargar el archivo ${jsonFile}`);
    goBackToMenu();
  }
}

// Renderizar la lista lateral de preguntas
function renderSidebarList() {
  const sidebarNav = document.getElementById('sidebar-questions-list');
  if (!sidebarNav) return;
  sidebarNav.innerHTML = '';

  currentQuestions.forEach((q, index) => {
    const item = document.createElement('div');
    item.className = `nav-q-item ${index === currentQuestionIndex ? 'active' : ''}`;
    item.onclick = () => jumpToQuestion(index);

    let statusHTML = '';
    if (checkedAnswers[index] || isEvaluated) {
      const isCorrect = checkAnswerCorrectness(index);
      if (isCorrect) {
        statusHTML = `<span class="status-badge-correct">Correct</span>`;
      } else {
        statusHTML = `<span class="status-badge-incorrect">Incorrect</span>`;
      }
    }

    item.innerHTML = `
      <div class="nav-q-header">
        <span>🔖 Question ${index + 1}</span>
        ${statusHTML}
      </div>
      <div class="nav-q-preview">${q.question}</div>
    `;

    sidebarNav.appendChild(item);
  });
}

// Renderizar la pregunta activa actual en el panel principal
function renderActiveQuestion() {
  const container = document.getElementById('active-question-container');
  const q = currentQuestions[currentQuestionIndex];
  if (!q) return;

  const isMulti = Array.isArray(q.answer);
  const inputType = isMulti ? 'checkbox' : 'radio';
  const isCheckedThisQ = checkedAnswers[currentQuestionIndex] === true;

  let optionsHTML = '';
  q.options.forEach((opt, oIndex) => {
    const isSelected = isOptionSelected(currentQuestionIndex, oIndex, isMulti);
    
    let evalStyle = '';
    if (isCheckedThisQ || isEvaluated) {
      const isCorrectOpt = isMulti ? q.answer.includes(oIndex) : q.answer === oIndex;
      if (isCorrectOpt) {
        evalStyle = 'border-color: #16a34a; background-color: #f0fdf4;';
      } else if (isSelected) {
        evalStyle = 'border-color: #dc2626; background-color: #fef2f2;';
      }
    }

    optionsHTML += `
      <label class="option-card ${isSelected ? 'selected' : ''}" style="${evalStyle}">
        <input type="${inputType}" 
               class="custom-input" 
               name="q_option" 
               value="${oIndex}" 
               ${isSelected ? 'checked' : ''} 
               ${isCheckedThisQ || isEvaluated ? 'disabled' : ''} 
               onclick="handleOptionSelect(${oIndex}, ${isMulti})">
        <span class="option-text">${opt}</span>
      </label>
    `;
  });

  let feedbackHTML = '';
  if (isCheckedThisQ || isEvaluated) {
    const isCorrect = checkAnswerCorrectness(currentQuestionIndex);
    feedbackHTML = `
      <div class="feedback-banner ${isCorrect ? 'banner-correct' : 'banner-incorrect'}">
        <strong>${isCorrect ? 'Correct answer.' : 'Incorrect answer. Review the explanation and resources to learn more.'}</strong>
      </div>
    `;
  }

  container.innerHTML = `
    ${feedbackHTML}
    <div class="q-number-title">
      🔖 Question ${currentQuestionIndex + 1}:
    </div>
    <div class="q-text">${q.question}</div>
    <div class="q-subtext">${isMulti ? 'Select all that apply.' : 'Select the best response.'}</div>
    <div class="options-list">
      ${optionsHTML}
    </div>
  `;

  updateFooterButtonState();
  renderSidebarList();
}

// Control dinámico del botón inferior derecho con verificación robusta
function updateFooterButtonState() {
  const btnNext = document.getElementById('btn-next-q');
  if (!btnNext) return;

  const userAns = userAnswers[currentQuestionIndex];
  
  // Validar si existe respuesta seleccionada (sea número o array con elementos)
  const hasSelected = userAns !== undefined && userAns !== null && (
    Array.isArray(userAns) ? userAns.length > 0 : true
  );
  
  const isCheckedThisQ = checkedAnswers[currentQuestionIndex] === true;

  if (isCheckedThisQ || isEvaluated) {
    const isLast = currentQuestionIndex === currentQuestions.length - 1;
    btnNext.textContent = isLast ? 'Finish test ›' : 'Next question ›';
    btnNext.className = 'btn-nav-purple active-btn';
    btnNext.onclick = () => navigateQuestion(1);
  } else if (hasSelected) {
    btnNext.textContent = 'Check answer ›';
    btnNext.className = 'btn-nav-purple active-btn';
    btnNext.onclick = () => checkCurrentAnswer();
  } else {
    btnNext.textContent = 'Skip question ›';
    btnNext.className = 'btn-nav-purple';
    btnNext.onclick = () => navigateQuestion(1);
  }
}

// Acción al hacer clic en "Check answer"
function checkCurrentAnswer() {
  checkedAnswers[currentQuestionIndex] = true;
  updateProgressBar();
  renderActiveQuestion();
}

// Manejar selección asegurando conversión limpia a enteros
function handleOptionSelect(optionIndex, isMulti) {
  if (checkedAnswers[currentQuestionIndex] || isEvaluated) return;

  const numericIndex = parseInt(optionIndex, 10);

  if (isMulti) {
    if (!Array.isArray(userAnswers[currentQuestionIndex])) {
      userAnswers[currentQuestionIndex] = [];
    }
    const indexInArr = userAnswers[currentQuestionIndex].indexOf(numericIndex);
    
    if (indexInArr > -1) {
      userAnswers[currentQuestionIndex].splice(indexInArr, 1);
    } else {
      userAnswers[currentQuestionIndex].push(numericIndex);
    }
  } else {
    userAnswers[currentQuestionIndex] = numericIndex;
  }

  updateProgressBar();

  // Actualizar estilos de las tarjetas de opción en tiempo real
  const optionCards = document.querySelectorAll('.option-card');
  optionCards.forEach((card, idx) => {
    const input = card.querySelector('input');
    if (input) {
      if (isOptionSelected(currentQuestionIndex, idx, isMulti)) {
        card.classList.add('selected');
        input.checked = true;
      } else {
        card.classList.remove('selected');
        input.checked = false;
      }
    }
  });

  updateFooterButtonState();
}

// Comprobar si una opción está seleccionada
function isOptionSelected(qIndex, oIndex, isMulti) {
  const ans = userAnswers[qIndex];
  if (ans === undefined || ans === null) return false;
  if (isMulti) return Array.isArray(ans) && ans.includes(oIndex);
  return Number(ans) === Number(oIndex);
}

// Navegar entre preguntas
function navigateQuestion(direction) {
  const newIndex = currentQuestionIndex + direction;
  if (newIndex >= 0 && newIndex < currentQuestions.length) {
    currentQuestionIndex = newIndex;
    renderActiveQuestion();
  } else if (newIndex >= currentQuestions.length && !isEvaluated) {
    evaluateExam();
  }
}

function jumpToQuestion(index) {
  currentQuestionIndex = index;
  renderActiveQuestion();
}

// Actualizar barra de progreso
function updateProgressBar() {
  const answeredCount = Object.keys(checkedAnswers).length;
  const total = currentQuestions.length;
  const ratioText = document.getElementById('progress-ratio-text');
  const barFill = document.getElementById('progress-bar-fill');

  if (ratioText) ratioText.textContent = `${answeredCount}/${total}`;
  const percentage = total > 0 ? (answeredCount / total) * 100 : 0;
  if (barFill) barFill.style.width = `${percentage}%`;
}

// Evaluar exactitud de respuesta
function checkAnswerCorrectness(qIndex) {
  const userAns = userAnswers[qIndex];
  const q = currentQuestions[qIndex];
  if (!q) return false;

  if (Array.isArray(q.answer)) {
    if (!Array.isArray(userAns)) return false;
    if (userAns.length !== q.answer.length) return false;
    const sortedUser = [...userAns].sort();
    const sortedCorrect = [...q.answer].sort();
    return sortedUser.every((val, idx) => val === sortedCorrect[idx]);
  } else {
    return Number(userAns) === Number(q.answer);
  }
}

// Evaluar examen completo ("Finish test")
function evaluateExam() {
  if (isEvaluated) return;
  isEvaluated = true;

  let correctCount = 0;
  currentQuestions.forEach((_, idx) => {
    if (checkAnswerCorrectness(idx)) correctCount++;
  });

  const percentage = Math.round((correctCount / currentQuestions.length) * 100);

  const resultsSummary = document.getElementById('results-summary');
  if (resultsSummary) {
    resultsSummary.style.display = 'block';
    resultsSummary.innerHTML = `
      <div style="background: ${percentage >= 70 ? '#f0fdf4' : '#fef2f2'}; border: 2px solid ${percentage >= 70 ? '#16a34a' : '#dc2626'}; border-radius: 12px; padding: 20px; margin-bottom: 24px; text-align: center;">
        <h2 style="color: ${percentage >= 70 ? '#16a34a' : '#dc2626'}; margin-bottom: 8px;">
          ${percentage >= 70 ? '¡Examen Aprobado!' : 'Examen No Aprobado'} (${percentage}%)
        </h2>
        <p style="color: #475569;">
          Preguntas correctas: <strong>${correctCount}</strong> de <strong>${currentQuestions.length}</strong>
        </p>
      </div>
    `;
  }

  renderActiveQuestion();
}

// Volver al menú
function goBackToMenu() {
  const selector = document.getElementById('exam-selector-screen');
  const quiz = document.getElementById('quiz-screen');
  if (selector) selector.style.display = 'block';
  if (quiz) quiz.style.display = 'none';
}
