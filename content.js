// content.js

function loginToSurveyJunkie(email, password) {
    const emailField = document.querySelector('input[aria-label="Email address"]');
    const passwordField = document.querySelector('input[type="password"]');

    if (emailField && passwordField) {
        emailField.value = email;
        passwordField.value = password;

        const loginButton = document.querySelector('button[type="submit"]');
        if (loginButton) {
            loginButton.click();
        }
    }
}