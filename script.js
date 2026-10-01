// Variables globales
let currentQuestions = [];
let userAnswers = {};

// Inicializar eventos al cargar el DOM
document.addEventListener('DOMContentLoaded', () => {
  // Enlazar el botón de Architecture con el archivo JSON correspondiente
  const btnArchitecture = document.getElementById('btn-architecture');
  if (btnArchitecture) {
    btnArchitecture.addEventListener('click', (e) => {
      e.preventDefault();
      selectExam('architecture-questions.json', 'Architecture Certification Exam');
    });
  }
});

// 1. Función principal invocada al hacer clic en cualquier tarjeta/botón
async function selectExam(jsonFile, examTitle) {
  // Cambiar el título del encabezado
  const titleElem = document.getElementById('app-title');
  const counterElem = document.getElementById('question-counter');
  
  if (titleElem) titleElem.textContent = examTitle;
  if (counterElem) counterElem.textContent = "Cargando preguntas...";

  // Alternar pantallas
  document.getElementById('exam-selector-screen').style.display = 'none';
  document.getElementById('quiz-screen').style.display = 'block';

  // Cargar preguntas desde el JSON
  try {
    const response = await fetch(jsonFile);
    if (!response.ok) throw new Error(`No se pudo cargar el archivo: ${jsonFile}`);
    
    currentQuestions = await response.json();
    userAnswers = {}; // Reiniciar respuestas anteriores

    if (counterElem) {
      counterElem.textContent = `Total de preguntas: ${currentQuestions.length}`;
    }

    // Renderizar la pantalla de preguntas
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

// 2. Función para renderizar las preguntas en el DOM
function renderQuestions(questions) {
  const container = document.getElementById('questions-wrapper');
  container.innerHTML = ''; // Limpiar contenido previo

  questions.forEach((q, qIndex) => {
    const questionCard = document.createElement('div');
    questionCard.className = 'question-card';
    questionCard.style.cssText = `
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 20px;
    `;

    // Texto de la pregunta
    let optionsHTML = '';
    q.options.forEach((opt, oIndex) => {
      optionsHTML += `
        <label style="display: block; margin: 10px 0; cursor: pointer; background: rgba(255,255,255,0.05); padding: 10px; border-radius: 8px;">
          <input type="radio" name="question_${qIndex}" value="${oIndex}" onchange="saveAnswer(${qIndex}, ${oIndex})">
          <span style="margin-left: 8px;">${opt}</span>
        </label>
      `;
    });

    questionCard.innerHTML = `
      <h3 style="margin-bottom: 15px; font-size: 1.1rem; color: #00d2ff;">
        Pregunta ${qIndex + 1}: ${q.question}
      </h3>
      <div class="options-container">
        ${optionsHTML}
      </div>
    `;

    container.appendChild(questionCard);
  });
}

// 3. Guardar la opción seleccionada por el usuario
function saveAnswer(questionIndex, optionIndex) {
  userAnswers[questionIndex] = optionIndex;
}

// 4. Volver al menú principal
function goBackToMenu() {
  document.getElementById('exam-selector-screen').style.display = 'block';
  document.getElementById('quiz-screen').style.display = 'none';
  
  const titleElem = document.getElementById('app-title');
  const counterElem = document.getElementById('question-counter');

  if (titleElem) titleElem.textContent = "Simulador de Certificaciones";
  if (counterElem) counterElem.textContent = "Selecciona tu ruta de certificación oficial para comenzar";
  
  document.getElementById('questions-wrapper').innerHTML = '';
}
