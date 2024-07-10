document.addEventListener('DOMContentLoaded', function () {

  let userID = null;  // Variable to store the user ID

  const initialPopup = document.getElementById('initial-popup');
  const mainPopup = document.getElementById('main-popup');
  const loginPopup = document.getElementById('login-popup');
  const connectButton = document.getElementById('connectButton');
  const submitInitialLoginButton = document.getElementById('submitInitialLogin');
  const submitLoginButton = document.getElementById('submitLogin');
  const cancelLoginButton = document.getElementById('cancelLogin');

  // Show initial login popup when extension opens
  initialPopup.classList.remove('hidden');

  // Handle submitting initial login credentials
  submitInitialLoginButton.addEventListener('click', async function () {
    const username = document.getElementById('surveyBoostUsername').value.trim();
    const password = document.getElementById('surveyBoostPassword').value.trim();

    // Validate username and password input
    if (!username || !password) {
      alert('Please enter both username and password.');
      return;
    }

    try {
      // Perform your submission logic here, e.g., send data to your backend
      const response = await fetch('http://127.0.0.1:8000/api/users/signin/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const responseData = await response.json();

      if (responseData.error) {
        throw new Error(responseData.error || 'Failed to authenticate Survey Boost credentials');
      }
      console.log('Survey Boost credentials authenticated.');

      userID = responseData.user_id;

      // Hide initial login popup and show main content
      initialPopup.classList.add('hidden');
      mainPopup.classList.remove('hidden');

    } catch (error) {
      console.error('Error authenticating Survey Boost credentials:', error);
      // Handle error (optional)
      alert("Invalid Username or Password");
    }
  });

  // Show login popup for Survey Junkie when Connect button is clicked
  connectButton.addEventListener('click', function () {
    mainPopup.classList.add('hidden');
    loginPopup.classList.remove('hidden');
  });

  // Handle canceling login
  cancelLoginButton.addEventListener('click', function () {
    loginPopup.classList.add('hidden');
    mainPopup.classList.remove('hidden');
  });

  // Handle submitting Survey Junkie login credentials
  submitLoginButton.addEventListener('click', async function () {
    const email = document.getElementById('surveyJunkieEmail').value.trim();
    const password = document.getElementById('surveyJunkiePassword').value.trim();

    // Validate email and password input
    if (!email || !password) {
      alert('Please enter both email and password.');
      return;
    }

    try {
      // Perform your submission logic here, e.g., send data to your backend
      const response = await fetch('http://127.0.0.1:8000/api/surveys/register/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          user_id: userID,
          survey_site: 'Survey Junkie', 
          emai: email, 
          password: password 
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save Survey Junkie credentials');
      }
      console.log('Survey Junkie credentials saved.');

      // Proceed to main content or perform further actions
      // For example, hide login popup and show main content
      loginPopup.classList.add('hidden');
      mainPopup.innerHTML = `<h1>Welcome to Survey Boost!</h1><p>Main content.</p>`;
      mainPopup.classList.remove('hidden');
    } catch (error) {
      console.error('Error saving Survey Junkie credentials:', error);
      // Handle error (optional)
      alert('Error saving Survey Junkie credentials. Please try again.');
    }
  });
});
