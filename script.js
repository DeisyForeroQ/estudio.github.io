let allQuestions = [];
let selectedQuestions = [];

// 1. Función para seleccionar el examen desde la pantalla principal
async function selectExam(jsonFile, examName) {
  document.getElementById('app-title').textContent = examName;
  document.getElementById('exam-selector-screen').style.display = 'none';
  document.getElementById('quiz-screen').style.display = 'block';

  await loadExamQuestions(jsonFile);
}

// 2. Carga dinámica del archivo JSON seleccionado
async function loadExamQuestions(jsonFile) {
  try {
    const response = await fetch(jsonFile);
    if (!response.ok) {
      throw new Error(`Error HTTP! Estado: ${response.status}`);
    }
    
    allQuestions = await response.json();
    
    const limit = Math.min(100, allQuestions.length);
    selectedQuestions = shuffleArray(allQuestions).slice(0, limit);
    
    startExam(selectedQuestions);
  } catch (error) {
    console.error(`Error al cargar ${jsonFile}:`, error);
    const counter = document.getElementById('question-counter');
    if (counter) {
      counter.textContent = "Error al cargar las preguntas. Verifica el archivo JSON.";
    }
  }
}

// 3. Volver al menú de selección de exámenes
function goBackToMenu() {
  document.getElementById('exam-selector-screen').style.display = 'block';
  document.getElementById('quiz-screen').style.display = 'none';
  document.getElementById('questions-wrapper').innerHTML = '';
  document.getElementById('score-box').style.display = 'none';
  document.getElementById('question-counter').textContent = '';
  document.getElementById('app-title').textContent = 'Simulador de Exámenes VMware';
}

// Quitar o actualizar el evento DOMContentLoaded original para que no cargue automáticamente preguntas
document.addEventListener('DOMContentLoaded', () => {
  // Inicialización limpia
});
