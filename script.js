// Variables Globales
let currentQuestions = [];
let userAnswers = {};
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
  document.getElementById('exam-selector-screen').style.display = 'none';
  document.getElementById('quiz-screen').style.display = 'flex';

  const resultsContainer = document.getElementById('results-summary');
  if (resultsContainer) resultsContainer.style.display = 'none';

  isEvaluated = false;
  userAnswers = {};
  currentQuestionIndex = 0;

  try {
    const response = await fetch(jsonFile);
    if (!response.ok) throw new Error(`Error al cargar ${jsonFile}`);
    
    const allQuestions = await response.json();
    currentQuestions = shuffleArray(allQuestions).slice(0, 60); // Máximo 60 preguntas tipo la interfaz

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
  sidebarNav.innerHTML = '';

  currentQuestions.forEach((q, index) => {
    const item = document.createElement('div');
    item.className = `nav-q-item ${index === currentQuestionIndex ? 'active' : ''}`;
    item.onclick = () => jumpToQuestion(index);

    let statusHTML = '';
    if (isEvaluated) {
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

  let optionsHTML = '';
  q.options.forEach((opt, oIndex) => {
    const isChecked = isOptionSelected(currentQuestionIndex, oIndex, isMulti);
    
    // Formato de resaltado si ya fue evaluado
    let evalStyle = '';
    if (isEvaluated) {
      const isCorrectOpt = isMulti ? q.answer.includes(oIndex) : q.answer === oIndex;
      if (isCorrectOpt) {
        evalStyle = 'border-color: #16a34a; background-color: #f0fdf4;';
      } else if (isChecked) {
        evalStyle = 'border-color: #dc2626; background-color: #fef2f2;';
      }
    }

    optionsHTML += `
      <label class="option-card ${isChecked ? 'selected' : ''}" style="${evalStyle}">
        <input type="${inputType}" 
               class="custom-input" 
               name="q_option" 
               value="${oIndex}" 
               ${isChecked ? 'checked' : ''} 
               ${isEvaluated ? 'disabled' : ''} 
               onchange="handleOptionSelect(${oIndex}, ${isMulti})">
        <span class="option-text">${opt}</span>
      </label>
    `;
  });

  // Retroalimentación si ya fue evaluado
  let feedbackHTML = '';
  if (isEvaluated) {
    const isCorrect = checkAnswerCorrectness(currentQuestionIndex);
    feedbackHTML = `
      <div class="feedback-box ${isCorrect ? 'feedback-correct' : 'feedback-incorrect'}">
        <strong>${isCorrect ? '¡Correcto!' : 'Incorrecto.'}</strong><br>
        ${q.explanation || ''}
      </div>
    `;
  }

  container.innerHTML = `
    <div class="q-number-title">
      🔖 Question ${currentQuestionIndex + 1}:
    </div>
    <div class="q-text">${q.question}</div>
    <div class="q-subtext">${isMulti ? 'Select all that apply.' : 'Select the best response.'}</div>
    <div class="options-list">
      ${optionsHTML}
    </div>
    ${feedbackHTML}
  `;

  // Actualizar botón de navegación siguiente
  const btnNext = document.getElementById('btn-next-q');
  if (currentQuestionIndex === currentQuestions.length - 1) {
    btnNext.textContent = 'Finish test ›';
  } else {
    btnNext.textContent = 'Skip question ›';
  }

  renderSidebarList();
}

// Manejar selección de opción
function handleOptionSelect(optionIndex, isMulti) {
  if (isEvaluated) return;

  if (isMulti) {
    if (!userAnswers[currentQuestionIndex]) userAnswers[currentQuestionIndex] = [];
    const indexInArr = userAnswers[currentQuestionIndex].indexOf(optionIndex);
    if (indexInArr > -1) {
      userAnswers[currentQuestionIndex].splice(indexInArr, 1);
    } else {
      userAnswers[currentQuestionIndex].push(optionIndex);
    }
  } else {
    userAnswers[currentQuestionIndex] = optionIndex;
  }

  updateProgressBar();
  renderActiveQuestion();
}

// Comprobar si una opción está seleccionada
function isOptionSelected(qIndex, oIndex, isMulti) {
  const ans = userAnswers[qIndex];
  if (ans === undefined) return false;
  if (isMulti) return Array.isArray(ans) && ans.includes(oIndex);
  return ans === oIndex;
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
  const answeredCount = Object.keys(userAnswers).filter(k => {
    const val = userAnswers[k];
    return Array.isArray(val) ? val.length > 0 : val !== undefined;
  }).length;

  const total = currentQuestions.length;
  document.getElementById('progress-ratio-text').textContent = `${answeredCount}/${total}`;
  
  const percentage = total > 0 ? (answeredCount / total) * 100 : 0;
  document.getElementById('progress-bar-fill').style.width = `${percentage}%`;
}

// Evaluar exactitud de respuesta
function checkAnswerCorrectness(qIndex) {
  const userAns = userAnswers[qIndex];
  const q = currentQuestions[qIndex];
  if (!q) return false;

  if (Array.isArray(q.answer)) {
    if (!Array.isArray(userAns)) return false;
    if (userAns.length !== q.answer.length) return false;
    return q.answer.every(val => userAns.includes(val));
  } else {
    return userAns === q.answer;
  }
}

// Evaluar examen completo
function evaluateExam() {
  if (isEvaluated) return;
  isEvaluated = true;

  let correctCount = 0;
  currentQuestions.forEach((_, idx) => {
    if (checkAnswerCorrectness(idx)) correctCount++;
  });

  const percentage = Math.round((correctCount / currentQuestions.length) * 100);

  const resultsSummary = document.getElementById('results-summary');
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

  renderActiveQuestion();
}

// Volver al menú
function goBackToMenu() {
  document.getElementById('exam-selector-screen').style.display = 'block';
  document.getElementById('quiz-screen').style.display = 'none';
}

// Pantalla completa opcional
function toggleFullScreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    if (document.exitFullscreen) document.exitFullscreen();
  }
}
