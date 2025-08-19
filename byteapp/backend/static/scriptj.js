document.addEventListener('DOMContentLoaded', function() {
    const fileUpload = document.getElementById('fileUpload');
    const fileInfo = document.getElementById('fileInfo');
    const promptInput = document.getElementById('promptInput');
    const apiKeyInput = document.getElementById('apiKey');
    const generateBtn = document.getElementById('generateRoadmap');
    const loading = document.getElementById('loading');
    const resultsSection = document.getElementById('resultsSection');
    const roadmapContent = document.getElementById('roadmapContent');

    // Global variables for quiz functionality
    let currentRoadmap = null;
    let currentQuiz = null;
    let currentQuestionIndex = 0;
    let userAnswers = [];
    let quizScore = 0;
    let currentWeekNumber = 0;
    let readingComplete = false;
    let scrollTimer = null;

    fileUpload.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            fileInfo.style.display = 'block';
            fileInfo.innerHTML = `
                <strong>Selected file:</strong> ${file.name}<br>
                <strong>Size:</strong> ${(file.size / 1024 / 1024).toFixed(2)} MB<br>
                <strong>Type:</strong> ${file.type || 'Unknown'}
            `;
            promptInput.value = '';
        } else {
            fileInfo.style.display = 'none';
        }
    });

    generateBtn.addEventListener('click', async function() {
        const apiKey = apiKeyInput.value.trim();
        const file = fileUpload.files[0];
        const content = promptInput.value.trim();

        if (!apiKey) {
            alert('Please enter your Gemini API key');
            return;
        }

        if (!file && !content) {
            alert('Please upload a file or enter course content');
            return;
        }

        generateBtn.disabled = true;
        loading.style.display = 'block';
        resultsSection.style.display = 'none';

        try {
            const formData = new FormData();
            formData.append('api_key', apiKey);

            if (file) {
                formData.append('file', file);
            } else {
                formData.append('content', content);
            }

            const response = await fetch('/generate-roadmap', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                displayRoadmap(data.roadmap);
                resultsSection.style.display = 'block';
            } else {
                alert('Error: ' + (data.error || 'Unknown error occurred'));
            }

        } catch (error) {
            console.error('Error:', error);
            alert('Failed to generate roadmap. Please try again.');
        } finally {
            generateBtn.disabled = false;
            loading.style.display = 'none';
        }
    });

    function displayRoadmap(roadmap) {
        currentRoadmap = roadmap;
        let html = '';

        if (roadmap.format === 'text') {
            html = `<div class="roadmap-content">${roadmap.roadmap_text.replace(/\n/g, '<br>')}</div>`;
        } else {
            // Course Overview
            if (roadmap.course_overview) {
                html += `
                    <div class="section">
                        <h3>📚 Course Overview</h3>
                        <p>${roadmap.course_overview}</p>
                    </div>
                `;
            }

            // Learning Objectives
            if (roadmap.learning_objectives && roadmap.learning_objectives.length > 0) {
                html += `
                    <div class="section">
                        <h3>🎯 Learning Objectives</h3>
                        <ul>
                            ${roadmap.learning_objectives.map(obj => `<li>${obj}</li>`).join('')}
                        </ul>
                    </div>
                `;
            }

            // Timeline
            if (roadmap.timeline) {
                html += `
                    <div class="section">
                        <h3>⏰ Study Timeline</h3>
                        <p>${roadmap.timeline}</p>
                    </div>
                `;
            }

            // Graphical Roadmap
            if (roadmap.roadmap && roadmap.roadmap.length > 0) {
                html += `
                    <div class="section">
                        <h3>🗺️ Your Learning Journey</h3>
                        <div class="roadmap-visual">
                `;
                
                roadmap.roadmap.forEach((week, index) => {
                    const isFirst = index === 0;
                    const status = isFirst ? 'current' : '';
                    const progress = isFirst ? 0 : 0;
                    
                    html += `
                        <div class="week-node ${status}" data-week="${week.week}">
                            <div class="week-icon">${week.week}</div>
                            <div class="week-content">
                                <div class="week-title">${week.title}</div>
                                <div class="week-topics">
                                    ${week.topics ? week.topics.slice(0, 3).join(' • ') : 'Topics to be covered'}
                                    ${week.topics && week.topics.length > 3 ? '...' : ''}
                                </div>
                                <div class="week-progress">
                                    <div class="progress-bar">
                                        <div class="progress-fill" style="width: ${progress}%"></div>
                                    </div>
                                    <button class="study-btn" 
                                            onclick="startStudy(${week.week})"
                                            ${!isFirst ? 'disabled' : ''}>
                                        📖 Study
                                    </button>
                                    <button class="knowledge-check-btn" 
                                            onclick="startQuiz(${week.week})"
                                            id="quiz-btn-${week.week}">
                                        🧠 Knowledge Check
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                });
                
                html += `
                        </div>
                    </div>
                `;
            }
        }

        // Notes Container
        html += `
            <div class="notes-container" id="notesContainer">
                <div class="notes-header">
                    <div class="notes-title" id="notesTitle">Study Material</div>
                    <div class="notes-subtitle" id="notesSubtitle">Read through the content below</div>
                </div>
                
                <div class="notes-content" id="notesContent">
                    <p>Study content will appear here...</p>
                </div>
                
                <div class="reading-progress" id="readingProgress">
                    <div class="progress-indicator">
                        <div class="progress-text">📖 Keep reading to unlock the quiz</div>
                    </div>
                    <div class="scroll-hint" id="scrollHint">Scroll down to continue reading</div>
                </div>
                
                <div class="notes-controls">
                    <button class="quiz-btn secondary" onclick="exitNotes()">Back to Roadmap</button>
                    <button class="mark-complete-btn" id="markCompleteBtn" onclick="completeReading()">
                        ✓ Mark as Read & Take Quiz
                    </button>
                </div>
            </div>

            <!-- Quiz Container -->
            <div class="quiz-container" id="quizContainer">
                <div class="quiz-header">
                    <div class="quiz-title" id="quizTitle">Knowledge Check</div>
                    <div class="quiz-progress">
                        <span id="questionCounter">Question 1 of 5</span>
                        <span>•</span>
                        <span id="quizTopic">Topic Name</span>
                    </div>
                </div>
                
                <div class="quiz-question">
                    <div class="question-text" id="questionText">Question will appear here</div>
                    <div class="quiz-options" id="quizOptions">
                        <!-- Options will be generated here -->
                    </div>
                </div>
                
                <div class="quiz-controls">
                    <button class="quiz-btn secondary" onclick="exitQuiz()">Exit Quiz</button>
                    <div>
                        <button class="quiz-btn secondary" id="prevBtn" onclick="previousQuestion()" disabled>Previous</button>
                        <button class="quiz-btn primary" id="nextBtn" onclick="nextQuestion()">Next Question</button>
                    </div>
                </div>
                
                <div class="score-display" id="scoreDisplay" style="display: none;">
                    <h3>Quiz Complete!</h3>
                    <div class="score-number" id="finalScore">85%</div>
                    <div class="score-text" id="scoreText">Great job! You're ready for the next section.</div>
                    <button class="back-to-roadmap" onclick="completeSection()">Continue Learning Journey</button>
                </div>
            </div>
        `;

        roadmapContent.innerHTML = html;
    }

    // Study Functions
    window.startStudy = function(weekNumber) {
        if (!currentRoadmap || !currentRoadmap.roadmap) return;
        
        currentWeekNumber = weekNumber;
        const weekData = currentRoadmap.roadmap.find(week => week.week === weekNumber);
        if (!weekData) return;
        
        // Hide roadmap and show notes
        document.querySelector('.roadmap-visual').style.display = 'none';
        document.querySelector('.section h3').style.display = 'none';
        document.getElementById('notesContainer').style.display = 'block';
        
        // Set notes content
        document.getElementById('notesTitle').textContent = weekData.title;
        document.getElementById('notesSubtitle').textContent = `Week ${weekNumber} Study Material`;
        
        // Generate study content
        let notesHtml = '';
        if (weekData.topics && weekData.topics.length > 0) {
            notesHtml += '<h3>📚 Topics to Study</h3><ul>';
            weekData.topics.forEach(topic => {
                notesHtml += `<li>${topic}</li>`;
            });
            notesHtml += '</ul>';
        }
        
        if (weekData.key_concepts && weekData.key_concepts.length > 0) {
            notesHtml += '<h3>🎯 Key Concepts</h3><ul>';
            weekData.key_concepts.forEach(concept => {
                notesHtml += `<li>${concept}</li>`;
            });
            notesHtml += '</ul>';
        }
        
        if (weekData.materials && weekData.materials.length > 0) {
            notesHtml += '<h3>📖 Study Materials</h3><ul>';
            weekData.materials.forEach(material => {
                notesHtml += `<li>${material}</li>`;
            });
            notesHtml += '</ul>';
        }
        
        if (weekData.exercises && weekData.exercises.length > 0) {
            notesHtml += '<h3>💻 Practice Exercises</h3><ul>';
            weekData.exercises.forEach(exercise => {
                notesHtml += `<li>${exercise}</li>`;
            });
            notesHtml += '</ul>';
        }
        
        // Add some additional study content
        notesHtml += `
            <h3>📝 Study Instructions</h3>
            <p>To get the most out of this section:</p>
            <ul>
                <li>Read through all the topics carefully</li>
                <li>Take notes on the key concepts</li>
                <li>Make sure you understand each point before moving on</li>
                <li>Practice with the exercises if provided</li>
                <li>Review any study materials mentioned</li>
            </ul>
            <p><strong>Once you've read through everything, you can take the knowledge check quiz to test your understanding.</strong></p>
        `;
        
        document.getElementById('notesContent').innerHTML = notesHtml;
        
        // Reset reading state
        readingComplete = false;
        document.getElementById('markCompleteBtn').classList.remove('show');
        document.getElementById('scrollHint').style.display = 'block';
        
        // Set up scroll tracking
        setupScrollTracking();
    };

    function setupScrollTracking() {
        const notesContent = document.getElementById('notesContent');
        const scrollHint = document.getElementById('scrollHint');
        const markCompleteBtn = document.getElementById('markCompleteBtn');
        const progressText = document.querySelector('.progress-text');
        
        let hasScrolledToBottom = false;
        let readingStartTime = Date.now();
        const minReadingTime = 10000; // 10 seconds minimum
        
        notesContent.addEventListener('scroll', function() {
            const { scrollTop, scrollHeight, clientHeight } = notesContent;
            const scrollPercentage = (scrollTop / (scrollHeight - clientHeight)) * 100;
            
            // Update progress text
            progressText.textContent = `📖 Reading progress: ${Math.round(scrollPercentage)}%`;
            
            // Check if scrolled near bottom (90%+)
            if (scrollPercentage >= 90 && !hasScrolledToBottom) {
                hasScrolledToBottom = true;
                scrollHint.style.display = 'none';
                
                // Check if minimum reading time has passed
                const currentTime = Date.now();
                const timeSpent = currentTime - readingStartTime;
                
                if (timeSpent >= minReadingTime) {
                    showCompleteButton();
                } else {
                    const remainingTime = Math.ceil((minReadingTime - timeSpent) / 1000);
                    progressText.textContent = `⏱️ Please spend ${remainingTime} more seconds reading`;
                    
                    setTimeout(() => {
                        if (hasScrolledToBottom) {
                            showCompleteButton();
                        }
                    }, minReadingTime - timeSpent);
                }
            }
        });
    }

    function showCompleteButton() {
        readingComplete = true;
        const progressText = document.querySelector('.progress-text');
        const markCompleteBtn = document.getElementById('markCompleteBtn');
        
        progressText.textContent = '✅ Reading complete! You can now take the quiz';
        markCompleteBtn.classList.add('show');
    }

    window.completeReading = function() {
        if (!readingComplete) return;
        
        // Hide notes and show quiz
        document.getElementById('notesContainer').style.display = 'none';
        
        // Unlock and highlight the knowledge check button
        const quizBtn = document.getElementById(`quiz-btn-${currentWeekNumber}`);
        if (quizBtn) {
            quizBtn.classList.add('unlocked');
        }
        
        // Start the quiz immediately
        startQuiz(currentWeekNumber);
    };

    window.exitNotes = function() {
        document.getElementById('notesContainer').style.display = 'none';
        document.querySelector('.roadmap-visual').style.display = 'flex';
        document.querySelector('.section h3').style.display = 'block';
    };

    // Quiz Functions
    window.startQuiz = function(weekNumber) {
        if (!currentRoadmap || !currentRoadmap.quizzes) return;
        
        // Find quiz for this week
        currentQuiz = currentRoadmap.quizzes.find(quiz => 
            quiz.topic.toLowerCase().includes('week ' + weekNumber) || 
            currentRoadmap.quizzes[weekNumber - 1]
        ) || currentRoadmap.quizzes[0]; // Fallback to first quiz
        
        if (!currentQuiz || !currentQuiz.multiple_choice) return;
        
        currentQuestionIndex = 0;
        userAnswers = [];
        quizScore = 0;
        
        // Hide roadmap and show quiz
        document.querySelector('.roadmap-visual').style.display = 'none';
        document.querySelector('.section h3').style.display = 'none';
        document.getElementById('quizContainer').style.display = 'block';
        
        document.getElementById('quizTopic').textContent = currentQuiz.topic;
        showQuestion();
    };

    function showQuestion() {
        if (!currentQuiz || !currentQuiz.multiple_choice) return;
        
        const question = currentQuiz.multiple_choice[currentQuestionIndex];
        const totalQuestions = currentQuiz.multiple_choice.length;
        
        document.getElementById('questionCounter').textContent = 
            `Question ${currentQuestionIndex + 1} of ${totalQuestions}`;
        document.getElementById('questionText').textContent = question.question;
        
        const optionsContainer = document.getElementById('quizOptions');
        optionsContainer.innerHTML = '';
        
        question.options.forEach((option, index) => {
            const optionDiv = document.createElement('div');
            optionDiv.className = 'quiz-option';
            optionDiv.textContent = option;
            optionDiv.onclick = () => selectOption(index, optionDiv);
            optionsContainer.appendChild(optionDiv);
        });
        
        // Update navigation buttons
        document.getElementById('prevBtn').disabled = currentQuestionIndex === 0;
        const nextBtn = document.getElementById('nextBtn');
        nextBtn.textContent = currentQuestionIndex === totalQuestions - 1 ? 'Finish Quiz' : 'Next Question';
        nextBtn.disabled = true; // Enable after selection
    }

    window.selectOption = function(optionIndex, optionElement) {
        // Remove previous selections
        document.querySelectorAll('.quiz-option').forEach(opt => 
            opt.classList.remove('selected'));
        
        // Mark current selection
        optionElement.classList.add('selected');
        userAnswers[currentQuestionIndex] = optionIndex;
        
        // Enable next button
        document.getElementById('nextBtn').disabled = false;
    };

    window.nextQuestion = function() {
        if (userAnswers[currentQuestionIndex] === undefined) return;
        
        const question = currentQuiz.multiple_choice[currentQuestionIndex];
        const userAnswer = userAnswers[currentQuestionIndex];
        const correctAnswerIndex = question.options.findIndex(opt => 
            opt === question.correct_answer || opt.startsWith(question.correct_answer));
        
        if (userAnswer === correctAnswerIndex) {
            quizScore++;
        }
        
        if (currentQuestionIndex < currentQuiz.multiple_choice.length - 1) {
            currentQuestionIndex++;
            showQuestion();
        } else {
            showScore();
        }
    };

    window.previousQuestion = function() {
        if (currentQuestionIndex > 0) {
            currentQuestionIndex--;
            showQuestion();
            
            // Restore previous selection
            if (userAnswers[currentQuestionIndex] !== undefined) {
                const options = document.querySelectorAll('.quiz-option');
                options[userAnswers[currentQuestionIndex]].classList.add('selected');
                document.getElementById('nextBtn').disabled = false;
            }
        }
    };

    function showScore() {
        const totalQuestions = currentQuiz.multiple_choice.length;
        const percentage = Math.round((quizScore / totalQuestions) * 100);
        
        document.querySelector('.quiz-question').style.display = 'none';
        document.querySelector('.quiz-controls').style.display = 'none';
        
        const scoreDisplay = document.getElementById('scoreDisplay');
        scoreDisplay.style.display = 'block';
        
        document.getElementById('finalScore').textContent = `${percentage}%`;
        document.getElementById('scoreText').textContent = 
            `You got ${quizScore} out of ${totalQuestions} questions correct. ${
                percentage >= 80 ? "Excellent work! You're ready for the next section." :
                percentage >= 60 ? "Good job! Review the material and you'll be ready to continue." :
                "Keep studying! Review the concepts and try again."
            }`;
    }

    window.exitQuiz = function() {
        document.getElementById('quizContainer').style.display = 'none';
        document.querySelector('.roadmap-visual').style.display = 'flex';
        document.querySelector('.section h3').style.display = 'block';
    };

    window.completeSection = function() {
        // Mark current section as completed and enable next
        const currentWeekNode = document.querySelector('.week-node.current');
        if (currentWeekNode) {
            currentWeekNode.classList.remove('current');
            currentWeekNode.classList.add('completed');
            
            // Update progress bar
            const progressFill = currentWeekNode.querySelector('.progress-fill');
            progressFill.style.width = '100%';
            
            // Enable next week
            const nextWeek = currentWeekNode.nextElementSibling;
            if (nextWeek && nextWeek.classList.contains('week-node')) {
                nextWeek.classList.add('current');
                const nextBtn = nextWeek.querySelector('.knowledge-check-btn');
                nextBtn.disabled = false;
            }
        }
        
        exitQuiz();
    };
});