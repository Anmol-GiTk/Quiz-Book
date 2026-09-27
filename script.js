let questions = [];
let editingIndex = -1;

let currentQuestion = 0;
let selectedAnswers = [];
let marked = [];
let timeLeft = 0;
let timerInterval = null;
let submitted = false;

const $ = id => document.getElementById(id);

function getSettings() {
  return {
    name: $("testName").value.trim() || "My Mock Test",
    time: Math.max(1, Number($("testTime").value) || 10),
    correct: Math.max(0, Number($("correctMarks").value) || 1),
    wrong: Math.max(0, Number($("wrongMarks").value) || 0)
  };
}

function clearForm() {
  $("subject").value = "";
  $("question").value = "";
  $("option0").value = "";
  $("option1").value = "";
  $("option2").value = "";
  $("option3").value = "";
  $("correctAnswer").value = "0";
  editingIndex = -1;
  $("formTitle").textContent = "Add Question";
  $("addQuestionBtn").textContent = "+ Add Question";
}

function addOrUpdateQuestion() {
  const subject = $("subject").value.trim() || "General";
  const question = $("question").value.trim();
  const options = [0,1,2,3].map(i => $(`option${i}`).value.trim());
  const answer = Number($("correctAnswer").value);

  if (!question) return alert("Please write the question.");
  if (options.some(x => !x)) return alert("Please fill all 4 options.");

  const item = { subject, question, options, answer };

  if (editingIndex === -1) questions.push(item);
  else questions[editingIndex] = item;

  clearForm();
  renderQuestionList();
}

function renderQuestionList() {
  $("questionCount").textContent = `${questions.length} Question${questions.length === 1 ? "" : "s"}`;

  $("questionList").innerHTML = questions.map((q, i) => `
    <div class="question-item">
      <div class="question-item-head">
        <span class="q-number">Q${i + 1} • ${escapeHtml(q.subject)}</span>
        <small>Correct: ${String.fromCharCode(65 + q.answer)}</small>
      </div>
      <p>${escapeHtml(q.question)}</p>
      <small>
        A: ${escapeHtml(q.options[0])} &nbsp;|&nbsp;
        B: ${escapeHtml(q.options[1])} &nbsp;|&nbsp;
        C: ${escapeHtml(q.options[2])} &nbsp;|&nbsp;
        D: ${escapeHtml(q.options[3])}
      </small>
      <div class="question-actions">
        <button class="edit-btn" onclick="editQuestion(${i})">Edit</button>
        <button class="delete-btn" onclick="deleteQuestion(${i})">Delete</button>
      </div>
    </div>
  `).join("");
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, ch => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[ch]));
}

function editQuestion(i) {
  const q = questions[i];
  editingIndex = i;
  $("formTitle").textContent = `Edit Question ${i + 1}`;
  $("addQuestionBtn").textContent = "✓ Update Question";
  $("subject").value = q.subject;
  $("question").value = q.question;
  q.options.forEach((x, n) => $(`option${n}`).value = x);
  $("correctAnswer").value = q.answer;
  window.scrollTo({top: 200, behavior: "smooth"});
}

function deleteQuestion(i) {
  if (!confirm(`Delete Question ${i + 1}?`)) return;
  questions.splice(i, 1);
  clearForm();
  renderQuestionList();
}

function clearAll() {
  if (!questions.length && !confirm("Reset all test settings too?")) return;
  if (questions.length && !confirm("Delete all questions and reset settings?")) return;
  questions = [];
  $("testName").value = "My Mock Test";
  $("testTime").value = 10;
  $("correctMarks").value = 1;
  $("wrongMarks").value = 0.25;
  clearForm();
  renderQuestionList();
}

function createTest() {
  if (!questions.length) return alert("Add at least 1 question first.");

  const settings = getSettings();
  $("runningTestName").textContent = settings.name;
  $("builderScreen").classList.add("hidden");
  $("resultScreen").classList.add("hidden");
  $("testScreen").classList.remove("hidden");
  $("testTab").classList.remove("hidden");
  $("builderTab").classList.remove("active");
  $("testTab").classList.add("active");

  currentQuestion = 0;
  selectedAnswers = Array(questions.length).fill(null);
  marked = Array(questions.length).fill(false);
  timeLeft = settings.time * 60;
  submitted = false;

  startTimer();
  renderQuestion();
}

function startTimer() {
  clearInterval(timerInterval);
  updateTimer();
  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimer();
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      submitTest(true);
    }
  }, 1000);
}

