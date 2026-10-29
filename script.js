// Agrega un objeto de control para saber si la pregunta actual ya fue comprobada
let checkedAnswers = {};

// Dentro de renderActiveQuestion(), ajusta el botón inferior según el estado:
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
    if (isCheckedThisQ) {
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
               onchange="handleOptionSelect(${oIndex}, ${isMulti})">
        <span class="option-text">${opt}</span>
      </label>
    `;
  });

  let feedbackHTML = '';
  if (isCheckedThisQ) {
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

// Control dinámico del botón inferior derecho
function updateFooterButtonState() {
  const btnNext = document.getElementById('btn-next-q');
  const userAns = userAnswers[currentQuestionIndex];
  const hasSelected = userAns !== undefined && (Array.isArray(userAns) ? userAns.length > 0 : true);
  const isCheckedThisQ = checkedAnswers[currentQuestionIndex] === true;

  if (isCheckedThisQ) {
    btnNext.textContent = currentQuestionIndex === currentQuestions.length - 1 ? 'Finish test ›' : 'Next question ›';
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

// Modificar handleOptionSelect para actualizar el botón en tiempo real al seleccionar
function handleOptionSelect(optionIndex, isMulti) {
  if (checkedAnswers[currentQuestionIndex] || isEvaluated) return;

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
  updateFooterButtonState();
}
