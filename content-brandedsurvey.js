let handleSurveyPageCalled = false;
let handleSurveyQuestionsCalled = false;
let survey_number = 0;

// Function to start a survey by clicking on a random survey card
function startSurvey() {
    console.log('Starting a random survey...');

    const surveyCards = document.querySelectorAll('.survey-card');
    if (surveyCards.length === 0) {
        console.error('No survey cards found.');
        return;
    }

    const randomIndex = Math.floor(Math.random() * surveyCards.length);
    const selectedCard = surveyCards[randomIndex];
    const button = selectedCard.querySelector('.survey-card-action .btn.btn-outline-primary');

    if (button) {
        console.log('Clicking the survey button:', button);
        button.click();
    } else {
        console.error('Survey button not found in the selected card:', selectedCard);
    }
}

// Function to handle the new page and click the "Take Survey" button
function handleSurveyPage() {
    if (handleSurveyPageCalled) return;

    console.log('Handling the survey page...');
    setTimeout(() => {
        const surveyButton = document.querySelector('.col-12.text-center .btn.btn-primary');
        if (surveyButton) {
            console.log('Clicking the survey button on the new page:', surveyButton);
            surveyButton.click();
        } else {
            console.error('Survey button not found on the new page.');
        }
    }, 2000);

    handleSurveyPageCalled = true;
}

// Function to handle survey questions
function handleSurveyQuestions() {
    if (handleSurveyQuestionsCalled) return;

    console.log('Handling survey questions...');
    const questions = [];

    const questionSections = document.querySelectorAll('section.profile-survey');
    questionSections.forEach(question => {
        const questionId = question.getAttribute('id');
        const questionType = question.getAttribute('data-ques-type');
        const questionText = question.querySelector('h2')?.innerText || 'No question text';
        const options = [];
        let answer = '';

        if (questionType === 'select') {
            question.querySelectorAll('select option').forEach(option => {
                if (option.value) {
                    options.push({
                        value: option.value,
                        label: option.innerText
                    });
                }
            });
        } else if (questionType === 'checkbox') {
            question.querySelectorAll('input[type="checkbox"]').forEach(option => {
                options.push({
                    id: option.id,
                    value: option.value,
                    label: option.nextElementSibling.innerText
                });
            });
        } else if (questionType === 'text') {
            const textInput = question.querySelector('input[type="text"]');
            if (textInput) {
                answer = textInput.value;
            }
        }

        if (questionType !== 'add-children') {
            questions.push({
                id: questionId,
                type: questionType,
                text: questionText,
                options: options,
                answer: answer
            });
        }
    });

    console.log('Survey questions and options:', questions);
    chrome.runtime.sendMessage({ type: 'brandedsurvey_surveyData', data: questions, number: survey_number});

    handleSurveyQuestionsCalled = true;
}

// Debounce utility function
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// Create and observe only if not already created
if (!window.surveyObserver) {
    console.log('Creating a new MutationObserver instance...');
    const observer = new MutationObserver(debounce((mutationsList) => {
        mutationsList.forEach(mutation => {
            if (mutation.type === 'childList') {
                if (location.href.includes('/profilers/extended_profile/')) {
                    handleSurveyPage();
                } else if (location.href.includes('/profilers/profiler/extended')) {
                    handleSurveyQuestions();
                }
            }
        });
    }, 500));

    observer.observe(document.documentElement, { childList: true, subtree: true });
    window.surveyObserver = observer;
} else {
    console.log('Observer already created.');
}

// Function to perform login actions
function performLogin(email, password) {
    console.log('Performing login for branded surveys...');
    console.log('Email and password in performLogin: ', email, password);

    const emailField = document.querySelector('input#UserEmail');
    const passwordField = document.querySelector('input#UserPassword');
    const loginButton = document.querySelector('input[type="submit"]');

    if (emailField && passwordField && loginButton) {
        emailField.value = email;
        passwordField.value = password;
        emailField.dispatchEvent(new Event('input', { bubbles: true }));
        passwordField.dispatchEvent(new Event('input', { bubbles: true }));

        setTimeout(() => {
            if (!loginButton.disabled) {
                loginButton.click();
                console.log('Login attempted.');
            } else {
                console.error('Login button is disabled.');
                sendLoginResult(false, email, password, 'Login button is disabled.');
            }
        }, 500);
    } else {
        console.error('Email or password fields not found.');
        sendLoginResult(false, email, password, 'Email or password fields not found.');
    }
}

// Function to check homepage content
function checkHomepage(email, password, user_id) {
    console.log('Checking homepage Branded Survey...');

    const navbarElement = document.querySelector('.navbar-nav');
    if (navbarElement && navbarElement.innerHTML.includes('My Dashboard')) {
        sendLoginResult(true, email, password, user_id, 'Homepage content of Branded Survey found.');
    } else {
        sendLoginResult(false, email, password, user_id, 'Homepage content of Branded Survey not found.');
    }
}

// Function to get balance
function getBalance() {
    console.log('Getting the balance for Branded Surveys...');
    const balanceElement = document.querySelector('a.my-points');
    if (balanceElement) {
        const balanceText = balanceElement.textContent.trim();
        const rawBalance = balanceText;

        chrome.storage.local.set(
            { brandedsurvey_balance: { balanceText, rawBalance } },
            () => {
                console.log('Branded Surveys Balance saved to Chrome storage.');
            }
        );

        return {
            rawBalance: rawBalance,
            balanceText: balanceText,
        };
    } else {
        console.error('Balance element not found.');
        return { rawBalance: null, balanceText: 'N/A' };
    }
}

// Function to send the result to the background script
function sendLoginResult(success, email, password, user_id, message) {
    console.log('Sending login result:', success, email, password);

    chrome.runtime.sendMessage({
        from: 'content-brandedsurvey',
        action: 'home-check',
        loginSuccess: success,
        email: email,
        password: password,
        user_id: user_id,
        message: message,
    });
}

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'brandedsurveys_login') {
        performLogin(request.email, request.password);
    }
    else if (request.action === 'brandedsurveys_check_homepage') {
        checkHomepage(request.email, request.password, request.user_id);
    }
    else if (request.action === 'brandedsurveys-getBalance') {
        getBalance();
    }
    else if (request.action === 'start_survey') {
        survey_number = request.number;
        startSurvey();
    }
});
