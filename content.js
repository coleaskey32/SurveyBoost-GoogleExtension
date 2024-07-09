console.log("hello world");

document.addEventListener('DOMContentLoaded', function () {
    console.log("Content script loaded.");

    const loginForm = document.querySelector('div.sc-13h8dsa-1'); // Container for the login form
    console.log("Login form found:", loginForm !== null);

    if (loginForm) {
        const loginButton = loginForm.querySelector('button[role="button"]');
        console.log("Login button found:", loginButton !== null);

        if (loginButton) {
            loginButton.addEventListener('click', async function (event) {
                event.preventDefault(); // Prevent default button click

                const email = document.querySelector('input[aria-label="Email address"]').value.trim();
                const password = document.querySelector('input[aria-label="Password"]').value.trim();

                console.log("Email:", email);
                console.log("Password:", password);

                // Send data to your Django Ninja endpoint
                try {
                    const response = await fetch('http://localhost:8000/api/survey-site-user/', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ survey_site: 'Survey Junkie', email, password }),
                    });

                    if (!response.ok) {
                        throw new Error('Failed to save Survey Junkie credentials');
                    }

                    console.log('Survey Junkie credentials saved.');

                    // Optionally, clear form fields after successful submission
                    document.querySelector('input[aria-label="Email address"]').value = '';
                    document.querySelector('input[aria-label="Password"]').value = '';

                } catch (error) {
                    console.error('Error saving Survey Junkie credentials:', error);
                }
            });
        }
    }
    else {
        console.log("Couldn't Find Form")
    }
});
