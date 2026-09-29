// Variable global para almacenar las preguntas cargadas
let allQuestions = [];
let selectedQuestions = [];

// Función para mezclar un arreglo (Fisher-Yates Shuffle)
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Carga del archivo JSON y selección aleatoria
async function loadExamQuestions() {
  try {
    const response = await fetch('questions.json');
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    allQuestions = await response.json();
    
    // Mezclamos todas las preguntas y seleccionamos solo 100
    selectedQuestions = shuffleArray(allQuestions).slice(0, 100);
    
    console.log(`Preguntas cargadas: ${selectedQuestions.length} de ${allQuestions.length}`);
    
    // Iniciar el examen o renderizar las preguntas
    startExam(selectedQuestions);
  } catch (error) {
    console.error("Error al cargar questions.json:", error);
  }
}

// Llama a la función cuando se cargue la página
document.addEventListener('DOMContentLoaded', loadExamQuestions);
