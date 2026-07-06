const shuffleQuestionOptions = (qList) => {
  return qList.map(q => {
    const correctOption = q.options.find(opt => opt.id === q.correct_answer);
    const correctLabel = correctOption ? correctOption.label : '';
    
    const shuffledOptions = [...q.options];
    for (let i = shuffledOptions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledOptions[i], shuffledOptions[j]] = [shuffledOptions[j], shuffledOptions[i]];
    }
    
    const ids = ['A', 'B', 'C', 'D'];
    const mappedOptions = shuffledOptions.map((opt, idx) => ({
      id: ids[idx],
      label: opt.label
    }));
    
    const newCorrectOption = mappedOptions.find(opt => opt.label === correctLabel);
    const newCorrectId = newCorrectOption ? newCorrectOption.id : 'A';
    
    return {
      ...q,
      options: mappedOptions,
      correct_answer: newCorrectId
    };
  });
};

const testQuestions = [
  {
    question: "Test 1?",
    options: [
      { id: 'A', label: "Correct Option 1" },
      { id: 'B', label: "Incorrect Option 2" },
      { id: 'C', label: "Incorrect Option 3" },
      { id: 'D', label: "Incorrect Option 4" }
    ],
    correct_answer: 'A'
  },
  {
    question: "Test 2?",
    options: [
      { id: 'A', label: "Incorrect Option 1" },
      { id: 'B', label: "Incorrect Option 2" },
      { id: 'C', label: "Correct Option 2" },
      { id: 'D', label: "Incorrect Option 4" }
    ],
    correct_answer: 'C'
  }
];

console.log("Original correct answers:", testQuestions.map(q => q.correct_answer));
for (let k = 0; k < 10; k++) {
  const shuffled = shuffleQuestionOptions(testQuestions);
  console.log(`Run ${k+1}:`, shuffled.map(q => q.correct_answer));
}
