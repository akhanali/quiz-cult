import type { Question, DifficultyLevel } from "../../../shared/types";

export function getSampleQuestions(difficulty: DifficultyLevel = "medium"): Question[] {
  const questionSets = {
    easy: [
      {
        text: "What color do you get when you mix red and blue?",
        options: ["Green", "Purple", "Orange", "Yellow"],
        correctOption: "Purple",
        timeLimit: 12,
        difficulty: "easy" as DifficultyLevel,
      },
      {
        text: "How many days are in a week?",
        options: ["5", "6", "7", "8"],
        correctOption: "7",
        timeLimit: 10,
        difficulty: "easy" as DifficultyLevel,
      },
      {
        text: "What is the capital of France?",
        options: ["Berlin", "Paris", "Madrid", "Rome"],
        correctOption: "Paris",
        timeLimit: 14,
        difficulty: "easy" as DifficultyLevel,
      },
      {
        text: "Which animal is known as 'man's best friend'?",
        options: ["Cat", "Dog", "Horse", "Bird"],
        correctOption: "Dog",
        timeLimit: 11,
        difficulty: "easy" as DifficultyLevel,
      },
      {
        text: "What do bees make?",
        options: ["Milk", "Honey", "Butter", "Cheese"],
        correctOption: "Honey",
        timeLimit: 10,
        difficulty: "easy" as DifficultyLevel,
      },
    ],
    
    medium: [
      {
        text: "Which planet is closest to the Sun?",
        options: ["Venus", "Mercury", "Earth", "Mars"],
        correctOption: "Mercury",
        timeLimit: 18,
        difficulty: "medium" as DifficultyLevel,
      },
      {
        text: "What does 'HTTP' stand for?",
        options: [
          "HyperText Transfer Protocol",
          "High Tech Transfer Process",
          "Home Type Text Protocol",
          "Hyperlink Text Transport Protocol"
        ],
        correctOption: "HyperText Transfer Protocol",
        timeLimit: 22,
        difficulty: "medium" as DifficultyLevel,
      },
      {
        text: "Who wrote 'Romeo and Juliet'?",
        options: ["Charles Dickens", "William Shakespeare", "Jane Austen", "Mark Twain"],
        correctOption: "William Shakespeare",
        timeLimit: 20,
        difficulty: "medium" as DifficultyLevel,
      },
      {
        text: "If a triangle has angles of 60°, 60°, and 60°, what type of triangle is it?",
        options: ["Right triangle", "Isosceles triangle", "Equilateral triangle", "Scalene triangle"],
        correctOption: "Equilateral triangle",
        timeLimit: 25,
        difficulty: "medium" as DifficultyLevel,
      },
      {
        text: "Which element has the chemical symbol 'O'?",
        options: ["Gold", "Oxygen", "Silver", "Iron"],
        correctOption: "Oxygen",
        timeLimit: 16,
        difficulty: "medium" as DifficultyLevel,
      },
    ],
    
    hard: [
      {
        text: "What is the molecular formula for caffeine?",
        options: ["C8H10N4O2", "C6H12O6", "C2H5OH", "C4H8O"],
        correctOption: "C8H10N4O2",
        timeLimit: 35,
        difficulty: "hard" as DifficultyLevel,
      },
      {
        text: "In which year did the Treaty of Westphalia end the Thirty Years' War?",
        options: ["1645", "1648", "1650", "1653"],
        correctOption: "1648",
        timeLimit: 32,
        difficulty: "hard" as DifficultyLevel,
      },
      {
        text: "Who discovered the photoelectric effect, for which they won the Nobel Prize in Physics?",
        options: ["Albert Einstein", "Niels Bohr", "Max Planck", "Werner Heisenberg"],
        correctOption: "Albert Einstein",
        timeLimit: 28,
        difficulty: "hard" as DifficultyLevel,
      },
      {
        text: "If f(x) = 3x² - 2x + 1, what is f'(2)?",
        options: ["10", "8", "12", "6"],
        correctOption: "10",
        timeLimit: 40,
        difficulty: "hard" as DifficultyLevel,
      },
      {
        text: "Which economic principle states that as the price of a good increases, the quantity demanded decreases, all else being equal?",
        options: [
          "Law of Diminishing Returns",
          "Law of Supply",
          "Law of Demand",
          "Pareto Principle"
        ],
        correctOption: "Law of Demand",
        timeLimit: 30,
        difficulty: "hard" as DifficultyLevel,
      },
    ],
  };

  return questionSets[difficulty];
}

// Legacy function for backward compatibility
export function getSampleQuestionsLegacy(): Question[] {
  return [
    {
      text: "What is the capital of France?",
      options: ["Berlin", "Paris", "Madrid", "Rome"],
      correctOption: "Paris",
      timeLimit: 15,
    },
    {
      text: "Which planet is known as the Red Planet?",
      options: ["Earth", "Mars", "Jupiter", "Saturn"],
      correctOption: "Mars",
      timeLimit: 10,
    },
    {
      text: "Who wrote 'To Kill a Mockingbird'?",
      options: [
        "Harper Lee",
        "Mark Twain",
        "F. Scott Fitzgerald",
        "Ernest Hemingway",
      ],
      correctOption: "Harper Lee",
      timeLimit: 20,
    },
  ];
}