// Variables globales
let currentQuestions = [];
let userAnswers = {};

// Función auxiliar para desordenar un arreglo aleatoriamente (Algoritmo Fisher-Yates)
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Inicializar eventos al cargar el DOM
document.addEventListener('DOMContentLoaded', () => {
  const btnArchitecture = document.getElementById('btn-architecture');
  if (btnArchitecture) {
    btnArchitecture.addEventListener('click', (e) => {
      e.preventDefault();
      selectExam('architecture-questions.json', 'VMware Cloud Foundation - Architecture');
    });
  }
});

// 1. Cargar examen desde el JSON seleccionando preguntas aleatorias
async function selectExam(jsonFile, examTitle) {
  const titleElem = document.getElementById('app-title');
  const counterElem = document.getElementById('question-counter');
  
  if (titleElem) titleElem.textContent = examTitle;
  if (counterElem) counterElem.textContent = "Cargando preguntas...";

  // Alternar pantallas
  document.getElementById('exam-selector-screen').style.display = 'none';
  document.getElementById('quiz-screen').style.display = 'block';

  // Ocultar resultados previos si existen y mostrar botón de enviar
  const resultsContainer = document.getElementById('results-summary');
  if (resultsContainer) resultsContainer.style.display = 'none';

  const submitBtn = document.getElementById('btn-submit-exam');
  if (submitBtn) submitBtn.style.display = 'block';

  try {
    const response = await fetch(jsonFile);
    if (!response.ok) throw new Error(`No se pudo cargar el archivo: ${jsonFile}`);
    
    const allQuestions = await response.json();

    // 1. Mezclar todo el banco de preguntas de forma aleatoria
    const shuffledQuestions = shuffleArray(allQuestions);
    
    // 2. Cortar estrictamente a un máximo de preguntas (ej. 160 o las disponibles)
    currentQuestions = shuffledQuestions.slice(0, 160);

    userAnswers = {}; // Reiniciar respuestas anteriores

    if (counterElem) {
      counterElem.textContent = `Total de preguntas: ${currentQuestions.length}`;
    }

    renderQuestions(currentQuestions);

  } catch (error) {
    console.error(error);
    const wrapper = document.getElementById('questions-wrapper');
    if (wrapper) {
      wrapper.innerHTML = `
        <div style="text-align: center; color: #ff6b6b; padding: 20px;">
          <p>⚠️ No se pudo cargar el archivo <strong>${jsonFile}</strong>.</p>
          <p>Asegúrate de crear este archivo en la misma carpeta que el <code>index.html</code>.</p>
        </div>
      `;
    }
  }
}

// 2. Renderizar preguntas (Soporta Radio y Checkbox dinámicamente)
function renderQuestions(questions) {
  const container = document.getElementById('questions-wrapper');
  container.innerHTML = ''; 

  questions.forEach((q, qIndex) => {
    const questionCard = document.createElement('div');
    questionCard.className = 'question-card';
    questionCard.id = `question-card-${qIndex}`;
    questionCard.style.cssText = `
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 20px;
    `;

    // Detectar si la pregunta es de selección múltiple (si q.answer es un arreglo)
    const isMulti = Array.isArray(q.answer);
    const inputType = isMulti ? 'checkbox' : 'radio';

    let optionsHTML = '';
    q.options.forEach((opt, oIndex) => {
      optionsHTML += `
        <label id="label-${qIndex}-${oIndex}" style="display: block; margin: 10px 0; cursor: pointer; background: rgba(255,255,255,0.05); padding: 12px; border-radius: 8px; border: 1px solid transparent; transition: all 0.2s;">
          <input type="${inputType}" name="question_${qIndex}" value="${oIndex}" onchange="saveAnswer(${qIndex}, ${oIndex}, ${isMulti})">
          <span style="margin-left: 8px;">${opt}</span>
        </label>
      `;
    });

    questionCard.innerHTML = `
      <h3 style="margin-bottom: 15px; font-size: 1.1rem; color: #00d2ff;">
        Pregunta ${qIndex + 1}: ${q.question} 
        ${isMulti ? '<span style="color: #ffd166; font-size: 0.85rem; display: block; margin-top: 5px;">(Selecciona varias opciones)</span>' : ''}
      </h3>
      <div class="options-container">
        ${optionsHTML}
      </div>
      <div id="feedback-${qIndex}" style="margin-top: 15px; display: none; padding: 12px; border-radius: 8px; font-size: 0.95rem;"></div>
    `;

    container.appendChild(questionCard);
  });
}

// 3. Guardar respuesta del usuario (Maneja tanto radio como checkbox)
function saveAnswer(questionIndex, optionIndex, isMulti) {
  if (isMulti) {
    // Recolectar todos los checkboxes marcados en esta pregunta
    const checkboxes = document.querySelectorAll(`input[name="question_${questionIndex}"]:checked`);
    userAnswers[questionIndex] = Array.from(checkboxes).map(cb => parseInt(cb.value));
  } else {
    userAnswers[questionIndex] = parseInt(optionIndex);
  }
}

// Función auxiliar para comparar si dos arreglos contienen los mismos elementos
function arraysEqual(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort((x, y) => x - y);
  const sortedB = [...b].sort((x, y) => x - y);
  return sortedA.every((val, idx) => val === sortedB[idx]);
}

