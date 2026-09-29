// Variables globales
let allQuestions = [];
let selectedQuestions = [];

// 1. Algoritmo de mezcla (Fisher-Yates)
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// 2. Carga del archivo JSON y selección aleatoria
async function loadExamQuestions() {
  try {
    const response = await fetch('questions.json');
    if (!response.ok) {
      throw new Error(`Error HTTP! Estado: ${response.status}`);
    }
    
    allQuestions = await response.json();
    
    // Si hay menos de 100 preguntas disponibles, toma todas las que haya
    const limit = Math.min(100, allQuestions.length);
    selectedQuestions = shuffleArray(allQuestions).slice(0, limit);
    
    startExam(selectedQuestions);
  } catch (error) {
    console.error("Error al cargar questions.json:", error);
    const counter = document.getElementById('question-counter');
    if (counter) {
      counter.textContent = "Error al cargar las preguntas. Verifica la consola.";
    }
  }
}

// 3. Renderizado de las preguntas en el DOM
function startExam(questions) {
  const container = document.getElementById('questions-wrapper');
  const counter = document.getElementById('question-counter');
  
  if (counter) {
    counter.textContent = `Preguntas cargadas aleatoriamente: ${questions.length} de ${allQuestions.length} disponibles`;
  }
  
  if (!container) return;
  container.innerHTML = '';

  questions.forEach((q, index) => {
    const card = document.createElement('div');
    card.className = 'question-card';
    card.id = `card-${index}`;
    
    const optionsHTML = q.options.map((opt, i) => `
      <label class="option-label" id="label-${index}-${i}">
        <input type="radio" name="question-${index}" value="${i}">
        <span>${opt}</span>
      </label>
    `).join('');

    // Manejo de explicación opcional por seguridad
    const explanationText = q.explanation ? q.explanation : "No hay explicación disponible para esta pregunta.";

    card.innerHTML = `
      <h3 class="question-title">${index + 1}. ${q.question}</h3>
      <div class="options-group">${optionsHTML}</div>
      <div class="explanation" id="explanation-${index}">
        <strong>Explicación:</strong> ${explanationText}
      </div>
    `;

    container.appendChild(card);
  });
}

// 4. Evaluación del examen y muestra de explicaciones
function evaluateExam() {
  let score = 0;

  selectedQuestions.forEach((q, index) => {
    const selectedOption = document.querySelector(`input[name="question-${index}"]:checked`);
    const explanationDiv = document.getElementById(`explanation-${index}`);
    
    // Mostrar la explicación de la pregunta
    if (explanationDiv) {
      explanationDiv.style.display = 'block';
    }

    // Limpiar clases previas si se vuelve a calificar
    q.options.forEach((_, i) => {
      const lbl = document.getElementById(`label-${index}-${i}`);
      if (lbl) {
        lbl.classList.remove('correct', 'incorrect');
      }
    });

    // Marcar la opción correcta siempre
    const correctLabel = document.getElementById(`label-${index}-${q.answer}`);
    if (correctLabel) {
      correctLabel.classList.add('correct');
    }

    // Validar selección del usuario
    if (selectedOption) {
      const userChoice = parseInt(selectedOption.value, 10);
      if (userChoice === q.answer) {
        score++;
      } else {
        const wrongLabel = document.getElementById(`label-${index}-${userChoice}`);
        if (wrongLabel) {
          wrongLabel.classList.add('incorrect');
        }
      }
    }
  });

  // Mostrar el puntaje final
  const scoreBox = document.getElementById('score-box');
  if (scoreBox) {
    const percentage = ((score / selectedQuestions.length) * 100).toFixed(1);
    scoreBox.style.display = 'block';
    scoreBox.innerHTML = `
      <h2>Resultado Final: ${score} / ${selectedQuestions.length} (${percentage}%)</h2>
      <p>${percentage >= 70 ? '¡Felicidades! Has aprobado la simulación.' : 'Sigue practicando para alcanzar el 70% o más.'}</p>
    `;
  }

  // Desplazar la pantalla arriba para ver el puntaje
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 5. Iniciar la carga de preguntas al abrir la página
document.addEventListener('DOMContentLoaded', loadExamQuestions);