function updateTimer() {
  const min = Math.floor(timeLeft / 60);
  const sec = timeLeft % 60;
  $("timer").textContent = `${String(min).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
  $("timer").classList.toggle("warning", timeLeft <= 60);
}

function renderQuestion() {
  const q = questions[currentQuestion];
  const s = getSettings();

  $("currentNo").textContent = currentQuestion + 1;
  $("testProgress").textContent = `${currentQuestion + 1} / ${questions.length}`;
  $("questionText").textContent = q.question;
  $("subjectTag").textContent = q.subject;
  $("marksText").textContent = `+${s.correct} / -${s.wrong}`;
  $("progressBar").style.width = `${((currentQuestion + 1) / questions.length) * 100}%`;

  $("options").innerHTML = "";
  q.options.forEach((option, index) => {
    const label = document.createElement("label");
    label.className = "option";
    if (selectedAnswers[currentQuestion] === index) label.classList.add("selected");
    label.innerHTML = `<input type="radio" name="answer" ${selectedAnswers[currentQuestion] === index ? "checked" : ""}><span><b>${String.fromCharCode(65+index)}.</b> ${escapeHtml(option)}</span>`;
    label.onclick = () => {
      selectedAnswers[currentQuestion] = index;
      renderQuestion();
    };
    $("options").appendChild(label);
  });

  $("prevBtn").disabled = currentQuestion === 0;
  $("nextBtn").textContent = currentQuestion === questions.length - 1 ? "Finish →" : "Next →";
  $("reviewBtn").textContent = marked[currentQuestion] ? "✓ Remove Review" : "⚑ Mark for Review";
  renderPalette();
}

function renderPalette() {
  $("palette").innerHTML = "";
  questions.forEach((_, i) => {
    const b = document.createElement("button");
    b.textContent = i + 1;
    if (selectedAnswers[i] !== null) b.classList.add("answered");
    if (marked[i]) b.classList.add("marked");
    if (i === currentQuestion) b.classList.add("current");
    b.onclick = () => { currentQuestion = i; renderQuestion(); };
    $("palette").appendChild(b);
  });
}

function nextQuestion() {
  if (currentQuestion < questions.length - 1) {
    currentQuestion++;
    renderQuestion();
  } else submitTest(false);
}
function previousQuestion() {
  if (currentQuestion > 0) {
    currentQuestion--;
    renderQuestion();
  }
}
function toggleReview() {
  marked[currentQuestion] = !marked[currentQuestion];
  renderQuestion();
}

function submitTest(autoSubmit) {
  if (submitted) return;

  if (!autoSubmit) {
    const unanswered = selectedAnswers.filter(x => x === null).length;
    if (unanswered && !confirm(`${unanswered} question(s) are unanswered. Submit anyway?`)) return;
  }

  submitted = true;
  clearInterval(timerInterval);

  const s = getSettings();
  let correct = 0, wrong = 0, score = 0;

  questions.forEach((q, i) => {
    if (selectedAnswers[i] === null) return;
    if (selectedAnswers[i] === q.answer) {
      correct++;
      score += s.correct;
    } else {
      wrong++;
      score -= s.wrong;
    }
  });

  const unattempted = questions.length - correct - wrong;
  const attempted = correct + wrong;
  const accuracy = attempted ? correct / attempted * 100 : 0;

  $("testScreen").classList.add("hidden");
  $("resultScreen").classList.remove("hidden");
  $("score").textContent = score.toFixed(2);
  $("correct").textContent = correct;
  $("wrong").textContent = wrong;
  $("unattempted").textContent = unattempted;
  $("accuracyText").textContent = `${accuracy.toFixed(1)}%`;
  $("accuracyBar").style.width = `${accuracy}%`;
  $("resultMessage").textContent = autoSubmit
    ? "Time is over. The test was submitted automatically."
    : "Your test has been submitted successfully.";

  renderReview();
}

function renderReview() {
  $("reviewList").innerHTML = questions.map((q, i) => {
    const your = selectedAnswers[i] === null ? "Not attempted" : q.options[selectedAnswers[i]];
    return `<div class="review-item">
      <b>Q${i+1}. ${escapeHtml(q.question)}</b>
      <p class="your-answer">Your answer: ${escapeHtml(your)}</p>
      <p class="correct-answer">Correct answer: ${escapeHtml(q.options[q.answer])}</p>
    </div>`;
  }).join("");
}

function showBuilder() {
  clearInterval(timerInterval);
  $("testScreen").classList.add("hidden");
  $("resultScreen").classList.add("hidden");
  $("builderScreen").classList.remove("hidden");
  $("builderTab").classList.add("active");
  $("testTab").classList.remove("active");
}

$("addQuestionBtn").onclick = addOrUpdateQuestion;
$("createTestBtn").onclick = createTest;
$("clearAllBtn").onclick = clearAll;
$("prevBtn").onclick = previousQuestion;
$("nextBtn").onclick = nextQuestion;
$("reviewBtn").onclick = toggleReview;
$("submitBtn").onclick = () => submitTest(false);
$("againBtn").onclick = createTest;
$("editAfterBtn").onclick = showBuilder;
$("backBuilderBtn").onclick = showBuilder;
$("builderTab").onclick = showBuilder;
$("testTab").onclick = () => {
  if (questions.length) {
    $("builderScreen").classList.add("hidden");
    $("resultScreen").classList.add("hidden");
    $("testScreen").classList.remove("hidden");
  }
};

renderQuestionList();