// 4. Evaluar el examen completo
function evaluateExam() {
  if (!currentQuestions || currentQuestions.length === 0) {
    alert("No hay preguntas cargadas para evaluar.");
    return;
  }

  let correctCount = 0;
  let incorrectCount = 0;

  currentQuestions.forEach((q, qIndex) => {
    const selectedAnswer = userAnswers[qIndex];
    const correctAnswer = q.answer; 
    const feedbackElem = document.getElementById(`feedback-${qIndex}`);
    const isMulti = Array.isArray(correctAnswer);

    // Deshabilitar todos los inputs de esta pregunta
    const inputs = document.querySelectorAll(`input[name="question_${qIndex}"]`);
    inputs.forEach(input => input.disabled = true);

    let isCorrect = false;

    if (isMulti) {
      // Validación para selección múltiple
      const userArr = Array.isArray(selectedAnswer) ? selectedAnswer : [];
      isCorrect = arraysEqual(userArr, correctAnswer);

      // Resaltar en verde todas las opciones que eran correctas
      correctAnswer.forEach(corrIdx => {
        const correctLabel = document.getElementById(`label-${qIndex}-${corrIdx}`);
        if (correctLabel) {
          correctLabel.style.background = "rgba(46, 204, 113, 0.2)";
          correctLabel.style.borderColor = "#2ecc71";
        }
      });

      // Resaltar en rojo las opciones marcadas erróneamente por el usuario
      userArr.forEach(userOptIdx => {
        if (!correctAnswer.includes(userOptIdx)) {
          const wrongLabel = document.getElementById(`label-${qIndex}-${userOptIdx}`);
          if (wrongLabel) {
            wrongLabel.style.background = "rgba(231, 76, 60, 0.2)";
            wrongLabel.style.borderColor = "#e74c3c";
          }
        }
      });

    } else {
      // Validación para selección única
      isCorrect = (selectedAnswer !== undefined && parseInt(selectedAnswer) === parseInt(correctAnswer));

      // Resaltar la respuesta correcta en verde
      const correctLabel = document.getElementById(`label-${qIndex}-${correctAnswer}`);
      if (correctLabel) {
        correctLabel.style.background = "rgba(46, 204, 113, 0.2)";
        correctLabel.style.borderColor = "#2ecc71";
      }

      // Si falló y marcó algo, marcar su opción en rojo
      if (!isCorrect && selectedAnswer !== undefined) {
        const wrongLabel = document.getElementById(`label-${qIndex}-${selectedAnswer}`);
        if (wrongLabel) {
          wrongLabel.style.background = "rgba(231, 76, 60, 0.2)";
          wrongLabel.style.borderColor = "#e74c3c";
        }
      }
    }

    // Mostrar feedback en la tarjeta
    if (isCorrect) {
      correctCount++;
      if (feedbackElem) {
        feedbackElem.style.display = "block";
        feedbackElem.style.background = "rgba(46, 204, 113, 0.15)";
        feedbackElem.style.border = "1px solid #2ecc71";
        feedbackElem.style.color = "#2ecc71";
        feedbackElem.innerHTML = `<strong>¡Correcto!</strong> ${q.explanation || ''}`;
      }
    } else {
      incorrectCount++;
      if (feedbackElem) {
        feedbackElem.style.display = "block";
        feedbackElem.style.background = "rgba(231, 76, 60, 0.15)";
        feedbackElem.style.border = "1px solid #e74c3c";
        feedbackElem.style.color = "#ff6b6b";

        let correctText = '';
        if (isMulti) {
          correctText = correctAnswer.map(idx => `<strong>${q.options[idx]}</strong>`).join(' y ');
        } else {
          correctText = `<strong>${q.options[correctAnswer]}</strong>`;
        }

        feedbackElem.innerHTML = `
          <strong>Incorrecto.</strong> La(s) respuesta(s) correcta(s) era(n): ${correctText}.<br>
          <em>${q.explanation || ''}</em>
        `;
      }
    }
  });

  // Mostrar el panel de puntaje superior
  const resultsContainer = document.getElementById('results-summary');
  if (resultsContainer) {
    const scorePercentage = Math.round((correctCount / currentQuestions.length) * 100);
    resultsContainer.style.display = 'block';
    resultsContainer.innerHTML = `
      <div style="background: rgba(15, 23, 42, 0.8); border: 2px solid ${scorePercentage >= 70 ? '#2ecc71' : '#e74c3c'}; border-radius: 12px; padding: 20px; margin-bottom: 25px; text-align: center;">
        <h2 style="color: ${scorePercentage >= 70 ? '#2ecc71' : '#e74c3c'}; margin-bottom: 10px;">
          ${scorePercentage >= 70 ? '¡Examen Aprobado!' : 'Examen No Aprobado'} (${scorePercentage}%)
        </h2>
        <p style="font-size: 1.1rem; color: #fff;">
          Correctas: <strong style="color: #2ecc71;">${correctCount}</strong> | 
          Incorrectas / Sin responder: <strong style="color: #e74c3c;">${incorrectCount}</strong>
        </p>
      </div>
    `;
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Ocultar el botón después de evaluar
  const submitBtn = document.getElementById('btn-submit-exam');
  if (submitBtn) submitBtn.style.display = 'none';
}

// 5. Volver al menú principal
function goBackToMenu() {
  document.getElementById('exam-selector-screen').style.display = 'block';
  document.getElementById('quiz-screen').style.display = 'none';
  
  const titleElem = document.getElementById('app-title');
  const counterElem = document.getElementById('question-counter');

  if (titleElem) titleElem.textContent = "Simulador de Certificaciones";
  if (counterElem) counterElem.textContent = "Selecciona tu ruta de certificación oficial para comenzar";
  
  document.getElementById('questions-wrapper').innerHTML = '';
}
